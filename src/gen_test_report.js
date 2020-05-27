"use strict";

const fs = require('fs');
const path = require('path');
const os = require('os');
const fsPromises = fs.promises;

function drawResultTable(result) {
  let resultTable = `<table><tr> \
		<th>${result.workload}</th> \
		<th>Score</th> \
		</tr>`;
  for (const key of Object.keys(result.test_result)) {
    resultTable += "<tr><td>" + key + "</td><td>" + result.test_result[key] + "</td></tr>";
  }
  return resultTable + "</table>";
}

async function findPreTestResult(resultPath) {
  const dir = await fs.promises.opendir(path.dirname(resultPath));
  if (dir.length == 0)
    return Promise.reject("Error: no test result found!");
  else if (dir.length == 1)
    return Promise.resolve("none");
  else {
    let dirents = [];
    for await (const dirent of dir) {
      dirents.push(dirent.name);
    }
    const comparedResult = path.join(path.dirname(resultPath), dirents.sort().reverse()[1]);
    console.log("Found the previus test result: ", comparedResult);
    return Promise.resolve(comparedResult);
  }
}

function drawResultCompTable(basedResult, comparedResult) {
  let resultTable = `<table><tr>\
		<th>${basedResult.workload}</th>\
		<th>${basedResult.device_info.Browser}</th>\
		<th>${comparedResult.device_info.Browser}</th>\
		<th>Diff</th></tr>`;
  for (const key of Object.keys(basedResult.test_result)) {
    const basedValue = basedResult.test_result[key];
    const comparedValue = comparedResult.test_result[key];
    resultTable += "<tr><td>" + key + "</td><td>" + basedValue
      + "</td><td>" + comparedValue + "</td><td>"
      + Math.round(((basedValue / comparedValue) * 100) * 100) / 100 + "%</td></tr>";
  }
  return resultTable + "</table>";
}

function drawDeviceInfoTable(result) {
  let deviceInfoTable = "<table>";
  for (const key of Object.keys(result.device_info)) {
    deviceInfoTable += "<tr><td>" + key + "</td><td>" + result.device_info[key] + "</td></tr>";
  }
  return deviceInfoTable + "</table>";
}

/*
* Generate test report as html
* @param: {Object}, resultPaths, an object reprensents for test result path
* e.g.
* {
* 	"Speedometer2": path.join(__dirname, "../results/Speedometer2/202005261300_Intel-Core-i5-8350U_Chrome-85.0.4154.0.json"),
*	  "WebXPRT3": path.join(__dirname, "../results/WebXPRT3/202005261555_Intel-Core-i5-8350U_Chrome-85.0.4154.0.json")
* }
*/
async function genTestReport(resultPaths) {
  console.log("********** Generate test report as html **********");
  // Get test result table
  let resultTables = "";
  let basedResult;
  for (const key of Object.keys(resultPaths)) {
    const resultPath = resultPaths[key];

    // Get basedResult
    if (!fs.existsSync(resultPath)) {
      return Promise.reject(`Error: file: ${resultPath} does not exist!`);
    } else {
      const rawData = await fsPromises.readFile(resultPath, 'utf-8');
      basedResult = JSON.parse(rawData);
      console.log("based result: ", basedResult);
    }

    // Draw result table
    let resultTable;
    // Find previous test result
    const comparedPath = await findPreTestResult(resultPath);
    if (comparedPath !== "none") {
      const rawComparedData = await fsPromises.readFile(comparedPath, 'utf-8');
      const comparedResult = JSON.parse(rawComparedData);
      console.log("compared result: ", comparedResult);
      resultTable = drawResultCompTable(basedResult, comparedResult);
    } else {
      resultTable = drawResultTable(basedResult);
    }
    resultTables += resultTable + "<br><br>";
  }

  // Get device info table
  const deviceInfoTable = drawDeviceInfoTable(basedResult);
  // Define html style
  const htmlStyle = "<style> \
		* {font-family: Calibri (Body);} \
	  table {border-collapse: collapse;} \
	  table, td, th {border: 1px solid black;} \
	  th {background-color: #4CAF50; color: #ffffff;} \
		</style>";
  // Composite html body
  const html = htmlStyle + resultTables + "<br><br>" + deviceInfoTable;
  console.log("**Generated html: ", html);
  return Promise.resolve(html);
}

module.exports = genTestReport;