// Direct single-use provider access after affirmative agreement. No API key, relay,
// automatic credential retry or local credential persistence. Consent UI remains unchanged.
(() => {
    'use strict';
    function createDirectSession({agentId, source, loadSdk, noticeDigests}) {
        const prepared = new Set();
        let blocked = false;
        return Object.freeze({
            async prepare(mode) {
                if (blocked || !['text', 'voice'].includes(mode)) throw new Error('assistant_unavailable');
                prepared.add(mode);
            },
            isReady: mode => !blocked && prepared.has(mode),
            clear: () => prepared.clear(),
            async startSession(request) {
                const mode = request.textOnly ? 'text' : 'voice';
                if (blocked || typeof request.textOnly !== 'boolean' || !prepared.has(mode) || request.consent?.mode !== mode ||
                    request.consent?.source !== source || typeof request.isCurrent !== 'function')
                    throw new Error('assistant_consent_required');
                const sdk = await loadSdk(); // No provider script before agreement.
                if (typeof sdk?.Conversation?.startSession !== 'function') throw new Error('assistant_sdk_unavailable');
                if (!request.isCurrent()) return {isOpen: () => false, endSession: async () => {}};
                const sites = Object.freeze({'web-corporate': 'corporate', 'web-samgov': 'government', 'web-personal': 'personal'});
                const site = sites[source];
                if (!site || !/^[a-f0-9]{64}$/.test(noticeDigests?.[mode] || '')) throw new Error('assistant_unavailable');
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 15000);
                let access;
                try {
                    const response = await fetch('https://calldesk.agreeablemoss-8b616ba9.eastus2.azurecontainerapps.io/public/website/' + site + '/admission', {
                        method: 'POST', headers: {'Content-Type': 'application/json'}, mode: 'cors', credentials: 'omit',
                        cache: 'no-store', redirect: 'error', referrerPolicy: 'no-referrer', signal: controller.signal,
                        body: JSON.stringify({mode, notice_sha256: noticeDigests[mode], consent: true, authorization_id: crypto.randomUUID()})
                    });
                    if (!response.ok) throw new Error('assistant_unavailable');
                    const body = await response.text();
                    if (body.length > 16384) throw new Error('assistant_unavailable');
                    access = JSON.parse(body);
                    const keys = Object.keys(access).sort().join(',');
                    const issued = Date.parse(access.issued_at), expires = Date.parse(access.expires_at);
                    const url = new URL(access.signed_url);
                    if (keys !== 'expires_at,issued_at,mode,pause_window_seconds,signed_url,site'
                        || access.site !== site || access.mode !== mode || access.pause_window_seconds !== 900
                        || !Number.isFinite(issued) || !Number.isFinite(expires) || expires - issued !== 900000
                        || Date.now() >= expires || Math.abs(Date.now() - issued) > 60000
                        || !access.signed_url.startsWith('wss://api.elevenlabs.io/v1/convai/conversation?')
                        || url.hash || url.username || url.password || url.port || access.signed_url.includes('\\')
                        || url.searchParams.getAll('agent_id').length !== 1 || url.searchParams.get('agent_id') !== agentId
                        || url.searchParams.getAll('conversation_signature').length !== 1
                        || !/^[^\s]{32,4096}$/.test(url.searchParams.get('conversation_signature') || '')
                        || [...url.searchParams.keys()].some(key => !['agent_id', 'conversation_signature', 'conversation_id'].includes(key)))
                        throw new Error('assistant_unavailable');
                } catch { throw new Error('assistant_unavailable'); }
                finally { clearTimeout(timeout); }
                if (!request.isCurrent()) return {isOpen: () => false, endSession: async () => {}};
                let session, ended = false, connected = false, accepted = false, failed = false, close;
                let limit;
                const callbacks = request.callbacks || {};
                const endSession = () => {
                    if (close) return close;
                    ended = true; connected = false;
                    clearTimeout(limit);
                    close = Promise.resolve().then(() => session?.endSession()).catch(error => {
                        blocked = true;
                        throw error;
                    });
                    return close;
                };
                const handle = Object.freeze({
                    isOpen: () => accepted && connected && !ended && request.isCurrent(),
                    endSession,
                    getInputVolume: () => !request.textOnly && handle.isOpen() ? session.getInputVolume?.() ?? 0 : 0,
                    getOutputVolume: () => !request.textOnly && handle.isOpen() ? session.getOutputVolume?.() ?? 0 : 0,
                    setMicMuted(muted) {
                        if (request.textOnly || !handle.isOpen() || typeof muted !== 'boolean' || typeof session.setMicMuted !== 'function')
                            throw new Error('assistant_microphone_unavailable');
                        session.setMicMuted(muted);
                    },
                    sendUserMessage(text) {
                        if (!request.textOnly || !handle.isOpen() || typeof text !== 'string' ||
                            !text.trim() || text.length > 2000) throw new Error('assistant_message_unavailable');
                        session.sendUserMessage(text);
                    }
                });
                try {
                    session = await sdk.Conversation.startSession({
                        signedUrl: access.signed_url, textOnly: request.textOnly, connectionType: 'websocket',
                        onConnect: () => {
                            connected = true;
                            if (accepted && !ended && request.isCurrent())
                                callbacks.onConnect?.({conversationId: session.getId()});
                        },
                        onDisconnect: detail => {
                            connected = false;
                            if (!accepted) failed = true;
                            clearTimeout(limit);
                            if (accepted && !ended) callbacks.onDisconnect?.(detail);
                        },
                        onModeChange: detail => {
                            if (!request.textOnly && !ended && request.isCurrent()) callbacks.onModeChange?.(detail);
                        },
                        onMessage: detail => {
                            if (!ended && request.isCurrent()) callbacks.onMessage?.(detail);
                        },
                        onError: detail => {
                            connected = false; failed = true;
                            callbacks.onError?.(detail);
                            if (accepted) endSession().catch(() => {});
                        },
                        onGuardrailTriggered: detail => {
                            callbacks.onGuardrailTriggered?.(detail);
                            endSession().catch(() => {});
                        }
                    });
                    if (failed) { await endSession(); throw new Error('assistant_connection_failed'); }
                    if (ended || !request.isCurrent()) { await session.endSession(); return handle; }
                    accepted = true;
                    callbacks.onConversationCreated?.(handle);
                    if (connected) callbacks.onConnect?.({conversationId: session.getId()});
                    limit = setTimeout(() => {
                        endSession().then(() => callbacks.onDisconnect?.({reason: 'session_limit'})).catch(() => callbacks.onError?.());
                    }, 420000);
                    return handle;
                } catch (error) {
                    if (session) await endSession();
                    throw error;
                }
            }
        });
    }
    globalThis.GoddTechDirectAssistant = Object.freeze({createDirectSession});
})();

