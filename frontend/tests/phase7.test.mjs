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

test('Phase 7 — Exact Brand Invariance: VIDHIVRAKSH Across All Dictionaries', () => {
  for (const lang of LANGUAGES) {
    const dict = dicts[lang];
    assert.strictEqual(
      dict['brand.name'],
      'VIDHIVRAKSH',
      `Language '${lang}' must have exact brand 'VIDHIVRAKSH'`
    );
    // Ensure no lowercase/transliterated brand forms
    const content = JSON.stringify(dict);
    assert.doesNotMatch(
      content,
      /विधि वृक्ष|বিধি বৃক্ষ|விதி வ்ரக்ஷ்|विधी वृक्ष|విధి వృక్ష/i,
      `Language '${lang}' must not transliterate the brand name VIDHIVRAKSH`
    );
  }
});

test('Phase 7 — Duplicate Registration Error Strictly Maintained: USER ALREADY EXISTS', () => {
  for (const lang of LANGUAGES) {
    const dict = dicts[lang];
    assert.strictEqual(
      dict['auth.errorUserAlreadyExists'],
      'USER ALREADY EXISTS',
      `Language '${lang}' must retain exact error 'USER ALREADY EXISTS'`
    );
  }
});

test('Phase 7 — Safety Translation Key Parity Across All 6 Languages', () => {
  const safetyKeys = [
    'safety.warningModalTitle',
    'safety.warningBadge',
    'safety.accountSuspendedBadge',
    'safety.ruleLabel',
    'safety.reasonLabel',
    'safety.chatTerminated',
    'safety.chatTerminatedDesc',
    'safety.consequence1',
    'safety.consequence2',
    'safety.consequence3',
    'safety.acknowledgeBtn',
    'safety.startNewChat',
    'safety.reviewPrompt',
    'safety.reviewBtn',
    'safety.reviewReasonPlaceholder',
    'safety.submitReviewBtn',
    'safety.reviewSubmitting',
    'safety.reviewSubmittedSuccess',
    'safety.chatInputLocked',
    'safety.accountSuspendedBanner',
  ];

  for (const key of safetyKeys) {
    for (const lang of LANGUAGES) {
      const val = dicts[lang][key];
      assert.ok(
        val && typeof val === 'string' && val.trim().length > 0,
        `Missing or empty translation for key '${key}' in language '${lang}'`
      );
    }
  }
});

test('Phase 7 — Header Layout Refinement and Cluster Hierarchy', () => {
  const headerPath = path.resolve(process.cwd(), 'src/components/Header.tsx');
  const content = fs.readFileSync(headerPath, 'utf-8');

  // Verify responsive navigation tokens and clusters
  assert.ok(content.includes('LanguageSelector'), 'Header must include LanguageSelector component');
  assert.ok(content.includes('VIDHIVRAKSH'), 'Header must render VIDHIVRAKSH branding');
  assert.ok(content.includes('/workspace'), 'Header must feature direct link to workspace');
  assert.ok(content.includes('nav.library'), 'Header must link to legal document library');
  assert.ok(content.includes('nav.landResearch'), 'Header must link to land research');
  assert.ok(content.includes('nav.caseManagement'), 'Header must link to case management');
});

test('Phase 7 — Safety Warning Modal Contract and Dispute Review Integration', () => {
  const modalPath = path.resolve(process.cwd(), 'src/components/SafetyWarningModal.tsx');
  const content = fs.readFileSync(modalPath, 'utf-8');

  assert.ok(content.includes('/api/v1/safety/review-request'), 'Modal must integrate review dispute endpoint');
  assert.ok(content.includes('safety.warningBadge'), 'Modal must render warning count badge');
  assert.ok(content.includes('safety.accountSuspendedBadge'), 'Modal must render account suspension badge');
  assert.ok(content.includes('safety.startNewChat'), 'Modal must support starting a new consultation');
});

test('Phase 7 — Workspace Safety Termination & Input Locking Integration', () => {
  const wsPath = path.resolve(process.cwd(), 'src/app/workspace/page.tsx');
  const content = fs.readFileSync(wsPath, 'utf-8');

  assert.ok(content.includes('SafetyWarningModal'), 'Workspace must mount SafetyWarningModal');
  assert.ok(content.includes('isChatTerminated'), 'Workspace must track isChatTerminated state');
  assert.ok(content.includes('safety.chatTerminatedDesc'), 'Workspace must display chat termination notice banner');
  assert.ok(content.includes('safety.chatInputLocked'), 'Workspace must lock input composer on termination');
  assert.ok(content.includes('handleStartNewChat'), 'Workspace must provide reset action for new consultation');
});

test('Phase 7 — Language Context State Memoization and Persistence Contract', () => {
  const langContextPath = path.resolve(process.cwd(), 'src/context/LanguageContext.tsx');
  const content = fs.readFileSync(langContextPath, 'utf-8');

  assert.ok(content.includes('useCallback'), 'setLanguage must be memoized with useCallback to prevent re-render loops');
  assert.ok(content.includes('vidhivraksh_preferred_language'), 'Language must persist to vidhivraksh_preferred_language');
  assert.ok(content.includes('document.documentElement.lang'), 'Language selector must set HTML document element lang attribute');
});
