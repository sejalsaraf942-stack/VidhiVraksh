import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = process.cwd();
const TRANSLATIONS_DIR = path.resolve(ROOT_DIR, 'src/i18n/translations');
const LANGUAGES = ['en', 'hi', 'bn', 'ta', 'mr', 'te'];

const dicts = {};
for (const lang of LANGUAGES) {
  const filePath = path.join(TRANSLATIONS_DIR, `${lang}.json`);
  dicts[lang] = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

test('Part 1 & 2 — Duplicate Headers Removed in Affected Pages', () => {
  const affectedPages = [
    'src/app/land-research/page.tsx',
    'src/app/documents/page.tsx',
    'src/app/case-management/page.tsx',
  ];

  for (const pageRel of affectedPages) {
    const pagePath = path.resolve(ROOT_DIR, pageRel);
    assert.ok(fs.existsSync(pagePath), `Page ${pageRel} must exist`);
    const content = fs.readFileSync(pagePath, 'utf-8');

    // Must NOT import or render local Header or Footer
    assert.doesNotMatch(
      content,
      /<Header\s*\/?>/i,
      `${pageRel} must not contain duplicate <Header /> since RootLayout provides it`
    );
    assert.doesNotMatch(
      content,
      /<Footer\s*\/?>/i,
      `${pageRel} must not contain duplicate <Footer /> since RootLayout provides it`
    );
  }
});

test('Part 1 — Header Navigation Contains VIDHIVRAKSH WORKSPACE Dropdown and Options', () => {
  const headerPath = path.resolve(ROOT_DIR, 'src/components/Header.tsx');
  assert.ok(fs.existsSync(headerPath), 'Header.tsx must exist');
  const headerContent = fs.readFileSync(headerPath, 'utf-8');

  // Verify dropdown trigger
  assert.match(
    headerContent,
    /workspaceDropdownOpen/,
    'Header must implement workspaceDropdownOpen state'
  );
  assert.match(
    headerContent,
    /nav\.workspaceDropdown/,
    'Header must render localized nav.workspaceDropdown'
  );

  // Verify the 4 exact options in dropdown
  assert.match(headerContent, /\/workspace/, 'Dropdown must link to /workspace');
  assert.match(headerContent, /\/documents/, 'Dropdown must link to /documents');
  assert.match(headerContent, /\/land-research/, 'Dropdown must link to /land-research');
  assert.match(headerContent, /\/case-management/, 'Dropdown must link to /case-management');

  // Verify separate top-level links are NOT present in middle desktop nav
  assert.doesNotMatch(
    headerContent,
    /featureRoutes\.map/,
    'Separate featureRoutes map must be removed from middle header nav'
  );

  // Verify Pricing link exists
  assert.match(headerContent, /\/pricing/, 'Header must provide a link to /pricing');
});

test('Part 3 — Pricing Page and Normal vs Professional Mode Comparison', () => {
  const pricingPath = path.resolve(ROOT_DIR, 'src/app/pricing/page.tsx');
  assert.ok(fs.existsSync(pricingPath), 'Pricing page src/app/pricing/page.tsx must exist');
  const content = fs.readFileSync(pricingPath, 'utf-8');

  // Prototype disclaimer
  assert.match(
    content,
    /pricing\.disclaimer/i,
    'Pricing page must render prototype disclaimer'
  );

  // Billing toggle
  assert.match(
    content,
    /pricing\.monthly/,
    'Pricing page must offer monthly billing toggle'
  );
  assert.match(
    content,
    /pricing\.yearly/,
    'Pricing page must offer annual billing toggle'
  );

  // Plans & pricing: ₹499, ₹4,999, ₹1,499, ₹14,990
  assert.match(content, /499/, 'Pricing page must display ₹499 pro legal pricing');
  assert.match(content, /4,999/, 'Pricing page must display ₹4,999 pro legal annual pricing');
  assert.match(content, /1,499/, 'Pricing page must display ₹1,499 advocate suite pricing');
  assert.match(content, /14,990/, 'Pricing page must display ₹14,990 advocate suite annual pricing');

  // Comparison table
  assert.match(
    content,
    /pricing\.comparisonTitle/,
    'Pricing page must include Normal vs Professional comparison table'
  );

  // No duplicate Header / Footer
  assert.doesNotMatch(
    content,
    /<Header\s*\/?>/i,
    'Pricing page must not render redundant <Header />'
  );
});

test('Part 3 — Simulated Demonstration Checkout Page', () => {
  const checkoutPath = path.resolve(ROOT_DIR, 'src/app/checkout/page.tsx');
  assert.ok(fs.existsSync(checkoutPath), 'Checkout page src/app/checkout/page.tsx must exist');
  const content = fs.readFileSync(checkoutPath, 'utf-8');

  // Simulated notice
  assert.match(
    content,
    /checkout\.disclaimer/,
    'Checkout page must include explicit simulated demonstration notice'
  );

  // Order summary and endpoints
  assert.match(
    content,
    /\/api\/v1\/billing\/checkout/,
    'Checkout page must call POST /api/v1/billing/checkout'
  );
  assert.match(
    content,
    /checkout\.orderSummary/,
    'Checkout page must render order summary'
  );
  assert.match(
    content,
    /checkout\.completeBtn/,
    'Checkout page must have complete demo purchase button'
  );

  // No duplicate Header / Footer
  assert.doesNotMatch(
    content,
    /<Header\s*\/?>/i,
    'Checkout page must not render redundant <Header />'
  );
});

test('Part 5 — CoreFeatures Feature Buttons Have Descriptive Localized Action Labels and Real Routes', () => {
  const coreFeaturesPath = path.resolve(ROOT_DIR, 'src/components/CoreFeatures.tsx');
  assert.ok(fs.existsSync(coreFeaturesPath), 'CoreFeatures.tsx must exist');
  const content = fs.readFileSync(coreFeaturesPath, 'utf-8');

  // Check functional routes
  assert.match(content, /targetRoute:\s*['"]\/workspace['"]/, 'CoreFeatures must route to /workspace');
  assert.match(content, /targetRoute:\s*['"]\/documents['"]/, 'CoreFeatures must route to /documents');
  assert.match(content, /targetRoute:\s*['"]\/land-research['"]/, 'CoreFeatures must route to /land-research');
  assert.match(content, /targetRoute:\s*['"]\/case-management['"]/, 'CoreFeatures must route to /case-management');

  // Check descriptive button keys
  assert.match(content, /features\.btn\.openAssistant/, 'Must have openAssistant action label');
  assert.match(content, /features\.btn\.exploreDocs/, 'Must have exploreDocs action label');
  assert.match(content, /features\.btn\.crimeGuide/, 'Must have crimeGuide action label');
  assert.match(content, /features\.btn\.challanHelp/, 'Must have challanHelp action label');
  assert.match(content, /features\.btn\.bnsMatrix/, 'Must have bnsMatrix action label');
  assert.match(content, /features\.btn\.browseLibrary/, 'Must have browseLibrary action label');
  assert.match(content, /features\.btn\.checkContract/, 'Must have checkContract action label');
  assert.match(content, /features\.btn\.researchLand/, 'Must have researchLand action label');
  assert.match(content, /features\.btn\.msmeDisputes/, 'Must have msmeDisputes action label');
  assert.match(content, /features\.btn\.manageCases/, 'Must have manageCases action label');
});

test('Part 6 — 100% Translation Key Parity Across All 6 Languages', () => {
  const enKeys = Object.keys(dicts['en']).sort();
  for (const lang of ['hi', 'bn', 'ta', 'mr', 'te']) {
    const langKeys = Object.keys(dicts[lang]).sort();
    assert.strictEqual(
      langKeys.length,
      enKeys.length,
      `Language '${lang}' has ${langKeys.length} keys, expected ${enKeys.length}`
    );

    const missing = enKeys.filter((k) => !dicts[lang][k]);
    assert.deepStrictEqual(
      missing,
      [],
      `Language '${lang}' is missing keys: ${missing.join(', ')}`
    );
  }
});

test('Part 6 — Brand Name Invariance: VIDHIVRAKSH Strictly Uppercase with 0 Transliterations', () => {
  for (const lang of LANGUAGES) {
    const dict = dicts[lang];
    assert.strictEqual(
      dict['brand.name'],
      'VIDHIVRAKSH',
      `Language '${lang}' brand name must be exactly VIDHIVRAKSH`
    );
    assert.strictEqual(
      dict['auth.errorUserAlreadyExists'],
      'USER ALREADY EXISTS',
      `Language '${lang}' duplicate user error must be exactly USER ALREADY EXISTS`
    );
  }
});
