(() => {
    'use strict';
    const opaque = value => typeof value === 'string' && /^[A-Za-z0-9_-]{43}$/.test(value);
    const cid = value => typeof value === 'string' && /^conv_[A-Za-z0-9_-]{1,123}$/.test(value);
    const keys = (body, fields) => body && typeof body === 'object' && !Array.isArray(body)
        && Object.keys(body).sort().join(',') === [...fields].sort().join(',');
    const noticeFields = ['source', 'mode', 'language', 'policyVersion', 'noticeVersion', 'noticeSha256'];
    const callbackNames = new Set(['onConnect', 'onDisconnect', 'onError', 'onMessage', 'onAudio', 'onModeChange',
        'onStatusChange', 'onCanSendFeedbackChange', 'onUnhandledClientToolCall', 'onVadScore', 'onMCPToolCall',
        'onMCPConnectionStatus', 'onAgentToolRequest', 'onAgentToolResponse', 'onConversationMetadata',
        'onAsrInitiationMetadata', 'onInterruption', 'onAgentResponseCorrection', 'onAgentChatResponsePart',
        'onAgentReasoningResponsePart', 'onRichContent', 'onGuardrailTriggered', 'onAudioAlignment', 'onAgentTyping',
        'onExternalAgentConnected', 'onExternalAgentDisconnected', 'onPing', 'onContextUsage', 'onDebug',
        'onIncomingEvent', 'onOutgoingEvent', 'onConversationCreated']);
    const inactive = () => Object.freeze({isOpen: () => false, endSession: async () => {}});

    function createServerSdkBridge(options) {
        const now = options.now || Date.now;
        const fetchImpl = options.fetchImpl || globalThis.fetch;
        const readiness = new Set();
        const grants = new Map(); // One-use state lives in this closure only.
        let disconnectFailed = false;
        const base = options.source === 'web-samgov' ? 'https://goddtechnologies.com/api/government-assistant' : '/api/assistant';
        const notice = mode => {
            if (!['web-corporate', 'web-samgov', 'web-personal'].includes(options.source)
                || !['text', 'voice'].includes(mode)) throw new Error('assistant_notice_mismatch');
            const hash = typeof options.noticeSha256 === 'string' ? options.noticeSha256 : options.noticeSha256?.[mode];
            if (typeof hash !== 'string' || !/^[a-f0-9]{64}$/.test(hash)) throw new Error('assistant_notice_mismatch');
            return Object.freeze({source: options.source, mode, language: 'en', policyVersion: options.policyVersion,
                noticeVersion: options.noticeVersion, noticeSha256: hash});
        };
        const sameNotice = (body, expected) => noticeFields.every(field => body?.[field] === expected[field]);
        async function request(path, body, csrf) {
            const controller = new AbortController();
            const timer = globalThis.setTimeout(() => controller.abort(), 12000);
            try {
                const response = await fetchImpl(path, {method: body === null ? 'GET' : 'POST',
                    credentials: options.source === 'web-samgov' ? 'include' : 'same-origin', cache: 'no-store', redirect: 'error', signal: controller.signal,
                    headers: {Accept: 'application/json', ...(body === null ? {} : {'Content-Type': 'application/json'}),
                        ...(csrf ? {'X-CSRF-Token': csrf} : {})}, ...(body === null ? {} : {body: JSON.stringify(body)})});
                if (!response.ok || response.headers.get('content-type')?.split(';')[0] !== 'application/json')
                    throw new Error('assistant_bridge_unavailable');
                const raw = await response.text();
                if (raw.length > 8192) throw new Error('assistant_bridge_unavailable');
                return JSON.parse(raw);
            } catch { throw new Error('assistant_bridge_unavailable'); }
            finally { globalThis.clearTimeout(timer); }
        }
        async function prepare(mode) {
            readiness.delete(mode);
            if (disconnectFailed) throw new Error('assistant_disconnect_unavailable');
            const expected = notice(mode);
            const body = await request(`${base}/readiness?mode=${mode}&language=en`, null);
            if (!keys(body, [...noticeFields, 'ready', 'code']) || !sameNotice(body, expected) || body.ready !== true)
                throw new Error('assistant_readiness_unavailable');
            readiness.add(mode);
            return body;
        }
        async function authorizeConsent(value) {
            const expected = notice(value?.mode);
            if (!keys(value, noticeFields) || !sameNotice(value, expected)) throw new Error('assistant_notice_mismatch');
            await prepare(expected.mode);
            const challenge = await request(`${base}/challenge`, {mode: expected.mode, language: 'en'});
            if (!keys(challenge, [...noticeFields, 'code', 'csrfToken']) || challenge.code !== 'challenge'
                || !sameNotice(challenge, expected) || !opaque(challenge.csrfToken)) throw new Error('assistant_challenge_unavailable');
            const grant = await request(`${base}/consent`, expected, challenge.csrfToken);
            const expires = Date.parse(grant?.expiresAt);
            if (!keys(grant, [...noticeFields, 'code', 'authorization', 'expiresAt']) || grant.code !== 'authorized'
                || !sameNotice(grant, expected) || !opaque(grant.authorization) || !Number.isFinite(expires)
                || expires <= now() || expires > now() + 300000) throw new Error('assistant_authorization_unavailable');
            // Discard old grants; switching mode or declining never reuses one.
            for (const [key, value] of grants) if (value.expires <= now()) grants.delete(key);
            if (grants.size >= 8) { grants.clear(); throw new Error('assistant_authorization_unavailable'); }
            grants.set(grant.authorization, {notice: expected, csrf: challenge.csrfToken, expires});
            return Object.freeze({...grant, status: 'authorized'});
        }
        async function startAuthorizedSession(value) {
            const grant = grants.get(value?.authorization);
            grants.delete(value?.authorization); // Consume locally before any await; never retry a spent request.
            if (!grant || grant.expires <= now() || typeof value.textOnly !== 'boolean'
                || grant.notice.mode !== (value.textOnly ? 'text' : 'voice') || typeof value.isCurrent !== 'function')
                throw new Error('assistant_authorization_unavailable');
            for (const [name, callback] of Object.entries(value.callbacks || {})) {
                if (!callbackNames.has(name) || typeof callback !== 'function') throw new Error('assistant_callback_unavailable');
            }
            if (!value.isCurrent()) return inactive();
            const body = await request(`${base}/session?mode=${grant.notice.mode}&language=en`,
                {authorization: value.authorization}, grant.csrf);
            if (!value.isCurrent()) return inactive();
            if (!keys(body, ['code', 'conversationToken', 'conversationId', 'mode', 'connectionType'])
                || body.code !== 'authorized' || body.mode !== grant.notice.mode || body.connectionType !== 'webrtc'
                || !cid(body.conversationId) || typeof body.conversationToken !== 'string'
                || body.conversationToken.length < 32 || body.conversationToken.length > 4096
                || !/^[\x21-\x7e]+$/.test(body.conversationToken)) throw new Error('assistant_provider_binding_unavailable');
            if (typeof options.loadSdk !== 'function') throw new Error('assistant_sdk_unavailable');
            const sdk = await options.loadSdk(); // No provider code loads until durable consent/ID binding succeeds.
            if (!value.isCurrent() || grant.expires <= now()) return inactive();
            if (typeof sdk?.Conversation?.startSession !== 'function') throw new Error('assistant_sdk_unavailable');
            let connected = false, accepted = false, ended = false, failed = false, sdkSession;
            let closePromise;
            const endSession = () => {
                ended = true;
                if (!closePromise) closePromise = Promise.resolve().then(() => sdkSession?.endSession()).catch(() => {
                    disconnectFailed = true; grants.clear(); readiness.clear();
                    throw new Error('assistant_disconnect_unavailable');
                });
                return closePromise;
            };
            const callbacks = {};
            for (const [name, callback] of Object.entries(value.callbacks || {})) {
                if (name === 'onConversationCreated' || typeof callback !== 'function') continue;
                callbacks[name] = (...args) => { if (accepted && !ended && value.isCurrent()) callback(...args); };
            }
            callbacks.onConnect = detail => {
                if (detail?.conversationId && detail.conversationId !== body.conversationId) {
                    failed = true; connected = false;
                    if (accepted && !ended) { value.callbacks?.onError?.(); endSession().catch(() => {}); }
                    return;
                }
                connected = true;
                if (accepted && !ended && value.isCurrent()) value.callbacks?.onConnect?.({conversationId: body.conversationId});
            };
            callbacks.onDisconnect = detail => {
                connected = false;
                if (accepted && !ended) value.callbacks?.onDisconnect?.(detail);
            };
            callbacks.onError = () => { failed = true; connected = false;
                if (accepted && !ended) { value.callbacks?.onError?.(); endSession().catch(() => {}); } };
            callbacks.onGuardrailTriggered = detail => {
                failed = true;
                if (accepted && !ended) { value.callbacks?.onGuardrailTriggered?.(detail); endSession().catch(() => {}); }
            };
            try {
                sdkSession = await sdk.Conversation.startSession({conversationToken: body.conversationToken,
                    connectionType: 'webrtc', textOnly: value.textOnly, ...callbacks});
                // Confirm the connected SDK room ID equals the authenticated,
                // durably bound token endpoint ID. No browser ID is evidence.
                if (failed || !value.isCurrent() || grant.expires <= now()
                    || typeof sdkSession?.endSession !== 'function' || typeof sdkSession?.getId !== 'function'
                    || sdkSession.getId() !== body.conversationId) {
                    await endSession();
                    if (!value.isCurrent()) return inactive();
                    throw new Error('assistant_provider_binding_unavailable');
                }
                const handle = Object.freeze({endSession, isOpen: () => accepted && connected && !ended && value.isCurrent(),
                    sendUserMessage(text) {
                        if (!value.textOnly || !accepted || !connected || ended || !value.isCurrent()
                            || typeof text !== 'string' || !text.trim() || text.length > 2000
                            || typeof sdkSession.sendUserMessage !== 'function') throw new Error('assistant_message_unavailable');
                        sdkSession.sendUserMessage(text);
                    }});
                accepted = true;
                value.callbacks?.onConversationCreated?.(handle);
                if (connected) value.callbacks?.onConnect?.({conversationId: body.conversationId});
                return handle;
            } catch {
                if (sdkSession && !ended) await endSession();
                throw new Error('assistant_session_unavailable');
            }
        }
        return Object.freeze({prepare, isReady: mode => readiness.has(mode), authorizeConsent, startAuthorizedSession,
            clear: () => {grants.clear(); readiness.clear();}});
    }
    globalThis.GoddTechAssistantSession = Object.freeze({createServerSdkBridge});
})();

