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

    // onConnect is not a returned usable handle: never publish active early.
    let readyOptions, releaseReadyHandle, readinessEnds=0, readyOpen=true;
    const readinessSent=[],readinessMessages=[],readinessStates=[];
    const readyHandle={isOpen:()=>readyOpen,sendUserMessage:text=>readinessSent.push(text),endSession(){readinessEnds++;readyOpen=false;readyOptions.onDisconnect({reason:'user'});}};
    const readinessAdapter=api.createSdkAdapter({loadClient:async()=>({Conversation:{startSession(options){
        readyOptions=options;options.onConversationCreated(readyHandle);options.onConnect({conversationId:'conv_handle_after_connect'});
        options.onMessage({role:'agent',message:'Invented early greeting'});
        return new Promise(resolve=>{releaseReadyHandle=()=>resolve(readyHandle);});
    }}})});
    const readinessGate=api.createConsentGate({verified,adapter:readinessAdapter,onState:s=>readinessStates.push(s.phase),onMessage:m=>readinessMessages.push(m)});
    readinessGate.request();readinessGate.accept();await settle();
    check(readinessGate.snapshot().phase,'connecting','Early onConnect does not enable composer');
    check(readinessGate.snapshot().conversationId,'conv_handle_after_connect','Record conversation ID while handle is pending');
    check(readinessStates.includes('active'),false,'No early active publication');
    check(readinessGate.send('Invented early manual send'),false,'Pending handle cannot accept text');
    check(readinessSent.length,0,'No queued or automatic provider message');
    check(readinessMessages.filter(m=>m.role==='user').length,0,'No fabricated local user acknowledgement');
    releaseReadyHandle();await settle();
    check(readinessGate.snapshot().phase,'active','Connected and usable handle publish active together');
    check(readinessSent.length,0,'Handle resolution does not send retained input');
    check(readinessGate.send('Invented manual send after ready'),true,'Operator sends again manually after readiness');
    check(readinessSent,['Invented manual send after ready'],'Exactly one explicit text send');
    check(readinessMessages.filter(m=>m.role==='user').length,1,'One local user append for successful manual send');
    readinessGate.reset();await settle();check(readinessEnds,1,'Ready handle cleanup exactly once');
    let handleFirstOptions, handleFirstEnds=0;
    const handleFirst=api.createConsentGate({verified,adapter:api.createSdkAdapter({loadClient:async()=>({Conversation:{startSession(options){
        handleFirstOptions=options;const handle={isOpen:()=>true,sendUserMessage(){},endSession(){handleFirstEnds++;}};
        options.onConversationCreated(handle);return handle;
    }}})})});
    handleFirst.request();handleFirst.accept();await settle();
    check(handleFirst.snapshot().phase,'connecting','Returned handle alone does not authorize active UI');
    check(handleFirst.send('before connection event'),false,'Handle-first ordering cannot send early');
    handleFirstOptions.onConnect({conversationId:'conv_connect_after_handle'});
    check(handleFirst.snapshot().phase,'active','Late supported onConnect activates usable handle');
    handleFirst.close();await settle();check(handleFirstEnds,1,'Handle-first cleanup exactly once');
    for (const action of ['close','guardrail','disconnect']) {
        let lateHandleOptions,releaseLateHandle,lateHandleEnds=0;
        const lateGate=api.createConsentGate({verified,adapter:api.createSdkAdapter({loadClient:async()=>({Conversation:{startSession(options){
            lateHandleOptions=options;const handle={isOpen:()=>true,sendUserMessage(){throw Error('must not send');},endSession(){lateHandleEnds++;options.onDisconnect({reason:'user'});}};
            options.onConversationCreated(handle);options.onConnect({conversationId:'conv_pending_'+action});
            return new Promise(resolve=>{releaseLateHandle=()=>resolve(handle);});
        }}})})});
        lateGate.request();lateGate.accept();await settle();
        if(action==='close')lateGate.close();else if(action==='guardrail')lateHandleOptions.onGuardrailTriggered();else lateHandleOptions.onDisconnect({reason:'server'});
        check(lateGate.snapshot().phase,'closing',action+' during handle wait fences replacement session');
        check(lateGate.accept(),false,action+' cannot implicitly restart');
        releaseLateHandle();await settle();
        check(lateHandleEnds,1,action+' pending handle cleans exactly once');
        check(lateGate.snapshot().phase,'closed',action+' closes only after handle cleanup');
        check(lateGate.snapshot().conversationId,'conv_pending_'+action,action+' retains original conversation ID');
        check(lateGate.send('after shutdown'),false,action+' cannot send discarded input');
    }
    let synchronousEnds=0;
    const syncDisconnect=api.createConsentGate({verified,adapter:{startSession(request){
        request.callbacks.onConnect({conversationId:'conv_sync_disconnect'});request.callbacks.onDisconnect();
        return {isOpen:()=>false,sendUserMessage(){},endSession(){synchronousEnds++;}};
    }}});
    syncDisconnect.request();syncDisconnect.accept();check(syncDisconnect.snapshot().phase,'closing','Synchronous disconnect keeps pending-start cleanup fenced');
    await settle();check(synchronousEnds,1,'Synchronous pending handle cleans once');check(syncDisconnect.snapshot().phase,'closed','Synchronous disconnect settles closed');
    let unusableEnds=0;
    const unusable=api.createConsentGate({verified,adapter:{startSession(request){request.callbacks.onConnect({conversationId:'conv_unusable'});
        return {isOpen:()=>false,sendUserMessage(){throw Error('must not send');},endSession(){unusableEnds++;}};}}});
    unusable.request();unusable.accept();await settle();check(unusable.snapshot().phase,'connecting','Closed SDK handle never activates composer');
    check(unusable.send('unusable'),false,'Unusable handle cannot send');unusable.close();await settle();check(unusableEnds,1,'Unusable handle can still be cleaned');



    for (const timing of ['before_handle','after_cleanup','new_attempt']) {
        let terminalOptions,releaseTerminal,terminalEnds=0;
        const terminal=api.createConsentGate({verified,adapter:api.createSdkAdapter({loadClient:async()=>({Conversation:{startSession(options){
            terminalOptions=options;const handle={isOpen:()=>true,sendUserMessage(){},endSession(){terminalEnds++;}};
            options.onConversationCreated(handle);options.onConnect({conversationId:'conv_terminal_'+timing});
            return new Promise(resolve=>{releaseTerminal=()=>resolve(handle);});
        }}})})});
        terminal.request();terminal.accept();await settle();terminalOptions.onDisconnect({reason:'server'});
        check(terminal.snapshot().phase,'closing','Natural disconnect waits for pending handle cleanup');
        if(timing==='before_handle')terminalOptions.onGuardrailTriggered();
        releaseTerminal();await settle();check(terminalEnds,1,'Natural disconnect plus terminal event cleans handle once');
        if(timing==='after_cleanup')terminalOptions.onGuardrailTriggered();
        if(timing==='new_attempt'){
            terminal.request();terminalOptions.onGuardrailTriggered();await settle();
            check(terminal.snapshot().phase,'awaiting','Previous terminal event does not replace new consent');
            check(terminal.snapshot().notice,null,'Previous terminal event does not accuse newer session');
            terminal.close();
        }else{
            await settle();check(terminal.snapshot().notice,'refused','Same-session late guardrail preserves fixed fallback');
            check(terminal.snapshot().phase,'closed','Terminal fallback follows completed cleanup');
            check(terminal.snapshot().conversationId,'conv_terminal_'+timing,'Same-session late guardrail retains early ID');
        }
    }

    // Browser timer methods require a Window receiver; Node's timers do not.
    // Exercise the real defaults, not an injected options.clock.
    let timerId=0;
    const nativeTimers=new Map();
    const timerBridge={set(fn,ms){const id=++timerId;nativeTimers.set(id,{fn,ms});return id;},clear:id=>nativeTimers.delete(id)};
    const windowContext=vm.createContext({timerBridge});
    vm.runInContext(`globalThis.setTimeout=function(fn,ms){if(this!==globalThis)throw new TypeError('Illegal invocation: Window receiver');return timerBridge.set(fn,ms);};
        globalThis.clearTimeout=function(id){if(this!==globalThis)throw new TypeError('Illegal invocation: Window receiver');timerBridge.clear(id);};`,windowContext);
    vm.runInContext(source,windowContext);
    const windowApi=windowContext.GoddTechAssistantConsent;
    let windowStarts=0;
    const windowGate=windowApi.createConsentGate({verified,adapter:{startSession(){windowStarts++;return {endSession(){}};}}});
    check(windowGate.request(),true,'Native-receiver default consent timer');
    check([...nativeTimers.values()][0].ms,30000,'Actual default 30-second timeout');
    [...nativeTimers.values()][0].fn();
    check(windowGate.snapshot().notice,'timeout','Native-receiver default timer ends unagreed attempt');
    check(windowStarts,0,'Native-receiver timeout never connects');
    windowGate.request();windowGate.close();check(nativeTimers.size,0,'Default consent clearTimeout has Window receiver');
    const windowScripts=[],windowScope={};
    const windowLoad=windowApi.createSdkLoader({createElement:()=>({}),head:{appendChild:n=>windowScripts.push(n)}},windowScope);
    const windowLoaded=windowLoad();check([...nativeTimers.values()][0].ms,15000,'Default SDK load timeout has Window receiver');
    windowScope.ElevenLabsClient={Conversation:{startSession(){}}};windowScripts[0].onload();await windowLoaded;
    check(nativeTimers.size,0,'Default SDK success clears timer with Window receiver');
    const defaultTimeout=windowApi.createSdkLoader({createElement:()=>({}),head:{appendChild(){}}},{})();
    [...nativeTimers.values()][0].fn();await assert.rejects(defaultTimeout,/SDK is unavailable/);assertions++;
    check(nativeTimers.size,0,'Default SDK timeout clears correctly');
    // Negative control proves that the regression fails against the original defaults.
    vm.runInContext(source.replaceAll('set: (fn, ms) => globalThis.setTimeout(fn, ms), clear: id => globalThis.clearTimeout(id)',
        'set: setTimeout, clear: clearTimeout'),windowContext);
    const brokenApi=windowContext.GoddTechAssistantConsent;
    assert.throws(()=>brokenApi.createConsentGate({verified,adapter:{startSession(){throw new Error('must not start');}}}).request(),/Illegal invocation/);assertions++;
    await assert.rejects(brokenApi.createSdkLoader({createElement:()=>({}),head:{appendChild(){}}},{})(),/Illegal invocation/);assertions++;
}
console.log(JSON.stringify({assertions, result: 'PASS', real_provider_sessions: 0, microphone_requests: 0}));
