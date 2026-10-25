import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LANGUAGES = ['en', 'hi', 'bn', 'ta', 'mr', 'te'];
const TRANSLATIONS_DIR = path.join(__dirname, '../src/i18n/translations');

// Script detection regexes to confirm non-English translations are rendered in native script
const SCRIPT_REGEXES = {
  hi: /[\u0900-\u097F]/, // Devanagari
  mr: /[\u0900-\u097F]/, // Devanagari
  bn: /[\u0980-\u09FF]/, // Bengali
  ta: /[\u0B80-\u0BFF]/, // Tamil
  te: /[\u0C00-\u0C7F]/, // Telugu
};

test('Phase 2 — Language-Switching Matrix: All 6 Languages Render Completely and Natively', () => {
  const dicts = {};
  for (const lang of LANGUAGES) {
    const filePath = path.join(TRANSLATIONS_DIR, `${lang}.json`);
    dicts[lang] = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  }

  // Critical sections to test for each language
  const coreTestKeys = [
    // Header & Navigation
    'nav.about', 'nav.features', 'nav.workflow', 'nav.modes', 'nav.faq', 'nav.getStarted',
    // Hero
    'hero.title', 'hero.subtitle', 'hero.btn.getStarted', 'hero.btn.exploreFeatures',
    // About
    'about.title', 'about.challenge.title', 'about.challenge.p1', 'about.mission.title',
    // All 10 Features
    'features.item1.title', 'features.item2.title', 'features.item3.title', 'features.item4.title',
    'features.item5.title', 'features.item6.title', 'features.item7.title', 'features.item8.title',
    'features.item9.title', 'features.item10.title',
    // Workflow 5 Steps
    'workflow.step1.title', 'workflow.step2.title', 'workflow.step3.title', 'workflow.step4.title', 'workflow.step5.title',
    // User Categories
    'users.cat1.title', 'users.cat2.title', 'users.cat3.title',
    // Modes
    'modes.normal.name', 'modes.normal.desc', 'modes.pro.name', 'modes.pro.desc',
    // Trust
    'trust.point1.title', 'trust.point2.title', 'trust.point3.title', 'trust.point4.title', 'trust.point5.title',
    // FAQs
    'faq.q1', 'faq.a1', 'faq.q2', 'faq.a2', 'faq.q3', 'faq.a3', 'faq.q4', 'faq.a4', 'faq.q5', 'faq.a5',
    // Footer
    'footer.col.features', 'footer.col.resources', 'footer.col.legal', 'footer.copyright',
  ];

  for (const lang of LANGUAGES) {
    const d = dicts[lang];

    for (const key of coreTestKeys) {
      const val = d[key];
      assert.ok(val, `Key '${key}' missing in ${lang}`);
      assert.strictEqual(
        val.includes('MISSING'),
        false,
        `Key '${key}' returned missing placeholder in ${lang}`
      );

      // If not English, verify text contains native glyphs (except brand name)
      if (lang !== 'en') {
        const regex = SCRIPT_REGEXES[lang];
        if (regex) {
          const hasScript = regex.test(val);
          assert.strictEqual(
            hasScript,
            true,
            `Language '${lang}' key '${key}' failed native script check! Value: "${val}"`
          );
        }
      }
    }
  }
});
