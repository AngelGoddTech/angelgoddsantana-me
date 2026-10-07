import os
import hashlib
import json
from pathlib import Path
from flask import Flask, jsonify, request, send_from_directory
from assistant_bridge import AssistantBridge, BridgeReply, OPAQUE, read_json, request_cookie

# Path to built static files
DIST_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'dist')

app = Flask(__name__, static_folder=None)
app.config['MAX_CONTENT_LENGTH'] = 4096
app.config['ASSISTANT_BRIDGE_ENABLED'] = os.environ.get('ASSISTANT_BRIDGE_ENABLED') == '1'
app.config['ASSISTANT_HTTPS_INGRESS_ORIGIN'] = ('https://angelgoddsantana.me'
    if os.environ.get('ASSISTANT_HTTPS_INGRESS_ORIGIN') == 'https://angelgoddsantana.me' else None)

NOTICE_PATH = Path(__file__).resolve().parent / 'src/policy/assistant-notice.json'
NOTICE_BYTES = NOTICE_PATH.read_bytes()
NOTICE = json.loads(NOTICE_BYTES)
NOTICE_SHA256 = hashlib.sha256(NOTICE_BYTES).hexdigest()
ASSISTANT_HOST_SOURCE = {'angelgoddsantana.me': 'web-personal'}


def assistant_source():
    # Ignore forwarded-host claims until deployment proxy trust is reviewed.
    return ASSISTANT_HOST_SOURCE.get(request.host)


def assistant_bridge():
    return AssistantBridge(app.config.get('ASSISTANT_BRIDGE_ENABLED') is True,
                           app.config.get('ASSISTANT_BRIDGE_TRANSPORT'))


def assistant_notice(mode='text', language='en'):
    if mode not in ('text', 'voice') or language != NOTICE['language']:
        raise ValueError('unsupported notice')
    return dict(source='web-personal', mode=mode, language=language,
                policyVersion=NOTICE['policyVersion'], noticeVersion=NOTICE['noticeVersion'],
                noticeSha256=NOTICE_SHA256)


def assistant_reply(reply):
    response = jsonify(reply.body)
    if reply.cookie:
        response.headers.add('Set-Cookie', reply.cookie)
    return response, reply.status


def assistant_origin():
    secure = request.is_secure or app.config.get('ASSISTANT_HTTPS_INGRESS_ORIGIN') == 'https://' + request.host
    return (secure and request.headers.get('Origin') == 'https://' + request.host
            and request.headers.get('Sec-Fetch-Site', '') in ('', 'same-origin'))


def assistant_body():
    if request.content_length is not None and request.content_length > app.config['MAX_CONTENT_LENGTH']:
        from werkzeug.exceptions import RequestEntityTooLarge
        raise RequestEntityTooLarge()
    if request.mimetype != 'application/json' or request.content_length is None or request.content_length > 2048:
        raise ValueError('invalid body')
    data = read_json(request.get_data(cache=True))
    if not isinstance(data, dict):
        raise ValueError('invalid body')
    return data


@app.get('/api/assistant/readiness')
def assistant_readiness():
    """Report an unavailable bridge; no session or authorization is issued."""
    source = assistant_source()
    if source is None:
        return jsonify(code='unsupported_source_host'), 403
    if app.config['ASSISTANT_BRIDGE_ENABLED']:
        try:
            notice = assistant_notice(request.args.get('mode', 'text'), request.args.get('language', 'en'))
        except ValueError:
            return jsonify(code='unsupported_notice_scope'), 400
        reply = assistant_bridge().forward('readiness', request.host, notice,
                                          dict(mode=notice['mode'], language=notice['language']))
        if reply.status != 200:
            reply = BridgeReply(reply.status, {**reply.body, **notice, 'ready': False})
        return assistant_reply(reply)
    response = jsonify(
        ready=False, source=source, modes=['text', 'voice'],
        language=NOTICE['language'], policyVersion=NOTICE['policyVersion'],
        noticeVersion=NOTICE['noticeVersion'], noticeSha256=NOTICE_SHA256,
        code='consent_binding_bridge_unavailable', csrfToken=None,
    )
    response.headers['Cache-Control'] = 'no-store'
    return response


