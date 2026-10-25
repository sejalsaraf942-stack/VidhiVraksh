import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const COMPONENTS_DIR = path.join(__dirname, '../src/components');

test('Phase 2 — Component Localization Audit: No Raw English Text in Components', () => {
  const componentFiles = fs.readdirSync(COMPONENTS_DIR).filter((f) => f.endsWith('.tsx'));
  assert.ok(componentFiles.length >= 6, `Expected at least 6 components, found ${componentFiles.length}`);

  for (const file of componentFiles) {
    const content = fs.readFileSync(path.join(COMPONENTS_DIR, file), 'utf-8');
    
    // Components must use useLanguage hook
    assert.strictEqual(
      content.includes('useLanguage'),
      true,
      `Component ${file} must import and use useLanguage`
    );

    // Verify all heading/subheading/button tags use t(...)
    // Search for suspicious hardcoded text inside button or link tags without t()
    const suspiciousPatterns = [
      /<button[^>]*>\s*([A-Za-z]{4,})\s*<\/button>/g,
      /<h[1-6][^>]*>\s*([A-Za-z]{5,})\s*<\/h[1-6]>/g,
    ];

    for (const pattern of suspiciousPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        // Exception: VIDHIVRAKSH brand name is allowed to be literal VIDHIVRAKSH
        if (match[1] === 'VIDHIVRAKSH') continue;
        assert.fail(`File ${file} has potentially un-localized raw text: "${match[1]}"`);
      }
    }
  }
});
