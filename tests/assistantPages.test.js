import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';

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
    const assistantPage = render(assistant.default);

    assert.match(privacy, /Godd Technologies, LLC/);
    assert.match(privacy, /verified actual conversation start plus 90 elapsed days/);
    assert.match(privacy, /business relationship does not create Keep automatically/);
    assert.match(privacy, /Notion Trash is recoverable/);
    assert.match(terms, /does not purchase a service/);
    assert.match(terms, /confirm employment availability/);
    assert.match(policy, /GT-AI-RETENTION-2026-10-07-v1/);
    assert.match(policy, /Effective date:\*\* October 7, 2026/);
    for (const value of [privacy, terms, policy, assistantPage]) {
      assert.match(value, /href="\/ai-retention-policy"/);
      assert.doesNotMatch(value, /<script|<iframe|agent_\d|conv_\d|Sentinel_|\.calldesk-work|subscription|tenant/i);
    }
    assert.match(assistantPage, /type="checkbox" disabled=""/);
    assert.match(assistantPage, /<button[^>]+disabled=""/);
    assert.match(assistantPage, /Text mode does not request microphone access/);
    assert.match(assistantPage, /currently unavailable/);
});
