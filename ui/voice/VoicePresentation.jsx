import React,{useEffect} from 'react';
import {createRoot} from 'react-dom/client';
import {Orb} from './Orb';
import './VoicePresentation.css';

function VoicePresentation({phase='awaiting',voiceMode='listening',muted=false,dark=false,getInputVolume=()=>0,getOutputVolume=()=>0,onMute,onEnd}){
  const active=phase==='active';
  const speaking=active&&voiceMode==='speaking';
  const state=active?(speaking?'talking':'listening'):phase==='connecting'?'thinking':null;
  useEffect(()=>{const previous=document.documentElement.classList.contains('dark');document.documentElement.classList.toggle('dark',dark);return()=>document.documentElement.classList.toggle('dark',previous);},[dark]);
  const heading=phase==='connecting'?'Opening your voice conversation':phase==='closing'?'Ending your conversation':active?(speaking?'Let’s talk it through.':'I’m listening.'):'A voice conversation, at your pace.';
  const status=active?(muted?'Your microphone is muted.':speaking?'The assistant is speaking.':'Speak when you are ready.'):'Review the voice notice and agree before connecting.';
  return <section className={'assistant-voice-presentation'+(dark?' is-dark':'')} aria-label="Voice conversation" data-voice-state={state||'idle'} data-volume-mode={active?'manual':'auto'}>
    <div className="voice-orb-stage"><div className="voice-orb-shell"><Orb className="official-orb" colors={['#2792dc','#9ce6e6']} seed={7421} agentState={state} volumeMode={active?'manual':'auto'} getInputVolume={getInputVolume} getOutputVolume={getOutputVolume}/></div><h3>{heading}</h3><p role="status">{status}</p></div>
    <div className="voice-call-controls"><button className="voice-mute" type="button" disabled={!active} aria-pressed={muted} onClick={()=>onMute?.(!muted)}><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3M8 22h8"/></svg>{muted?'Unmute microphone':'Mute microphone'}</button><button className="voice-end" type="button" disabled={!['connecting','active'].includes(phase)} onClick={onEnd}>End conversation</button></div>
  </section>;
}
globalThis.GoddTechVoicePresentation=Object.freeze({mount(element){const root=createRoot(element);return {update:props=>root.render(<VoicePresentation {...props}/>),destroy:()=>root.unmount()};}});
