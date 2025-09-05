import os
from flask import Flask, send_from_directory

# Path to built static files
DIST_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'dist')

app = Flask(
    __name__,
    static_folder=os.path.join(DIST_DIR),
    static_url_path=''
)


@app.route('/')
def index():
    return send_from_directory(DIST_DIR, 'index.html')


# Serve any file in dist directly (css, js, assets)
@app.route('/<path:path>')
def static_proxy(path: str):
    file_path = os.path.join(DIST_DIR, path)
    if os.path.isfile(file_path):
        return send_from_directory(DIST_DIR, path)
    # SPA fallback: return index.html for client-side routes
    return send_from_directory(DIST_DIR, 'index.html')


if __name__ == '__main__':
    # For local testing only; Azure uses gunicorn via startup command
    port = int(os.environ.get('PORT', 8000))
    app.run(host='0.0.0.0', port=port)
