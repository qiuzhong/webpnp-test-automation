"use strict";


const genDeviceInfo = require('./src/get_device_info.js');
const run_test = require('./src/run.js');
// const sendMail = require('./send_mail.js');

async function main() {

  const deviceInfo = await genDeviceInfo();
  console.log(deviceInfo);

  let speedometer2Results = await run_test.genSpeedometer2Results(deviceInfo);
  // let webXPRT3Results = await run_test.genWebXPRT3Results(deviceInfo);
  // await sendMain({
  //  'Speedometer2': speedometer2Results,
  //  'WebXPRT3': webXPRT3Results
  // });
}

main();

// cron.schedule('0 0 3 * * *', () => {
//   main().catch(err => () {
//     sendMail(err);
//   }
// });

