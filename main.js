"use strict";


const genDeviceInfo = require('./src/get_device_info.js');
const runTest = require('./src/run.js');
const genTestReport = require('./src/gen_test_report.js');
const sendMail = require('./src/send_mail.js');
const settings = require('./config.json');
const cron = require('node-cron');
const moment = require('moment');

let cpuModel = require('os').cpus()[0].model;

async function main() {

  let now = moment();
  const weekAndDay = now.week() + '.' + now.day();

  try {
    const deviceInfo = await genDeviceInfo();
    console.log(deviceInfo);

    const workloadResults = await runTest.genWorkloadsResults(deviceInfo);
    console.log(JSON.stringify(workloadResults, null, 4));

    const testReports = await genTestReport(workloadResults);

    let platform = 'Windows';
    if (deviceInfo.OS.includes('Ubuntu')) {
      platform = 'Linux';
    } 
    let subject = '[W' + weekAndDay + '] Web PnP weekly test report - ' + platform + ' - ' + deviceInfo.Browser;
    console.log(subject);
    await sendMail(subject, testReports, 'test_report');
  } catch (err) {
    let subject = '[W' + weekAndDay + '] Web PnP weekly test failed';
    await sendMail(subject, err, 'failure_notice');
  }

}


if (settings.enable_cron) {
  if (cpuModel.includes('Intel')) {
    cron.schedule(settings.intel_test_cadence, () => {
      main();
    });
  } else {
    cron.schedule(settings.amd_test_cadence, () => {
      main();
    });
  }
} else {
  main();
}

