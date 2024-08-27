# Installation

## manifest.json

### `key`:
1. Open `chrome://extensions/` and turn Developer mode on
2. Click "Pack extension", and select the `canvas-grade-drafts/src` folder.  `canvas-grade-drafts/src.crx` and `canvas-grade-drafts/src.pem` should be generated.
3. Drag and drop `canvas-grade-drafts/src.crx` onto `chrome://extensions/`, and click "Add extension" at the prompt.
4. Find your [chrome user data directory](https://chromium.googlesource.com/chromium/src/+/master/docs/user_data_dir.md), and open the `Extensions` folder in your profile directory.
5. Check the extension ID on `chrome://extensions/`, then copy the `key` value from `[extension_id]/manifest.json` into `canvas-grade-drafts/src/manifest.json`.
6. Go back to `chrome://extensions/` and uninstall the packed version of the extension.  Install the unpacked version by clicking "Load unpacked" and selecting the `canvas-grade-drafts/src` folder.

### `oauth2.client_id`:
1. Go to [https://console.developers.google.com/](https://console.developers.google.com/) and create a new project.
2. Set up the OAuth consent screen, then go to "Credentials", click "Create credentials", and select "OAuth client ID".
3. For "Application type" select "Chrome Extension", then copy the extension ID from `chrome://extensions/` into the "Item ID" field.  Click "Create" to generate the Client ID.

### `host_permissions`:
```
https://[canvas-domain]/*
```

## config.js

### `API_KEY`:
1. Go to [https://console.developers.google.com/apis](https://console.developers.google.com/apis) and select the project used to generate the OAuth client ID.
2. Under "Enabled APIs & services", click "Enable APIs and services", then enable the Google Sheets API.
3. Under "Credentials", click "Create credentials", and select "API key".

### `CANVAS_ENDPOINT`:
```
https://[canvas-domain]
```

### `CANVAS_TOKEN`:
Canvas [access token](https://canvas.instructure.com/doc/api/file.oauth.html#manual-token-generation)

### `SPREADSHEET_ID`:
Google Sheets [spreadsheet ID](https://developers.google.com/sheets/api/guides/concepts#spreadsheet)

### `DATA_RANGE`:
Spreadsheet range in [A1 notation](https://developers.google.com/sheets/api/guides/concepts#cell)

### `READABLE_RANGE`:
Spreadsheet range in [A1 notation](https://developers.google.com/sheets/api/guides/concepts#cell)