const fs = require('fs');
const fsPromises = fs.promises;
const path = require('path');
const xl = require('excel4node');
const Client = require('ssh2-sftp-client');
const run = require('./run.js');
const settings = require('../config.json');


/*
* Get excel filename base on JSON file path
*/
function getExcelFilename(jsonPath) {
  let resultFileBasename = path.basename(jsonPath, '.json');
  let resultFileParts = resultFileBasename.split('_');

  let date = resultFileParts[0].substring(0, 8);
  let device = resultFileParts[1];
  let platform = run.getPlatformName();

  let browserParts = resultFileParts[resultFileParts.length - 1].split('-');
  browserParts.pop();
  let browser = [platform, browserParts.join('_')].join('-');

  let excelFileName = [date, browser, device].join('_') + '.xlsx';
  return excelFileName;
}

/*
* Write the test results stored in JSON file to excel and upload to server
* 
*/
async function genExcelFilesAndUpload(fileInfo) {
  let results = {};
  let excelFileName = '';

  for (let workload in fileInfo) {
    let resultFilePath = fileInfo[workload]; 

    if (!fs.existsSync(resultFilePath)) {
      return Promise.reject(`${resultFilePath} does not exist, failed to write to Excel!`);
    }
    let rawData = await fsPromises.readFile(resultFilePath, 'utf-8');
    results[workload] = JSON.parse(rawData);

    if (excelFileName === '')
      excelFileName = getExcelFilename(resultFilePath);
    }

  console.log(`Excel file name: ${excelFileName}`);
  let excelDir = path.join(process.cwd(), 'excels');
  if (!fs.existsSync(excelDir)) {
    fs.mkdirSync(excelDir, {recursive: true});
  }

  let excelPathName = path.join(excelDir, excelFileName);
  await writeDataToExcel(excelPathName, results);
  await uploadExcelFile(excelPathName);

  return Promise.resolve();
}

/*
* Write JSON object to an excel file
*/
async function writeDataToExcel(pathname, jsonData) {
  let wb = new xl.Workbook();

  let ws = wb.addWorksheet('Index');
  let deviceInfo = '';
  let tableHeader = ['component', 'case_id', 'unit'];
  let workloadNameConverter = {
    'Speedometer2': 'Speedometer 2.0',
    'WebXPRT3': 'WebXPRT 3'
  };
  let workloadUnits = {
    'Speedometer2': 'score',
    'WebXPRT3': 'ms'
  };
  let totalWorkloadScoreRows = [];
  let detailedWorkloadsScoreRows = [];

  for (let workload in jsonData) {

    if (deviceInfo === '') {
      let device = jsonData[workload]['device_info'];
      let cpu = device['CPU']['info'];
      let gpu = device['GPU'];
      let gpuVer = device['GPU Driver Version'];
      let osVer = device['OS Version'];
      let browserVer = device['Browser'].split('-').pop();
      deviceInfo = ['CPU: ' + cpu,
                    'GPU: ' + gpu,
                    'GPU Version: ' + gpuVer,
                    'OS Version: ' + osVer,
                    'Browser Version: ' + browserVer].join('\n');

    }

    let totalWorkloadName = jsonData[workload]['workload'];
    if (workload in workloadNameConverter)
      totalWorkloadName = workloadNameConverter[workload];

    totalWorkloadScoreRows.push([totalWorkloadName, totalWorkloadName, 'score',
                                jsonData[workload]['test_result']['Total Score']]);

    for (let subCase in jsonData[workload]['test_result']) {
      if (subCase !== 'Total Score') {
        let col1 = totalWorkloadName;
        let col2 = subCase;
        if (workload === 'WebXPRT3')
          col2 = subCase.replace(/\s\(ms\)$/g, ''); // Remove unit in excel sheet.
        let col3 = workloadUnits[workload];
        let col4 = jsonData[workload]['test_result'][subCase];

        detailedWorkloadsScoreRows.push([col1, col2, col3, col4]);
      }
    }
  }
  tableHeader.push(deviceInfo);

  for (let i = 0; i < tableHeader.length; i++)
    ws.cell(1, i + 1).string(tableHeader[i]);

  for (let i = 0; i < totalWorkloadScoreRows.length; i++)
    for (let j = 0; j < totalWorkloadScoreRows[i].length; j++)
      ws.cell(i + 2, j + 1).string(totalWorkloadScoreRows[i][j]);

  for (let i = 0; i < detailedWorkloadsScoreRows.length; i++)
    for (let j = 0; j < detailedWorkloadsScoreRows[i].length; j++)
      ws.cell(i + 4, j + 1).string(detailedWorkloadsScoreRows[i][j]);

  await wb.write(pathname);

  return Promise.resolve();
}

/*
* Upload excel file to a the server
*/
async function uploadExcelFile(pathname) {

  let excelName = path.basename(pathname);
  let sftp = new Client();
  let serverConfig = {
    host: settings.excel_server.host,
    username: settings.excel_server.username,
    password: settings.excel_server.password
  };
  let remoteResultDir = `/home/${serverConfig.username}/PHP/files`;
  try {
    await sftp.connect(serverConfig);
    let remoteResultDirExist = await sftp.exists(remoteResultDir);
    if (!remoteResultDirExist) {
      console.log(`mkdir -pv ${remoteResultDir} on remote server to store excel files...`);
      await sftp.mkdir(remoteResultDir, true);
      console.log(`${remoteResultDir} created on remote server`);
    }

    let remoteExcelPathName = remoteResultDir + `/${excelName}`;
    let remoteFileExist = await sftp.exists(remoteExcelPathName);
    if (remoteFileExist) {
      console.log(`${remoteExcelPathName} already exists, remove it first`);
      await sftp.delete(remoteExcelPathName);
      console.log(`${remoteExcelPathName} deleted on remote server`);
    }
    console.log(`Uploading local excel file: ${pathname}`);
    await sftp.fastPut(pathname, remoteExcelPathName);
    console.log(`${pathname} uploaded to remote server.`);
  } catch (err) {
    console.log(err);
  } finally {
    await sftp.end();
  }
  return Promise.resolve();
}


module.exports = {
  genExcelFilesAndUpload: genExcelFilesAndUpload
};
