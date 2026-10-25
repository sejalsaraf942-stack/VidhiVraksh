import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LANGUAGES = ['en', 'hi', 'bn', 'ta', 'mr', 'te'];
const TRANSLATIONS_DIR = path.join(__dirname, '../src/i18n/translations');

test('Phase 2 — Simulated Client Switching: Full UI Coverage for All 6 Languages', () => {
  const sections = [
    'nav', 'hero', 'about', 'features', 'workflow', 'users', 'modes', 'trust', 'faq', 'footer', 'modal'
  ];

  for (const lang of LANGUAGES) {
    const filePath = path.join(TRANSLATIONS_DIR, `${lang}.json`);
    const dict = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    assert.strictEqual(dict['brand.name'], 'VIDHIVRAKSH');

    for (const section of sections) {
      const matchingKeys = Object.keys(dict).filter((k) => k.startsWith(`${section}.`));
      assert.ok(matchingKeys.length > 0, `Section ${section} has no keys in ${lang}`);

      for (const key of matchingKeys) {
        const val = dict[key];
        assert.ok(typeof val === 'string' && val.length > 0, `Key ${key} empty in ${lang}`);
        assert.strictEqual(val.includes('MISSING'), false, `Key ${key} has MISSING placeholder`);
      }
    }
  }
});
