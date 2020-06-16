const settings = require('../../config.json');
const platformBrowser = require('../browser.js');
const { chromium } = require('playwright-chromium');
const path = require('path');
const fs = require('fs');

async function runJetStream2Test(workload) {
  // let workload = settings.workloads[1];

  platformBrowser.configChromePath(settings);
  console.log(`********** Start running ${workload.name} tests **********`);
  const userDataDir = path.join(process.cwd(), 'userData');
  if (fs.existsSync(userDataDir)) {
    fs.rmdirSync(userDataDir, { recursive: true });
  }
  fs.mkdirSync(userDataDir);
  const browser = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    executablePath: settings.chrome_path,
    args: ["--start-maximized"]
    // viewport: null
  });
  const page = await browser.newPage();
  console.log(`********** Going to URL: ${workload.url} **********`);
  await page.goto(workload.url, { waitUntil: 'load', timeout: 10000 });
  await page.waitForSelector('//*[@id="status"]/a',
    {timeout: 5 * 60 * 1000}
  );
  console.log("********** Running JetStream2 tests... **********");
  await page.click('//*[@id="status"]/a');
  await page.waitForTimeout(6 * 60 * 1000);
  await page.waitForSelector('#result-summary > div',
    {timeout: 10 * 60 * 1000}
  );

  console.log("********** Running JetStream2 tests completed **********");
  let scores = {};
  const scoreElement = await page.$('#result-summary > div');
  const score = await scoreElement.evaluate(element => element.textContent);
  console.log('********** JetStream2 tests score: **********');
  console.log(`********** ${score}  **********`);
  scores['Total Score'] = score;

  let subcaseScore = {};
  let subItem = [], subScore = [];
  // Get subCases
  const subItemElements = await page.$$('#results > div > h3');
  for (const subItemElement of subItemElements) {
    const item = await subItemElement.evaluate(element=>element.textContent);
    subItem.push(item);
  }
  const subScoreElements = await page.$$('#results > div > h4');
  for (const subScoreElement of subScoreElements) {
    const score = await subScoreElement.evaluate(element=>element.textContent);
    subScore.push(score);
  }
  // Append subItem and subScore to subcaseScore
  if (subItem.length === subScore.length && subItem.length !== 0) {
    for (let i=0; i<subItem.length; i++) {
      subcaseScore[subItem[i]] = subScore[i];
    }
  } else {
    return Promise.reject("Error: unexpected subScore in JetStream2!");
  }

  Object.assign(scores, subcaseScore);
  console.log(scores);
  await browser.close();

  return Promise.resolve({
    date: Date(),
    scores: scores
  });
}

module.exports = runJetStream2Test;
