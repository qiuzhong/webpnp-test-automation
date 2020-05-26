"use strict";

const settings = require('../config.json');
const { chromium } = require('playwright');

/*
* Get information of gpu driver version and browser version
*/
async function getOtherInfo() {
  console.log('********** Get other device info **********');
  const chromePath = settings.chrome_path;
  const browser = await chromium.launch({
      headless: false,
      executablePath: chromePath,
  });

  const page = await browser.newPage();

  // Get Chrome version
  await page.goto('chrome://version');
  const versionElement = await page.$('#version > span:nth-child(1)');
  const chromeVersion = await versionElement.evaluate(element => element.textContent);
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