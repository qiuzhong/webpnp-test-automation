const settings = require('../../config.json');
const platformBrowser = require('../browser.js');
const { chromium } = require('playwright-chromium');
const path = require('path');
const fs = require('fs');

async function runUnity3DTest(workload) {
  // let workload = settings.workloads[1];
  platformBrowser.configChromePath(settings);
  console.log(`********** Start running ${workload.name} tests **********`);
  const userDataDir = path.join(process.cwd(), 'userData');
  // Do not clear cache for Unity3D
  if (!fs.existsSync(userDataDir))
    fs.mkdirSync(userDataDir);
  const browser = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    executablePath: settings.chrome_path,
    args: ["--start-maximized"]
    // viewport: null
  });
  const page = await browser.newPage();
  console.log(`********** Going to URL: ${workload.url} **********`);

  const resultKeys = [
    "Mandelbrot Script",
    "Instantiate & Destroy",
    "CryptoHash Script",
    "Animation & Skinning",
    "Asteroid Field",
    "Particles",
    "Physics Meshes",
    "Physics Cubes",
    "Physics Spheres",
    "2D Physics Spheres",
    "2D Physics Boxes",
    "AI Agents",
    "Overall"
  ];

  let scores = {};
  let logList = [];
  let exactKeys = [];
  return new Promise(async (resolve, reject) => {
    // Since the Unity3D's results are painted in a canvas, we have to get result from console log
    page.on('console', async msg => {
      // Only record console log type
      if (msg.type() === 'log') {
        logList.push(msg.text());
        // "Overall: " is the last record of result log
        if (msg.text().includes("Overall: ")) {
          await page.close();
          await browser.close();
          console.log("********** Running Unity3D tests completed **********");
          console.log('********** Unity3D tests score: **********');
          // Get last 13 records as which are the exact test results
          const scoresText = logList.slice(logList.length-13, logList.length);
          // console.log(`********** ${scoresText}  **********`);
          for (const item of scoresText) {
            const key = item.split(": ")[0];
            const value = item.split(": ")[1];
            exactKeys.push(key);
            if (key === "Overall")
              scores["Total Score"] = value;
            else
              scores[key] = value;
          }
          if (exactKeys.join(" ") === resultKeys.join(" ")) {
            console.log(scores);
            resolve({date: Date(), scores: scores});
          } else {
            reject(`Error: Expected ${resultKeys} but got ${exactKeys}`);
          }
        }
      }
    });
    console.log("********** Running Unity3D tests... **********");
    await page.goto(workload.url, { waitUntil: 'load', timeout: 5000 });

  });
}

module.exports = runUnity3DTest;
