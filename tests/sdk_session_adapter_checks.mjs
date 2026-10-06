import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const PATHS = ['../src/assistant-widget.js'];
let assertions = 0;
const check = (actual, expected, reason) => { assert.deepEqual(actual, expected, reason); assertions += 1; };
const settle = async () => { for (let n = 0; n < 20; n += 1) await Promise.resolve(); };
for (const path of PATHS) {
    const source = fs.readFileSync(new URL(path, import.meta.url), 'utf8');
    const context = vm.createContext({setTimeout, clearTimeout});
    vm.runInContext(source, context);
    const api = context.GoddTechAssistantConsent;
    check(api.SDK_SCRIPT, 'https://unpkg.com/@elevenlabs/client@1.27.0/dist/lib.iife.js', 'Exact published version');
    check(api.SDK_INTEGRITY, 'sha384-ekuWfdL0BkeVAWv24yeCWtzVwYDQd4pCkPL5TKVDLmwDBeVxS2cTwo0wfsUNaFkJ', 'Verified exact artifact');
    let appended = [];
    let cleared = 0;
    let timeout;
    const scope = {};
    const load = api.createSdkLoader({createElement: tag => ({tag}), head: {appendChild: node => appended.push(node)}}, scope,
        {set(fn, ms) { check(ms, 15000, 'Bounded lazy code load'); timeout = fn; return 1; }, clear() { cleared += 1; }});
    check(appended.length, 0, 'Creating adapter/loader performs no request');
    const loaded = load();
    check(load() === loaded, true, 'One pinned download promise');
    check(appended.length, 1, 'No duplicate script');
    check(appended[0].integrity, api.SDK_INTEGRITY, 'SRI enforced');
    check(appended[0].crossOrigin, 'anonymous', 'CORS SRI; no credentials');
    scope.ElevenLabsClient = {Conversation: {startSession() {}}};
    appended[0].onload(); await loaded;
    check(cleared, 1, 'Clear load timeout');
    appended[0].onerror(); check(cleared, 1, 'Late error cannot reject resolved load');
    const badLoad = api.createSdkLoader({createElement: tag => ({tag}), head: {appendChild: node => appended.push(node)}}, {},
        {set(fn) { timeout = fn; return 2; }, clear() {}});
    const rejectedLoad = badLoad(); timeout();
    await assert.rejects(rejectedLoad, /Assistant SDK is unavailable/); assertions += 1;
    let loads = 0;
    let starts = 0;
    let ends = 0;
    let SDKOptions;
    let open = false;
    const sent = [];
    const messages = [];
    const callbackOrder = [];
    const fakeSDK = {Conversation: {startSession(options) {
        starts += 1; SDKOptions = options;
        const handle = {endSession() { open = false; ends += 1; options.onDisconnect({reason: 'user'}); },
            isOpen: () => open, sendUserMessage: value => sent.push(value)};
        options.onConversationCreated(handle);
        open = true;
        options.onConnect({conversationId: 'conv_fake_sdk'});
        return handle;
    }}};
    const adapter = api.createSdkAdapter({loadClient() { loads += 1; return Promise.resolve(fakeSDK); },
        callbacks: {onConnect: () => callbackOrder.push('existing-connect'), onMessage: () => callbackOrder.push('existing-message')}});
    const verified = {preSessionControl: true, textCapture: true, voiceRecording: true, guardrailEvents: true, disconnectControl: true};
    const gate = api.createConsentGate({adapter, verified, onMessage: message => messages.push(message)});
    check(starts + loads, 0, 'No load or provider creation before request');
    gate.request();
    check(starts + loads, 0, 'Notice itself is local');
    check(gate.send('invented text'), false, 'Text cannot auto-start session');
    gate.decline();
    check(starts + loads, 0, 'Decline never loads SDK');
    gate.request(); gate.accept(); await settle();
    check(loads, 1, 'Code loads only after affirmative choice');
    check(starts, 1, 'Exactly one connection');
    check(SDKOptions.textOnly, true, 'True text-only mode');
    check(SDKOptions.connectionType, 'websocket', 'Explicit supported transport, no RTC');
    check(SDKOptions.agentId, api.AGENT_ID, 'Existing new website agent only');
    check(['overrides','authorization','signedUrl','userId','dynamicVariables','clientTools'].some(key => Object.hasOwn(SDKOptions,key)), false, 'No credentials, identity invention, or protected configuration override');
    check(gate.snapshot().phase, 'active', 'Direct callback preserves lifecycle');
    check(callbackOrder[0], 'existing-connect', 'Existing callback preserved');
    check(gate.send('invented text'), true, 'Text sends only in accepted active session');
    check(sent.length, 1, 'Text uses existing accepted session');
    check(messages[0].role, 'user', 'Submitted user turn is visible locally');
    check(messages[0].message, 'invented text', 'Local user turn preserves accepted text');
    SDKOptions.onMessage({role: 'user', message: 'invented text', event_id: 1});
    check(messages.length, 1, 'Server echo cannot duplicate local user turn');
    check(gate.send(''), false, 'No empty message');
    check(gate.send('a'.repeat(2001)), false, 'Bounded input');
    SDKOptions.onMessage({role: 'agent', message: '<script>invented</script>', event_id: 2});
    check(messages[1].message, '<script>invented</script>', 'Message remains text; UI uses textContent');
    check(callbackOrder.at(-1), 'existing-message', 'Message callback preserved');
    gate.reset(); await settle();
    check(ends, 1, 'End control uses SDK cleanup');
    check(gate.send('after end'), false, 'No sending after shutdown');
    SDKOptions.onMessage({role: 'agent', message: 'late invented response', event_id: 3});
    check(messages.length, 2, 'Stale responses do not alter new UI');
    gate.request('voice', 'es');
    check(starts, 1, 'Switching mode waits for fresh agreement');
    gate.accept(); await settle();
    check(SDKOptions.textOnly, false, 'Explicit separately accepted voice choice');
    check(starts, 2, 'One new voice connection after choice');
    SDKOptions.onGuardrailTriggered(); await settle();
    check(ends, 2, 'Type-only guardrail callback explicitly ends SDK session');
    check(gate.snapshot().notice, 'refused', 'Fixed fallback after cleanup');
    check(gate.snapshot().reviewConfirmed, false, 'No durable acknowledgement fabricated');
    let deferredLoad;
    let canceledStarts = 0;
    const cancelAdapter = api.createSdkAdapter({loadClient: () => new Promise(resolve => { deferredLoad = resolve; })});
    const cancelGate = api.createConsentGate({adapter: cancelAdapter, verified});
    cancelGate.request(); cancelGate.accept(); cancelGate.close();
    deferredLoad({Conversation: {startSession() { canceledStarts += 1; }}}); await settle();
    check(canceledStarts, 0, 'Consent withdrawal while loading prevents all provider creation');
    check(cancelGate.snapshot().phase, 'closed', 'Canceled code load safely resolves without provider');
    let staleCreate;
    let staleEnds = 0;
    let staleConnects = 0;
    const staleAdapter = api.createSdkAdapter({loadClient: async () => ({Conversation: {startSession(options) {
        return new Promise((resolve, reject) => { staleCreate = async () => {
            const handle = {endSession() { staleEnds += 1; }};
            try { options.onConversationCreated(handle); staleConnects += 1; options.onConnect({conversationId: 'conv_stale'}); resolve(handle); }
            catch (error) { await handle.endSession(); reject(error); }
        }; });
    }}})});
    const staleGate = api.createConsentGate({adapter: staleAdapter, verified});
    staleGate.request(); staleGate.accept(); await settle(); staleGate.close(); await staleCreate(); await settle();
    check(staleEnds, 1, 'SDK documented stale-creation catch cleans capture');
    check(staleConnects, 0, 'Withdrawn consent cannot publish connected');
    check(staleGate.accept(), false, 'No implicit restart after canceled handshake');
    const request = {agentId: api.AGENT_ID, textOnly: true, consent: {version: api.NOTICE_VERSION, source: api.SOURCE, mode: 'text'},
        callbacks: {}, isCurrent: () => true};
    await assert.rejects(adapter.startSession({...request, agentId: 'protected_phone_agent'}), /Affirmative/); assertions += 1;
    await assert.rejects(adapter.startSession({...request, consent: null}), /Affirmative/); assertions += 1;
    for (const bag of [{agentId: 'protected_phone_agent'}, {textOnly: false}, {connectionType: 'webrtc'},
        {overrides: {agent: {prompt: {prompt: 'invented override'}}}}, {authorization: 'invented-nonsecret-test'},
        {onConnect: 'not-a-function'}]) {
        const strictAdapter = api.createSdkAdapter({loadClient: async () => fakeSDK, callbacks: bag});
        await assert.rejects(strictAdapter.startSession(request), /Unsupported SDK callback/); assertions += 1;
        await assert.rejects(adapter.startSession({...request, callbacks: bag}), /Unsupported SDK callback/); assertions += 1;
    }
    const beforeDenied = starts;
    await adapter.startSession({...request, isCurrent: () => false});
    check(starts, beforeDenied, 'Stale request denied before SDK load');
    const blocked = api.createConsentGate({adapter});
    blocked.request(); blocked.accept(); await settle();
    check(starts, beforeDenied, 'Production capture/runtime gates remain false despite available adapter');
}
console.log(JSON.stringify({assertions, result: 'PASS', real_provider_sessions: 0, microphone_requests: 0}));
