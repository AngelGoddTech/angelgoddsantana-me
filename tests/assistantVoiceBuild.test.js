import assert from 'node:assert/strict';
import test from 'node:test';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {verifyRuntime,verifiedBuilder} from '../scripts/verify_assistant_voice_inputs.mjs';

function fixture(t){const root=mkdtempSync(path.join(tmpdir(),'assistant-voice-inputs-'));t.after(()=>rmSync(root,{recursive:true,force:true}));return root;}
const write=(root,file,value)=>{const target=path.join(root,file);mkdirSync(path.dirname(target),{recursive:true});writeFileSync(target,JSON.stringify(value));};
const pin={version:'19.2.1',resolved:'https://registry.npmjs.org/react/-/react-19.2.1.tgz',integrity:'sha512-offline-fixture'};

test('Runtime rejects changed installed package versions and integrity metadata',t=>{
  const root=fixture(t),lock={packages:{'node_modules/react':pin}};
  write(root,'node_modules/.package-lock.json',{packages:{'node_modules/react':pin}});
  write(root,'node_modules/react/package.json',{version:pin.version});
  assert.doesNotThrow(()=>verifyRuntime(root,lock));
  write(root,'node_modules/react/package.json',{version:'19.1.0'});
  assert.throws(()=>verifyRuntime(root,lock),/installed version differs/);
  write(root,'node_modules/react/package.json',{version:pin.version});
  write(root,'node_modules/.package-lock.json',{packages:{'node_modules/react':{...pin,integrity:'sha512-different'}}});
  assert.throws(()=>verifyRuntime(root,lock),/integrity differs/);
});

test('An arbitrary build directory cannot execute altered esbuild entry code',t=>{
  const root=fixture(t),builder={version:'0.25.4',integrity:'sha512-offline-builder',main_sha256:'approved-entry-sha'};
  write(root,'package.json',{});
  write(root,'node_modules/esbuild/package.json',{version:builder.version,main:'lib/main.js'});
  write(root,'node_modules/.package-lock.json',{packages:{'node_modules/esbuild':builder}});
  mkdirSync(path.join(root,'node_modules/esbuild/lib'),{recursive:true});
  writeFileSync(path.join(root,'node_modules/esbuild/lib/main.js'),'throw Error("untrusted builder executed");');
  assert.throws(()=>verifiedBuilder(path.join(root,'package.json'),{esbuild:builder,native:{}}),/entry bytes differ/);
});
