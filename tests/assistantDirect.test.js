import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {randomUUID} from 'node:crypto';

const fixtures = [['src/lib/assistantDirect.js', 'web-personal', 'agent_5001m475t8mre208r993d3ernz84']];
let checks = 0;
const equal = (a, b) => { assert.equal(a, b); checks++; };
async function exercise(path, source, agentId) {
  const timers = new Map(); let nextTimer = 0, loads = 0, starts = 0, ends = 0, sent, options;
  const admissions = [];
  const site = 'personal';
  const scope = vm.createContext({Date, URL, AbortController, crypto: {randomUUID},
    async fetch(url, request) {
      admissions.push({url, request}); const body = JSON.parse(request.body), now = Date.now();
      return {ok: true, text: async () => JSON.stringify({site, mode: body.mode,
        signed_url: 'wss://api.elevenlabs.io/v1/convai/conversation?agent_id=' + agentId + '&conversation_signature=offline-signed-access-01234567890123456789&conversation_id=conv_offline',
        issued_at: new Date(now).toISOString(), expires_at: new Date(now + 900000).toISOString(), pause_window_seconds: 900})};
    },
    setTimeout(fn, ms) { timers.set(++nextTimer, {fn, ms}); return nextTimer; },
    clearTimeout(id) { timers.delete(id); },
  });
  vm.runInContext(fs.readFileSync(path, 'utf8').replace('export function', 'function'), scope);
  const sdk = {Conversation: {async startSession(value) {
    starts++; options = value; value.onConnect();
    return {getId: () => 'conv_offline', endSession: async () => { ends++; },
      sendUserMessage: value => { sent = value; }, getInputVolume: () => .42, getOutputVolume: () => .73,
      setMicMuted: value => { muted = value; }};
  }}};
  const make = loadSdk => scope.GoddTechDirectAssistant.createDirectSession({agentId, source, loadSdk, noticeDigests: {text: 'a'.repeat(64), voice: 'b'.repeat(64)}});
  const adapter = make(async () => { loads++; return sdk; });
  let current = true, received, disconnected, voiceMode, muted;
  const request = mode => ({consent: {source, mode}, textOnly: mode === 'text', isCurrent: () => current,
    callbacks: {onModeChange: value => { voiceMode = value.mode; }, onMessage: value => { received = value; }, onDisconnect: value => { disconnected = value; }}});
  await assert.rejects(adapter.startSession(request('text'))); checks++;
  await adapter.prepare('text'); equal(loads, 0);
  await assert.rejects(adapter.startSession({...request('text'), consent: {source, mode: 'voice'}})); checks++;
  equal(starts, 0); equal(loads, 0);
  const handle = await adapter.startSession(request('text'));
  equal(starts, 1); equal(options.agentId, undefined); equal(new URL(options.signedUrl).searchParams.get('agent_id'), agentId);
  equal(admissions.length, 1); equal(admissions[0].request.credentials, 'omit'); equal(JSON.parse(admissions[0].request.body).consent, true); equal(options.textOnly, true);
  equal(options.connectionType, 'websocket'); equal(handle.isOpen(), true);
  handle.sendUserMessage('ordinary inquiry'); equal(sent, 'ordinary inquiry');
  options.onMessage({role: 'agent', message: 'reply'}); equal(received.message, 'reply');
  await handle.endSession(); await handle.endSession(); equal(ends, 1); equal(handle.isOpen(), false);
  equal(timers.size, 0);
  await assert.rejects(async () => handle.sendUserMessage('after close')); checks++;
  await adapter.prepare('voice');
  const voice = await adapter.startSession(request('voice')); equal(options.textOnly, false);
  await assert.rejects(async () => voice.sendUserMessage('text in voice')); checks++;
  equal(voice.getInputVolume(), .42); equal(voice.getOutputVolume(), .73);
  voice.setMicMuted(true); equal(muted, true); voice.setMicMuted(false); equal(muted, false);
  options.onModeChange({mode: 'speaking'}); equal(voiceMode, 'speaking');
  options.onGuardrailTriggered({reason: 'refused'}); await voice.endSession(); equal(ends, 2);
  equal(voice.getInputVolume(), 0); equal(voice.getOutputVolume(), 0);
  await assert.rejects(async () => voice.setMicMuted(true)); checks++;
  options.onModeChange({mode: 'listening'}); equal(voiceMode, 'speaking');
  const limited = await adapter.startSession(request('text'));
  const timer = [...timers.values()].find(value => value.ms === 420000);
  assert.ok(timer); checks++; timer.fn();
  for (let n = 0; n < 8; n++) await Promise.resolve();
  equal(limited.isOpen(), false); equal(disconnected.reason, 'session_limit'); equal(ends, 3);
  current = false;
  const stale = await adapter.startSession(request('text')); equal(stale.isOpen(), false); equal(starts, 3);
  current = true; adapter.clear(); equal(adapter.isReady('text'), false);
  await assert.rejects(adapter.startSession(request('text'))); checks++;
  const malformed = make(async () => ({})); await malformed.prepare('text');
  await assert.rejects(malformed.startSession(request('text')), /assistant_sdk_unavailable/); checks++;
  let release;
  const delayed = make(async () => ({Conversation: {startSession(value) {
    options = value; return new Promise(resolve => { release = () => resolve({getId: () => 'late', endSession: async () => { ends++; }}); });
  }}}));
  await delayed.prepare('text'); const pending = delayed.startSession(request('text'));
  for (let n = 0; n < 12 && !release; n++) await Promise.resolve();
  equal(typeof release, 'function'); current = false; release();
  const late = await pending; equal(late.isOpen(), false); equal(ends, 4);
  current = true;
  const brokenClose = make(async () => ({Conversation: {async startSession(value) {
    value.onConnect(); return {getId: () => 'conv_offline', endSession: async () => { throw Error('offline close failure'); }};
  }}}));
  await brokenClose.prepare('text'); const broken = await brokenClose.startSession(request('text'));
  await assert.rejects(broken.endSession()); checks++;
  await assert.rejects(brokenClose.prepare('voice')); checks++;
}
for (const fixture of fixtures) await exercise(...fixture);
// The personal CDN loader must terminate without a provider connection.
for (const outcome of ['timeout', 'invalid-global', 'network-error']) {
  let script, fire;
  const scope = vm.createContext({
    setTimeout(fn, ms) { equal(ms, 15000); fire = fn; return 1; }, clearTimeout() {},
    document: {createElement: () => ({}), head: {appendChild: value => { script = value; }}},
  });
  vm.runInContext(fs.readFileSync(fixtures[0][0], 'utf8').replace('export function', 'function'), scope);
  const adapter = scope.createPersonalDirectSession(); await adapter.prepare('text'); equal(script, undefined);
  const pending = adapter.startSession({consent: {source: 'web-personal', mode: 'text'}, textOnly: true, isCurrent: () => true});
  assert.ok(script.src.includes('@elevenlabs/client@1.27.0/')); checks++;
  assert.ok(script.integrity.startsWith('sha384-')); checks++;
  if (outcome === 'timeout') fire(); else if (outcome === 'network-error') script.onerror(); else script.onload();
  await assert.rejects(pending, /assistant_sdk_unavailable/); checks++;
  // A late load cannot turn a failed load into a successful connection.
  script.onload(); await assert.rejects(adapter.startSession({consent: {source: 'web-personal', mode: 'text'}, textOnly: true, isCurrent: () => true})); checks++;
}

