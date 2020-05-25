const fs = require('fs');
const fsPromises = require('fs').promises;
const runSpeedometer2 = require('./run_speedometer2.js');
const runWebXPRT3 = require('./run_webxprt3.js');
const settings = require('./configuration.json');


/*
* Sort the score object array by specific key and get the medium one.
*/
function sortScores(scoresArray, propertyName) {
    scoresArray.sort((a, b) => {
        Number.parseFloat(a[propertyName]) - Number.parseFloat(b[propertyName]);
    });

    return scoresArray;
}

/*
*   Read last score file and compare with this score.
*   Return an object with this data and 
*/
function compareScore(lastScoreFile, thisData, propertyName) {

    let changeRate = 0.0;
    if (fs.existsSync(lastScoreFile)) {
        let lastData = JSON.parse(fs.readFileSync(lastScoreFile));

        let lastScore = Number.parseFloat(lastData['score'][propertyName]);
        let thisScore = Number.parseFloat(thisData['score'][propertyName]);
        let delta = thisScore - lastScore;
        changeRate = (delta / lastScore * 100).toPrecision(2);
    }

    return changeRate;
}

/*
* Run WebXPRT3 page tests for 3 times and get the medium score.
* Compare with the last time score
* Calculate the change rate.
*/
async function runWebXPRT3AndProcessResults() {
    
    let webxprt3Scores = [];
    for (let i = 0; i < settings.RUN_WEBXPRT3_TIMES; i++) {
        const thisScore = await runWebXPRT3();
        webxprt3Scores.push(thisScore);

        await new Promise(resolve => setTimeout(resolve, settings.RUN_WEBXPRT3_TEST_INTERNAL));
    }
    sortScores(webxprt3Scores);
    let middleIndex = Math.floor(settings.RUN_SPEEDOMETER2_TIMES - 1) / 2;
    let now = Date();
    let thisWebXPRT3Data = {
        date: now,
        score: webxprt3Scores[middleIndex]
    }

    let changeRate = compareScore(settings.LAST_WEBXPRT3_TEST_SCORE_FILE, thisWebXPRT3Data, 'Your Score');

    await fsPromises.writeFile(settings.LAST_WEBXPRT3_TEST_SCORE_FILE, JSON.stringify(thisWebXPRT3Data));
    return Promise.resolve({
        changeRate: changeRate,
        score: webxprt3Scores[middleIndex]
    });
}

/*
* Run Speedometer2 page tests for 3 times and get the medium score.
* Compare with the last time score.
* Calculate the change rate.
*/
async function runSpeedometer2AndProcessResults() {

    let speedometer2Scores = [];
    for (let i= 0; i < settings.RUN_SPEEDOMETER2_TIMES; i++) {
        const thisScore = await runSpeedometer2();
        speedometer2Scores.push(thisScore);

        await new Promise(resolve => setTimeout(resolve, settings.RUN_SPEEDOMETER2_TEST_INTERVAL));
    }
    sortScores
    let middleIndex = Math.floor(settings.RUN_SPEEDOMETER2_TIMES - 1) / 2;
    let now = Date();
    let thisSpeedometer2Data = {
        date: now,
        score: speedometer2Scores[middleIndex]
    }

    let changeRate = compareScore(settings.LAST_SPEEDOMETER2_TEST_SCORE_FILE, thisSpeedometer2Data, 'Geomean Score:');
    
    await fsPromises.writeFile(settings.LAST_SPEEDOMETER2_TEST_SCORE_FILE, JSON.stringify(thisSpeedometer2Data));
    return Promise.resolve({
        changeRate: changeRate,
        score: speedometer2Scores[middleIndex]
    });
}


module.exports = {
    runWebXPRT3AndProcessResults: runWebXPRT3AndProcessResults,
    runSpeedometer2AndProcessResults: runSpeedometer2AndProcessResults
}
