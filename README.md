genScreenshot: Automated Screenshot Generation and Archiving
============================================================

This script allows you to capture full-page screenshots of specified URLs for multiple devices (desktop and mobile) and archives them into a compressed ZIP file. The script is built using `puppeteer-extra`, leveraging stealth plugins, cookie consent automation, and ad-blocking features for a seamless, automated browsing and screenshot experience.

Features
--------

-   **Cross-Device Screenshots**: Capture screenshots for both desktop and mobile views with custom resolutions.
-   **Stealth Mode**: Uses Puppeteer Stealth Plugin to bypass bot detection.
-   **Cookie Consent Management**: Automatically handles cookie consent pop-ups.
-   **Ad Blocking**: Blocks intrusive ads during screenshot generation.
-   **Full-Page Scrolling**: Ensures complete page rendering before capturing.
-   **Archiving**: Combines all screenshots into a single ZIP file.

* * * * *

Installation
------------

1.  Clone the repository:

    bash

    Copier le code

    `git clone <repository-url>
    cd <repository-name>`

2.  Install dependencies:

    bash

    Copier le code

    `npm install`

* * * * *

Dependencies
------------

The script uses the following NPM packages:

-   **puppeteer-extra**: Core Puppeteer library with plugin support.
-   **puppeteer-extra-plugin-stealth**: Plugin for stealth mode.
-   **@duckduckgo/autoconsent**: Automatically manages cookie consent pop-ups.
-   **@cliqz/adblocker-puppeteer**: Blocks ads and trackers.
-   **archiver**: Handles ZIP file creation.
-   **cross-fetch**: Enables fetching resources in Node.js.

Install them with:

bash

Copier le code

`npm install puppeteer-extra puppeteer-extra-plugin-stealth @duckduckgo/autoconsent @cliqz/adblocker-puppeteer archiver cross-fetch`

* * * * *

Usage
-----

1.  Import the function in your Node.js script:

    javascript

    Copier le code

    `const genScreenshot = require('./genScreenshot');`

2.  Call the `genScreenshot` function with the required parameters:

    javascript

    Copier le code

    `const urls = ["https://example.com", "https://another-example.com"];
    const name = "test_screenshots";
    const devices = ["desktop", "mobile"];

    genScreenshot(urls, name, devices)
      .then((zipPath) => {
        console.log(`Screenshots saved and archived at: ${zipPath}`);
      })
      .catch((error) => {
        console.error("Error generating screenshots:", error);
      });`

### Parameters

-   `urls` *(Array)*: List of URLs to capture.
-   `name` *(String)*: Name prefix for the screenshots and ZIP file.
-   `devices` *(Array or String)*: Device types (`desktop`, `mobile`) for capturing screenshots.

* * * * *

File Structure
--------------

-   **Captured Screenshots**: Each screenshot is named with the format `{name}_{label}_{device}.png`.
    -   Example: `test_screenshots_homepage_desktop.png`
-   **ZIP Archive**: Contains all screenshots for easy access and distribution.
    -   Example: `test_screenshots.zip`

* * * * *

Configuration
-------------

### Device Viewports

The default viewport widths are configured in the `devicesVP` object:

javascript

Copier le code

`const devicesVP = {
  desktop: 1400,
  mobile: 390,
};`

You can modify these values to suit your requirements.

* * * * *

Error Handling
--------------

-   If a URL is invalid or unreachable, an error will be logged, and the process will continue with the next URL.
-   Ensure that Google Chrome is installed at the specified path (`/usr/bin/google-chrome-stable`).
