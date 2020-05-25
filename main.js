"use strict";

// const sendMail = require('./send_mail.js');
// const runTest = require('./run_test.js');
// const genMail = require('./gen_mail.js');
// const genDeviceInfo = require('./gen_device_info.js');

// async function main() {
//   const testResults = await runTest();
//   const deviceInfo = await genDeviceInfo(...testResult);

//   // await sendMail(deviceInfo);
// }

// main().catch(console.error);

const run_test = require('./run_test.js');
const genDeviceInfo = require('./gen_device_info.js');
const sendMail = require('./send_mail.js');

async function main() {
  let speedometer2Results = await run_test.runSpeedometer2AndProcessResults();
//   let webXPRT3Results = await run_test.runWebXPRT3AndProcessResults();
  const deviceInfo = await genDeviceInfo(...testResult);

  await sendMail(deviceInfo + JSON.stringify(speedometer2Results));
}

main();

// cron.schedule('0 0 3 * * *', () => {
//     main().catch(err => (){
//         sendMail(err);
//     }
// });

