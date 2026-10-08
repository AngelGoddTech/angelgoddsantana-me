"""Same-origin bridge to the existing CallDesk service; never a provider client.

Only reviewed site hosts may reach the fixed TLS origin. No deployment switch
can manufacture central readiness or an authorization. Secrets and tokens are
neither logged nor persisted here, and redirects are never followed.
"""
import hmac
import http.client
import json
import re
import ssl
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from http.cookies import SimpleCookie

CALLDESK_HOST = "calldesk.agreeablemoss-8b616ba9.eastus2.azurecontainerapps.io"
COOKIE_NAME = "__Host-CallDeskWebConsent"
OPAQUE = re.compile(r"^[A-Za-z0-9_-]{43}$")
CONVERSATION = re.compile(r"^conv_[A-Za-z0-9_-]{1,123}$")
PATHS = {
    "readiness": "/web-retention/consent-readiness",
    "challenge": "/web-retention/challenge",
    "consent": "/web-retention/consent",
    "session": "/web-retention/start",
}
NOTICE_FIELDS = frozenset({"source", "mode", "language", "policyVersion", "noticeVersion", "noticeSha256"})
HOST_SOURCES = {"goddtechnologies.com": "web-corporate", "samgov.goddtechnologies.com": "web-samgov",
                "angelgoddsantana.me": "web-personal"}
MAX_JSON_DEPTH = 16


def unique_object(pairs):
    value = {}
    for key, item in pairs:
        if key in value:
            raise ValueError("duplicate field")
        value[key] = item
    return value


def read_json(raw, maximum=2048):
    if not isinstance(raw, bytes) or not 0 < len(raw) <= maximum:
        raise ValueError("invalid body length")
    text = raw.decode("utf-8")
    # Bound container nesting before invoking the recursive decoder. Brackets
    # inside JSON strings (including escaped quotes) are ordinary text.
    depth = 0
    quoted = escaped = False
    for character in text:
        if quoted:
            if escaped:
                escaped = False
            elif character == "\\":
                escaped = True
            elif character == '"':
                quoted = False
        elif character == '"':
            quoted = True
        elif character in "[{":
            depth += 1
            if depth > MAX_JSON_DEPTH:
                raise ValueError("invalid JSON nesting")
        elif character in "]}":
            depth -= 1
    try:
        return json.loads(text, object_pairs_hook=unique_object)
    except RecursionError:
        # Preserve the routes' bounded 400 contract even on runtimes/stacks
        # whose parser recursion limit is lower than the explicit depth bound.
        raise ValueError("invalid JSON nesting") from None


def request_cookie(raw):
    """Forward one exact cookie, rather than Flask/user/Owner session cookies."""
    matches = []
    for item in (raw or "").split(";"):
        key, separator, value = item.strip().partition("=")
        if separator and key == COOKIE_NAME:
            matches.append(value)
    return matches[0] if len(matches) == 1 and OPAQUE.fullmatch(matches[0]) else None


@dataclass(frozen=True)
class BridgeReply:
    status: int
    body: dict
    cookie: str | None = None


class FixedCallDeskTransport:
    """A bounded HTTPS POST. Transport injection is used only in offline tests."""
    def __call__(self, path, body, headers):
        if path not in PATHS.values():
            raise ValueError("unreviewed path")
        encoded = json.dumps(body, separators=(",", ":"), ensure_ascii=True).encode("ascii")
        if len(encoded) > 2048:
            raise ValueError("oversized request")
        connection = http.client.HTTPSConnection(CALLDESK_HOST, 443, timeout=5,
                                                context=ssl.create_default_context())
        try:
            # Host remains the fixed TLS/ingress host. Origin identifies the
            # validated public site; forwarded host/proto and bearer auth are absent.
            connection.request("POST", path, encoded, {**headers, "Accept": "application/json",
                               "Content-Type": "application/json", "Content-Length": str(len(encoded))})
            response = connection.getresponse()
            if response.status not in (200, 400, 403, 409, 429, 503):
                raise ValueError("upstream status")
            if response.getheader("Content-Type", "").split(";", 1)[0].strip().lower() != "application/json":
                raise ValueError("upstream content type")
            length = response.getheader("Content-Length")
            if length is not None and (not length.isdigit() or int(length) > 8192):
                raise ValueError("oversized response")
            chunks = []
            size = 0
            started = time.monotonic()
            while True:
                chunk = response.read1(min(4096, 8193 - size))
                size += len(chunk)
                if size > 8192 or time.monotonic() - started > 10:
                    raise ValueError("upstream limit")
                if not chunk:
                    break
                chunks.append(chunk)
            cookie_headers = [value for name, value in response.getheaders() if name.lower() == "set-cookie"]
            if len(cookie_headers) > 1:
                raise ValueError("multiple upstream cookies")
            return BridgeReply(response.status, read_json(b"".join(chunks), 8192),
                               cookie_headers[0] if cookie_headers else None)
        finally:
            connection.close()


