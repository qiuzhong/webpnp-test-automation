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
  const gpuDriverVersionText = await page.evaluate(() =>
    [...document.querySelectorAll('#info-view-table > tbody > tr:nth-child(19)')].map(({ innerText }) => innerText)
  );
  if (gpuDriverVersionText[0].split('\t')[0] !== "Driver version")
    console.error("Error: Cann't get GPU Driver version!");
  const gpuDriverVerion = gpuDriverVersionText[0].split('\t')[1];
  console.log(gpuDriverVerion);

  browser.close().catch(console.error);
  // await browser.close(); // A bug here, await close() method will hang and never been resolved.

  const otherInfo = {
    "chromeVersion": chromeVersion,
    "gpuDriverVersion": gpuDriverVerion
  };

 return Promise.resolve(otherInfo);
};

module.exports = getOtherInfo;