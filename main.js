"use strict";


const genDeviceInfo = require('./src/get_device_info.js');
const runTest = require('./src/run.js');
const genTestReport = require('./src/gen_test_report.js');
const sendMail = require('./src/send_mail.js');
const settings = require('./config.json');

async function main() {

  try {
    const deviceInfo = await genDeviceInfo();
    console.log(deviceInfo);

    const workloadResults = await runTest.genWorkloadsResults(deviceInfo);
    console.log(JSON.stringify(workloadResults, null, 4));

    const testReports = await genTestReport(workloadResults);

    let platform = 'Windows';
    if (deviceInfo.OS.indexOf('Ubuntu') !== -1) {
      platform = 'Linux';
    } 
    let subject = 'Web PnP weekly test report - ' + platform + ' - ' + deviceInfo.Browser;
    await sendMail(subject, testReports, 'test_report');
  } catch (err) {
    let subject = 'Web PnP weekly test failed';
    await sendMail(subject, err, 'failure_notice');
  }

}

// main();

cron.schedule(settings.test_cadence, () => {
  main();
});

