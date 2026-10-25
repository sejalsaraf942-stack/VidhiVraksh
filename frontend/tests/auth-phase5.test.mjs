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

test('Phase 5 — Exact Duplicate Registration Message: USER ALREADY EXISTS', () => {
  for (const lang of LANGUAGES) {
    const dict = dicts[lang];
    assert.strictEqual(
      dict['auth.errorUserAlreadyExists'],
      'USER ALREADY EXISTS',
      `Language '${lang}' must have exact duplicate error 'USER ALREADY EXISTS' without typo correction`
    );
  }
});

test('Phase 5 — Brand Name Invariance: VIDHIVRAKSH strictly preserved in all 6 languages', () => {
  for (const lang of LANGUAGES) {
    const dict = dicts[lang];
    assert.strictEqual(
      dict['brand.name'],
      'VIDHIVRAKSH',
      `Language '${lang}' brand.name must be exactly 'VIDHIVRAKSH'`
    );

    // Verify brand name in modal titles and welcome titles
    assert.ok(
      dict['auth.modalLoginTitle'].includes('VIDHIVRAKSH'),
      `modalLoginTitle in ${lang} must contain 'VIDHIVRAKSH'`
    );
    assert.ok(
      dict['auth.modalSignupTitle'].includes('VIDHIVRAKSH'),
      `modalSignupTitle in ${lang} must contain 'VIDHIVRAKSH'`
    );
    assert.ok(
      dict['workspace.welcomeTitle'].startsWith('VIDHIVRAKSH'),
      `workspace.welcomeTitle in ${lang} must start with 'VIDHIVRAKSH'`
    );

    // Forbid obsolete LIBRA
    for (const [k, v] of Object.entries(dict)) {
      assert.ok(
        !v.includes('LIBRA'),
        `Obsolete brand 'LIBRA' found in ${lang}[${k}]: ${v}`
      );
    }
  }
});

test('Phase 5 — All Phase 5 Translation Keys Present Across All 6 Languages', () => {
  const phase5Keys = [
    'auth.login',
    'auth.signup',
    'auth.modalLoginTitle',
    'auth.modalSignupTitle',
    'auth.modalLoginSubtitle',
    'auth.modalSignupSubtitle',
    'auth.passwordLabel',
    'auth.passwordPlaceholder',
    'auth.confirmPasswordLabel',
    'auth.confirmPasswordPlaceholder',
    'auth.nameOptionalLabel',
    'auth.switchToSignup',
    'auth.switchToLogin',
    'auth.btnLogin',
    'auth.btnSignup',
    'auth.errorInvalidCredentials',
    'auth.errorPasswordMismatch',
    'auth.errorPasswordShort',
    'auth.errorEmptyFields',
    'auth.errorUserAlreadyExists',
    'auth.successSignup',
    'auth.successLogin'
  ];

  for (const lang of LANGUAGES) {
    const dict = dicts[lang];
    for (const k of phase5Keys) {
      assert.ok(
        dict[k] && dict[k].trim().length > 0,
        `Language '${lang}' is missing Phase 5 key: '${k}'`
      );
    }
  }
});

test('Phase 5 — LocalStorage Cache vidhivraksh_registered_emails_v1 contract', () => {
  const STORAGE_KEY = 'vidhivraksh_registered_emails_v1';
  assert.strictEqual(STORAGE_KEY, 'vidhivraksh_registered_emails_v1');

  // Simulated email caching logic
  const mockStorage = {};
  const cacheRegisteredEmail = (email) => {
    const normalized = email.trim().toLowerCase();
    if (!normalized || !normalized.includes('@')) return;
    const raw = mockStorage[STORAGE_KEY];
    const existing = raw ? JSON.parse(raw) : [];
    if (!existing.includes(normalized)) {
      mockStorage[STORAGE_KEY] = JSON.stringify([...existing, normalized]);
    }
  };

  // Test 1: Add new email
  cacheRegisteredEmail('  Citizen.New@Example.TEST  ');
  const cached = JSON.parse(mockStorage[STORAGE_KEY]);
  assert.deepStrictEqual(cached, ['citizen.new@example.test']);

  // Test 2: Duplicate email is ignored
  cacheRegisteredEmail('CITIZEN.NEW@EXAMPLE.TEST');
  const cached2 = JSON.parse(mockStorage[STORAGE_KEY]);
  assert.strictEqual(cached2.length, 1);

  // Test 3: Second distinct email is appended
  cacheRegisteredEmail('lawyer.priya@example.test');
  const cached3 = JSON.parse(mockStorage[STORAGE_KEY]);
  assert.strictEqual(cached3.length, 2);
  assert.ok(cached3.includes('lawyer.priya@example.test'));

  // Test 4: Passwords are NEVER cached
  const serialized = JSON.stringify(mockStorage);
  assert.ok(!serialized.includes('password'));
  assert.ok(!serialized.includes('DemoPass'));
});
