"use strict";


const genDeviceInfo = require('./src/get_device_info.js');
const runTest = require('./src/run.js');
const browser = require('./src/browser.js');
const genTestReport = require('./src/gen_test_report.js');
const sendMail = require('./src/send_mail.js');
const settings = require('./config.json');
const excel = require('./src/excel.js');
const chart = require('./src/chart.js');
const cron = require('node-cron');
const moment = require('moment');
const os = require('os');


const cpuModel = os.cpus()[0].model;
const platform = runTest.getPlatformName();

async function main() {

  let now = moment();
  const weekAndDay = now.week() + '.' + now.day();

  let deviceInfo = {};
  try {
    deviceInfo = await genDeviceInfo();

    // in dev mode, check browser version will be skipped.
    if (!settings.dev_mode) {
      await browser.checkBrowserVersion(deviceInfo);
    }

    const workloadResults = await runTest.genWorkloadsResults(deviceInfo);
    console.log(JSON.stringify(workloadResults, null, 4));
    await excel.genExcelFilesAndUpload(workloadResults);

    let chartImages = [];
    // only attach the trend charts for Canary tests
    // Since AMD testing is before Intel, downloading charts is available after Intel testing done.
    if (deviceInfo.Browser.includes('Canary') && cpuModel.includes('Intel')) {
      await chart.dlCharts();
      chartImages = await chart.getChartFiles();
      console.log(chartImages);
    }

    let mailType = 'test_report';
    if (cpuModel.includes('AMD'))
      mailType = 'dev_notice'; // If the test is on AMD platform, then send dev team.

    const testReports = await genTestReport(workloadResults);

    let subject = '[W' + weekAndDay + '] Web PnP weekly automation test report - ' + platform + ' - ' + deviceInfo.Browser;
    console.log(subject);
    await sendMail(subject, testReports, mailType, chartImages);
  } catch (err) {

    console.log(err);
    let subject = '[W' + weekAndDay + ']';
    if (! settings.dev_mode && err.message.includes('No new browser update')) {
      subject += 'Web PnP weekly automation test cancelled on ' + platform + ' as no browser update';
    } else { 
      subject += 'Web PnP weekly automation test failed on ' + platform + '-' + cpuModel;
    }

    console.log(subject);
    await sendMail(subject, err, 'failure_notice');
  }

  // Update the browser version in config.json if necessary
  await browser.updateConfig(deviceInfo, settings);

  if (deviceInfo.Browser.includes('Canary') && cpuModel.includes('Intel')) {
    await chart.cleanUpChartFiles();
  }
}


if (settings.enable_cron) {
  cron.schedule(settings.update_browser_sched, () => {
    browser.updateChrome();
  });
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

