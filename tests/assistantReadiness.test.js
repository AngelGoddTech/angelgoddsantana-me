import assert from 'node:assert/strict';
import test from 'node:test';
import { matchesNotice, readAssistantReadiness } from '../src/lib/assistantReadiness.js';

const expected = {
  source: 'web-personal', language: 'en', policyVersion: 'policy-current',
  noticeVersion: 'notice-current', noticeSha256: 'a'.repeat(64),
};
const unavailable = {
  ...expected, ready: false, modes: ['text', 'voice'],
  code: 'consent_binding_bridge_unavailable',
};

test('unavailable metadata matches notice but cannot enable a connection', () => {
  assert.equal(matchesNotice(unavailable, expected), true);
  for (const value of [true, 'false', null, undefined]) {
    assert.equal(matchesNotice({ ...unavailable, ready: value }, expected), false);
  }
});

test('different source, language, version, hash or modes fail closed', () => {
  for (const key of ['source', 'language', 'policyVersion', 'noticeVersion', 'noticeSha256', 'code']) {
    assert.equal(matchesNotice({ ...unavailable, [key]: 'different' }, expected), false);
  }
  for (const modes of [[], ['text'], ['voice'], ['text', 'text'], ['text', 'voice', 'unknown'], null]) {
    assert.equal(matchesNotice({ ...unavailable, modes }, expected), false);
  }
  assert.equal(matchesNotice(null, expected), false);
});

test('readiness uses only same-origin noncached JSON without redirects', async () => {
  let request;
  const value = await readAssistantReadiness(expected, {
    fetchImpl: async (url, options) => {
      request = { url, options };
      return new Response(JSON.stringify(unavailable), { headers: { 'Content-Type': 'application/json' } });
    },
  });
  assert.equal(value.ready, false);
  assert.equal(request.url, '/api/assistant/readiness');
  assert.equal(request.options.credentials, 'same-origin');
  assert.equal(request.options.cache, 'no-store');
  assert.equal(request.options.redirect, 'error');
});

test('SPA fallback, failed response, malformed metadata and network failure deny readiness', async () => {
  for (const response of [
    new Response('<html>SPA</html>', { headers: { 'Content-Type': 'text/html' } }),
    new Response('{}', { status: 503, headers: { 'Content-Type': 'application/json' } }),
    new Response(JSON.stringify({ ...unavailable, ready: true }), { headers: { 'Content-Type': 'application/json' } }),
  ]) {
    await assert.rejects(readAssistantReadiness(expected, { fetchImpl: async () => response }));
  }
  await assert.rejects(readAssistantReadiness(expected, { fetchImpl: async () => { throw new Error('offline'); } }));
});
