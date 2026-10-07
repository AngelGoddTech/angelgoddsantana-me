import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import { NOTICE_SHA256 } from '../src/policy/notice-hash.js';

const require = createRequire(import.meta.url);
const { build } = createRequire(require.resolve('vite'))('esbuild');

async function loadComponent(entry) {
  const result = await build({
    entryPoints: [entry], bundle: true, write: false, platform: 'node', format: 'cjs',
    jsx: 'automatic', external: ['react', 'react-dom', 'react-router-dom'],
    plugins: [{ name: 'policy-text', setup(builder) {
      builder.onResolve({ filter: /\.md\?raw$/ }, (args) => ({
        path: path.resolve(args.resolveDir, args.path.replace(/\?raw$/, '')), namespace: 'policy-text',
      }));
      builder.onLoad({ filter: /.*/, namespace: 'policy-text' }, async (args) => ({
        contents: await readFile(args.path, 'utf8'), loader: 'text',
      }));
    } }],
  });
  const module = { exports: {} };
  new Function('require', 'module', 'exports', result.outputFiles[0].text)(require, module, module.exports);
  return module.exports;
}

test('legal documents and unavailable assistant render without a provider connection', async () => {
    const legal = await loadComponent('src/components/Privacy.jsx');
    const assistant = await loadComponent('src/components/Assistant.jsx');
    const render = (component) => renderToStaticMarkup(
      createElement(StaticRouter, { location: '/privacy' }, createElement(component)),
    );
    const privacy = render(legal.default);
    const terms = render(legal.AssistantTermsPage);
    const policy = render(legal.RetentionPolicyPage);
    const amendment = render(legal.AzureCopyAmendmentPage);
    const assistantPage = render(assistant.default);

    assert.match(privacy, /Godd Technologies, LLC/);
    assert.match(privacy, /90 elapsed days of 24 hours each in UTC after the verified actual conversation start/);
    assert.match(privacy, /business relationship does not create Keep automatically/);
    assert.match(privacy, /Notion Trash is recoverable/);
    assert.match(privacy, /precise removal timing has not been verified/);
    assert.match(privacy, /An overdue review leaves Keep in force/);
    assert.match(privacy, /authenticated Company Owner/);
    assert.match(terms, /does not purchase a service/);
    assert.match(terms, /confirm employment availability/);
    assert.match(policy, /GT-AI-RETENTION-2026-10-07-v1/);
    assert.match(policy, /Effective date:\*\* October 7, 2026/);
    for (const value of [privacy, terms, policy, amendment, assistantPage]) {
      assert.match(value, /href="\/ai-retention-policy\/azure-copy-amendment"/);
      assert.doesNotMatch(value, /<script|<iframe|agent_\d|conv_\d|Sentinel_|\.calldesk-work|subscription|tenant/i);
    }
    assert.match(assistantPage, /type="checkbox" disabled=""/);
    assert.match(assistantPage, /<button[^>]+disabled=""/);
    assert.match(assistantPage, /Text mode does not request microphone access or authorize voice recording/);
    assert.match(assistantPage, /currently unavailable/);
    assert.match(assistantPage, /I agree to processing my text conversation and preserving its transcript in the Company Azure copy/);
    assert.doesNotMatch(assistantPage, /Owner adoption|verified release|release disclosure|implementation|epoch|ready receipt/i);
    assert.match(policy, /original policy below effective October 7, 2026/);
    assert.match(amendment, /GT-AI-RETENTION-2026-10-07-v1.1-azure-copy/);
    assert.match(amendment, /Notion Trash is recoverable/);
    const amendmentArticle = amendment.match(/<article[^>]*>([\s\S]*?)<\/article>/)[1];
    assert.doesNotMatch(amendmentArticle, /Awaiting Owner approval|proposed|draft|release gate/i);
    assert.equal(createHash('sha256').update(await readFile('src/policy/ai-assistant-azure-copy-amendment.md')).digest('hex'),
      '4d77212a0fa403adf68a26f47f6c984265ae7de658d3002de67740c4acb6f5f5');
    const noticeBytes = await readFile('src/policy/assistant-notice.json');
    assert.equal(createHash('sha256').update(noticeBytes).digest('hex'), NOTICE_SHA256);
    const notice = JSON.parse(noticeBytes);
    assert.equal(notice.policyVersion, 'GT-AI-RETENTION-2026-10-07-v1.1-azure-copy');
    assert.equal(notice.noticeVersion, 'GT-WEB-CONSENT-2026-10-07-v1.1-azure-copy-compact');
    for (const paragraph of ['introduction', 'providers', 'retention', 'copies', 'restrictions', 'renewal', 'alternative'])
      assert.ok(assistantPage.includes(notice[paragraph].replaceAll('&', '&amp;').replaceAll("'", '&#x27;')), `${paragraph} is displayed`);
    assert.match(notice.modes.voice, /AI-generated version of Angel Godd-Santana's voice/);
    assert.match(notice.agreement.voice, /microphone access, speech processing, recording and transcription/);
    assert.match(notice.providers, /OpenAI Luna.*Google Gemini fallback/);
    for (const link of notice.links) {
      assert.ok(assistantPage.includes(`href="${link.href}"`));
      assert.ok(assistantPage.includes(link.label.replaceAll('&', '&amp;')));
    }
});
