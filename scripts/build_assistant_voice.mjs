import {createRequire} from 'node:module';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import fs from 'node:fs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
// Reuse the approved preview's pinned dependencies; never install implicitly.
const runtime=process.env.ASSISTANT_ORB_RUNTIME;
if(!runtime)throw Error('Set ASSISTANT_ORB_RUNTIME to the existing approved Orb runtime directory.');
const require=createRequire(path.join(runtime,'package.json'));
const buildRequire=createRequire(process.env.ASSISTANT_ESBUILD_PACKAGE);
const {build}=createRequire(buildRequire.resolve('vite'))('esbuild');
const corporate=fs.existsSync(path.join(root,'src/static'));
const out=path.join(root,corporate?'src/static/js/assistant-voice.js':'public/assistant-voice.js');
await build({entryPoints:[path.join(root,'ui/voice/VoicePresentation.jsx')],bundle:true,minify:true,format:'iife',platform:'browser',jsx:'automatic',nodePaths:[path.join(runtime,'node_modules')],alias:{react:path.join(runtime,'node_modules/react'),'react-dom':path.join(runtime,'node_modules/react-dom'),three:path.join(runtime,'node_modules/three')},outfile:out,define:{'process.env.NODE_ENV':'"production"'},logLevel:'warning'});
fs.copyFileSync(path.join(root,'ui/voice/LICENSE.md'),path.join(path.dirname(out),'assistant-voice-LICENSE.txt'));
if(corporate){fs.copyFileSync(path.join(root,'ui/voice/LICENSE.md'),path.join(root,'sites/samgov/assistant-voice-LICENSE.txt'));fs.copyFileSync(out,path.join(root,'sites/samgov/assistant-voice.js'));fs.copyFileSync(out.replace(/\.js$/,'.css'),path.join(root,'sites/samgov/assistant-voice.css'));}
console.log('Built local official Orb assets; no provider connection.');