export const createServerSdkBridge = globalThis.GoddTechAssistantSession.createServerSdkBridge;

export function createPersonalAssistantBridge(notice, noticeSha256) {
    let pending;
    const loadSdk = () => {
        if (pending) return pending;
        pending = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            let timer;
            const finish = success => {
                globalThis.clearTimeout(timer);
                if (success && typeof globalThis.ElevenLabsClient?.Conversation?.startSession === 'function')
                    resolve(globalThis.ElevenLabsClient);
                else reject(new Error('assistant_sdk_unavailable'));
            };
            script.src = 'https://unpkg.com/@elevenlabs/client@1.27.0/dist/lib.iife.js';
            script.integrity = 'sha384-ekuWfdL0BkeVAWv24yeCWtzVwYDQd4pCkPL5TKVDLmwDBeVxS2cTwo0wfsUNaFkJ';
            script.crossOrigin = 'anonymous';
            script.async = true;
            script.onload = () => finish(true);
            script.onerror = () => finish(false);
            timer = globalThis.setTimeout(() => finish(false), 15000);
            document.head.appendChild(script);
        });
        return pending;
    };
    return createServerSdkBridge({source: 'web-personal', policyVersion: notice.policyVersion,
        noticeVersion: notice.noticeVersion, noticeSha256, loadSdk});
}