export function createPersonalDirectSession() {
    let pending;
    const loadSdk = () => pending ||= new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/@elevenlabs/client@1.27.0/dist/lib.iife.js';
        script.integrity = 'sha384-ekuWfdL0BkeVAWv24yeCWtzVwYDQd4pCkPL5TKVDLmwDBeVxS2cTwo0wfsUNaFkJ';
        script.crossOrigin = 'anonymous';
        let done = false, timer;
        const finish = success => {
            if (done) return;
            done = true;
            clearTimeout(timer);
            if (success && typeof globalThis.ElevenLabsClient?.Conversation?.startSession === 'function')
                resolve(globalThis.ElevenLabsClient);
            else reject(new Error('assistant_sdk_unavailable'));
        };
        script.async = true;
        script.onload = () => finish(true);
        script.onerror = () => finish(false);
        timer = setTimeout(() => finish(false), 15000);
        document.head.appendChild(script);
    });
    return globalThis.GoddTechDirectAssistant.createDirectSession({
        agentId: 'agent_5001m475t8mre208r993d3ernz84', source: 'web-personal', noticeDigests: {"text": "16b5fe4ce109c0c05c5fec8a7734958a0f58738663e06fbf59bda23cf3feb848", "voice": "c02d7afbfdcff5d2747007283fc22b5d0adc2b331ea18d4d3ed6affec98dbef7"}, loadSdk
    });
}
