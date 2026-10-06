(() => {
    'use strict';

    const AGENT_ID = 'agent_5001m475t8mre208r993d3ernz84';
    const SOURCE = 'web-personal';
    const WIDGET_SCRIPT = 'https://unpkg.com/@elevenlabs/convai-widget-embed@0.18.3/dist/index.js';
    const WIDGET_INTEGRITY = 'sha384-BpmvKCW/TFrpO8oObmUgZzUCIMHI00QbpGA4/jfXcfTosbgtuEUN1wYT7nNIsV3v';
    const SDK_SCRIPT = 'https://unpkg.com/@elevenlabs/client@1.27.0/dist/lib.iife.js';
    const SDK_INTEGRITY = 'sha384-ekuWfdL0BkeVAWv24yeCWtzVwYDQd4pCkPL5TKVDLmwDBeVxS2cTwo0wfsUNaFkJ';
    const NOTICE_VERSION = 'web-consent-2026-10-v1';
    const CONSENT_TIMEOUT_MS = 30000;
    const LANGUAGES = Object.freeze({en: 'English', es: 'Español', fr: 'Français', zh: '中文', ko: '한국어', hi: 'हिन्दी'});

    // The owner authorized SDK-controlled sessions because the widget cannot reset consent.
    // Actual capture/runtime evidence remains required; no provider code loads while OFF.
    const VERIFIED = Object.freeze({
        preSessionControl: false, textCapture: false, voiceRecording: false,
        guardrailEvents: false, disconnectControl: false
    });
    const COPY = Object.freeze({
        en: {
            launcher: 'AI assistant', heading: 'Before you start', language: 'Language', mode: 'Conversation mode',
            send: 'Send', end: 'End conversation', input: 'Your message', transcript: 'Conversation transcript', visitor: 'You', agent: 'Assistant',
            text: 'Text', voice: 'Voice', accept: 'Agree and start', decline: 'Decline', close: 'Close',
            textNotice: "This is an AI assistant, not a person. Your messages and the assistant’s replies will be saved as a transcript so Angel can follow up. Text mode does not use a microphone or record audio. Do you agree to start this text conversation?",
            voiceNotice: "This is an AI assistant using an AI-generated version of Angel Godd-Santana’s voice, not a person. If you agree, this voice conversation will be audio-recorded and transcribed so Angel can follow up. The microphone will only be requested after you agree. Do you agree to start?",
            unavailable: 'The assistant is currently unavailable. Please email support@goddtechnologies.com.',
            declined: 'You have not agreed, so no conversation will start.',
            timeout: 'Since you haven’t responded or agreed, I’m ending this conversation.',
            ending: 'I’m ending this conversation.',
            ended: 'This conversation has ended. A new conversation requires your agreement again.',
            refusing: 'I can’t continue this request. I’m ending this conversation.',
            refused: 'I can’t continue this request. This conversation has ended.',
            reviewPending: 'Review confirmation is pending.', reviewConfirmed: 'This conversation has been flagged for Angel to review.'
        },
        es: {
            launcher: 'Asistente de IA', heading: 'Antes de empezar', language: 'Idioma', mode: 'Modo de conversación',
            send: 'Enviar', end: 'Terminar conversación', input: 'Su mensaje', transcript: 'Transcripción de la conversación', visitor: 'Usted', agent: 'Asistente',
            text: 'Texto', voice: 'Voz', accept: 'Aceptar e iniciar', decline: 'No aceptar', close: 'Cerrar',
            textNotice: 'Este es un asistente de inteligencia artificial, no una persona. Sus mensajes y las respuestas del asistente se guardarán como una transcripción para que Angel pueda darle seguimiento. El modo de texto no usa el micrófono ni graba audio. ¿Acepta iniciar esta conversación de texto?',
            voiceNotice: 'Este es un asistente de inteligencia artificial que usa una versión de la voz de Angel Godd-Santana generada por IA, no una persona. Si acepta, esta conversación de voz se grabará en audio y se transcribirá para que Angel pueda darle seguimiento. El micrófono solo se solicitará después de que acepte. ¿Acepta iniciar?',
            unavailable: 'El asistente no está disponible en este momento. Escriba a support@goddtechnologies.com.',
            declined: 'No ha aceptado, por lo que no se iniciará ninguna conversación.',
            timeout: 'Como no ha respondido ni aceptado, estoy terminando esta conversación.',
            ending: 'Estoy terminando esta conversación.',
            ended: 'Esta conversación ha terminado. Para iniciar otra, deberá aceptar de nuevo.',
            refusing: 'No puedo continuar con esta solicitud. Estoy terminando esta conversación.',
            refused: 'No puedo continuar con esta solicitud. Esta conversación ha terminado.',
            reviewPending: 'La confirmación de revisión está pendiente.', reviewConfirmed: 'Esta conversación se ha marcado para que Angel la revise.'
        },
        fr: {
            launcher: 'Assistant IA', heading: 'Avant de commencer', language: 'Langue', mode: 'Mode de conversation',
            send: 'Envoyer', end: 'Terminer la conversation', input: 'Votre message', transcript: 'Transcription de la conversation', visitor: 'Vous', agent: 'Assistant',
            text: 'Texte', voice: 'Voix', accept: 'Accepter et commencer', decline: 'Refuser', close: 'Fermer',
            textNotice: 'Ceci est un assistant IA, pas une personne. Vos messages et les réponses de l’assistant seront conservés sous forme de transcription afin qu’Angel puisse vous répondre. Le mode texte n’utilise pas de microphone et n’enregistre pas d’audio. Acceptez-vous de commencer cette conversation écrite ?',
            voiceNotice: 'Ceci est un assistant IA qui utilise une version de la voix d’Angel Godd-Santana générée par IA, pas une personne. Si vous acceptez, cette conversation vocale sera enregistrée et transcrite afin qu’Angel puisse vous répondre. Le microphone ne sera demandé qu’après votre accord. Acceptez-vous de commencer ?',
            unavailable: 'L’assistant est actuellement indisponible. Écrivez à support@goddtechnologies.com.',
            declined: 'Vous n’avez pas donné votre accord ; aucune conversation ne commencera.',
            timeout: 'Comme vous n’avez pas répondu ni donné votre accord, je mets fin à cette conversation.',
            ending: 'Je mets fin à cette conversation.',
            ended: 'Cette conversation est terminée. Une nouvelle conversation nécessite à nouveau votre accord.',
            refusing: 'Je ne peux pas poursuivre cette demande. Je mets fin à cette conversation.',
            refused: 'Je ne peux pas poursuivre cette demande. Cette conversation est terminée.',
            reviewPending: 'La confirmation du signalement est en attente.', reviewConfirmed: 'Cette conversation a été signalée à Angel pour examen.'
        },
        zh: {
            launcher: 'AI 助手', heading: '开始之前', language: '语言', mode: '对话方式',
            send: '发送', end: '结束对话', input: '您的消息', transcript: '对话文字记录', visitor: '您', agent: '助手',
            text: '文字', voice: '语音', accept: '同意并开始', decline: '不同意', close: '关闭',
            textNotice: '这是人工智能助手，不是真人。您的消息和助手的回复将保存为文字记录，以便 Angel 后续回复。文字模式不使用麦克风，也不录制音频。您是否同意开始本次文字对话？',
            voiceNotice: '这是人工智能助手，使用由人工智能生成的 Angel Godd-Santana 声音，不是真人。如果您同意，本次语音对话将录音并转写为文字，以便 Angel 后续回复。只有在您同意后才会请求麦克风权限。您是否同意开始？',
            unavailable: '助手目前不可用。请发送邮件至 support@goddtechnologies.com。',
            declined: '您尚未同意，因此不会开始对话。',
            timeout: '由于您未回复或同意，我将结束本次对话。',
            ending: '我将结束本次对话。',
            ended: '本次对话已结束。开始新对话需要您再次同意。',
            refusing: '我无法继续处理此请求。我将结束本次对话。',
            refused: '我无法继续处理此请求。本次对话已结束。',
            reviewPending: '正在等待审核标记确认。', reviewConfirmed: '本次对话已标记，供 Angel 审核。'
        },
        ko: {
            launcher: 'AI 어시스턴트', heading: '시작하기 전에', language: '언어', mode: '대화 방식',
            send: '보내기', end: '대화 종료', input: '메시지', transcript: '대화 텍스트 기록', visitor: '사용자', agent: '어시스턴트',
            text: '텍스트', voice: '음성', accept: '동의하고 시작', decline: '동의하지 않음', close: '닫기',
            textNotice: '이것은 사람이 아닌 AI 어시스턴트입니다. Angel이 후속 답변을 할 수 있도록 메시지와 어시스턴트의 답변이 텍스트 기록으로 저장됩니다. 텍스트 모드에서는 마이크를 사용하거나 오디오를 녹음하지 않습니다. 이 텍스트 대화를 시작하는 데 동의하십니까?',
            voiceNotice: '이것은 사람이 아닌 AI 어시스턴트이며 AI가 생성한 Angel Godd-Santana의 목소리를 사용합니다. 동의하시면 Angel이 후속 답변을 할 수 있도록 이 음성 대화가 녹음되고 텍스트로 기록됩니다. 동의하신 후에만 마이크 권한을 요청합니다. 시작하는 데 동의하십니까?',
            unavailable: '현재 어시스턴트를 이용할 수 없습니다. support@goddtechnologies.com으로 이메일을 보내 주세요.',
            declined: '동의하지 않으셨으므로 대화가 시작되지 않습니다.',
            timeout: '응답하거나 동의하지 않으셨으므로 이 대화를 종료합니다.',
            ending: '이 대화를 종료하고 있습니다.',
            ended: '이 대화가 종료되었습니다. 새 대화를 시작하려면 다시 동의해야 합니다.',
            refusing: '이 요청을 계속 처리할 수 없습니다. 이 대화를 종료하고 있습니다.',
            refused: '이 요청을 계속 처리할 수 없습니다. 이 대화가 종료되었습니다.',
            reviewPending: '검토 표시 확인을 기다리는 중입니다.', reviewConfirmed: 'Angel이 검토할 수 있도록 이 대화에 표시가 되었습니다.'
        },
        hi: {
            launcher: 'AI सहायक', heading: 'शुरू करने से पहले', language: 'भाषा', mode: 'बातचीत का तरीका',
            send: 'भेजें', end: 'बातचीत समाप्त करें', input: 'आपका संदेश', transcript: 'बातचीत का लिखित रिकॉर्ड', visitor: 'आप', agent: 'सहायक',
            text: 'टेक्स्ट', voice: 'आवाज़', accept: 'सहमत होकर शुरू करें', decline: 'असहमत', close: 'बंद करें',
            textNotice: 'यह AI सहायक है, इंसान नहीं। आपके संदेश और सहायक के जवाब लिखित बातचीत के रूप में सहेजे जाएँगे, ताकि Angel बाद में जवाब दे सकें। टेक्स्ट मोड में माइक्रोफ़ोन का उपयोग या ऑडियो रिकॉर्डिंग नहीं होती। क्या आप यह टेक्स्ट बातचीत शुरू करने के लिए सहमत हैं?',
            voiceNotice: 'यह AI सहायक है, इंसान नहीं, और Angel Godd-Santana की AI द्वारा बनाई गई आवाज़ का उपयोग करता है। आपकी सहमति के बाद यह आवाज़ वाली बातचीत ऑडियो में रिकॉर्ड होगी और लिखित रूप में बदली जाएगी, ताकि Angel बाद में जवाब दे सकें। माइक्रोफ़ोन की अनुमति केवल आपकी सहमति के बाद माँगी जाएगी। क्या आप शुरू करने के लिए सहमत हैं?',
            unavailable: 'सहायक अभी उपलब्ध नहीं है। कृपया support@goddtechnologies.com पर ईमेल करें।',
            declined: 'आपने सहमति नहीं दी है, इसलिए बातचीत शुरू नहीं होगी।',
            timeout: 'आपने जवाब या सहमति नहीं दी है, इसलिए मैं यह बातचीत समाप्त कर रहा हूँ।',
            ending: 'मैं यह बातचीत समाप्त कर रहा हूँ।',
            ended: 'यह बातचीत समाप्त हो गई है। नई बातचीत के लिए आपकी सहमति फिर से आवश्यक है।',
            refusing: 'मैं इस अनुरोध को आगे नहीं बढ़ा सकता। मैं यह बातचीत समाप्त कर रहा हूँ।',
            refused: 'मैं इस अनुरोध को आगे नहीं बढ़ा सकता। यह बातचीत समाप्त हो गई है।',
            reviewPending: 'समीक्षा के चिह्न की पुष्टि बाकी है।', reviewConfirmed: 'यह बातचीत Angel की समीक्षा के लिए चिह्नित कर दी गई है।'
        }
    });

    const normalizeLanguage = value => {
        const code = String(value || 'en').toLowerCase().split('-')[0];
        return Object.hasOwn(COPY, code) ? code : 'en';
    };

    function chainCallbacks(existing = {}, additions = {}) {
        const result = {...existing};
        for (const [name, callback] of Object.entries(additions)) {
            if (typeof callback !== 'function') continue;
            const previous = result[name];
            result[name] = (...args) => { try { if (typeof previous === 'function') previous(...args); } finally { callback(...args); } };
        }
        return result;
    }

    function createSdkLoader(page, scope, clock = {set: (fn, ms) => globalThis.setTimeout(fn, ms), clear: id => globalThis.clearTimeout(id)}) {
        let pending = null;
        return () => {
            if (pending) return pending;
            pending = new Promise((resolve, reject) => {
                const script = page.createElement('script');
                let done = false;
                let timer;
                const finish = success => {
                    if (done) return;
                    done = true;
                    clock.clear(timer);
                    if (success && typeof scope.ElevenLabsClient?.Conversation?.startSession === 'function') resolve(scope.ElevenLabsClient);
                    else reject(new Error('Assistant SDK is unavailable'));
                };
                script.src = SDK_SCRIPT;
                script.integrity = SDK_INTEGRITY;
                script.crossOrigin = 'anonymous';
                script.async = true;
                script.onload = () => finish(true);
                script.onerror = () => finish(false);
                timer = clock.set(() => finish(false), 15000);
                page.head.appendChild(script);
            });
            return pending;
        };
    }

    const SDK_CALLBACK_NAMES = new Set(["onConnect", "onDisconnect", "onError", "onMessage", "onAudio", "onModeChange", "onStatusChange", "onCanSendFeedbackChange", "onUnhandledClientToolCall", "onVadScore", "onMCPToolCall", "onMCPConnectionStatus", "onAgentToolRequest", "onAgentToolResponse", "onConversationMetadata", "onAsrInitiationMetadata", "onInterruption", "onAgentResponseCorrection", "onAgentChatResponsePart", "onAgentReasoningResponsePart", "onRichContent", "onGuardrailTriggered", "onAudioAlignment", "onAgentTyping", "onExternalAgentConnected", "onExternalAgentDisconnected", "onPing", "onContextUsage", "onDebug", "onIncomingEvent", "onOutgoingEvent", "onConversationCreated"]);
    function onlySdkCallbacks(bag = {}) {
        const safe = {};
        for (const [name, callback] of Object.entries(bag)) {
            if (!SDK_CALLBACK_NAMES.has(name) || typeof callback !== 'function') throw new Error('Unsupported SDK callback option');
            safe[name] = callback;
        }
        return safe;
    }

    function createSdkAdapter(options) {
        return Object.freeze({
            async startSession(request) {
                const inactive = {endSession: async () => {}, isOpen: () => false};
                const consent = request.consent;
                if (request.agentId !== AGENT_ID || typeof request.textOnly !== 'boolean' ||
                    consent?.version !== NOTICE_VERSION || consent.source !== SOURCE ||
                    consent.mode !== (request.textOnly ? 'text' : 'voice') || typeof request.isCurrent !== 'function') {
                    throw new Error('Affirmative session consent is required');
                }
                if (!request.isCurrent()) return inactive;
                const client = await options.loadClient();
                // Closing/declining while code loads never creates a provider session.
                if (!request.isCurrent()) return inactive;
                const callbacks = chainCallbacks(onlySdkCallbacks(options.callbacks), onlySdkCallbacks(request.callbacks));
                const fenced = chainCallbacks(callbacks, {
                    onConversationCreated() {
                        // The SDK catches this and awaits cleanup before publishing connected.
                        if (!request.isCurrent()) throw new Error('Conversation consent was withdrawn');
                    }
                });
                return client.Conversation.startSession({...fenced, agentId: AGENT_ID, textOnly: request.textOnly,
                    connectionType: 'websocket'});
            }
        });
    }

    function createConsentGate(options = {}) {
        const verified = {...VERIFIED, ...options.verified};
        const adapter = options.adapter;
        const clock = options.clock || {now: () => Date.now(), set: (fn, ms) => globalThis.setTimeout(fn, ms), clear: id => globalThis.clearTimeout(id)};
        const timeout = CONSENT_TIMEOUT_MS;
        let generation = 0;
        let timer = null;
        let session = null;
        let pendingStart = null;
        let stopping = false;
        let closePromise = Promise.resolve();
        const endedSessions = new WeakMap();
        const endOnce = async value => {
            if (!value || typeof value.endSession !== 'function') throw new TypeError('Missing disconnect control');
            if (!endedSessions.has(value)) endedSessions.set(value, Promise.resolve().then(() => value.endSession()));
            await endedSessions.get(value);
        };
        let state = {phase: 'closed', language: normalizeLanguage(options.language), mode: 'text', consent: null,
            conversationId: null, notice: null, reviewConfirmed: false};
        const publish = () => { options.onState?.({...state}); };
        const clearTimer = () => { if (timer !== null) clock.clear(timer); timer = null; };
        const ready = mode => !stopping && verified.preSessionControl === true && verified.guardrailEvents === true &&
            verified.disconnectControl === true && typeof adapter?.startSession === 'function' &&
            (mode === 'text' ? verified.textCapture === true : mode === 'voice' && verified.voiceRecording === true);
        function stop() {
            const current = session;
            const pending = pendingStart;
            session = null;
            pendingStart = null;
            if (!current && !pending) return closePromise;
            stopping = true;
            closePromise = Promise.all([closePromise, current ? endOnce(current) :
                Promise.resolve(pending).then(endOnce)]).then(() => { stopping = false; }).catch(() => {
                // A disconnect failure must never reopen the consent gate.
                stopping = true;
                state = {...state, phase: 'unavailable', notice: 'unavailable'};
                publish();
            });
            return closePromise;
        }
        function finish(notice, phase = 'closed') {
            clearTimer();
            generation += 1;
            const token = generation;
            const hadCaptureAttempt = Boolean(session || pendingStart || stopping);
            const closed = stop();
            state = {...state, phase: hadCaptureAttempt ? 'closing' : phase, consent: null,
                notice: hadCaptureAttempt ? 'ending' : notice};
            publish();
            if (hadCaptureAttempt) closed.then(() => {
                if (token !== generation || stopping) return;
                state = {...state, phase, notice: notice === 'declined' ? 'ended' : notice};
                publish();
            });
        }
        function request(mode = 'text', language = state.language) {
            if (!['text', 'voice'].includes(mode)) throw new TypeError('Unsupported conversation mode');
            clearTimer();
            generation += 1;
            stop();
            const token = generation;
            state = {phase: stopping ? 'closing' : ready(mode) ? 'awaiting' : 'unavailable', mode, language: normalizeLanguage(language),
                consent: null, conversationId: null, notice: ready(mode) ? null : 'unavailable', reviewConfirmed: false};
            const armTimeout = () => {
                if (state.phase !== 'awaiting') return;
                timer = clock.set(() => {
                if (token === generation && state.phase === 'awaiting') finish('timeout');
                }, timeout);
            };
            armTimeout();
            if (state.phase === 'closing') closePromise.then(() => {
                if (token !== generation) return;
                state = {...state, phase: ready(mode) ? 'awaiting' : 'unavailable', notice: ready(mode) ? null : 'unavailable'};
                armTimeout();
                publish();
            });
            publish();
            return state.phase === 'awaiting';
        }
        function accept() {
            if (state.phase !== 'awaiting' || !ready(state.mode)) return false;
            clearTimer();
            const token = generation;
            // Memory only: no cookie, localStorage, transcript, or invented durable receipt.
            const consent = Object.freeze({version: NOTICE_VERSION, timestamp: new Date(clock.now()).toISOString(),
                source: SOURCE, mode: state.mode, language: state.language});
            state = {...state, phase: 'connecting', consent, notice: null};
            publish();
            let guardrailSeen = false;
            let capturedConversationId = null;
            const callbacks = {
                onConnect: detail => {
                    capturedConversationId = typeof detail?.conversationId === 'string' ? detail.conversationId : null;
                    if (token !== generation || state.phase !== 'connecting') return;
                    const id = capturedConversationId;
                    state = {...state, phase: 'active', conversationId: id};
                    publish();
                },
                onDisconnect: () => {
                    if (token !== generation || stopping) return;
                    clearTimer();
                    session = null;
                    // Retain the token for a guardrail event delivered just after disconnect.
                    state = {...state, phase: 'closed', consent: null, notice: state.notice === 'refused' ? 'refused' : 'ended'};
                    publish();
                },
                onMessage: detail => {
                    if (token !== generation || !['connecting', 'active'].includes(state.phase) ||
                        !['user', 'agent'].includes(detail?.role) || typeof detail.message !== 'string' ||
                        (state.mode === 'text' && detail.role === 'user')) return;
                    options.onMessage?.({role: detail.role, message: detail.message.slice(0, 10000)});
                },
                onError: () => {
                    if (token === generation) finish('unavailable', 'unavailable');
                },
                onGuardrailTriggered: () => {
                    if (guardrailSeen) return;
                    guardrailSeen = true;
                    if (token === generation) {
                        clearTimer();
                        const closed = stop();
                        state = {...state, phase: 'closing', consent: null, notice: 'refusing', reviewConfirmed: false};
                        publish();
                        closed.then(() => {
                            if (token !== generation || stopping) return;
                            state = {...state, phase: 'closed', notice: 'refused'};
                            publish();
                        });
                    }
                    // A late event requests review for its own session; it never alters a newer UI.
                    // The type-only event cannot establish injection or accuse a visitor.
                    options.onReviewNeeded?.({conversationId: capturedConversationId, source: SOURCE, event: 'guardrail_triggered'});
                }
            };
            let started;
            try {
                started = adapter.startSession({agentId: AGENT_ID, textOnly: state.mode === 'text', callbacks, consent,
                    isCurrent: () => token === generation && ['connecting', 'active'].includes(state.phase) && state.consent === consent});
            } catch {
                if (token === generation) finish('unavailable', 'unavailable');
                return false;
            }
            pendingStart = Promise.resolve(started);
            pendingStart.then(value => {
                if (!value || typeof value.endSession !== 'function') throw new TypeError('Missing disconnect control');
                if (token !== generation || !['connecting', 'active'].includes(state.phase)) {
                    return endOnce(value);
                }
                session = value;
                pendingStart = null;
            }).catch(() => { if (token === generation) finish('unavailable', 'unavailable'); });
            return true;
        }
        return Object.freeze({
            request, accept, decline: () => finish('declined'), close: () => finish('declined'),
            reset: () => finish('ended'),
            confirmReview(receipt) {
                if (!['refusing', 'refused'].includes(state.notice) || !state.conversationId || receipt?.status !== 'persisted' ||
                    receipt.conversationId !== state.conversationId || receipt.source !== SOURCE) return false;
                state = {...state, reviewConfirmed: true};
                publish();
                return true;
            },
            snapshot: () => ({...state}), ready,
            send(text) {
                if (state.phase !== 'active' || state.mode !== 'text' || !session ||
                    typeof session.isOpen !== 'function' || !session.isOpen() ||
                    typeof session.sendUserMessage !== 'function' || typeof text !== 'string' || !text.trim() || text.length > 2000) return false;
                try { session.sendUserMessage(text); options.onMessage?.({role: 'user', message: text}); return true; }
                catch { finish('unavailable', 'unavailable'); return false; }
            },
            chainCallbacks
        });
    }

    const api = Object.freeze({createConsentGate, createSdkAdapter, createSdkLoader, chainCallbacks, COPY, LANGUAGES, VERIFIED, NOTICE_VERSION, CONSENT_TIMEOUT_MS,
        AGENT_ID, SOURCE, WIDGET_SCRIPT, WIDGET_INTEGRITY, SDK_SCRIPT, SDK_INTEGRITY});
    if (typeof document === 'undefined') { globalThis.GoddTechAssistantConsent = api; return; }
    // No new provider code or element is loaded before consent; the unverified adapter stays absent.
    if (document.querySelector('[data-goddtech-assistant-gate]') || document.querySelector('elevenlabs-convai')) return;
    const launcher = document.createElement('button');
    launcher.type = 'button';
    launcher.setAttribute('data-goddtech-assistant-gate', '');
    launcher.setAttribute('aria-haspopup', 'dialog');
    launcher.style.position = 'fixed';
    launcher.style.bottom = '20px';
    launcher.style.right = '20px';
    launcher.style.zIndex = '9999';
    const panel = document.createElement('dialog');
    panel.setAttribute('aria-labelledby', 'goddtech-assistant-heading');
    const heading = document.createElement('h2');
    heading.id = 'goddtech-assistant-heading';
    const languageLabel = document.createElement('label');
    const language = document.createElement('select');
    for (const [code, name] of Object.entries(LANGUAGES)) {
        const option = document.createElement('option');
        option.value = code;
        option.textContent = name;
        language.appendChild(option);
    }
    const modeLabel = document.createElement('label');
    const mode = document.createElement('select');
    for (const name of ['text', 'voice']) {
        const option = document.createElement('option');
        option.value = name;
        mode.appendChild(option);
    }
    const notice = document.createElement('p');
    const status = document.createElement('p');
    status.setAttribute('role', 'status');
    const transcript = document.createElement('ol');
    transcript.setAttribute('role', 'log');
    transcript.setAttribute('aria-live', 'polite');
    const composer = document.createElement('form');
    const input = document.createElement('textarea');
    input.maxLength = 2000;
    const send = document.createElement('button');
    send.type = 'submit';
    const end = document.createElement('button');
    end.type = 'button';
    composer.appendChild(input);
    composer.appendChild(send);
    composer.appendChild(end);
    const accept = document.createElement('button');
    const decline = document.createElement('button');
    const close = document.createElement('button');
    for (const button of [accept, decline, close]) button.type = 'button';
    languageLabel.appendChild(language);
    modeLabel.appendChild(mode);
    for (const node of [heading, languageLabel, modeLabel, notice, status, transcript, composer, accept, decline, close]) panel.appendChild(node);
    const initialLanguage = normalizeLanguage(document.documentElement.lang || navigator.language);
    const adapter = createSdkAdapter({loadClient: createSdkLoader(document, globalThis)});
    const gate = createConsentGate({language: initialLanguage, adapter, onState: render, onMessage: message => {
        const copy = COPY[gate.snapshot().language];
        const line = document.createElement('li');
        line.textContent = copy[message.role === 'user' ? 'visitor' : 'agent'] + ': ' + message.message;
        transcript.appendChild(line);
        while (transcript.children.length > 50) transcript.removeChild(transcript.firstChild);
    }});
    function render(state) {
        const copy = COPY[state.language];
        panel.lang = state.language;
        launcher.textContent = copy.launcher;
        heading.textContent = copy.heading;
        languageLabel.setAttribute('aria-label', copy.language);
        language.setAttribute('aria-label', copy.language);
        modeLabel.setAttribute('aria-label', copy.mode);
        mode.setAttribute('aria-label', copy.mode);
        language.value = state.language;
        mode.value = state.mode;
        for (const option of mode.children) option.textContent = copy[option.value];
        notice.textContent = gate.ready(state.mode) ? copy[state.mode + 'Notice'] : copy.unavailable;
        status.textContent = state.notice ? copy[state.notice] : '';
        if (['refusing', 'refused'].includes(state.notice)) status.textContent += ' ' + copy[state.reviewConfirmed ? 'reviewConfirmed' : 'reviewPending'];
        accept.textContent = copy.accept;
        decline.textContent = copy.decline;
        close.textContent = copy.close;
        accept.disabled = state.phase !== 'awaiting';
        composer.hidden = state.phase !== 'active';
        input.disabled = send.disabled = state.phase !== 'active' || state.mode !== 'text';
        input.setAttribute('aria-label', copy.input);
        input.placeholder = copy.input;
        send.textContent = copy.send;
        end.textContent = copy.end;
        end.disabled = !['connecting', 'active'].includes(state.phase);
        transcript.setAttribute('aria-label', copy.transcript);
        if (state.phase === 'awaiting') { transcript.replaceChildren(); input.value = ''; }
    }
    launcher.addEventListener('click', () => { gate.request('text', language.value || initialLanguage); if (!panel.open) panel.showModal(); });
    language.addEventListener('change', () => gate.request(mode.value, language.value));
    mode.addEventListener('change', () => gate.request(mode.value, language.value));
    composer.addEventListener('submit', event => { event.preventDefault(); if (gate.send(input.value)) input.value = ''; });
    end.addEventListener('click', () => gate.reset());
    accept.addEventListener('click', () => gate.accept());
    decline.addEventListener('click', () => gate.decline());
    close.addEventListener('click', () => { gate.close(); panel.close(); });
    panel.addEventListener('cancel', () => gate.close());
    panel.addEventListener('close', () => gate.close());
    globalThis.addEventListener?.('pagehide', () => gate.close());
    document.body.appendChild(launcher);
    document.body.appendChild(panel);
    render(gate.snapshot());
})();
