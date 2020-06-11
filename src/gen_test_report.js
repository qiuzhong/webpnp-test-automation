"use strict";

const fs = require('fs');
const fsPromises = fs.promises;
const path = require('path');
const os = require('os');
const cpuList = require('../cpu_list.json');
const chart = require('./chart.js');


/*
* Draw table header
* @param {String}, type, one of ["summary", "details"]
*/
function drawTableHeader(type, basedResult, preResult, competitorResult) {
  let preCpu = "", preOs = "", preBrowser = "", vsPre = "";
  let comCpu = "", comOs = "", comBrowser = "", vsCom = "</tr>";
  let firstCol = "Workloads";
  if (type !== "summary")
    firstCol = basedResult.workload;
  if (preResult !== "") {
    preCpu = `<th>${preResult.device_info.CPU.info}</th>`;
    preOs = `<th>${preResult.device_info.OS}</th>`;
    preBrowser = `<th>${preResult.device_info.Browser}</th>`;
    vsPre = `<th rowspan='3'>Chrome vs. previous (${basedResult.device_info.CPU.codename})</th>`;
  }
  if (competitorResult !== "") {
    comCpu = `<th>${competitorResult.device_info.CPU.info}</th>`;
    comOs = `<th>${competitorResult.device_info.OS}</th>`;
    comBrowser = `<th>${competitorResult.device_info.Browser}</th>`;
    vsCom = `<th rowspan='3'>${basedResult.device_info.CPU.codename} vs. ${competitorResult.device_info.CPU.codename}</th></tr>`;
  }
  const tableHeader = `<tr><th rowspan="3">${firstCol}</th>\
                     ${preCpu + comCpu}<th>${basedResult.device_info.CPU.info}</th>${vsPre + vsCom}\
                 <tr>${preOs + comOs}<th>${basedResult.device_info.OS}</th></tr>\
                 <tr>${preBrowser + comBrowser}<th>${basedResult.device_info.Browser}</th></tr>`;
  return tableHeader;
}

function drawRoundsHeader(basedResult, competitorResult) {
  let comCol = "</tr>";
  let basedRoundCol = "<tr>", comRoundCol = "";
  const basedResultLength = basedResult.test_rounds.length;
  for (let i = 0; i < basedResultLength; i ++) {
    basedRoundCol += `<th>Round ${i + 1}</th>`;
  }

  let header = `<tr><th rowspan='2'>Workloads</th><th colspan='${basedResultLength}'>\
    ${basedResult.device_info.CPU.info + " " + basedResult.device_info.Browser}</th>`;
  if(competitorResult !== "") {
    const comResultLength = competitorResult.test_rounds.length;
    for (let i = 0; i < comResultLength; i ++) {
      comRoundCol += `<th>Round ${i + 1}</th>`;
    }
    comCol = `<th colspan='${comResultLength}'>\
      ${competitorResult.device_info.CPU.info + " " + competitorResult.device_info.Browser}</th></tr>`;
  }
  header = header + comCol + basedRoundCol + comRoundCol + "</tr>";
  return header;
}

function drawRoundsResult(basedResult, competitorResult) {
  let basedResultCol = `<tr><td>${basedResult.workload}</td>`;
  let comResultCol = "";
  const selectedStyle = "style='background-color: #4CAF50;'";
  for ( let i = 0; i < basedResult.test_rounds.length; i++ ) {
    if (i === basedResult.selected_round)
      basedResultCol += `<td ${selectedStyle}>${basedResult.test_rounds[i].scores["Total Score"]}</td>`;
    else
      basedResultCol += `<td>${basedResult.test_rounds[i].scores["Total Score"]}</td>`;
  }
  if (competitorResult !== "") {
    for ( let i = 0; i < competitorResult.test_rounds.length; i++ ) {
      if (i === competitorResult.selected_round)
        comResultCol += `<td ${selectedStyle}>${competitorResult.test_rounds[i].scores["Total Score"]}</td>`;
      else
        comResultCol += `<td>${competitorResult.test_rounds[i].scores["Total Score"]}</td>`;
    }
  }
  const resultCol = basedResultCol + comResultCol + "</tr>";
  return resultCol;
}

