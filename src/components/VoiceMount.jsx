import {useEffect,useRef,useState} from 'react';
let pending;
function loadPresentation(){
  if(globalThis.GoddTechVoicePresentation)return Promise.resolve(globalThis.GoddTechVoicePresentation);
  return pending ||= new Promise((resolve,reject)=>{
    const css=document.createElement('link');css.rel='stylesheet';css.href=new URL('assistant-voice.css',document.baseURI).href;document.head.appendChild(css);
    const script=document.createElement('script');script.src=new URL('assistant-voice.js',document.baseURI).href;
    script.onload=()=>globalThis.GoddTechVoicePresentation?resolve(globalThis.GoddTechVoicePresentation):reject(Error('voice_presentation_unavailable'));
    script.onerror=()=>reject(Error('voice_presentation_unavailable'));document.head.appendChild(script);
  });
}
export default function VoiceMount(props){
  const element=useRef(null),view=useRef(null),latest=useRef(props);latest.current=props;
  const [loaded,setLoaded]=useState(false);
  useEffect(()=>{let owned=true;loadPresentation().then(api=>{if(!owned)return;view.current=api.mount(element.current);view.current.update(latest.current);setLoaded(true);}).catch(()=>{if(owned)element.current.textContent='Voice presentation is unavailable. You can end the conversation or contact Angel directly.';});return()=>{owned=false;view.current?.destroy();view.current=null;};},[]);
  useEffect(()=>{view.current?.update(props);});
  return <><div ref={element} className="assistant-voice-mount"/>{!loaded&&['connecting','active'].includes(props.phase)&&<button className="assistant-end" type="button" onClick={props.onEnd}>End conversation</button>}</>;
}
