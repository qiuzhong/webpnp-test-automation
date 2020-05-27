const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');
const runSpeedometer2 = require('./workloads/speedometer2.js');
const runWebXPRT3 = require('./workloads/webxprt3.js');
const settings = require('../config.json');


/*
* Sort the score object array by specific key and get the medium one.
*/
function sortScores(scoresArray, score, propertyName) {
  scoresArray.sort((a, b) => {
    Number.parseFloat(a[score][propertyName]) - Number.parseFloat(b[score][propertyName]);
  });

  return scoresArray;
}

/*
* Run WebXPRT3 page tests for 3 times and get the medium score.
*/
// async function runWebXPRT3Workload() {
//   let workload = settings.workloads[0];
//   let webxprt3Scores = [];
//   for (let i = 0; i < workload.run_times; i++) {
//     const thisScore = await runWebXPRT3();
//     webxprt3Scores.push(thisScore);

//     await new Promise(resolve => setTimeout(resolve, 5000)); // sleep for 5s before next time running
//   }
//   sortScores(webxprt3Scores, 'scores', 'Total Score');
//   let middleIndex = Math.floor(workloads.run_times - 1) / 2;

//   return Promise.resolve(webxprt3Scores[middleIndex]);
// }

/*
* Run Speedometer2 page tests for 3 times and get the medium score.
*/
async function runSpeedometer2Workload() {

  let workload = settings.workloads[1];
  let speedometer2Scores = [];
  for (let i= 0; i < workload.run_times; i++) {
    const thisScore = await runSpeedometer2();
    speedometer2Scores.push(thisScore);

    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  sortScores(speedometer2Scores, 'scores', 'Total Score');
  let middleIndex = Math.floor(workload.run_times - 1) / 2;

  return Promise.resolve(speedometer2Scores[middleIndex]);
}


/*
* Call runSpeedometer2 and generate a JSON file for send_mail module
* Return an object {
*   'Speedometer2': "file/",
* }
*/
async function genSpeedometer2Results(deviceInfo) {
  let workload = settings.workloads[1];

  let results = await runSpeedometer2Workload();
  let jsonData = {
    'workload': workload.name,
    'device_info': deviceInfo,
    'test_result': results.scores,
    'execution_date': results.date
  }
  console.log(JSON.stringify(jsonData, null, 4));

  let jsonFilename = await storeTestData(deviceInfo, workload, jsonData);
  return Promise.resolve({
    'Speedometer2': jsonFilename
  });
}

/*
*   Generate a JSON file to store this test result
*   Return: JSON file pathname 
*/
async function storeTestData(deviceInfo, workload, jsonData) {
  let testResultsDir = path.join(process.cwd(), 'results', workload.name);
  if (!fs.existsSync(testResultsDir)) {
    fs.mkdirSync(testResultsDir, {recursive: true});
  }

  let cpu = deviceInfo['CPU'].replace('\u00ae', '').replace('\u2122', '').replace(' ', '-'); // Remove the (R) and (TM) unicode characters
  let now = new Date();
  let date = now.toISOString().split('.')[0].replace(/T|-|:/g, '');
  let browser = deviceInfo['Browser']
  let jsonFilename = date + '-' + cpu + '-' + browser + '.json';

  await fsPromises.writeFile(path.join(testResultsDir, jsonFilename), JSON.stringify(jsonData, null, 4));
  return Promise.resolve(jsonFilename);
}

module.exports = {
  genSpeedometer2Results: genSpeedometer2Results
}