function drawResultTable(basedResult, preResult, competitorResult, hasPreResult) {
  let summaryCol = "";
  let resultTable = "<table>" + drawTableHeader("details", basedResult, preResult, competitorResult);

  for (const key of Object.keys(basedResult.test_result)) {
    const basedValue = basedResult.test_result[key];
    // Get info from preResult
    let preValue = "", preCol = "", vsPreCol = "";
    if (preResult !== "") {
      preValue = preResult.test_result[key];
      preCol = `<td>${preValue}</td>`;
      vsPreCol = drawCompareResult(basedValue, preValue);
      if (basedResult.workload === "WebXPRT3" && key !== "Total Score") {
        vsPreCol =  drawCompareResult(preValue, basedValue);
      }
    }
    // Get info from competitorResult
    let competitorCol = "", vsCompetitorCol = "", competitorValue = "";
    if (competitorResult !== "") {
      competitorValue = competitorResult.test_result[key];
      vsCompetitorCol = drawCompareResult(basedValue, competitorValue);
      if (basedResult.workload === "WebXPRT3" && key !== "Total Score") {
        vsCompetitorCol =  drawCompareResult(competitorValue, basedValue);
      }
      competitorCol = `<td>${competitorValue}</td>`;
    }
    // Draw resultTable
    resultTable += `<tr><td>${key}</td>${preCol + competitorCol}<td>${basedValue}</td>${vsPreCol + vsCompetitorCol}</tr>`;
    // Draw summaryCol
    if (key == "Total Score") {
      if (preResult === "" && hasPreResult) {
        preCol = "<td>-</td>";
        vsPreCol = "<td>-</td>";
      }
      summaryCol = `<tr><td>${basedResult.workload}</td>${preCol + competitorCol}<td>${basedValue}</td>${vsPreCol + vsCompetitorCol}</tr>`;
    }
  }

  return {"all":`${resultTable}</table>`, "summaryCol": summaryCol};
}

async function findPreTestResult(resultPath) {
  const dir = await fs.promises.readdir(path.dirname(resultPath));
  // Gets cpu info from the test report file, e.g. Intel-KBL-i5-8350U
  const currentCPU = path.basename(resultPath).split('_')[1];
  const currentBrowser = path.basename(resultPath).split('_')[2];
  const currentBrowserChannel = currentBrowser.split('-')[1];
  if (dir.length == 0)
    return Promise.reject("Error: no test result found!");
  else if (dir.length == 1)
    return Promise.resolve("");
  else {
    let dirents = [];
    for (const dirent of dir) {
      // We only compare same CPU versions and previous browser version
      const prevBrowser = dirent.split('_')[2];
      const prevBrowserChannel = prevBrowser.split('-')[1];
      if (currentCPU === dirent.split('_')[1] && currentBrowserChannel === prevBrowserChannel &&
          currentBrowser > prevBrowser)
        dirents.push(dirent);
    }
    if (dirents.length > 0) {
      const comparedPath = path.join(path.dirname(resultPath), dirents.sort().pop());
      console.log("Found the previous test result: ", comparedPath);
      const rawComparedData = await fsPromises.readFile(comparedPath, 'utf-8');
      const preResult = JSON.parse(rawComparedData);
      console.log("compared result: ", preResult);
      return Promise.resolve(preResult);
    } else {
      return Promise.resolve("");
    }
  }
}

async function findCompetitorResult(resultPath) {
  const dir = await fs.promises.readdir(path.dirname(resultPath));
  const basedFileName = path.basename(resultPath).split('_');
  const basedCpuInfo = basedFileName[1];
  // cpu_list.json's keys are cpu brand name
  let basedCpuBrand = basedCpuInfo.slice(basedCpuInfo.indexOf('-') + 1);
  basedCpuBrand =basedCpuBrand.slice(basedCpuBrand.indexOf('-') + 1);
  const basedChromeVersion = basedFileName[2];

  let matchedAmdInfo = "";
  if (basedCpuBrand in cpuList["Intel"])
    matchedAmdInfo = cpuList["Intel"][basedCpuBrand]["competitor"].replace(/\s/g, '-');
  else
    return Promise.reject(`Error: does not found matched Intel CPU info: (${basedCpuInfo}) in cpu_list.json`);

  let amdDirents = [];
  for (const dirent of dir) {
    // We only find matched AMD cpu
    if (dirent.split('_')[1].includes(matchedAmdInfo) && dirent.split('_')[2].includes(basedChromeVersion))
      amdDirents.push(dirent);
  }
  if (amdDirents.length == 0) {
    return Promise.resolve("");
  } else {
    // Find AMD test result with latest execution time
    const amdPath = path.join(path.dirname(resultPath), amdDirents.sort().reverse()[0]);
    console.log("Found the competitor test result: ", amdPath);
    const rawComparedData = await fsPromises.readFile(amdPath, 'utf-8');
    const amdResult = JSON.parse(rawComparedData);
    console.log("Competitor result: ", amdResult);
    return Promise.resolve(amdResult);
  }
}

