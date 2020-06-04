const os = require('os');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-chromium');
const settings = require('../config.json');


async function updateChrome() {

  let platform = os.platform();
  if (platform === 'win32') {
    let updateDir = path.join(os.homedir(), 'AppData', 'Local', 'Google', 'Update');
    if (fs.existsSync(updateDir)) {
      console.log('********** Getting chrome version before update **********');
      let browser = await chromium.launch({
        headless: false,
        executablePath: settings.chrome_path,
      });
      let page = await browser.newPage();
      await page.goto('chrome://version');
      let versionElement = await page.$('#version');
      let lastVersion = await versionElement.evaluate(element => element.innerText);
      console.log(lastVersion);

      console.log('********** Upgrading the Chromium browser **********');
      await page.goto('chrome://settings/help');

      await new Promise(resolve => setTimeout(resolve, 5 * 60 * 1000));
      await browser.close();

      console.log('********** Getting chrome version after update **********');
      browser = await chromium.launch({
        headless: false,
        executablePath: settings.chrome_path,
      });
      page = await browser.newPage();
      await page.goto('chrome://version');
      versionElement = await page.$('#version');
      thisVersion = await versionElement.evaluate(element => element.innerText);
      console.log(thisVersion);
      await browser.close();
    }
  }
  return Promise.resolve();
}

/*
* Check if the Chrome canary Update directory exists on Windows, if not skip the update.
*/
function chromeUpdateDirectoryExist() {
  
  let platform = os.platform();

  if (platform === 'win32') {
    let updateDir = path.join(os.homedir(), 'AppData', 'Local', 'Google', 'Update')
    return fs.existsSync(updateDir);
  }

  return true;
}

/*
* Check browser version in latest results JSON
*/
async function checkBrowserVersion(deviceInfo) {

  let browserInfo = deviceInfo.Browser.split('-');
  let currentVersion = browserInfo.pop();

  if (!('chrome_canary_version' in settings)) {
    return Promise.resolve();
  } else {
    let lastVersion = settings.chrome_canary_version;
    if (currentVersion <= lastVersion) {
      return Promise.reject(new Error('No new browser update'))
    }
  }

  return Promise.resolve();
}

/*
* Update config.json when the browser version is higher than config.json
*/
async function updateConfig(deviceInfo, settings) {
  let browserInfo = deviceInfo.Browser.split('-');
  let currentVersion = browserInfo[browserInfo.length - 1];

  let needUpdate = false;
  if (! ('chrome_canary_version' in settings)) {
    needUpdate = true;
  } else if (settings.chrome_canary_version < currentVersion) {
    needUpdate = true;
  }

  if (needUpdate) {
    settings.chrome_canary_version = currentVersion;
    await fs.promises.writeFile(
      path.join(process.cwd(), 'config.json'),
      JSON.stringify(settings, null, 4));
  }
}

if (require.main === module) {
  updateChromium();
} else {
  module.exports = {
    updateChrome: updateChrome,
    checkBrowserVersion: checkBrowserVersion,
    updateConfig: updateConfig
  };
}

