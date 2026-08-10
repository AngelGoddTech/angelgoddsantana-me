import os
from flask import Flask, send_from_directory

# Path to built static files
DIST_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'dist')

app = Flask(__name__, static_folder=None)


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
    return response


if __name__ == '__main__':
    # For local testing only; Azure uses gunicorn via startup command
    port = int(os.environ.get('PORT', 8000))
    app.run(host='0.0.0.0', port=port)
