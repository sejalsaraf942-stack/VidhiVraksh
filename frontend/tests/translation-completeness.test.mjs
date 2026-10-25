import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LANGUAGES = ['en', 'hi', 'bn', 'ta', 'mr', 'te'];
const TRANSLATIONS_DIR = path.join(__dirname, '../src/i18n/translations');

test('Phase 2 — Translation Completeness: 100% Key Parity Across All 6 Languages', () => {
  const dicts = {};
  for (const lang of LANGUAGES) {
    const filePath = path.join(TRANSLATIONS_DIR, `${lang}.json`);
    assert.strictEqual(fs.existsSync(filePath), true, `Missing dictionary for ${lang}`);
    dicts[lang] = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  }

  const enKeys = Object.keys(dicts.en);
  const enKeySet = new Set(enKeys);
  assert.ok(enKeys.length > 50, `Expected comprehensive key list, found ${enKeys.length}`);

  for (const lang of LANGUAGES) {
    const langDict = dicts[lang];
    const langKeySet = new Set(Object.keys(langDict));

    // Check missing keys
    const missingKeys = enKeys.filter((k) => !langKeySet.has(k));
    assert.deepStrictEqual(
      missingKeys,
      [],
      `Language '${lang}' is missing ${missingKeys.length} keys: ${missingKeys.slice(0, 5).join(', ')}...`
    );

    // Check extra keys
    const extraKeys = Object.keys(langDict).filter((k) => !enKeySet.has(k));
    assert.deepStrictEqual(
      extraKeys,
      [],
      `Language '${lang}' has unexpected extra keys: ${extraKeys.join(', ')}`
    );

    // Check empty or whitespace values
    for (const [key, val] of Object.entries(langDict)) {
      assert.strictEqual(
        typeof val === 'string' && val.trim().length > 0,
        true,
        `Language '${lang}' has empty or invalid value for key '${key}'`
      );
    }
  }
});

test('Phase 2 — Brand Name Invariance: VIDHIVRAKSH Must Strictly Remain VIDHIVRAKSH Everywhere', () => {
  const forbiddenTransliterations = ['लिब्रा', 'লিব্রা', 'லிப்ரா', 'లిబ్రా', 'लिव्रा'];

  for (const lang of LANGUAGES) {
    const filePath = path.join(TRANSLATIONS_DIR, `${lang}.json`);
    const dict = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    // Check brand.name
    assert.strictEqual(
      dict['brand.name'],
      'VIDHIVRAKSH',
      `Language '${lang}' brand.name must be 'VIDHIVRAKSH'`
    );

    // Verify no transliterations in any values
    for (const [key, val] of Object.entries(dict)) {
      for (const bad of forbiddenTransliterations) {
        assert.strictEqual(
          val.includes(bad),
          false,
          `Language '${lang}' key '${key}' has forbidden transliteration '${bad}': ${val}`
        );
      }
    }
  }
});
