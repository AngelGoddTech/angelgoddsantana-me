// Public ElevenLabs agents; the API key stays on the server. Consent is local
// to this page and is not represented as a signed or durable server receipt.
(() => {
    'use strict';
    function createDirectSession({agentId, source, loadSdk}) {
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
                    sendUserMessage(text) {
                        if (!request.textOnly || !handle.isOpen() || typeof text !== 'string' ||
                            !text.trim() || text.length > 2000) throw new Error('assistant_message_unavailable');
                        session.sendUserMessage(text);
                    }
                });
                try {
                    session = await sdk.Conversation.startSession({
                        agentId, textOnly: request.textOnly, connectionType: 'websocket',
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
                    }, 600000);
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
        script.onload = () => resolve(globalThis.ElevenLabsClient);
        script.onerror = () => reject(new Error('assistant_sdk_unavailable'));
        document.head.appendChild(script);
    });
    return globalThis.GoddTechDirectAssistant.createDirectSession({
        agentId: 'agent_5001m475t8mre208r993d3ernz84', source: 'web-personal', loadSdk
    });
}
