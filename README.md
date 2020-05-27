This is a test automation framework based on [Playwright](https://github.com/microsoft/playwright), supports key Web workloads automation testing on Chrome browser across multiple platforms, as well as automatically generating test result and sending test report via mail.

## Support

- Platforms: Windows, Linux
- Workloads: Speedometer2, WebXPRT3

## Dependencies

- [Node.js](https://nodejs.org/en/), recommend to use Node.js LTS, current this tool is based on Node.js (12.17.0 LTS).

## Usage
- Go to this folder
- ```javascript
  npm install
  ```
- Config test plan via config.json:
  1. Set test target in `workloads` fields, current we only supports two workloads, WebXPRT3 and Speedometer2, pls. don't edit the workload name while you can change the workload's url and running times via `url` and `run_times` fields respectively. You can also remove either of these two workloads to in order to run single workload testing.
  2. Set executable path of the Chrome browser via `chrome_path` fields.
  3. This tool allows to run tests automatically in a pre-set scheduler by using [node-corn](https://github.com/node-cron/node-cron), you can set the test
  cadence via `test-cadence` field. Please refer to [cron syntax](https://www.npmjs.com/package/node-cron#cron-syntax) to check how to set a test cadence. The default cadence is running at 00:00 Saturday bi-weekly.
  4. `mail_test_report` field is used for setting stakeholders' mail list who'd like to receive the test report.
  5. `mail_error_report` field is used for setting mail list who'd like to receive the error message when the testing goes into something wrong.