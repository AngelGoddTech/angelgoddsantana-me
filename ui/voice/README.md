# Approved official Orb integration

Angel approved all three voice widget designs October 12, 2026. The MIT-licensed Orb is pinned to ElevenLabs UI commit `23c31bd3088814215a8b5d0bfb56b327cad1a578`. `Orb.tsx` exactly matches the approved local component: the official Perlin texture is embedded; shader and animation logic are unchanged. License and upstream provenance are retained.

`VoicePresentation.jsx` renders the approved Orb colors, stage, status and controls using real session state. Active animation receives real adapter input/output levels in manual volume mode. Idle organic motion uses the official automatic mode. There is no simulation tour, fake call, or audio generation in application code. Consent and recording notices remain in the owning page. Mute calls the real SDK `setMicMuted`; end uses the existing session lifecycle.

The generated asset contains its own pinned React/Three runtime, so it can mount inside vanilla corporate/government pages or the personal React page without requiring a framework migration. The build aliases React, React DOM and Three to the same approved runtime to prevent duplicate hook runtimes. `package.json` and `package-lock.json` preserve that runtime's approved inputs; the build never installs implicitly.

Build with the already-preserved dependency runtime and existing esbuild:

```sh
ASSISTANT_ORB_RUNTIME=/Users/angelgodd-santana/Documents/Codex/2026-10-09/task/website-resume-20261012/voice/runtime ASSISTANT_ESBUILD_PACKAGE=/Users/angelgodd-santana/Documents/Codex/2026-10-09/task/launch-personal/package.json node scripts/build_assistant_voice.mjs
```

The current public contact routes remain held. Design approval does not authorize deployment or paid acceptance. Official API reference: https://elevenlabs.io/docs/eleven-agents/libraries/java-script
