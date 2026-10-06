const AGENT_ID = 'agent_5001m475t8mre208r993d3ernz84';
const EMBED_SCRIPT_URL = 'https://unpkg.com/@elevenlabs/convai-widget-embed@0.18.3/dist/index.js';

const widget = document.createElement('elevenlabs-convai');
widget.setAttribute('agent-id', AGENT_ID);
document.body.appendChild(widget);

const embedScript = document.createElement('script');
embedScript.src = EMBED_SCRIPT_URL;
embedScript.async = true;
document.body.appendChild(embedScript);