@app.post('/api/assistant/consent')
def assistant_consent():
    """Fail closed until a reviewed CSRF and provider-binding bridge exists.

    Origin and exact notice/mode validation cannot replace the unavailable
    server authorization. This route never creates consent evidence, a provider
    connection or a token; CSRF trust must be supplied by the real bridge.
    """
    source = assistant_source()
    if source is None:
        return jsonify(code='unsupported_source_host'), 403
    if not assistant_origin():
        return jsonify(code='invalid_origin'), 403
    if not request.is_json:
        return jsonify(code='invalid_consent_request'), 400
    try:
        payload = assistant_body()
    except (ValueError, UnicodeError):
        return jsonify(code='invalid_consent_request'), 400
    expected_fields = {'source', 'mode', 'language', 'policyVersion',
                       'noticeVersion', 'noticeSha256'}
    if not isinstance(payload, dict) or set(payload) != expected_fields:
        return jsonify(code='invalid_consent_request'), 400
    if (payload['source'] != source
            or payload['mode'] not in ('text', 'voice')
            or payload['language'] != NOTICE['language']
            or payload['policyVersion'] != NOTICE['policyVersion']
            or payload['noticeVersion'] != NOTICE['noticeVersion']
            or payload['noticeSha256'] != NOTICE_SHA256):
        return jsonify(code='consent_notice_mismatch'), 409
    if app.config['ASSISTANT_BRIDGE_ENABLED']:
        return assistant_reply(assistant_bridge().forward('consent', request.host,
            assistant_notice(payload['mode'], payload['language']), payload,
            request_cookie(request.headers.get('Cookie')), request.headers.get('X-CSRF-Token')))
    response = jsonify(code='consent_binding_bridge_unavailable')
    response.headers['Cache-Control'] = 'no-store'
    return response, 503


@app.post('/api/assistant/challenge')
def assistant_challenge():
    if assistant_source() is None or not assistant_origin():
        return jsonify(code='invalid_origin'), 403
    try:
        data = assistant_body()
        if set(data) != {'mode', 'language'}:
            raise ValueError('invalid fields')
        notice = assistant_notice(data['mode'], data['language'])
    except (ValueError, TypeError, UnicodeError):
        return jsonify(code='invalid_consent_request'), 400
    return assistant_reply(assistant_bridge().forward('challenge', request.host, notice, data))


@app.post('/api/assistant/session')
def assistant_session():
    if assistant_source() is None or not assistant_origin():
        return jsonify(code='invalid_origin'), 403
    try:
        data = assistant_body()
        if set(data) != {'authorization'} or not isinstance(data['authorization'], str) or not OPAQUE.fullmatch(data['authorization']):
            raise ValueError('invalid grant')
        notice = assistant_notice(request.args.get('mode', 'text'), request.args.get('language', 'en'))
    except (ValueError, TypeError, UnicodeError):
        return jsonify(code='invalid_consent_request'), 400
    return assistant_reply(assistant_bridge().forward('session', request.host, notice, data,
        request_cookie(request.headers.get('Cookie')), request.headers.get('X-CSRF-Token')))


@app.route('/favicon.ico')
def legacy_favicon():
    """Keep old browser requests on the new AGS icon rather than a stale icon."""
    return send_from_directory(DIST_DIR, 'favicon.svg')


@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_spa(path: str):
    """Serve build assets directly and hand all routes to the React app.

    Flask's built-in static route returns a 404 before an SPA fallback can run
    for a missing route. Disabling it above lets deep links such as /resume and
    /contact reload successfully while still serving files from dist/.
    """
    if path == 'api' or path.startswith('api/'):
        return jsonify(code='api_route_unavailable'), 404
    file_path = os.path.join(DIST_DIR, path)
    if path and os.path.isfile(file_path):
        return send_from_directory(DIST_DIR, path)
    return send_from_directory(DIST_DIR, 'index.html')


@app.after_request
def add_response_headers(response):
    """Set safe defaults for the brochure site without blocking Vite assets."""
    response.headers.setdefault('X-Content-Type-Options', 'nosniff')
    response.headers.setdefault('X-Frame-Options', 'DENY')
    response.headers.setdefault('Referrer-Policy', 'strict-origin-when-cross-origin')
    response.headers.setdefault('Permissions-Policy', 'camera=(), geolocation=(), microphone=()')
    if request.path == '/assistant' and app.config['ASSISTANT_BRIDGE_ENABLED']:
        response.headers['Permissions-Policy'] = 'camera=(), geolocation=(), microphone=(self)'
    if request.path == '/api' or request.path.startswith('/api/'):
        response.headers['Cache-Control'] = 'no-store'
    return response


if __name__ == '__main__':
    # For local testing only; Azure uses gunicorn via startup command
    port = int(os.environ.get('PORT', 8000))
    app.run(host='0.0.0.0', port=port)
