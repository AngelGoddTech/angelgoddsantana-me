import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';

const json=file=>JSON.parse(fs.readFileSync(file,'utf8'));
export function verifyRuntime(runtime,pinned){
  const installed=json(path.join(runtime,'node_modules/.package-lock.json')).packages;
  for(const [name,wanted] of Object.entries(pinned.packages)){
    if(!name)continue;
    const actual=installed[name];
    for(const field of ['version','resolved','integrity'])
      if(!wanted[field]||actual?.[field]!==wanted[field])throw Error(`Orb runtime ${name} ${field} differs from ui/voice/package-lock.json.`);
    if(json(path.join(runtime,name,'package.json')).version!==wanted.version)
      throw Error(`Orb runtime ${name} installed version differs from lock.`);
  }
}

function verifyIntegrity(packageRoot,name,pin){
  const modules=path.resolve(packageRoot,name.startsWith('@')?'../..':'..');
  const npmLock=path.join(modules,'.package-lock.json');
  const pnpmLock=path.resolve(modules,'../../lock.yaml');
  if(fs.existsSync(npmLock)){
    const installed=json(npmLock).packages['node_modules/'+name];
    if(installed?.version===pin.version&&installed?.integrity===pin.integrity)return;
  }
  if(fs.existsSync(pnpmLock)){
    const entry=`  ${name.startsWith('@')?"'"+name+'@'+pin.version+"'":name+'@'+pin.version}:\n    resolution: {integrity: ${pin.integrity}}`;
    if(fs.readFileSync(pnpmLock,'utf8').replaceAll('\r\n','\n').includes(entry))return;
  }
  throw Error(`Build package ${name} installed integrity metadata differs from ui/voice/build-lock.json.`);
}

export function verifiedBuilder(packageFile,pins){
  if(!packageFile)throw Error('Set ASSISTANT_ESBUILD_PACKAGE to an existing package.json with the pinned esbuild.');
  const supplied=createRequire(path.resolve(packageFile));
  let require;
  try{require=createRequire(supplied.resolve('esbuild/package.json'));}
  catch{require=createRequire(supplied.resolve('vite'));}
  const packageRoot=path.dirname(fs.realpathSync(require.resolve('esbuild/package.json')));
  if(json(path.join(packageRoot,'package.json')).version!==pins.esbuild.version)throw Error('esbuild version differs from build lock.');
  verifyIntegrity(packageRoot,'esbuild',pins.esbuild);
  const main=require.resolve('esbuild');
  if(createHash('sha256').update(fs.readFileSync(main)).digest('hex')!==pins.esbuild.main_sha256)throw Error('esbuild entry bytes differ from build lock.');
  const nativeName=`@esbuild/${process.platform}-${process.arch}`;
  const nativePin=pins.native[nativeName];
  if(!nativePin)throw Error('This esbuild platform is not in the build lock.');
  const nativeRoot=path.dirname(fs.realpathSync(require.resolve(nativeName+'/package.json')));
  if(json(path.join(nativeRoot,'package.json')).version!==nativePin.version)throw Error('Native esbuild version differs from build lock.');
  verifyIntegrity(nativeRoot,nativeName,nativePin);
  // Load executable build code only after checking versions, lock integrities and entry bytes.
  return require('esbuild');
}