// Draw comparison result with style
// green for result >= 100%, yellow for 99.99% < result < 95%, red for result <= 95%
function drawCompareResult(basedValue, comparedValue) {
  const result = Math.round(((basedValue / comparedValue) * 100) * 100) / 100;
  let resultStyle = "";
  if (result >= 100)
    resultStyle = "#4CAF50";
  else if (result < 100 && result > 95)
    resultStyle = "#D1B100";
  else
    resultStyle = "red";
  return `<td style="color:${resultStyle}">${result}%</td>`;
}

function drawDeviceInfoTable(result) {
  let deviceInfoTable = "<table>";
  const deviceInfo = result.device_info;
  for (const key in deviceInfo) {
    if (key === "CPU")
      deviceInfoTable += `<tr><td>${key}</td><td>${deviceInfo[key].info}</td></tr>`;
    else
      deviceInfoTable += `<tr><td>${key}</td><td>${deviceInfo[key]}</td></tr>`;
  }
  return `${deviceInfoTable}</table>`;
}

async function hasPreResults(resultPaths) {
  for (const key in resultPaths) {
    const resultPath = resultPaths[key];
    // Find previous test result
    const preResult = await findPreTestResult(resultPath);
    if (preResult !== "")
      return Promise.resolve(true);
  }
  return Promise.resolve(false);

}
/*
* Generate test report as html
* @param: {Object}, resultPaths, an object reprensents for test result path
* e.g.
* {
*   "Speedometer2": path.join(__dirname, "../results/Windows/Speedometer2/20200606042844_Intel-TGL-i7-1165G7_Chrome-Canary-85.0.4165.0.json"),
*	  "WebXPRT3": path.join(__dirname, "../results/Windows/WebXPRT3/20200606053303_Intel-TGL-i7-1165G7_Chrome-Canary-85.0.4165.0.json")
* }
*/
async function genTestReport(resultPaths) {
  console.log("********** Generate test report as html **********");
  // Get test result table
  let resultTables = "";
  let summaryTable = "<table>";
  let roundsTable = "<table>";
  let basedResult;
  let flag = false;
  const hasPreResult = await hasPreResults(resultPaths);
  for (const key in resultPaths) {
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
    let competitorResult = "";
    // Find previous test result
    const preResult = await findPreTestResult(resultPath);
    // Try to find competitor test result only when based test result is running on Intel
    if (basedResult.device_info.CPU.mfr === "Intel")
      // Find competitor test result
      competitorResult = await findCompetitorResult(resultPath);
    if(!flag) {
      summaryTable += drawTableHeader("summary", basedResult, preResult, competitorResult);
      roundsTable += drawRoundsHeader(basedResult, competitorResult);
    }
    const resultTable = drawResultTable(basedResult, preResult, competitorResult, hasPreResult);
    resultTables += `${resultTable.all}<br>`;
    summaryTable += resultTable.summaryCol;
    roundsTable += drawRoundsResult(basedResult, competitorResult);
    flag = true;
  }
  summaryTable += "</table><br>";
  roundsTable += "</table><br><br>";
  // Get device info table
  const deviceInfoTable = drawDeviceInfoTable(basedResult);
  // Define html style
  const htmlStyle = "<style> \
		* {font-family: Calibri (Body);} \
	  table {border-collapse: collapse;} \
	  table, td, th {border: 1px solid black;} \
	  th {background-color: #0071c5; color: #ffffff; font-weight: normal;} \
		</style>";
  // Composite html body
  let charts = await chart.getChartFiles();
  let chartImages = '<br/>';
  for (let chart of charts) {
    chartImages += '<img src="cid:' + chart.replace('.png', '') + '"><br/>';
  }
  const html = htmlStyle + "<b>Summary:</b>" + chartImages + summaryTable + roundsTable + "<b>Details:</b>"
               + resultTables + "<br><br>" + "<b>Device Info:</b>" + deviceInfoTable;
  console.log("**Generated html: ", html);
  return Promise.resolve(html);
}

module.exports = genTestReport;