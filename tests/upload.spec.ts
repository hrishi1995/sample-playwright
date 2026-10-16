import fs from 'fs';
import path from 'path';
import { test, expect } from '@playwright/test';

const UPLOAD_URL = 'https://the-internet.herokuapp.com/upload';
const FIXTURES_DIR = path.join(__dirname, 'fixtures');

// One fixture per format. The site accepts any file type, so each format is
// checked end to end: chosen, posted, and shown back as uploaded.
const FORMATS = [
  'sample-upload.txt',
  'sample-upload.csv',
  'sample-upload.json',
  'sample-upload.xml',
  'sample-upload.md',
  'sample-upload.pdf',
  'sample-upload.png',
  'sample-upload.jpg',
  'sample-upload.gif',
  'sample-upload.zip',
  'sample-upload.docx',
];

const isUploadPost = (response: { url(): string; request(): { method(): string } }) =>
  response.url().endsWith('/upload') && response.request().method() === 'POST';

test.describe('file chooser upload', () => {
  for (const fileName of FORMATS) {
    test(`uploads ${fileName} via the file chooser`, async ({ page }) => {
      await page.goto(UPLOAD_URL);

      const uploadResponse = page.waitForResponse(isUploadPost);
      await page.locator('#file-upload').setInputFiles(path.join(FIXTURES_DIR, fileName));
      await page.getByRole('button', { name: 'Upload' }).click();

      expect((await uploadResponse).status()).toBe(200);
      await expect(page.getByRole('heading', { name: 'File Uploaded!' })).toBeVisible();
      await expect(page.locator('#uploaded-files')).toHaveText(fileName);
    });
  }
});

test.describe('drag-and-drop upload', () => {
  for (const fileName of FORMATS) {
    test(`uploads ${fileName} by dropping it onto the drag-and-drop zone`, async ({ page }) => {
      await page.goto(UPLOAD_URL);

      const base64 = fs.readFileSync(path.join(FIXTURES_DIR, fileName)).toString('base64');

      // Playwright cannot perform a native OS drag, so we dispatch the drag/drop
      // events with a DataTransfer that holds a File, which Dropzone.js handles.
      const uploadResponse = page.waitForResponse(isUploadPost);
      await page.locator('#drag-drop-upload').evaluate(
        (zone, { name, data }) => {
          const bytes = Uint8Array.from(atob(data), (c) => c.charCodeAt(0));
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(new File([bytes], name));
          for (const type of ['dragenter', 'dragover', 'drop']) {
            zone.dispatchEvent(new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer }));
          }
        },
        { name: fileName, data: base64 },
      );
      expect((await uploadResponse).status()).toBe(200);

      const preview = page.locator('#drag-drop-upload .dz-preview');
      await expect(preview.locator('.dz-filename')).toHaveText(fileName);
      await expect(preview).toHaveClass(/dz-success/);
    });
  }
});

// Intentionally failing test: submitting with no file chosen currently returns
// HTTP 500 ("Internal Server Error - No file was chosen"). A missing file is a
// client error, so the expected behaviour is a non-5xx response. This fails
// against the live site until that is fixed.
test('submitting without choosing a file does not cause a server error', async ({ page }) => {
  await page.goto(UPLOAD_URL);

  const [response] = await Promise.all([
    page.waitForResponse(isUploadPost),
    page.getByRole('button', { name: 'Upload' }).click(),
  ]);

  expect(
    response.status(),
    'POST /upload with no file should be a client error (4xx) with a message, not a 500',
  ).toBeLessThan(500);
});
