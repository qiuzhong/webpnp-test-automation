const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-chromium');
const settings = require('../config.json');
const platformBrowser = require('./browser.js');


/*
* Download screenshots trend charts from Web PnP Report page.
*/
async function dlCharts() {

  let date = new Date();
  let isoDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
  let prefixDate = isoDate.toISOString().substring(0,10).replace(/-/g, '');

  let selectors = {
    'WebXPRT3': '#WebXPRT_3_Windows_Chrome_Canary',
    'Speedometer2': '#Speedometer_2_0_Windows_Chrome_Canary'
  };
  let chartsDir = path.join(process.cwd(), 'charts');
  if (! fs.existsSync(chartsDir)) {
    fs.mkdirSync(chartsDir);
  }

  platformBrowser.configChromePath(settings);
  const browser = await chromium.launch({
    headless: false,
    executablePath: settings.chrome_path
  });
  const page = await browser.newPage();
  await page.goto(settings.chart_page_url);
  for (let workload of settings.workloads) {
    let workloadName = workload.name;
    let element = await page.$(selectors[workloadName]);
    console.log(`Downloading trends image for ${workloadName}`);
    await element.screenshot({
        path: path.join(process.cwd(), 'charts', `${prefixDate}-${workloadName}-trends.png`)
    });     
  }

  await browser.close();
}

/*
* Get all the chart files for insert into the email
*/
async function getChartFiles() {

  let chartsDir = path.join(process.cwd(), 'charts');
  let chartFiles = await fs.promises.readdir(chartsDir);

  if (chartFiles.length === 0)  {
    return Promise.resolve([]);
  } else {
    return Promise.resolve(chartFiles);
  }
}

/*
* Remove the chart image files after sending the email report.
*/
async function cleanUpChartFiles() {
  let chartFiles = await getChartFiles();

  for (let file of chartFiles) {
    let absChartFile = path.join(process.cwd(), 'charts', file);
    console.log(`Remove chart file: ${absChartFile}`);
    await fs.promises.unlink(absChartFile);
  }

  return Promise.resolve();
}


module.exports = {
  dlCharts: dlCharts,
  getChartFiles: getChartFiles,
  cleanUpChartFiles: cleanUpChartFiles
};
