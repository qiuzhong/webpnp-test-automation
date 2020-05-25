const settings = require('./configuration.json');
const { chromium } = require('playwright');

async function runSpeedometer2Test() {
    console.log('********** Start running Speedometer2 tests **********');
    const browser = await chromium.launch({
        headless: false
    });
    const page = await browser.newPage();
    console.log(`********** Going to URL: ${settings.SPEEDOMETER2_URL} **********`);
    await page.goto(settings.SPEEDOMETER2_URL);

    console.log("********** Running Speedometer2 tests... **********");
    await page.click('xpath=//*[@id="home"]/div/button');
    await page.waitForSelector('xpath=//*[@id="summarized-results"]/div[4]/button[2]',
        {timeout: 5 * 60 * 1000}
    );

    console.log("********** Running Speedometer2 tests completed **********");
    let scores = {};
    const scoreElement = await page.$('#result-number');
    const score = await scoreElement.evaluate(element => element.textContent);
    console.log('********** Speedometer tests score: **********');
    console.log(`********** ${score}  **********`);


    if (settings.showDetailedSpeedometer2Score) {
        const arithMeanElement = await page.$('#results-with-statistics');
        const arithMeanScore = await arithMeanElement.evaluate(element => element.textContent);
        scores['Arithmetic Mean:'] = arithMeanScore;

        const geomeanElement = await page.$('#geomean-score');
        const geomeanScore = await geomeanElement.evaluate(element => element.textContent);
        scores['Geomean Score:'] = geomeanScore;

        const totalScoreTimeElement = await page.$('#total-score-time');
        const totalScoreTime = await totalScoreTimeElement.evaluate(element => element.textContent);
        scores['Total Score Time:'] = totalScoreTime;

        const totalRunningElement = await page.$('#total-running-time');
        const totalRunningTime = await totalRunningElement.evaluate(element => element.textContent);
        scores['Total Running Time:'] = totalRunningTime;

        console.log('********** Detailed scores: **********');
        console.log(scores);
    }

    await browser.close();

    return Promise.resolve(scores);
}


module.exports = runSpeedometer2Test;
