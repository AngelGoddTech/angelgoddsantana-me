# Website consent preparation — 2026-10-06

This is an unpublished candidate. No provider script or `elevenlabs-convai` element is loaded by the new loaders. All adapter/capture verification gates are false, so neither text nor voice can begin. Existing site headers and privacy paragraphs are unchanged.

## Owner requirements implemented offline

A fresh affirmative choice is required before each new session. Text is the default; language or mode changes invalidate pending consent. Decline, close, Escape, and a 30-second silence timeout never grant consent. The localized timeout says that no response or agreement was received and the conversation is ending. No provider/TTS session is started to say it.

The six complete UI localizations are English, Spanish, French, Mandarin Chinese, Korean, and Hindi. Text notice describes a saved transcript and explicitly says no microphone/audio recording; the distinct voice notice describes audio recording only when its verification gate is true. The currently unverified production candidate displays unavailability instead of a capture claim.

The offline controller records only consent version, timestamp, source, mode, and language in memory. Nothing is persisted in cookies/localStorage, and consent does not carry across sessions. Pending-start/close races terminate the obsolete connection before another agreement can start a session. Disconnect failures keep the gate closed. A fixed refusal is available outside the model after a terminal guardrail event. No guardrail cause is guessed from the type-only event, and no criminal label is applied to a visitor. A review flag is claimed only after an exact matching persisted receipt is supplied by a future trusted adapter; there is no new public endpoint or bearer credential in these loaders. Callback chaining preserves existing callbacks and runs safety cleanup even if one throws.

## Exact pinned widget constraint

The approved widget remains pinned to `@elevenlabs/convai-widget-embed@0.18.3`, SRI `sha384-BpmvKCW/TFrpO8oObmUgZzUCIMHI00QbpGA4/jfXcfTosbgtuEUN1wYT7nNIsV3v`. The downloaded published JavaScript is 1,532,798 bytes, SHA-256 `428f4ee85bcfa5159f08f276b283b868008a4b14e8eb31690b73e6ef3486fb50`; npm package integrity and unpkg byte equality were independently verified.

The source commit from public npm provenance is `4e2c7b76093989da202162e3ac7f74e9d6069926` in ElevenLabs' official packages repository:

