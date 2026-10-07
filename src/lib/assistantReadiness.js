// A verified server bridge is a separate release requirement. A response alone
// cannot enable a client connection; this preparation includes no provider SDK.
export function matchesNotice(readiness, expected) {
  return readiness !== null && typeof readiness === 'object'
    && readiness.ready === false
    && readiness.source === expected.source
    && readiness.language === expected.language
    && readiness.policyVersion === expected.policyVersion
    && readiness.noticeVersion === expected.noticeVersion
    && readiness.noticeSha256 === expected.noticeSha256
    && Array.isArray(readiness.modes)
    && readiness.modes.length === 2
    && readiness.modes.includes('text') && readiness.modes.includes('voice')
    && readiness.code === 'consent_binding_bridge_unavailable';
}

export async function readAssistantReadiness(expected, { fetchImpl = fetch, signal } = {}) {
  const response = await fetchImpl('/api/assistant/readiness', {
    credentials: 'same-origin', cache: 'no-store', redirect: 'error', signal,
    headers: { Accept: 'application/json' },
  });
  if (!response.ok || response.headers.get('content-type')?.split(';')[0] !== 'application/json') {
    throw new Error('assistant_readiness_unavailable');
  }
  const readiness = await response.json();
  if (!matchesNotice(readiness, expected)) throw new Error('assistant_readiness_mismatch');
  return readiness;
}
