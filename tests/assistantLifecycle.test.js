// Offline component lifecycle with a deferred SDK promise; no DOM/provider IO.
import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const {build} = createRequire(require.resolve('vite'))('esbuild');
const bundle = await build({entryPoints:['src/components/Assistant.jsx'],bundle:true,write:false,
  platform:'node',format:'cjs',jsx:'automatic',external:['react','react/jsx-runtime'],
  plugins:[{name:'offline-session',setup(builder){
    builder.onResolve({filter:/assistantSession$/},()=>({path:'offline-session',namespace:'fixture'}));
    builder.onLoad({filter:/.*/,namespace:'fixture'},()=>({contents:'export const createPersonalAssistantBridge = () => globalThis.__OFFLINE_ASSISTANT_BRIDGE;'}));
  }}]});

async function fixture(closeFails=false) {
  let release, prepareCount=0, starts=0, ends=0, ended=false;
  const deferred=new Promise(resolve=>{release=resolve;});
  globalThis.__OFFLINE_ASSISTANT_BRIDGE={clear(){},prepare:async()=>{prepareCount++;},
    authorizeConsent:async()=>({authorization:'A'.repeat(43)}),
    startAuthorizedSession:async(options)=>{starts++;await deferred;options.callbacks?.onConnect({conversationId:'conv_offline_policy_link'});return {isOpen:()=>!ended,endSession:async()=>{
      if(!ended){ended=true;ends++;}if(closeFails)throw Error('offline failed disconnect');
    }}}};
  const slots=[],effects=[];let cursor=0;
  const react={
    useRef(initial){const i=cursor++;if(!slots[i])slots[i]={current:initial};return slots[i];},
    useState(initial){const i=cursor++;if(!(i in slots))slots[i]=initial;return [slots[i],value=>{slots[i]=typeof value==='function'?value(slots[i]):value;}];},
    useEffect(effect,deps){const i=cursor++;const old=slots[i];
      if(!old||deps.some((value,index)=>value!==old.deps[index])){
        slots[i]={deps,cleanup:old?.cleanup};effects.push(()=>{slots[i].cleanup?.();slots[i].cleanup=effect();});
      }
    }};
  const module={exports:{}};
  new Function('require','module','exports',bundle.outputFiles[0].text)(name=>name==='react'?react:require(name),module,module.exports);
  let tree;
  function render(){cursor=0;tree=module.exports.default();while(effects.length)effects.shift()();return tree;}
  const settle=async()=>{for(let n=0;n<35;n++)await Promise.resolve();render();};
  function descend(predicate,node){if(!node||typeof node!=='object')return null;if(predicate(node))return node;
    for(const child of [node.props?.children].flat(5)){const found=descend(predicate,child);if(found)return found;}return null;}
  const find=predicate=>descend(predicate,tree);
  const label=node=>[node.props.children].flat(5).filter(value=>typeof value==='string').join('');
  const start=()=>find(node=>node.type==='button'&&label(node).startsWith('Start '));
  const agree=()=>find(node=>node.type==='input'&&node.props.type==='checkbox');
  render();await settle();
  return {render,settle,find,start,agree,release,stats:()=>({prepareCount,starts,ends}),
    async begin(){agree().props.onChange({target:{checked:true}});render();assert.equal(start().props.disabled,false);start().props.onClick();await settle();},
    end:()=>find(node=>node.type==='button'&&label(node)==='End conversation').props.onClick()};
}

test('End during pending SDK creation keeps controls closed until disconnect completes',async()=>{
  const f=await fixture();await f.begin();
  assert.equal(f.stats().starts,1);
  const closed=f.end();f.render();
  assert.equal(f.start().props.disabled,true);assert.equal(f.agree().props.disabled,true);
  await f.settle();assert.equal(f.stats().ends,0);
  f.release();await closed;await f.settle();
  assert.equal(f.stats().ends,1);assert.equal(f.start().props.disabled,true);
  assert.equal(f.agree().props.checked,false);
});

test('Mode change waits for pending old SDK and explicit new agreement',async()=>{
  const f=await fixture();await f.begin();
  f.find(node=>node.type==='input'&&node.props.type==='radio'&&node.props.value==='voice').props.onChange();f.render();
  await f.settle();assert.equal(f.stats().prepareCount,1);assert.equal(f.start().props.disabled,true);
  f.release();await f.settle();
  assert.equal(f.stats().ends,1);assert.equal(f.stats().prepareCount,2);assert.equal(f.stats().starts,1);
  assert.equal(f.start().props.disabled,true);assert.equal(f.agree().props.checked,false);
});

test('A failed disconnect latches unavailable through mode changes',async()=>{
  const f=await fixture(true);await f.begin();const closed=f.end();f.release();await closed;await f.settle();
  f.find(node=>node.type==='input'&&node.props.type==='radio'&&node.props.value==='voice').props.onChange();f.render();await f.settle();
  assert.equal(f.start().props.disabled,true);assert.equal(f.agree().props.disabled,true);assert.equal(f.stats().starts,1);
});

test('The public policy remains available before agreement and during either active mode',async()=>{
  for (const mode of ['text','voice']) {
    const f=await fixture();
    if(mode==='voice') {
      f.find(node=>node.type==='input'&&node.props.type==='radio'&&node.props.value==='voice').props.onChange();
      f.render();
      await f.settle();
    }
    const policy=()=>f.find(node=>node.type==='a'&&node.props.href==='/ai-retention-policy/azure-copy-amendment');
    for(const active of [false,true]) {
      if(active) {await f.begin();f.release();await f.settle();}
      const link=policy();
      assert.equal(link.props.children,'Privacy & recording policy');
      assert.equal(link.props.target,'_blank');
      assert.equal(link.props.rel,'noopener noreferrer');
      assert.equal(link.props['aria-label'],'Privacy & recording policy (opens in a new tab)');
      assert.equal(link.props.onClick,undefined);
      const before=f.stats();f.render();
      assert.deepEqual(f.stats(),before);
      assert.equal(f.stats().ends,0);
      if(active) assert.equal(f.agree().props.checked,true);
    }
  }
});