// Admission and provider binding regressions use only mocked transport/SDK.
async function admissionRegression(path, source, agentId) {
  const site = source === 'web-personal' ? 'personal' : source === 'web-samgov' ? 'government' : 'corporate';
  for (const scenario of ['clock-ahead','clock-behind','missing-id','duplicate-id','sdk-id-mismatch','callback-id-mismatch']) {
    let started=0, closed=0;
    class VisitorClock extends Date { static now() {return Date.now()+(scenario==='clock-ahead'?108000000:scenario==='clock-behind'?-108000000:0);} }
    const scope=vm.createContext({Date:VisitorClock,URL,AbortController,crypto:{randomUUID},setTimeout(){return 1;},clearTimeout(){},
      async fetch() { const now=Date.now();const id=scenario==='missing-id'?'':scenario==='duplicate-id'?'&conversation_id=conv_offline&conversation_id=conv_other':'&conversation_id=conv_offline';
        return {ok:true,text:async()=>JSON.stringify({site,mode:'text',signed_url:'wss://api.elevenlabs.io/v1/convai/conversation?agent_id='+agentId+'&conversation_signature=offline-signature-01234567890123456789'+id,issued_at:new Date(now).toISOString(),expires_at:new Date(now+900000).toISOString(),pause_window_seconds:900})}; }
    });
    vm.runInContext(fs.readFileSync(path,'utf8').replace('export function','function'),scope);
    const sdk={Conversation:{async startSession(options){started++;options.onConnect({conversationId:scenario==='callback-id-mismatch'?'conv_wrong':'conv_offline'});return {getId:()=>scenario==='sdk-id-mismatch'?'conv_wrong':'conv_offline',endSession:async()=>{closed++;}};}}};
    const adapter=scope.GoddTechDirectAssistant.createDirectSession({agentId,source,noticeDigests:{text:'a'.repeat(64)},loadSdk:async()=>sdk});await adapter.prepare('text');
    const request={textOnly:true,consent:{source,mode:'text'},isCurrent:()=>true};
    if(scenario.startsWith('clock')) { const handle=await adapter.startSession(request);equal(handle.isOpen(),true);await handle.endSession();equal(closed,1); }
    else {await assert.rejects(adapter.startSession(request));checks++;equal(started,scenario.endsWith('mismatch')?1:0);equal(closed,scenario.endsWith('mismatch')?1:0);}
  }
}
for(const fixture of fixtures)await admissionRegression(...fixture);
console.log(JSON.stringify({result: 'PASS', assertions: checks, provider_sessions: 0, microphone_requests: 0}));