- [Call event source](https://github.com/elevenlabs/packages/blob/4e2c7b76093989da202162e3ac7f74e9d6069926/packages/convai-widget-core/src/contexts/conversation.tsx#L1033): `elevenlabs-convai:call` is not cancelable; dispatch result is ignored, and exceptions fall back to the original configuration before `startSession`. `preventDefault()` cannot enforce consent.
- [Terms source](https://github.com/elevenlabs/packages/blob/4e2c7b76093989da202162e3ac7f74e9d6069926/packages/convai-widget-core/src/contexts/terms.tsx#L27): agreement is reused in memory and optionally localStorage. Disconnect does not reset it; removing a persistence key does not fix reuse in the mounted element.
- [Lifecycle source](https://github.com/elevenlabs/packages/blob/4e2c7b76093989da202162e3ac7f74e9d6069926/packages/convai-widget-core/src/contexts/conversation.tsx#L598): widget overwrites supplied `onDisconnect`, `onStatusChange`, `onMessage`, and `onDebug`; `onConnect`, `onConversationCreated`, and `onGuardrailTriggered` survive.
- [Text session source](https://github.com/elevenlabs/packages/blob/4e2c7b76093989da202162e3ac7f74e9d6069926/packages/client/src/TextConversation.ts#L35): `onConversationCreated` runs after transport creation, so it cannot supply pre-consent gating.
- [Guardrail event documentation](https://elevenlabs.io/docs/eleven-agents/customization/events/client-events#guardrail_triggered): append `guardrail_triggered` to existing agent client events; event has no cause and signifies terminal guardrail handling.

A verified runtime/capture setup is required to enable actual conversations; the owner subsequently authorized the controlled SDK adapter documented below. No unsupported shadow-DOM interception, polling, or silent widget-version change was used; the SDK replacement has explicit owner authorization. Widget integration, actual recording/capture, language behavior, durable flag storage, and live browser/provider tests remain unverified. This candidate does not fulfill website go-live by itself.

## Local checks

`node tests/consent_gate_checks.mjs` uses fake clocks and fake adapters only. The websites repository covers both corporate and government loaders (208 assertions); the personal repository covers its loader (104 assertions). Assertions exercise every fail-closed prerequisite, consent timeout, decline/close/reset, repeated clicks, all languages, fresh voice consent, pending-start/close races, guardrail refusal, exact persisted-review receipts, and callback preservation. No provider conversation or microphone request is made.

Independent review found and resolved three draft issues before handoff: shared asynchronous shutdown promises now block every restart until real completion; late terminal events retain their own captured conversation ID for a deduplicated review request without modifying a newer session; the localized warning says the conversation is ending until shutdown resolves, and failed shutdown stays unavailable. Offline deferred-resolution/rejection and late-event assertions cover these fixes.

General close, decline, and reset during an already accepted or pending session also display the localized ending state until actual shutdown completes; they do not falsely say that consent was never given. The final regression verification is 295 website tests with two existing FlaskLimiter warnings, personal lint with zero errors/six existing Fast Refresh warnings, personal Vite build, and 312 fake-adapter consent assertions.


## Owner-authorized controlled SDK adapter

After the widget constraint was reported, the owner authorized the smallest supported SDK adapter. It is now implemented; actual runtime/capture verification flags remain false. No resources, authentication grants, package installations, browser/provider sessions, or deployment occurred.

Exact official package: `@elevenlabs/client@1.27.0`; browser global `ElevenLabsClient.Conversation`; classic script `https://unpkg.com/@elevenlabs/client@1.27.0/dist/lib.iife.js`. Artifact: 1,096,070 bytes; SHA-256 `f69a845935c3788ea46a73b09ead74640dfba5be135f225eac719df3a320c9cd`; SRI `sha384-ekuWfdL0BkeVAWv24yeCWtzVwYDQd4pCkPL5TKVDLmwDBeVxS2cTwo0wfsUNaFkJ`. npm tarball SHA-512 integrity and unpkg byte equality were verified. Loading is lazy after affirmative consent, cached, anonymous with SRI, and bounded by a 15-second code-load timeout. Before agreement no SDK/provider script is loaded.

Supported API: `Conversation.startSession({agentId, textOnly, connectionType: 'websocket', ...callbacks})`, `endSession`, `isOpen`, `sendUserMessage`; callbacks `onConnect`, `onDisconnect`, `onMessage`, `onError`, `onConversationCreated`, `onGuardrailTriggered`. Existing callbacks are chained. No prompt/first-message/LLM/voice/language override, bearer/API key, signed URL, tool mock, or invented user identity is sent. Provider language detection stays inherited; the notice language is local.

The local launcher/consent dialog now has plain-text transcript, send and end controls. Sending cannot start a connection; it requires an accepted active text session. Successfully sent text gets its own local user turn; duplicate server user echoes are suppressed in text mode. `textContent` renders messages, bounded to 50 entries and cleared for a new session; website code does not log/persist messages. Guardrail handling explicitly ends the SDK session and shows the generic fixed fallback; no cause or durable flag is fabricated.

Consent is rechecked after code loading, so withdrawal during loading creates no provider session. For a stale SDK startup, the adapter synchronously throws in `onConversationCreated`; the supported SDK catch awaits cleanup before marking connected. **There is no public AbortSignal/start-cancellation option.** Voice startup can already acquire microphone after consent before a handle is available. An already pending handshake cannot be promised to cancel immediately; restart stays blocked until startup/cleanup settles. Initial metadata carries ID/audio formats, not recording or durable transcript-storage acknowledgement. Capture gates stay false until separately verified evidence supports them.

Primary evidence: [official package metadata](https://registry.npmjs.org/@elevenlabs%2fclient/1.27.0), [official SDK documentation](https://elevenlabs.io/docs/eleven-agents/libraries/java-script), and verified package `dist/index.d.ts`, `dist/BaseConversation.d.ts`, `dist/types.d.ts`, `dist/platform/web/index.js`, `dist/utils/WebSocketConnection.js`.

Source-derived host candidates, not an actual browser trace or CSP approval: SDK script `https://unpkg.com`; transport `wss://api.elevenlabs.io`; voice sample-rate worklet `https://cdn.jsdelivr.net/npm/@alexanderolsen/libsamplerate-js@2.1.2/dist/libsamplerate.worklet.js`; generated audio worklets `blob:` with SDK `data:` fallback. Text needs no microphone/worklets; explicit WebSocket mode does not request RTC/LiveKit. Existing site headers remain unchanged. Root must collect actual trace/violations before narrowly changing headers. No unsafe-eval/new Function use was found in the selected artifact.

Offline SDK-contract checks: 124 assertions for corporate/government plus 62 personal. With 312 consent checks, **498 offline assertions pass**, with zero real provider sessions/microphone requests. These cover lazy loading, consent withdrawal, stale creation cleanup, exact pinned SRI, callback preservation, active-session-only text send and visible user turn, fresh voice agreement, explicit guardrail termination and default verification gates OFF. Mocks do not prove actual recording, runtime model, server persistence or browser behavior. Durable review acknowledgement is not wired to a public endpoint; backend corroboration/persistence remains an activation prerequisite.

The adapter accepts only official function-valued callback names, including the documented onConversationCreated lifecycle hook. Credential/configuration/nonfunction keys are rejected in both optional and per-session callback bags. Fixed agent ID, textOnly and WebSocket transport are assigned last. Offline deny-bag cases ensure callback composition cannot retarget the protected phone, enable voice from text, set RTC, inject a prompt, or pass authorization.
