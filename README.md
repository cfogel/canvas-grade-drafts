# Usage

Right now, the only way to activate it is through keyboard shortcuts - an actual UI is coming soon.

## Save and clear grade and rubric

Saves the data to the spreadsheet specified in `config.js`, then clears the Canvas grade and all of the rubric fields.  `DATA_RANGE` contains a table with the information used to restore the grades, and `READABLE_RANGE` contains a table with the information in a human-readable form.

### `DATA_RANGE` columns:

1. Course ID
2. Assignment ID
3. Student ID
4. Attempt number
5. Grade
6. Comments left by the grader (JSON list of comment text)
7. Rubric data (JSON)
8. Grader ID
9. Grading timestamp
10. Whether the row's data has been loaded (`false` when the data is saved; updated to `true` when the extension loads the data)

### `READABLE_RANGE` columns:

1. Course name
2. Assignment name
3. Student name
4. Attempt number
5. Grade
6. Comments left by the grader (JSON list of comment text)

For each row of the rubric:

7. Rubric row #1 points
8. Rubric row #1 comments
9. Rubric row #2 points
10. Rubric row #2 comments
11. Rubric row #3 points
12. etc. 

...

13. Grader ID
14. Grading timestamp
15. Whether the row's data has been loaded (currently always `false`)

## Load saved grade and rubric

Finds the most recent `DATA_RANGE` row that matches the course + assignment + student and hasn't already been loaded.  The grade and the rubric ratings, points, and comments are restored, and the last column's value is changed to `true`. 


# Configuration

## [manifest.json](src/manifest.json)

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
