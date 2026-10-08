// Real document/history policy regression, using a disposable Chrome profile.
// Flask simulates the bridge; Chrome blocks every non-localhost request.
import assert from 'node:assert/strict';
import test from 'node:test';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, access, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import process from 'node:process';

const chrome = process.env.ASSISTANT_TEST_CHROME || (process.platform === 'darwin'
  ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' : 'google-chrome');
const python = process.env.ASSISTANT_TEST_PYTHON || 'python3';

const delay = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));
async function until(check) {
  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    try { const value = await check(); if (value) return value; } catch { /* document navigation */ }
    await delay(50);
  }
  throw new Error('Local browser fixture timed out');
}

async function stopChild(child) {
  if (!child.pid || child.exitCode !== null || child.signalCode !== null) return;
  await new Promise(resolve => {
    const force = setTimeout(() => child.kill('SIGKILL'), 2000);
    child.once('close', () => { clearTimeout(force); resolve(); });
    child.kill();
  });
}

async function localBrowser(enabled) {
  await access('dist/index.html'); // Build before running this browser suite.
  const directory = await mkdtemp(path.join(tmpdir(), 'assistant-navigation-'));
  const server = spawn(python, ['tests/navigation_server.py', enabled ? 'on' : 'off'],
    { stdio: ['ignore', 'pipe', 'pipe'] });
  let output = '', errors = '';
  server.on('error', error => { errors += error.message; });
  server.stdout.on('data', chunk => { output += chunk; });
  server.stderr.on('data', chunk => { errors += chunk; });
  const browser = spawn(chrome, ['--headless=new', '--disable-gpu', '--no-first-run',
    '--no-default-browser-check', '--disable-background-networking', '--disable-component-update',
    '--disable-sync', '--disable-default-apps', '--metrics-recording-only',
    '--remote-debugging-port=0', `--user-data-dir=${directory}`, 'about:blank'],
    { stdio: ['ignore', 'ignore', 'pipe'] });
  browser.stderr.on('data', chunk => { errors += chunk; });
  browser.on('error', error => { errors += error.message; });
  let socket;
  const close = async () => {
    socket?.close();
    await Promise.all([stopChild(browser), stopChild(server)]);
    await rm(directory, {recursive: true, force: true});
  };
  try {
    const port = await until(() => output.match(/^([0-9]+)\n/)?.[1]);
    const origin = `http://127.0.0.1:${port}`;
    const debuggingPort = await until(async () => (await readFile(path.join(directory, 'DevToolsActivePort'), 'utf8')).split('\n')[0]);
    const targets = await (await fetch(`http://127.0.0.1:${debuggingPort}/json/list`)).json();
    socket = new WebSocket(targets.find(target => target.type === 'page').webSocketDebuggerUrl);
    await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, {once: true}); socket.addEventListener('error', reject, {once: true}); });
    let next = 0;
    const pending = new Map();
    function call(method, params = {}) {
      return new Promise((resolve, reject) => {
        const id = ++next;
        const timeout = setTimeout(() => { pending.delete(id); reject(Error('Local CDP command timed out')); }, 10000);
        pending.set(id, {resolve, reject, timeout});
        socket.send(JSON.stringify({id, method, params}));
      });
    }
    socket.addEventListener('message', async event => {
      const message = JSON.parse(event.data);
      if (message.id) {
        const waiter = pending.get(message.id);
        pending.delete(message.id);
        clearTimeout(waiter?.timeout);
        if (message.error) waiter?.reject(Error(message.error.message)); else waiter?.resolve(message.result);
      } else if (message.method === 'Fetch.requestPaused') {
        const {requestId, request} = message.params;
        // No owner browser, credentials, provider requests or external asset I/O.
        const local = new URL(request.url).origin === origin;
        await call(local ? 'Fetch.continueRequest' : 'Fetch.failRequest',
          local ? {requestId} : {requestId, errorReason: 'BlockedByClient'}).catch(() => {});
      }
    });
    socket.addEventListener('close', () => {
      for (const waiter of pending.values()) {
        clearTimeout(waiter.timeout); waiter.reject(Error('Local browser closed'));
      }
      pending.clear();
    });
    await call('Page.enable');
    await call('Fetch.enable', {patterns: [{urlPattern: '*'}]});
    const evaluate = async expression => {
      const result = await call('Runtime.evaluate', {expression, returnByValue: true});
      if (result.exceptionDetails) throw Error(result.exceptionDetails.exception?.description || 'Browser expression failed');
      return result.result.value;
    };
    const snapshot = () => evaluate(`(() => {
      const policy = document.permissionsPolicy || document.featurePolicy;
      return {path: location.pathname, heading: document.querySelector('h1')?.textContent,
        microphone: policy.allowsFeature('microphone'), camera: policy.allowsFeature('camera'),
        geolocation: policy.allowsFeature('geolocation'),
        documentId: window.__NAVIGATION_DOCUMENT_ID ||= Math.random().toString(36)};
    })()`);
    const settled = expectedPath => until(async () => {
      const value = await snapshot();
      const expectedHeading = {'/assistant': 'AI assistant', '/privacy': 'AI assistant privacy',
        '/terms': 'AI assistant terms', '/ai-retention-policy': 'Website AI assistant retention policy',
        '/ai-retention-policy/azure-copy-amendment': 'Azure-copy retention policy'}[expectedPath];
      return value.path === expectedPath && value.heading &&
        (!expectedHeading || value.heading === expectedHeading) && value;
    });
    return {origin, call, evaluate, snapshot, settled,
      navigate: async route => {
        const previous = await snapshot();
        await call('Page.navigate', {url: origin + route});
        return until(async () => { const value = await settled(route.split(/[?#]/)[0]);
          return value.documentId !== previous.documentId && value; });
      },
      close};
  } catch (error) {
    await close();
    throw new Error(`${error.message}\n${errors}`);
  }
}

function policy(value, microphone) {
  assert.equal(value.microphone, microphone, `${value.path}: microphone policy`);
  assert.equal(value.camera, false, `${value.path}: camera policy`);
  assert.equal(value.geolocation, false, `${value.path}: geolocation policy`);
}

test('legal entry, assistant exit, history and direct loads retain document-scoped microphone policy', async () => {
  const browser = await localBrowser(true);
  try {
    for (const route of ['/privacy', '/terms', '/ai-retention-policy', '/ai-retention-policy/azure-copy-amendment']) {
      const legal = await browser.navigate(route);
      policy(legal, false);
      await browser.evaluate(`Array.from(document.querySelectorAll('a')).find(link => link.textContent === 'Review the conversation notice').click()`);
      const assistant = await browser.settled('/assistant');
      policy(assistant, true);
      assert.notEqual(assistant.documentId, legal.documentId, 'Entry obtains a new assistant document');
      await browser.evaluate('history.back()');
      policy(await browser.settled(route), false);
      await browser.evaluate('history.forward()');
      policy(await browser.settled('/assistant'), true);
    }
    const direct = await browser.navigate('/assistant');
    policy(direct, true);
    await browser.evaluate(`document.querySelector('.footer-links a[href="/privacy"]').click()`);
    const leaving = await until(async () => {
      const value = await browser.settled('/privacy');
      return !value.microphone && value;
    });
    policy(leaving, false);
    assert.notEqual(leaving.documentId, direct.documentId, 'Exit loads a restricted legal document');
    await browser.evaluate('history.back()');
    policy(await browser.settled('/assistant'), true);
    await browser.evaluate('history.forward()');
    policy(await browser.settled('/privacy'), false);
    // Each global navigation control must leave the microphone document.
    for (const selector of ['.wordmark', '.desktop-nav a[href="/about"]',
      '.desktop-nav a[href="/contact"]', '.footer-links a[href="/terms"]',
      '.footer-links a[href="/selected-work"]']) {
      const current = await browser.navigate('/assistant');
      const route = await browser.evaluate(`document.querySelector(${JSON.stringify(selector)}).getAttribute('href')`);
      await browser.evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
      const left = await browser.settled(route);
      policy(left, false);
      assert.notEqual(left.documentId, current.documentId, 'Global navigation obtains a restricted document');
    }
    // A same-document history transition also crosses the policy boundary.
    const original = await browser.navigate('/privacy');
    await browser.evaluate(`history.pushState(null, '', '/assistant'); dispatchEvent(new PopStateEvent('popstate'))`);
    const entered = await until(async () => {
      const value = await browser.settled('/assistant');
      return value.documentId !== original.documentId && value;
    });
    policy(entered, true);
    await browser.evaluate(`history.pushState(null, '', '/privacy'); dispatchEvent(new PopStateEvent('popstate'))`);
    const exited = await until(async () => {
      const value = await browser.settled('/privacy');
      return value.documentId !== entered.documentId && value;
    });
    policy(exited, false);
    policy(await browser.navigate('/assistant?notice=text#conversation'), true);
    // Aliases do not broaden the server's exact-route permission or reload-loop.
    for (const alias of ['/assistant/', '/Assistant']) {
      const restricted = await browser.navigate(alias);
      policy(restricted, false);
      await browser.evaluate(`document.querySelector('input[value="voice"]').click()`);
      await delay(200);
      assert.equal((await browser.snapshot()).documentId, restricted.documentId);
      policy(await browser.snapshot(), false);
    }
    policy(await browser.navigate('/contact'), false);
  } finally { await browser.close(); }
});

test('bridge OFF keeps microphone blocked on direct load and legal-page entry', async () => {
  const browser = await localBrowser(false);
  try {
    policy(await browser.navigate('/assistant'), false);
    policy(await browser.navigate('/privacy'), false);
    await browser.evaluate(`Array.from(document.querySelectorAll('a')).find(link => link.textContent === 'Review the conversation notice').click()`);
    policy(await browser.settled('/assistant'), false);
  } finally { await browser.close(); }
});
