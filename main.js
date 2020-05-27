"use strict";


const genDeviceInfo = require('./src/get_device_info.js');
const runTest = require('./src/run.js');
const genTestReport = require('./gen_test_report.js');
// const sendMail = require('./send_mail.js');

async function main() {

  const deviceInfo = await genDeviceInfo();
  console.log(deviceInfo);

  const speedometer2Results = await runTest.genSpeedometer2Results(deviceInfo);
  const webXPRT3Results = await runTest.genWebXPRT3Results(deviceInfo);

  console.log(JSON.stringify({
    'Speedometer2': speedometer2Results,
    'WebXPRT3': webXPRT3Results
  }, null, 4));

  // await sendMain({
  //  'Speedometer2': speedometer2Results,
  //  'WebXPRT3': webXPRT3Results
  // });

  const testReports = await genTestReport({
    'Speedometer2': speedometer2Results,
    'WebXPRT3': webXPRT3Results
  });

  const subject = "Web PnP weekly test report - " + deviceInfo.OS + " - " + deviceInfo.Browser;
  await sendMail(subject, testReports, 'test_report');
}

main();

// cron.schedule('0 0 3 * * *', () => {
//   main().catch(err => () {
//     sendMail(err);
//   }
// });

