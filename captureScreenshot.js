const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const autoconsent = require("@duckduckgo/autoconsent/dist/autoconsent.puppet.js");
const extraRules = require("@duckduckgo/autoconsent/rules/rules.json");
const { PuppeteerBlocker } = require("@cliqz/adblocker-puppeteer");
const fetch = require("cross-fetch");

const archiver = require("archiver");
const fs = require("fs");
const labels = ["homepage", "search", "product"];
const devicesVP = {
  desktop: 1400,
  mobile: 390,
};
puppeteer.use(StealthPlugin());
const genScreenshot = async (urls, name, devices) => {
  console.log("Received name:", name);
  console.log("Received URLs:", urls);
  console.log("Received devices:", devices);
  const device = Array.isArray(devices) ? devices : [devices];
  const browser = await puppeteer.launch({
    //executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
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
    timeout: 500000, // Increase timeout
  });

  // Define rules for autoconsent
  const consentomatic = extraRules.consentomatic;
  const rules = [
    ...autoconsent.rules,
    ...Object.keys(consentomatic).map((name) => new autoconsent.ConsentOMaticCMP(`com_${name}`, consentomatic[name])),
    ...extraRules.autoconsent.map((spec) => autoconsent.createAutoCMP(spec)),
  ];

  const zipFile = archiver("zip", { zlib: { level: 9 } });
  const output = fs.createWriteStream(`${name}_screenshots.zip`);
  const userAgent = {
    desktop: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36",
    mobile: "Mozilla/5.0 (iPhone; CPU iPhone OS 12_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148",
  };
  zipFile.pipe(output);
  for (const [indexEl, eleDev] of device.entries()) {
    console.log(indexEl, eleDev);
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      try {
        new URL(url);
        const blocker = await PuppeteerBlocker.fromLists(fetch, ["https://secure.fanboy.co.nz/fanboy-cookiemonster.txt"]);

        const page = await browser.newPage();
        console.log(device[indexEl]);
        console.log(devicesVP[device[indexEl]]);

        await blocker.enableBlockingInPage(page);

        // Attach autoconsent to the page
        page.once("load", async () => {
          const tab = autoconsent.attachToPage(page, url, rules, 10);
          try {
            const isChecked = await tab.checked;
            if (isChecked) await tab.doOptIn(); // Choose between doOptIn or doOptOut based on your needs
          } catch (e) {
            console.warn(`CMP error`, e);
          }
        });

        await page.setUserAgent(userAgent[eleDev]);
        await page
          .goto(url, {
            waitUntil: "networkidle2",
            timeout: 90000, // Extend timeout to 60 seconds
          })
          .catch((e) => console.error(`Error loading page: ${e.message}`));
        await page
          .evaluate(() => {
            return new Promise(async (resolve, reject) => {
              let distance = 100;
              let lastScrollTop = 0;
              let currentScrollTop = 0;
              // Function to perform a single scroll step
              const scrollStep = () => {
                return new Promise((resolveStep) => {
                  window.scrollBy(0, distance);
                  setTimeout(() => resolveStep(window.scrollY), 100); // Short delay to allow the scroll to complete
                });
              };
              do {
                lastScrollTop = currentScrollTop;
                currentScrollTop = await scrollStep(); // Perform scroll and update currentScrollTop
                // Check if scrolled position didn't change
                if (currentScrollTop === lastScrollTop) {
                  resolve(); // Resolve if we've reached the bottom
                }
              } while (currentScrollTop !== lastScrollTop);
              window.scrollTo(0, 0);
              /*await page.waitForTimeout(1000);
              resolve(); */
            });
          })
          .catch((e) => console.error(e));
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
        await new Promise((resolve) => setTimeout(resolve, 2000)); // Pause for 2 seconds

        const screenshotPath = `${name}_${labels[i]}_${eleDev}.png`;
        await page.screenshot({
          path: screenshotPath,
          //fullPage: true,
        });
        zipFile.append(fs.createReadStream(screenshotPath), {
          name: `${name}_${labels[i]}_${eleDev}.png`,
        });

        await new Promise((resolve) => setTimeout(resolve, 2000)); // Pause for 2 seconds

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
