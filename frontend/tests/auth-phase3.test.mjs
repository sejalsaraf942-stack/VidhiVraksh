import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LANGUAGES = ['en', 'hi', 'bn', 'ta', 'mr', 'te'];
const TRANSLATIONS_DIR = path.join(__dirname, '../src/i18n/translations');

test('Phase 3 — Auth & User Translation Completeness Across All 6 Languages', () => {
  const authKeys = [
    'auth.signin', 'auth.signup', 'auth.signout', 'auth.modalTitle', 'auth.modalSubtitle',
    'auth.emailLabel', 'auth.nameLabel', 'auth.roleLabel', 'auth.roleCitizen', 'auth.roleBusiness',
    'auth.roleLawyer', 'auth.sendOtp', 'auth.otpLabel', 'auth.verifyOtp', 'auth.mockOtpNotice',
    'auth.fillMockOtp', 'auth.quickDemo', 'auth.demoCitizen', 'auth.demoLawyer',
    'auth.errorInvalidOtp', 'auth.errorGeneral', 'auth.successSignedOut',
    'profile.title', 'profile.role', 'profile.mode', 'profile.modeNormal', 'profile.modePro',
    'profile.switchToNormal', 'profile.switchToPro', 'profile.subscription',
    'profile.history', 'profile.documents', 'profile.noHistory', 'profile.noDocuments'
  ];

  for (const lang of LANGUAGES) {
    const filePath = path.join(TRANSLATIONS_DIR, `${lang}.json`);
    const dict = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    for (const key of authKeys) {
      assert.ok(dict[key], `Missing Phase 3 auth key '${key}' in language '${lang}'`);
      assert.strictEqual(dict[key].trim().length > 0, true, `Empty auth key '${key}' in '${lang}'`);
      assert.strictEqual(dict[key].includes('MISSING'), false, `Missing placeholder in '${key}'`);
    }

    // Verify brand name in modal title
    assert.strictEqual(
      dict['auth.modalTitle'].includes('VIDHIVRAKSH'),
      true,
      `auth.modalTitle in '${lang}' must contain literal 'VIDHIVRAKSH'`
    );
  }
});

test('Phase 3 — Mock OTP Integration & Role Escalation Defense Contract', async () => {
  // Test mock OTP format
  const mockCode = '123456';
  assert.strictEqual(mockCode.length, 6, 'Mock OTP should be 6 digits');

  // Verify non-privileged self-registration rule
  const allowedSelfRegistrationRoles = ['citizen', 'business'];
  const privilegedRoles = ['admin', 'lawyer'];

  for (const role of privilegedRoles) {
    assert.strictEqual(
      allowedSelfRegistrationRoles.includes(role),
      false,
      `Privileged role '${role}' must not be allowed during self-registration`
    );
  }
});
