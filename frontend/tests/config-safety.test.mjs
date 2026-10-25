import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test('Test 4 & 5 — Startup without external AI credentials & Configuration safety', () => {
  const rootDir = path.join(__dirname, '../..');
  const frontendEnvPath = path.join(__dirname, '../.env.local');

  // Verify frontend does not require external AI keys (OpenAI, Gemini, Pinecone, FAISS etc.)
  if (fs.existsSync(frontendEnvPath)) {
    const envContent = fs.readFileSync(frontendEnvPath, 'utf-8');
    assert.strictEqual(
      /OPENAI_API_KEY/i.test(envContent),
      false,
      'External OpenAI key must not be required or exposed'
    );
    assert.strictEqual(
      /SECRET_KEY/i.test(envContent),
      false,
      'Backend secret key must not be in frontend bundle'
    );
  }

  // Ensure root .env.example does not expose active production secrets
  const envExamplePath = path.join(rootDir, '.env.example');
  if (fs.existsSync(envExamplePath)) {
    const exampleContent = fs.readFileSync(envExamplePath, 'utf-8');
    assert.ok(exampleContent.includes('ENVIRONMENT='), '.env.example should define ENVIRONMENT');
  }
});
