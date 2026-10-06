import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const PATHS = ['../src/assistant-widget.js'];
let assertions = 0;
const check = (actual, expected, reason) => { assert.deepEqual(actual, expected, reason); assertions += 1; };
const settle = async () => { for (let n = 0; n < 12; n += 1) await Promise.resolve(); };
function clock() {
    let now = 1791288000000;
    let id = 0;
    const timers = new Map();
    return {now: () => now, set: (fn, ms) => { const key = ++id; timers.set(key, {fn, at: now + ms}); return key; },
        clear: key => timers.delete(key), tick(ms) { now += ms; for (const [key, timer] of timers) if (timer.at <= now) { timers.delete(key); timer.fn(); } }};
}
for (const path of PATHS) {
    const source = fs.readFileSync(new URL(path, import.meta.url), 'utf8');
    const context = vm.createContext({setTimeout, clearTimeout});
    vm.runInContext(source, context);
    const api = context.GoddTechAssistantConsent;
    const verified = {preSessionControl: true, textCapture: true, voiceRecording: true, guardrailEvents: true, disconnectControl: true};
    check(Object.keys(api.COPY).join(','), 'en,es,fr,zh,ko,hi', 'All six languages');
    check(api.CONSENT_TIMEOUT_MS, 30000, 'Documented default');
    check(Object.values(api.VERIFIED).every(value => value === false), true, 'Production gates OFF');
    for (const [language, copy] of Object.entries(api.COPY)) {
        check(Object.keys(copy).length, 26, language + ' localized copy completeness');
        check(Object.values(copy).every(value => typeof value === 'string' && value.length > 0), true, 'No empty localized copy');
    }
    const blockedClock = clock();
    let calls = 0;
    const blocked = api.createConsentGate({clock: blockedClock, adapter: {startSession() { calls += 1; }}});
    check(blocked.request(), false, 'Unverified capture/adapter stays unavailable');
    check(blocked.accept(), false, 'No bypass via programmatic accept');
    blockedClock.tick(60000);
    check(calls, 0, 'No provider or microphone before agreement');
    for (const missing of Object.keys(verified)) {
        const partial = {...verified, [missing]: false};
        const gate = api.createConsentGate({verified: partial, clock: clock(), adapter: {startSession() { calls += 1; }}});
        const mode = missing === 'voiceRecording' ? 'voice' : 'text';
        check(gate.request(mode), false, 'Missing ' + missing + ' fails closed');
    }
    let disconnects = 0;
    let callback;
    const fakeClock = clock();
    const receipts = [];
    const gate = api.createConsentGate({verified, clock: fakeClock,
        adapter: {startSession(options) { calls += 1; callback = options.callbacks; receipts.push(options); return {isOpen: () => true, sendUserMessage() {}, endSession() { disconnects += 1; }}; }},
        onReviewNeeded: receipt => receipts.push(receipt)});
    const before = calls;
    check(gate.request(), true, 'Text request');
    check(gate.snapshot().mode, 'text', 'Text default');
    fakeClock.tick(29999);
    check(calls, before, 'Silence is not consent');
    fakeClock.tick(1);
    check(gate.snapshot().notice, 'timeout', 'Exact visible no-agreement timeout');
    check(gate.accept(), false, 'Timeout cannot accept stale choice');
    for (const action of ['decline', 'close', 'reset']) {
        gate.request('text'); gate[action]();
        check(gate.accept(), false, action + ' cancels consent');
        check(calls, before, action + ' has no provider session');
    }
    for (const language of Object.keys(api.COPY)) {
        gate.request('text', language);
        check(gate.snapshot().language, language, 'Fresh localized notice');
        check(gate.snapshot().consent, null, 'Language changes do not accept');
    }
    check(gate.accept(), true, 'Explicit affirmative response');
    check(gate.accept(), false, 'Repeated clicks start once');
    check(calls, before + 1, 'One provider start');
    check(receipts[0].textOnly, true, 'Text session has no mic');
    check(receipts[0].consent.version, api.NOTICE_VERSION, 'Minimal versioned receipt');
    check(Object.keys(receipts[0].consent).join(','), 'version,timestamp,source,mode,language', 'No transcript or visitor identity in receipt');
    callback.onConnect({conversationId: 'conv_invented_1'});
    await settle();
    check(gate.snapshot().phase, 'active', 'Connected');
    gate.request('voice', 'es');
    check(gate.accept(), false, 'Mode change waits for preceding disconnect');
    await settle();
    check(disconnects, 1, 'Existing text session ended');
    check(gate.snapshot().phase, 'awaiting', 'Fresh voice consent');
    check(gate.snapshot().consent, null, 'No carried consent');
    check(gate.accept(), true, 'Voice separately accepted');
    check(receipts[1].textOnly, false, 'Voice requested only after explicit choice');
    callback.onConnect({conversationId: 'conv_invented_2'});
    await settle();
    callback.onGuardrailTriggered({reason: 'untrusted_injection_guess'});
    await settle();
    check(gate.snapshot().notice, 'refused', 'Fixed visible refusal');
    check(gate.snapshot().reviewConfirmed, false, 'Never claim unconfirmed durable flag');
    check(disconnects, 2, 'Guardrail disconnect');
    callback.onGuardrailTriggered();
    check(receipts.length, 3, 'Duplicate guardrail event emits one review request');
    check(Object.keys(receipts[2]).join(','), 'conversationId,source,event', 'No inferred guardrail cause or accusation');
    check(gate.confirmReview({status: 'persisted', conversationId: 'wrong', source: api.SOURCE}), false, 'Reject mismatched review receipt');
    check(gate.confirmReview({status: 'pending', conversationId: 'conv_invented_2', source: api.SOURCE}), false, 'Pending is not durable');
    check(gate.confirmReview({status: 'persisted', conversationId: 'conv_invented_2', source: 'wrong'}), false, 'Reject wrong source');
    check(gate.confirmReview({status: 'persisted', conversationId: 'conv_invented_2', source: api.SOURCE}), true, 'Only exact confirmed receipt');
    check(gate.snapshot().reviewConfirmed, true, 'Confirmed flag is accurately indicated');
    callback.onDisconnect();
    check(gate.snapshot().notice, 'refused', 'Disconnect preserves refusal');
    const oldCallbacks = callback;
    gate.request('text', 'en');
    oldCallbacks.onGuardrailTriggered();
    check(gate.snapshot().notice, null, 'Stale previous callbacks cannot affect new consent');
    check(gate.accept(), true, 'Restart requires fresh agreement');
    gate.close();
    await settle();
    check(disconnects, 3, 'Closing during connect ends pending session once');
    const order = [];
    const existing = {onGuardrailTriggered: () => order.push('old'), onMessage: () => order.push('message')};
    const merged = gate.chainCallbacks(existing, {onGuardrailTriggered: () => order.push('new')});
    merged.onGuardrailTriggered(); merged.onMessage();
    check(order.join(','), 'old,new,message', 'Preserve old and unrelated callbacks');
    const throwing = gate.chainCallbacks({onDisconnect() { throw Error('invented callback failure'); }}, {onDisconnect: () => order.push('cleanup')});
    assert.throws(() => throwing.onDisconnect()); assertions += 1;
    check(order.at(-1), 'cleanup', 'Safety cleanup even if earlier callback throws');
    let lateResolve;
    let lateEnds = 0;
    const lateGate = api.createConsentGate({verified, clock: clock(), adapter: {startSession: () => new Promise(resolve => { lateResolve = resolve; })}});
    lateGate.request(); lateGate.accept(); lateGate.close(); lateGate.request('voice');
    check(lateGate.accept(), false, 'Close/start race cannot open second session');
    lateResolve({endSession() { lateEnds += 1; }});
    await settle();
    check(lateEnds, 1, 'Late connection closes exactly once');
    check(lateGate.snapshot().phase, 'awaiting', 'Can retry only after previous connection closed');
    check(lateGate.snapshot().consent, null, 'Late connection never supplies consent');
    let finishDisconnect;
    let deferredStarts = 0;
    let deferredConnect;
    const deferredGate = api.createConsentGate({verified, clock: clock(), adapter: {startSession() {
        deferredStarts += 1;
        return new Promise(resolve => { deferredConnect = resolve; });
    }}});
    deferredGate.request(); deferredGate.accept(); deferredGate.close(); deferredGate.request('voice');
    deferredConnect({endSession: () => new Promise(resolve => { finishDisconnect = resolve; })});
    await settle();
    check(deferredGate.snapshot().phase, 'closing', 'Actual asynchronous disconnect still pending');
    check(deferredGate.accept(), false, 'No agreement starts while disconnect pending');
    check(deferredStarts, 1, 'Pending disconnect cannot open second provider session');
    finishDisconnect(); await settle();
    check(deferredGate.snapshot().phase, 'awaiting', 'Fresh choice only after actual disconnect resolves');
    let rejectDisconnect;
    const rejectedGate = api.createConsentGate({verified, clock: clock(), adapter: {startSession: () => ({
        endSession: () => new Promise((_resolve, reject) => { rejectDisconnect = reject; })
    })}});
    rejectedGate.request(); rejectedGate.accept(); await settle(); rejectedGate.request('voice'); await settle();
    rejectDisconnect(Error('invented disconnect failure')); await settle();
    check(rejectedGate.snapshot().phase, 'unavailable', 'Failed disconnect stays unavailable');
    check(rejectedGate.accept(), false, 'Failed disconnect cannot begin another session');
    let completeGuardrailEnd;
    let reviewCalls = 0;
    let oldEvent;
    const orderedGate = api.createConsentGate({verified, clock: clock(), onReviewNeeded: () => { reviewCalls += 1; },
        adapter: {startSession(options) { oldEvent = options.callbacks; return {
            endSession: () => new Promise(resolve => { completeGuardrailEnd = resolve; })
        }; }}});
    orderedGate.request(); orderedGate.accept(); oldEvent.onConnect({conversationId: 'conv_ordered'}); await settle();
    oldEvent.onGuardrailTriggered(); await settle();
    check(orderedGate.snapshot().notice, 'refusing', 'Never claim ended before actual disconnect');
    oldEvent.onDisconnect();
    check(orderedGate.snapshot().notice, 'refusing', 'Early disconnect callback cannot overstate cleanup');
    completeGuardrailEnd(); await settle();
    check(orderedGate.snapshot().notice, 'refused', 'Ended only after shutdown completion');
    check(reviewCalls, 1, 'Review request preserved');
    let lateEvent;
    const lateReviews = [];
    const lateEventGate = api.createConsentGate({verified, clock: clock(), onReviewNeeded: value => lateReviews.push(value),
        adapter: {startSession(options) { lateEvent = options.callbacks; return {endSession() {}}; }}});
    lateEventGate.request(); lateEventGate.accept(); lateEvent.onConnect({conversationId: 'conv_previous'}); await settle();
    lateEventGate.close(); await settle(); lateEventGate.request();
    lateEvent.onGuardrailTriggered();
    check(lateEventGate.snapshot().notice, null, 'Late event does not overwrite new notice');
    check(lateReviews[0].conversationId, 'conv_previous', 'Late event still requests previous session review');
    lateEvent.onGuardrailTriggered();
    check(lateReviews.length, 1, 'Late review request deduplicated');
    for (const action of ['reset', 'close', 'decline']) {
        let completeEnd;
        const activeGate = api.createConsentGate({verified, clock: clock(), adapter: {startSession: () => ({
            endSession: () => new Promise(resolve => { completeEnd = resolve; })
        })}});
        activeGate.request(); activeGate.accept(); await settle(); activeGate[action](); await settle();
        check(activeGate.snapshot().notice, 'ending', action + ' does not falsely claim no agreement or completed shutdown');
        check(activeGate.snapshot().phase, 'closing', action + ' remains closing');
        completeEnd(); await settle();
        check(activeGate.snapshot().notice, 'ended', action + ' acknowledges actual prior consent only after shutdown');
    }
    const badGate = api.createConsentGate({verified, clock: clock(), adapter: {startSession() { throw Error('invented failure'); }}});
    badGate.request();
    check(badGate.accept(), false, 'Synchronous failure safe'); await settle();
    check(badGate.snapshot().phase, 'unavailable', 'Failure cannot retry automatically');
}
console.log(JSON.stringify({assertions, result: 'PASS', provider_sessions: 0, microphone_requests: 0}));