def _challenge_cookie(raw, token):
    if not isinstance(raw, str) or len(raw) > 512 or "\r" in raw or "\n" in raw:
        return None
    jar = SimpleCookie()
    try:
        jar.load(raw)
    except Exception:
        return None
    if set(jar) != {COOKIE_NAME}:
        return None
    cookie = jar[COOKIE_NAME]
    if (not OPAQUE.fullmatch(cookie.value) or not hmac.compare_digest(cookie.value, token)
            or cookie["path"] != "/" or cookie["domain"] or cookie["expires"]
            or cookie["max-age"] != "300" or not cookie["secure"] or not cookie["httponly"]
            or cookie["samesite"].lower() != "strict"):
        return None
    # Reconstruct the reviewed attributes instead of forwarding arbitrary ones.
    return f"{COOKIE_NAME}={cookie.value}; Secure; HttpOnly; SameSite=Strict; Path=/; Max-Age=300"


class AssistantBridge:
    def __init__(self, enabled=False, transport=None):
        self.enabled = enabled is True
        self.transport = transport or FixedCallDeskTransport()

    def forward(self, operation, host, notice, payload, cookie=None, csrf=None):
        """Host and notice are derived by the Flask route, never browser flags."""
        if not self.enabled:
            return BridgeReply(503, {"code": "consent_binding_bridge_unavailable"})
        if (operation not in PATHS or not isinstance(notice, dict) or set(notice) != NOTICE_FIELDS
                or HOST_SOURCES.get(host) != notice["source"]):
            return BridgeReply(400, {"code": "invalid_consent_request"})
        headers = {"Origin": "https://" + host, "Sec-Fetch-Site": "same-origin"}
        if operation in ("consent", "session"):
            if not isinstance(cookie, str) or not OPAQUE.fullmatch(cookie) or not isinstance(csrf, str) or not OPAQUE.fullmatch(csrf) or not hmac.compare_digest(cookie, csrf):
                return BridgeReply(403, {"code": "invalid_consent_session"})
            headers["Cookie"] = COOKIE_NAME + "=" + cookie
            headers["X-CSRF-Token"] = csrf
        try:
            reply = self.transport(PATHS[operation], payload, headers)
            if not isinstance(reply, BridgeReply) or not isinstance(reply.body, dict):
                raise ValueError("invalid reply")
            body = reply.body
            code = body.get("code")
            if not isinstance(code, str) or not re.fullmatch(r"[A-Za-z0-9_]{1,96}", code):
                raise ValueError("invalid code")
            if reply.status != 200:
                # Even a failing central response cannot leak a token or cookie.
                if reply.status not in (400, 403, 409, 429, 503):
                    raise ValueError("invalid status")
                return BridgeReply(reply.status, {"code": code})
            if operation in ("readiness", "challenge", "consent"):
                if any(body.get(field) != value for field, value in notice.items()):
                    raise ValueError("notice mismatch")
            if operation == "readiness":
                if set(body) != NOTICE_FIELDS | {"code", "ready"} or type(body["ready"]) is not bool or reply.cookie:
                    raise ValueError("invalid readiness")
            elif operation == "challenge":
                if set(body) != NOTICE_FIELDS | {"code", "csrfToken"} or code != "challenge" or not isinstance(body["csrfToken"], str) or not OPAQUE.fullmatch(body["csrfToken"]):
                    raise ValueError("invalid challenge")
                reviewed_cookie = _challenge_cookie(reply.cookie, body["csrfToken"])
                if reviewed_cookie is None:
                    raise ValueError("invalid challenge cookie")
                return BridgeReply(200, body, reviewed_cookie)
            elif operation == "consent":
                if set(body) != NOTICE_FIELDS | {"code", "authorization", "expiresAt"} or code != "authorized" or not isinstance(body["authorization"], str) or not OPAQUE.fullmatch(body["authorization"]) or not isinstance(body["expiresAt"], str) or len(body["expiresAt"]) > 40 or reply.cookie:
                    raise ValueError("invalid authorization")
                expiry = datetime.fromisoformat(body["expiresAt"].replace("Z", "+00:00"))
                if expiry.utcoffset() is None or expiry.utcoffset().total_seconds() != 0:
                    raise ValueError("non-UTC expiry")
                seconds = (expiry - datetime.now(timezone.utc)).total_seconds()
                if not 0 < seconds <= 300:
                    raise ValueError("invalid expiry")
            else:
                if (set(body) != {"code", "conversationToken", "conversationId", "mode", "connectionType"}
                        or code != "authorized" or body["mode"] != notice["mode"] or body["connectionType"] != "webrtc"
                        or not isinstance(body["conversationId"], str) or not CONVERSATION.fullmatch(body["conversationId"])
                        or not isinstance(body["conversationToken"], str) or not 32 <= len(body["conversationToken"]) <= 4096
                        or any(ord(c) < 33 or ord(c) > 126 for c in body["conversationToken"]) or reply.cookie):
                    raise ValueError("invalid provider credential")
            return BridgeReply(200, body)
        except Exception:
            # Do not serialize exception/provider bodies, credentials or URLs.
            return BridgeReply(503, {"code": "assistant_bridge_unavailable"})
