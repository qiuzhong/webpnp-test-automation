const settings = require('../../config.json');
const { chromium } = require('playwright');

async function runSpeedometer2Test() {
  let workload = settings.workloads[1];

  console.log(`********** Start running ${workload.name} tests **********`);
    const browser = await chromium.launch({
        headless: false,
        executablePath: settings.chrome_path
    });
    const page = await browser.newPage();
    console.log(`********** Going to URL: ${workload.url} **********`);
    await page.goto(workload.url);

    console.log("********** Running Speedometer2 tests... **********");
    await page.click('xpath=//*[@id="home"]/div/button');
    await page.waitForSelector('xpath=//*[@id="summarized-results"]/div[4]/button[2]',
        {timeout: 5 * 60 * 1000}
    );

    console.log("********** Running Speedometer2 tests completed **********");
    let scores = {};
    const scoreElement = await page.$('#result-number');
    const score = await scoreElement.evaluate(element => element.textContent);
    console.log('********** Speedometer tests score: **********');
    console.log(`********** ${score}  **********`);
    scores['Total Score'] = score;

    const subcaseTable = await page.$('#detailed-results > table:nth-child(3)');
    const subcaseScore = await subcaseTable.evaluate((element) => {
        let subcase = {};

        for (let i = 1; i < element.rows.length; i++) {
            let subItem = element.rows[i].cells[0].textContent;
            let subScore = element.rows[i].cells[1].textContent;
            subcase[subItem] = subScore;
        }
        return subcase;
    });  

    Object.assign(scores, subcaseScore);
    console.log(scores);
    await browser.close();

    return Promise.resolve({
        date: Date(),
        scores: scores
    });
}


if (require.main === module) {
    runSpeedometer2Test();
} else {
    module.exports = runSpeedometer2Test;
}
