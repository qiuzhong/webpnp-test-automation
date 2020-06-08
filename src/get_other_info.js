"use strict";

const settings = require('../config.json');
const browser = require('./browser.js');
const { chromium } = require('playwright-chromium');

/*
* Get information of gpu driver version and browser version
*/
async function getOtherInfo() {
  console.log('********** Get other device info **********');
  browser.configChromePath(settings);
  const chromePath = settings.chrome_path;
  const browser = await chromium.launch({
      headless: false,
      executablePath: chromePath,
  });

  const page = await browser.newPage();

  // Get Chrome version
  await page.goto('chrome://version');
  const versionElement = await page.$('#version');
  const versionInfo = await versionElement.evaluate(element => element.innerText);
  console.log(versionInfo);

  let chromeChannel = '';
  if (versionInfo.includes('Stable')) {
    chromeChannel = 'Stable';
  } else if (versionInfo.includes('canary')) {
    chromeChannel = 'Canary';
  } else if (versionInfo.includes('Developer')) {
    chromeChannel = 'Dev';
  } else {
    chromeChannel = 'Beta';
  }
  const chromeVersion = chromeChannel + '-' + versionInfo.split(' ')[0];
  console.log('********** Chrome version **********');
  console.log(chromeVersion);
  
  // Get GPU driver version
  console.log('********** GPU driver version **********');
  await page.goto('chrome://gpu');
  const gpuDriverVersion = await page.evaluate(() => {
    let table = document.querySelector('#basic-info').querySelector('#info-view-table');
    for (let i = 0; i < table.rows.length; i++) {
      if (table.rows[i].cells[0].innerText === 'Driver version') {
        return table.rows[i].cells[1].innerText;
      }
    }
    return '';
  });
  if (gpuDriverVersion === '')
    console.error("Error: Cann't get GPU Driver version!");
  console.log(gpuDriverVersion);

  await browser.close(); // A bug here, await close() method will hang and never been resolved.

  const otherInfo = {
    "chromeVersion": chromeVersion,
    "gpuDriverVersion": gpuDriverVersion
  };

 return Promise.resolve(otherInfo);
};

module.exports = getOtherInfo;