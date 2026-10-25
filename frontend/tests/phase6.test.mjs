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

test('Phase 6 — Exact Duplicate Registration Message: USER ALREADY EXISTS', () => {
  for (const lang of LANGUAGES) {
    const dict = dicts[lang];
    assert.strictEqual(
      dict['auth.errorUserAlreadyExists'],
      'USER ALREADY EXISTS',
      `Language '${lang}' must have exact duplicate error 'USER ALREADY EXISTS'`
    );
  }
});

test('Phase 6 — 100% Translation Key Parity for Phase 6 Keys Across All 6 Languages', () => {
  const phase6Keys = [
    'nav.library',
    'nav.landResearch',
    'nav.caseManagement',
    'library.title',
    'library.subtitle',
    'library.searchPlaceholder',
    'library.catAll',
    'library.catPersonal',
    'library.catBusiness',
    'library.catProperty',
    'library.catProcedures',
    'library.sampleNotice',
    'library.sampleNoticeDetail',
    'library.consistencyTitle',
    'library.consistencyNotice',
    'land.title',
    'land.subtitle',
    'land.demoBanner',
    'land.fictionalNotice',
    'land.tabSimulated',
    'land.tabMyEntries',
    'land.tabChecklist',
    'land.newEntryBtn',
    'cases.title',
    'cases.subtitle',
    'cases.restrictedBadge',
    'cases.restrictedNotice',
    'cases.loginAsAdvocate',
    'cases.activeCases',
    'cases.upcomingDeadlines',
    'cases.pendingTasks',
    'cases.newCaseBtn',
  ];

  for (const key of phase6Keys) {
    for (const lang of LANGUAGES) {
      assert.ok(
        dicts[lang][key] && dicts[lang][key].trim().length > 0,
        `Missing or empty key '${key}' in language '${lang}'`
      );
    }
  }
});

test('Phase 6 — Strict Brand Name Invariance: VIDHIVRAKSH in uppercase with 0 transliterations', () => {
  const forbiddenTransliterations = [
    'विधिपक्ष',
    'विधिब्रक्ष',
    'विधिवृक्ष',
    'বিধিবৃক্ষ',
    'விதிவ்ரக்ஷ்',
    'విధివ్రక్ష్',
  ];

  for (const lang of LANGUAGES) {
    const dict = dicts[lang];
    assert.strictEqual(dict['brand.name'], 'VIDHIVRAKSH');

    for (const [k, v] of Object.entries(dict)) {
      assert.ok(!v.includes('LIBRA'), `Obsolete brand 'LIBRA' in ${lang}[${k}]: ${v}`);
      for (const bad of forbiddenTransliterations) {
        assert.ok(
          !v.includes(bad),
          `Transliteration '${bad}' found in ${lang}[${k}]: ${v}`
        );
      }
    }
  }
});

test('Phase 6 — Component Files Existence and Structural Verification', () => {
  const docPath = path.resolve(process.cwd(), 'src/app/documents/page.tsx');
  const landPath = path.resolve(process.cwd(), 'src/app/land-research/page.tsx');
  const casePath = path.resolve(process.cwd(), 'src/app/case-management/page.tsx');
  const headerPath = path.resolve(process.cwd(), 'src/components/Header.tsx');

  assert.ok(fs.existsSync(docPath), 'documents/page.tsx must exist');
  assert.ok(fs.existsSync(landPath), 'land-research/page.tsx must exist');
  assert.ok(fs.existsSync(casePath), 'case-management/page.tsx must exist');
  assert.ok(fs.existsSync(headerPath), 'components/Header.tsx must exist');

  // Verify Header links
  const headerCode = fs.readFileSync(headerPath, 'utf-8');
  assert.ok(headerCode.includes('/documents'), 'Header must include link to /documents');
  assert.ok(headerCode.includes('/land-research'), 'Header must include link to /land-research');
  assert.ok(headerCode.includes('/case-management'), 'Header must include link to /case-management');

  // Verify Mandatory Disclaimers in Pages
  const docCode = fs.readFileSync(docPath, 'utf-8');
  assert.ok(
    docCode.includes('library.sampleNotice') || docCode.includes('SAMPLE TEMPLATE'),
    'Document library must feature the sample template disclaimer'
  );
  assert.ok(
    docCode.includes('library.consistencyNotice') || docCode.includes('PRELIMINARY CONSISTENCY CHECK'),
    'Consistency checker must feature the preliminary consistency check notice'
  );

  const landCode = fs.readFileSync(landPath, 'utf-8');
  assert.ok(
    landCode.includes('land.demoBanner') || landCode.includes('DEMO MODE'),
    'Land research must feature the persistent demo banner'
  );
  assert.ok(
    landCode.includes('land.fictionalNotice') || landCode.includes('FICTIONAL DEMONSTRATION DATA'),
    'Land research must feature the fictional demo data notice'
  );

  const caseCode = fs.readFileSync(casePath, 'utf-8');
  assert.ok(
    caseCode.includes('cases.restrictedBadge') || caseCode.includes('ADVOCATES ONLY'),
    'Case management must enforce advocate-only restriction'
  );
  assert.ok(
    caseCode.includes('priya.law@example.test'),
    'Case management must provide quick demo advocate login'
  );
});
