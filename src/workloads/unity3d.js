const settings = require('../../config.json');
const platformBrowser = require('../browser.js');
const chromium = require('puppeteer');
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
  const browser = await chromium.launch({
    headless: false,
    executablePath: settings.chrome_path,
    userDataDir: userDataDir,
    // args: ["--start-fullscreen"],
    defaultViewport: null
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
  console.log("********** Running Unity3D tests... **********");
  await page.goto(workload.url, { waitUntil: 'load', timeout: 5000 });

  // Enable fullscreen and click Start button
  await page.waitForSelector('#overlay > button:nth-child(2)', { timeout: 10000 });
  const enableFullscreen = await page.$('#overlay > button:nth-child(2)');
  await new Promise(resolve => setTimeout(resolve, 3000));
  await enableFullscreen.click();
  const canvasContainer = await page.$('#gameContainer');
  const startPosition = await canvasContainer.evaluate(container => {
    const containerHeight = container.offsetHeight;
    const screenHeight = window.screen.height;
    const y = (screenHeight - containerHeight) / 2 + containerHeight * 600 / 720;
    return { x: window.screen.width / 2, y: y };
  });
  await page.mouse.click(startPosition.x, startPosition.y);

  await new Promise(resolve => setTimeout(resolve, 5 * 60 * 1000));
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
          const scoresText = logList.slice(logList.length - 13, logList.length);
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
            resolve({ date: Date(), scores: scores });
          } else {
            reject(`Error: Expected ${resultKeys} but got ${exactKeys}`);
          }
        }
      }
    });
  });
}
module.exports = runUnity3DTest;
