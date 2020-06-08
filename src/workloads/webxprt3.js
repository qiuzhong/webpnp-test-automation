const settings = require('../../config.json');
const platformBrowser = require('../browser.js');
const { chromium } = require('playwright-chromium');


async function runWebXPRT3Test(workload) {
  // let workload = settings.workloads[0];

  platformBrowser.configChromePath(settings);
  console.log('********** Start running WebXPRT3 tests **********');
  const browser = await chromium.launch({
    headless: false,
    executablePath: settings.chrome_path
  });
  const page = await browser.newPage();

  console.log(`********** Going to URL: ${workload.url} **********`);
  await page.goto(workload.url);

  console.log("********** Running WebXPRT3 tests... **********");
  await page.click('xpath=//*[@id="startBtnDiv"]/div[3]/div/div/a/p');
  await page.waitForSelector('xpath=//*[@id="medScnRes"]/div[2]/div[2]/div[1]/a/h4',
    {timeout: 10 * 60 * 1000}
  );

  console.log("********** Running WebXPRT3 tests completed **********");
  let scores = {};
  const scoreHandler = await page.$('#medScnRes > div:nth-child(2) > div:nth-child(1) > div > div > p.text-center.results-score-text');
  const score = await scoreHandler.evaluate(element => element.textContent);
  console.log('********** WebXPRT3 tests score: **********');
  console.log(`********** ${score}  **********`);
  scores['Total Score'] = score;

  const photoEnhancementElement = await page.$('#medScnRes > div:nth-child(5) > div:nth-child(1) > div > div.medium-3.columns.wx-results-text-cols > table > tbody > tr > td > h4');
  const photoEnhancementScore = await photoEnhancementElement.evaluate(element => element.innerText);
  scores['Photo Enhancement (ms)'] = photoEnhancementScore;

  const organizeAlbumElement = await page.$('#medScnRes > div:nth-child(5) > div:nth-child(2) > div > div.medium-3.columns.wx-results-text-cols > table > tbody > tr > td > h4');
  const organizeAlbumScore = await organizeAlbumElement.evaluate(element => element.innerText);
  scores['Organize Album using AI (ms)'] = organizeAlbumScore;

  const stockOptionElement = await page.$('#medScnRes > div:nth-child(5) > div:nth-child(3) > div > div.medium-3.columns.wx-results-text-cols > table > tbody > tr > td > h4');
  const stockOptionScore = await stockOptionElement.evaluate(element => element.innerText);
  scores['Stock Option Pricing (ms)'] = stockOptionScore;

  const encryptNoteElement = await page.$('#medScnRes > div:nth-child(5) > div:nth-child(4) > div > div.medium-3.columns.wx-results-text-cols > table > tbody > tr > td > h4');
  const encryptNoteScore = await encryptNoteElement.evaluate(element => element.innerText);
  scores['Encrypt Notes and OCR Scan (ms)'] = encryptNoteScore;

  const salesGraphsElement = await page.$('#medScnRes > div:nth-child(5) > div:nth-child(5) > div > div.medium-3.columns.wx-results-text-cols > table > tbody > tr > td > h4');
  const salesGraphsScore = await salesGraphsElement.evaluate(element => element.innerText);
  scores['Sales Graphs (ms)'] = salesGraphsScore;

  const onlineHomeworkElement = await page.$('#medScnRes > div:nth-child(5) > div:nth-child(6) > div > div.medium-3.columns.wx-results-text-cols > table > tbody > tr > td > h4');
  const onlineHomeworkScore = await onlineHomeworkElement.evaluate(element => element.innerText);
  scores['Online Homework (ms)'] = onlineHomeworkScore;

  console.log('********** Detailed scores: **********');
  console.log(scores);

  await browser.close();

  return Promise.resolve({
    date: Date(),
    scores: scores
  });
}


module.exports = runWebXPRT3Test;
