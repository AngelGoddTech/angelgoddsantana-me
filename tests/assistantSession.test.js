import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import process from 'node:process';
let assertions = 0;
const check = (actual, expected, message) => { assert.deepEqual(actual, expected, message); assertions++; };
const rejects = async action => { await assert.rejects(action, /assistant_/); assertions++; };
const targets = [['../src/lib/assistantSession.js', 'web-personal']];
for (const [path, source] of targets) {
  const context = vm.createContext({setTimeout, clearTimeout, AbortController});
  vm.runInContext(fs.readFileSync(new URL(path, import.meta.url),'utf8').split('\nexport const createServerSdkBridge')[0], context);
  const create = context.GoddTechAssistantSession.createServerSdkBridge;
  const now = Date.parse('2026-10-07T20:00:00Z');
  const fields = mode => ({source,mode,language:'en',policyVersion:'GT-AI-RETENTION-2026-10-07-v1.1-azure-copy',
    noticeVersion:'GT-WEB-CONSENT-2026-10-07-v1.1-azure-copy',noticeSha256:'f'.repeat(64)});
  function fixture(change={}) {
    const requests=[]; let loads=0, starts=0, ends=0, microphone=0, sent=[], sdkOptions;
    const fetchImpl = async (url, options) => {
      requests.push({url,options});
      const body = options.body ? JSON.parse(options.body) : null;
      const mode = body?.mode || (url.includes('mode=voice') ? 'voice' : 'text');
      let reply;
      if(url.includes('/readiness')) reply={...fields(mode),ready:true,code:'ready',...change.readiness};
      if(url.endsWith('/challenge')) reply={...fields(mode),code:'challenge',csrfToken:'C'.repeat(43),...change.challenge};
      if(url.endsWith('/consent')) reply={...fields(mode),code:'authorized',authorization:'A'.repeat(43),expiresAt:new Date(now+60000).toISOString(),...change.grant};
      if(url.includes('/session?')) reply={code:'authorized',conversationToken:'T'.repeat(64),conversationId:'conv_offline_invented',mode,connectionType:'webrtc',...change.session};
      await change.beforeReply?.(url);
      return {ok:change.ok!==false,headers:{get:()=>change.contentType||'application/json'},text:async()=>JSON.stringify(reply)};
    };
    const loadSdk=async()=>{loads++;return {Conversation:{startSession:async options=>{
      sdkOptions=options;starts++;if(!options.textOnly)microphone++;
      options.onConnect?.({conversationId:change.sdkId||'conv_offline_invented'});
      await change.beforeSdkReturn?.();
      return {getId:()=>change.sdkId||'conv_offline_invented',sendUserMessage: value=>sent.push(value),endSession:async()=>{ends++;if(change.closeFails)throw Error('private provider exception');}};
    }}};};
    const bridge=create({source,policyVersion:fields('text').policyVersion,noticeVersion:fields('text').noticeVersion,
      noticeSha256:'f'.repeat(64),now:()=>now,fetchImpl,loadSdk});
    return {bridge,requests,stats:()=>({loads,starts,ends,microphone,sent,sdkOptions})};
  }
  async function start(f,mode='text',extra={}) {
    const grant=await f.bridge.authorizeConsent(fields(mode));
    return f.bridge.startAuthorizedSession({authorization:grant.authorization,textOnly:mode==='text',isCurrent:()=>true,callbacks:{},...extra});
  }
  const f=fixture();
  check(f.stats().loads+f.requests.length,0,'Construction is local only');
  await f.bridge.prepare('text');
  check(f.stats().loads,0,'Readiness does not load SDK');
  const handle=await start(f);
  check(handle.isOpen(),true,'Connected room authenticated ID matches durable binding');
  check(f.stats().microphone,0,'Explicit WebRTC textOnly avoids microphone');
  check(f.stats().sdkOptions.connectionType,'webrtc','Pinned token uses WebRTC explicitly');
  check(f.stats().sdkOptions.textOnly,true,'Text override is boolean');
  check(f.stats().sdkOptions.conversationToken,'T'.repeat(64),'SDK receives only bound token');
  check(Object.hasOwn(f.stats().sdkOptions,'agentId'),false,'No raw public agent bypass');
  handle.sendUserMessage('invented offline text');
  check(f.stats().sent.length,1,'Bounded text composer works');
  await rejects(()=>Promise.resolve().then(()=>handle.sendUserMessage('x'.repeat(2001))));
  await handle.endSession(); await handle.endSession();
  check(f.stats().ends,1,'Owned disconnect is idempotent');
  check(handle.isOpen(),false,'Closed session cannot send');
  for(const request of f.requests) {
    check(request.options.redirect,'error','No redirect credentials');
    check(request.options.credentials,source==='web-samgov'?'include':'same-origin','Government sibling uses same-site cookie');
    check(request.url.includes('A'.repeat(43))||request.url.includes('T'.repeat(64)),false,'No grant/token URL');
    check(request.options.cache,'no-store','Credentials not cacheable');
    check(source==='web-samgov'?request.url.startsWith('https://goddtechnologies.com/api/government-assistant/'):request.url.startsWith('/api/assistant/'),true,'Fixed API route');
  }
  const voice=fixture();
  check(voice.stats().microphone,0,'No microphone before explicit voice start');
  await start(voice,'voice');
  check(voice.stats().microphone,1,'Only affirmative bound voice reaches simulated microphone');
  for(const change of [{readiness:{ready:false}},{readiness:{noticeSha256:'0'.repeat(64)}},{readiness:{source:'phone'}},
      {challenge:{csrfToken:'short'}},{challenge:{mode:'voice'}},{grant:{authorization:'short'}},
      {grant:{expiresAt:new Date(now).toISOString()}},{grant:{expiresAt:new Date(now+300001).toISOString()}},
      {session:{conversationId:'bad'}},{session:{conversationToken:'SECRET'}},{session:{mode:'voice'}},
      {session:{connectionType:'websocket'}},{session:{conversationToken:'T'.repeat(63)+'\n'}},
      {ok:false},{contentType:'text/html'}]) {
    const bad=fixture(change);await rejects(()=>start(bad));
    check(bad.stats().loads+bad.stats().starts,0,'Rejected central authority never loads provider SDK');
  }
  const mismatch=fixture({sdkId:'conv_wrong'}); await rejects(()=>start(mismatch));
  check(mismatch.stats().ends,1,'Wrong SDK room disconnects before usable handle');
  const late=fixture();const lateHandle=await start(late);
  late.stats().sdkOptions.onConnect({conversationId:'conv_late_wrong'});
  await Promise.resolve();await Promise.resolve();
  check(lateHandle.isOpen(),false,'Late wrong SDK ID cannot stay active');
  check(late.stats().ends,1,'Late wrong ID terminates owned SDK session');
  const withdrawn=fixture();const grant=await withdrawn.bridge.authorizeConsent(fields('text'));
  const stopped=await withdrawn.bridge.startAuthorizedSession({authorization:grant.authorization,textOnly:true,isCurrent:()=>false});
  check(stopped.isOpen(),false,'Withdrawn consent before token consumption is inactive');
  check(withdrawn.stats().loads,0,'Withdrawn consent never loads SDK');
  await rejects(()=>withdrawn.bridge.startAuthorizedSession({authorization:grant.authorization,textOnly:true,isCurrent:()=>true}));
  let current=true;
  const during=fixture({beforeReply:async url=>{if(url.includes('/session?'))current=false;}});
  const inactiveHandle=await start(during,'text',{isCurrent:()=>current});
  check(inactiveHandle.isOpen(),false,'Withdrawal during token request prevents SDK load');
  check(during.stats().loads,0,'Durable grant discarded after withdrawal');
  current=true;
  const opening=fixture({beforeSdkReturn:async()=>{current=false;}});
  const endedHandle=await start(opening,'text',{isCurrent:()=>current});
  check(endedHandle.isOpen(),false,'Withdrawal during SDK opening cleans up');
  check(opening.stats().ends,1,'Opening session disconnects once');
  const callbacks=fixture();await rejects(()=>start(callbacks,'text',{callbacks:{conversationToken:()=>{}}}));
  check(callbacks.stats().loads,0,'Callback bag cannot override credentials/transport options');
  const failed=fixture({closeFails:true});const failedHandle=await start(failed);await rejects(()=>failedHandle.endSession());
  await rejects(()=>failed.bridge.prepare('text'));
  check(failed.bridge.isReady('text'),false,'Failed disconnect cannot reopen the gate');
}
process.stdout.write(JSON.stringify({result:'PASS',assertions,real_provider_sessions:0,microphone_requests:0,simulated_voice_sdk_entries:targets.length}));
