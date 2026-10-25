import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

const LANGUAGES = ['en', 'hi', 'bn', 'ta', 'mr', 'te'];
const TRANSLATIONS_DIR = path.resolve(process.cwd(), 'src/i18n/translations');

const dicts = {};
for (const lang of LANGUAGES) {
  const filePath = path.join(TRANSLATIONS_DIR, `${lang}.json`);
  dicts[lang] = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

test('Phase 4 — Workspace Keys Parity Across All 6 Languages', () => {
  const requiredWorkspaceKeys = [
    'auth.rememberMe',
    'workspace.title',
    'workspace.navHome',
    'workspace.newChat',
    'workspace.conversations',
    'workspace.noConversations',
    'workspace.rename',
    'workspace.delete',
    'workspace.confirmDelete',
    'workspace.modeNormal',
    'workspace.modePro',
    'workspace.modeNormalDesc',
    'workspace.modeProDesc',
    'workspace.modeSwitchToNormal',
    'workspace.modeSwitchToPro',
    'workspace.welcomeTitle',
    'workspace.welcomeSubtitle',
    'workspace.prompt1',
    'workspace.prompt2',
    'workspace.prompt3',
    'workspace.prompt4',
    'workspace.prompt5',
    'workspace.prompt6',
    'workspace.inputPlaceholder',
    'workspace.send',
    'workspace.sending',
    'workspace.inputHint',
    'workspace.sourcesTitle',
    'workspace.disclaimer',
    'workspace.disclaimerShort',
    'workspace.sourcesCount',
    'workspace.readMore',
    'workspace.copyResponse',
    'workspace.copied',
    'workspace.errorSend',
    'workspace.signInRequired'
  ];

  for (const lang of LANGUAGES) {
    const dict = dicts[lang];
    for (const key of requiredWorkspaceKeys) {
      assert.ok(
        dict[key] && dict[key].trim().length > 0,
        `Language '${lang}' missing required Phase 4 key '${key}'`
      );
    }
  }
});

test('Phase 4 — 6 Suggested Prompts Distinctness & Authenticity Across Languages', () => {
  for (const lang of LANGUAGES) {
    const dict = dicts[lang];
    const prompts = [
      dict['workspace.prompt1'],
      dict['workspace.prompt2'],
      dict['workspace.prompt3'],
      dict['workspace.prompt4'],
      dict['workspace.prompt5'],
      dict['workspace.prompt6']
    ];

    const uniquePrompts = new Set(prompts);
    assert.strictEqual(
      uniquePrompts.size,
      6,
      `Language '${lang}' has duplicate suggested prompts`
    );

    for (const p of prompts) {
      assert.ok(p.length >= 15, `Prompt too short in '${lang}': ${p}`);
    }
  }
});

test('Phase 4 — Brand Name VIDHIVRAKSH Invariance in Workspace Texts', () => {
  const forbiddenTransliterations = ['लिब्रा', 'লিব্রা', 'லிப்ரா', 'లిబ్రా', 'लिव्रा'];
  
  for (const lang of LANGUAGES) {
    const dict = dicts[lang];
    const welcome = dict['workspace.welcomeTitle'];
    assert.ok(
      welcome.startsWith('VIDHIVRAKSH'),
      `Welcome title in '${lang}' must start with 'VIDHIVRAKSH', got: ${welcome}`
    );

    for (const [key, val] of Object.entries(dict)) {
      if (key.startsWith('workspace.') || key.startsWith('auth.')) {
        for (const bad of forbiddenTransliterations) {
          assert.ok(
            !val.includes(bad),
            `Forbidden transliteration '${bad}' found in ${lang}[${key}]: ${val}`
          );
        }
      }
    }
  }
});
