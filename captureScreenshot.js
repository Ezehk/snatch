const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const autoconsent = require("@duckduckgo/autoconsent");
const extraRules = require("@duckduckgo/autoconsent/rules/rules.json");

const archiver = require("archiver");
const fs = require("fs");

const labels = ["homepage", "search", "product"];
const devicesVP = {
  desktop: 1200,
  mobile: 390,
};

puppeteer.use(StealthPlugin());

const genScreenshot = async (urls, name, devices) => {
  console.log("Received name:", name);
  console.log("Received URLs:", urls);
  console.log("Received devices:", devices);

  const device = Array.isArray(devices) ? devices : [devices];

  const browser = await puppeteer.launch({
    executablePath: "/usr/bin/google-chrome-stable",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage", // Overcomes limited resource problems
      "--disable-gpu", // Disable GPU hardware acceleration
      "--no-zygote", // Helps to avoid crashes in some environments
      "--single-process", // Runs the browser in a single process
    ],
    headless: true,
    timeout: 90000, // Increase timeout
  });

  const zipFile = archiver("zip", { zlib: { level: 9 } });
  const output = fs.createWriteStream(`${name}_screenshots.zip`);
  const userAgent = {
    desktop: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36",
    mobile: "Mozilla/5.0 (iPhone; CPU iPhone OS 12_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148",
  };

  zipFile.pipe(output);

  // Define rules for autoconsent
  const consentomatic = extraRules.consentomatic;
  const rules = [
    ...autoconsent.rules,
    ...Object.keys(consentomatic).map((name) => new autoconsent.ConsentOMaticCMP(`com_${name}`, consentomatic[name])),
    ...extraRules.autoconsent.map((spec) => autoconsent.createAutoCMP(spec)),
  ];

  for (const [indexEl, eleDev] of device.entries()) {
    console.log(indexEl, eleDev);
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];

      try {
        new URL(url);
        const page = await browser.newPage();

        console.log(device[indexEl]);
        console.log(devicesVP[device[indexEl]]);

        await page.setUserAgent(userAgent[eleDev]);

        // Attach autoconsent to the page
        page.once("load", async () => {
          const tab = autoconsent.attachToPage(page, url, rules, 10);
          try {
            await tab.checked;
            await tab.doOptIn(); // Choose between doOptIn or doOptOut based on your needs
          } catch (e) {
            console.warn(`CMP error`, e);
          }
        });

        await page.goto(url, {
          waitUntil: "networkidle2",
          timeout: 90000, // Extend timeout to 60 seconds
        });

        const dimensions = await page.evaluate(() => {
          return {
            width: document.documentElement.scrollWidth,
            height: document.documentElement.scrollHeight,
          };
        });

        await page.setViewport({
          width: devicesVP[device[indexEl]],
          height: dimensions.height,
          deviceScaleFactor: 1,
        });

        const screenshotPath = `${name}_${labels[i]}_${eleDev}.png`;
        await page.screenshot({
          path: screenshotPath,
          fullPage: true,
        });

        zipFile.append(fs.createReadStream(screenshotPath), {
          name: `${name}_${labels[i]}_${eleDev}.png`,
        });

        await page.close();
      } catch (error) {
        console.error("Error in genScreenshot:", error);
        throw error; // Rethrow the error to be caught in server.js
      }
    }
  }

  await browser.close();

  zipFile.finalize();

  return new Promise((resolve, reject) => {
    output.on("close", () => resolve(`${name}_screenshots.zip`));
    zipFile.on("error", (err) => reject(err));
  });
};

module.exports = genScreenshot;
