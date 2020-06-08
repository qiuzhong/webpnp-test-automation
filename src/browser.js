const os = require('os');
const fs = require('fs');
const path = require('path');
const child = require('child_process');
const { chromium } = require('playwright-chromium');
const settings = require('../config.json');


function configChromePath(setting) {

  let platform = os.platform();

  if (platform === 'win32') {
    setting['chrome_path'] = setting.win_chrome_path.replace('HOME_DIR', os.homedir());
  } else if (platform === 'linux') {
    setting['chrome_path'] = setting.linux_chrome_path;
  } else {
    throw new Error('Unsupported test platform');
  }
}

async function updateChrome() {

  let platform = os.platform();
  if (platform === 'win32') {
    await updateWinChrome();
  } else if (platform === 'linux') {
    await dlChromeAndInstall();
  } else {
    return Promise.reject(new Error(`${platform} not supported`))
  }
  return Promise.resolve();
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

/*
* Update Chrome canary by go to page chrome://settings/help
*/
async function updateWinChrome() {

  configChromePath(settings);
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

    return Promise.resolve();
  } else {
    return Promise.reject(new Error('Update directory not found'));
  }
}

/*
* Download the Linux Chrome deb package
*/
async function dlChromeDeb() {

  let chromeDebUrl = 'https://dl.google.com/linux/direct/google-chrome-unstable_current_amd64.deb';
  let debDir = path.join(process.cwd(), 'deb');
  if (!fs.existsSync(debDir)) {
    fs.mkdirSync(debDir, {recursive: true});
  }
  let debPath = path.join(debDir, 'google-chrome-unstable_current_amd64.deb');
  if (fs.existsSync(debPath)) {
    fs.unlinkSync(debPath);
  }

  await new Promise((resolve, reject) => {
    let dlCmd = `wget -P ${debDir} ${chromeDebUrl}`;
    let output = child.execSync(dlCmd);
    console.log(output.toString());

    return resolve(debPath);
  });
  return Promise.resolve(debPath);
}

/*
* Install the deb package on Linux platform.
*/
async function installChromeDeb(chromePkg) {
  let password = settings.chrome_linux_password;
  let command = `echo ${password} | sudo -S dpkg -i ${chromePkg}`;

  try {
    let output = child.execSync(command);
    console.log(output.toString());
    return Promise.resolve();
  } catch (err) {
    console.log(err);
    return Promise.reject(err);
  }
}


/*
* Get the latest Chrome installers of Windows and Linux and install.
*/
async function dlChromeAndInstall() {

  let chromePkg = await dlChromeDeb();
  await installChromeDeb(chromePkg);
  return Promise.resolve();
}


if (require.main === module) {
  updateChrome();
} else {
  module.exports = {
    configChromePath: configChromePath,
    updateChrome: updateChrome,
    checkBrowserVersion: checkBrowserVersion,
    updateConfig: updateConfig
  };
}

