"""Local browser fixture. The bridge is simulated and cannot reach CallDesk."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app import app  # noqa: E402
from assistant_bridge import BridgeReply  # noqa: E402
from werkzeug.serving import make_server  # noqa: E402


def unavailable_bridge(*_args):
    return BridgeReply(503, {'code': 'offline_navigation_fixture'})


app.config.update(ASSISTANT_BRIDGE_ENABLED=sys.argv[1] == 'on',
                  ASSISTANT_BRIDGE_TRANSPORT=unavailable_bridge,
                  ASSISTANT_HTTPS_INGRESS_ORIGIN=None)
server = make_server('127.0.0.1', 0, app, threaded=True)
print(server.server_port, flush=True)
server.serve_forever()
