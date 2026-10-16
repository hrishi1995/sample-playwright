# sample-playwright

Playwright (TypeScript) automation for https://the-internet.herokuapp.com/upload.

## Quick start

Requires Node.js 18+. Clone, install, and run the tests in one command:

```sh
git clone https://github.com/hrishi1995/sample-playwright.git && cd sample-playwright && npm install && npm test
```

If the repo is already cloned, run `npm install && npm test` from the project root.

`npm test` installs Chromium if needed (`pretest`), then runs `tests/upload.spec.ts` on Chromium with list output.

## Tests

| Test | Count | Expected result |
| --- | --- | --- |
| `file chooser upload`: uploads each format via the file chooser | 11 | Pass |
| `drag-and-drop upload`: uploads each format by dropping it onto the zone | 11 | Pass |
| submitting without choosing a file does not cause a server error | 1 | **Fails by design** (site returns HTTP 500) |

Formats covered: txt, csv, json, xml, md, pdf, png, jpg, gif, zip, docx. Fixtures live in `tests/fixtures/`.

The last test is intentionally failing. It documents a real defect: posting the form with no file returns `500 Internal Server Error`. It will pass once the site returns a client error (4xx) for that case.

## Notes

- The drag-and-drop test simulates the drop with a synthetic `DataTransfer`, since Playwright cannot perform native OS drag-and-drop.
- Reports and traces are written to `test-results/` on failure.
