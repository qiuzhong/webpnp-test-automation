This is a test automation framework based on [Playwright](https://github.com/microsoft/playwright), supports key Web workloads automation testing on Chrome browser across multiple platforms, as well as automatically generating test result and sending test report via mail.

## Support

- Platforms: Windows, Linux
- Workloads: Speedometer2, WebXPRT3

## Dependencies

- [Node.js](https://nodejs.org/en/), recommend to use Node.js LTS, current this tool is based on Node.js (12.17.0 LTS).

## Workflow
The automation test mainly takes the following actions:
* Get the system information like CPU, Memory, OS.
* Launch the Chrome browser and read the GPU information and browser version.
* Check if the launching browser version is higher than the one for which ran last time. It's not necessary to run a second time for
  the same version.
* Launch the chrome and run each workload defined in config.json for several times. The test results of all arounds are recorded.
* Choose the middle value among the test arounds and store the device information and all the results of this workload test
  to `./results/{platform}/{workload}` directory(If it does not exists, create it). The files are named as `{data}_{CPU}_{Browser}.json`.
* Before storing the test results to json files, download the test results of competitor from remote server. Then we can compare the
  scores to the ones from compettitor. After storing the results, upload this test results to remote server for backup.
* Generate the excel files to list the scores between CPUs for the same workload at `./excels` directory(If it does not exists, create it)
  and then upload them to the remote server.
* Execute a script on server to upload the data stored in excel files to the Web PnP Report site database.
* Download the trend charts for each workload and put them on the `./charts` directory(If it does not exists, create it).
* Generate html report that contains the comparison tables based on the json files. The comparison will base on the paris in
  `cpu_list.json`. The trend charts are insert into the html.
* Send E-mail to involved teams of the project. If there're any errors occured, send the errors information to dev team.
* Write the browser version to config.json and clean up the downloaded charts.

## Usage
- Go to this folder
- ```javascript
  npm install
  ```
- Config test plan via config.json:
  1. Set test target in `workloads` fields, current we only supports two workloads, WebXPRT3 and Speedometer2, pls. don't edit the workload name while you can change the workload's url and running times via `url` and `run_times` fields respectively. You can also remove either of these two workloads to in order to run single workload testing.
  2. To support both Windows and Linux platforms, `win_chrome_path` and `linux_chrome_path` are introduced. The `chrome_path` field is invalid now, you should not set it.
  3. This tool allows to run tests automatically in a pre-set scheduler by using [node-corn](https://github.com/node-cron/node-cron), you can set the test cadence via `intel_test_cadence` and `amd_test_cadence` fields. `amd_test_cadence` is **always before** the `intel_test_cadence` as Intel testing will compare the test results to AMD. Please refer to [cron syntax](https://www.npmjs.com/package/node-cron#cron-syntax) to check how to set a test cadence. The default cadence is running at 00:00 Saturday bi-weekly.
  4. `mail_test_report` field is used for setting stakeholders' mail list who'd like to receive the test report.
  5. `mail_dev_notice` field is used for setting mail list who'd like to receive the error message when the testing goes into something wrong.
  6. On Linux platform, please set the `chrome_linux_password` field the Linux sudo password. It's required while upgrading the
  chrome as install Linux package might need sudo permission.
  7. There is a `dev_mode`, setting it to `true` will skip the browser version check.
  8. If you don't want to run the test at a specific schedule, you can simply set `enable_cron` to `false`. Then the browser upgrading will also be skipped.

- Run the test: restart the PC and go to this folder again and run:
  `node main.js`
- Add a new workload
  If you want to a new workload, you need:
  * Update the `workloads` array of config.json.
  * Provide a workload executor module, place it to `src/workloads/` directory.
  * Update the `executors` object of the function `genWorkloadsResults` in `src/run.js`.

  ## Note

  - This tool uses playwright v1.02, which is only guarantee to support Chromium >= 84.0.4135.0.
  - Tester should maintain the cpu_list.json file which is a CPU info lists used for finding matched CPU code name and corresponding competitor's test result.
  - Before testing, please restart the test device to make a clean up environment.
