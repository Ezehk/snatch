const express = require("express");
const bodyParser = require("body-parser");
const captureScreenshots = require("./captureScreenshot");
const path = require("path");
const fs = require("fs");

const app = express();
const port = process.env.PORT || 3001;

app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: true }));

app.post("/public", async (req, res) => {
  console.log("Received request:", req.body);

  if (!req.body || !Array.isArray(req.body.urls)) {
    return res.status(400).send("Invalid request body");
  }

  const urls = req.body.urls.filter((url) => url.trim() !== "");
  const name = req.body.websiteName;
  const devices = req.body.devices; // Make sure this is correctly parsed

  try {
    const zipFilePath = await captureScreenshots(urls, name, devices);
    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=screenshots.zip"
    );
    fs.createReadStream(zipFilePath)
      .pipe(res)
      .on("finish", () => {
        fs.unlinkSync(zipFilePath); // Delete the zip file after sending
      });
  } catch (error) {
    console.error("Error caught in POST /public:", error);
    res.status(500).send(`Error: ${error.message}`);
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
