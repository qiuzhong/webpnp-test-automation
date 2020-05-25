"use strict";

const settings = require('../config.json');
const { chromium } = require('playwright');

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
  const gpuDriverVerText = await page.evaluate(() =>
    [...document.querySelectorAll('#info-view-table > tbody > tr:nth-child(19)')].map(({ innerText }) => innerText)
  );
  if (gpuDriverVerText[0].split('\t')[0] !== "Driver version")
    console.error("Error: Cann't get GPU Driver version!");
  const gpuDriverVer = gpuDriverVerText[0].split('\t')[1];
  console.log(gpuDriverVer);

  await browser.close();
  return Promise.resolve([chromeVersion, gpuDriverVer]);
};

module.exports = getOtherInfo;