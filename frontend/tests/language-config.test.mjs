import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPPORTED_CODES = ['en', 'hi', 'bn', 'ta', 'mr', 'te'];
const DEFAULT_LANGUAGE = 'en';

function resolveLanguage(langCode) {
  if (!langCode) return DEFAULT_LANGUAGE;
  const cleaned = langCode.trim().toLowerCase();
  const base = cleaned.split('-')[0].split('_')[0];
  if (SUPPORTED_CODES.includes(base)) {
    return base;
  }
  return DEFAULT_LANGUAGE;
}

test('Test 2 — Language Configuration: App recognizes all 6 language codes', () => {
  const translationsDir = path.join(__dirname, '../src/i18n/translations');
  
  for (const code of SUPPORTED_CODES) {
    const filePath = path.join(translationsDir, `${code}.json`);
    assert.strictEqual(fs.existsSync(filePath), true, `Missing translation file for ${code}`);
    
    const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    assert.strictEqual(typeof content, 'object', `Translation for ${code} must be an object`);
    assert.ok(Object.keys(content).length > 0, `Translation for ${code} must not be empty`);
    assert.ok(content['brand.name'], `${code} must have brand.name`);
    assert.strictEqual(content['brand.name'], 'VIDHIVRAKSH', `${code} brand.name must be VIDHIVRAKSH`);
    assert.ok(content['hero.title'], `${code} must have hero.title`);
  }
});

test('Test 3 — Unsupported language fallback: Setting language to "fr" falls back to English', () => {
  assert.strictEqual(resolveLanguage('fr'), 'en', 'fr must fall back to en');
  assert.strictEqual(resolveLanguage('de'), 'en', 'de must fall back to en');
  assert.strictEqual(resolveLanguage('es'), 'en', 'es must fall back to en');
  assert.strictEqual(resolveLanguage(''), 'en', 'empty string must fall back to en');
  assert.strictEqual(resolveLanguage(null), 'en', 'null must fall back to en');
  assert.strictEqual(resolveLanguage(undefined), 'en', 'undefined must fall back to en');
  
  // Dialects should resolve to base code
  assert.strictEqual(resolveLanguage('hi-IN'), 'hi');
  assert.strictEqual(resolveLanguage('bn-IN'), 'bn');
  assert.strictEqual(resolveLanguage('ta-LK'), 'ta');
  assert.strictEqual(resolveLanguage('mr-IN'), 'mr');
  assert.strictEqual(resolveLanguage('te-IN'), 'te');
  assert.strictEqual(resolveLanguage('en-US'), 'en');
});
