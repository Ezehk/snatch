const puppeteer = require("puppeteer");
const archiver = require("archiver");
const fs = require("fs");

const labels = ["homepage", "search", "product"];
const devicesVP = {
  desktop: 1200,
  mobile: 390,
};
const genScreenshot = async (urls, name, devices) => {
  console.log("Received name:", name);
  console.log("Received URLs:", urls);
  console.log("Received devices:", devices);

  const device = Array.isArray(devices) ? devices : [devices];

  const browser = await puppeteer.launch();
  const zipFile = archiver("zip", { zlib: { level: 9 } });
  const output = fs.createWriteStream(`${name}_screenshots.zip`);
  const mobileUserAgent =
    "Mozilla/5.0 (iPhone; CPU iPhone OS 12_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148";

  zipFile.pipe(output);

  for (const [indexEl, eleDev] of device.entries()) {
    console.log(indexEl, eleDev);
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];

      try {
        new URL(url);
        const page = await browser.newPage();

        console.log(device[indexEl]);
        console.log(devicesVP[device[indexEl]]);

        await page.setViewport({
          width: devicesVP[device[indexEl]],
          height: 800,
          deviceScaleFactor: 1,
        });

        if (eleDev === "mobile") {
          await page.setUserAgent(mobileUserAgent);
        }

        await page.goto(url, { waitUntil: "networkidle2" });

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
            });
          })
          .catch((e) => console.error(e));

        const screenshotPath = `screenshots/${name}_${labels[i]}_${eleDev}.png`;
        await page.screenshot({
          path: screenshotPath,
          fullPage: true,
        });

        zipFile.append(fs.createReadStream(screenshotPath), {
          name: `${name}_${labels[i]}_${eleDev}.png`,
        });

        await page.close();
      } catch (error) {
        console.error(`Error processing ${url}: ${error.message}`);
        continue;
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

function showMessage(event) {
  event.preventDefault(); // Prevent default form submission behavior
  document.querySelector("#loadingSpinner").style.display = "block";

  // Get the form data
  const formData = new FormData(document.getElementById("screenForm"));

  // Serialize the form data
  const urlSearchParams = new URLSearchParams(formData);
  const serializedFormData = new URLSearchParams(urlSearchParams).toString();

  // Send a POST request to the server asynchronously
  fetch("/public", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: serializedFormData,
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.blob(); // Assuming the server responds with a zip file
    })
    .then((blob) => {
      // Create a temporary link element
      const link = document.createElement("a");

      // Create a blob URL for the zip file
      const blobUrl = window.URL.createObjectURL(blob);

      // Set the link's href to the blob URL
      link.href = blobUrl;

      // Specify the filename for the download
      link.download = "screenshots.zip";

      // Append the link to the document
      document.body.appendChild(link);

      // Trigger a click on the link to start the download
      link.click();

      // Remove the link from the document
      document.body.removeChild(link);

      document.querySelector("#loadingSpinner").style.display = "none";
    })
    .catch((error) => {
      console.error("Error:", error.message);
    });
}

module.exports = genScreenshot;
