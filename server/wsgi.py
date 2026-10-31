# WSGI entry for hosts that run Python behind their own web server.
# PythonAnywhere free accounts use this file. They do not ask for a credit card.
# Map /css /js /data /img /vendor to those folders as static files so the
# daily CPU allowance is spent on /api, not on the map data.

import importlib.util
from email.parser import Parser
from http import HTTPStatus
from io import BytesIO
from pathlib import Path

_spec = importlib.util.spec_from_file_location(
    "room_server", Path(__file__).resolve().parent / "room_server.py"
)
_room = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_room)
_room.init_db()


class _WsgiAdapter(_room.Handler):
    def __init__(self, environ):
        self.client_address = (environ.get("REMOTE_ADDR", "0.0.0.0"), 0)
        self.request_version = "HTTP/1.1"
        self.command = environ.get("REQUEST_METHOD", "GET")
        path = environ.get("PATH_INFO") or "/"
        query = environ.get("QUERY_STRING") or ""
        self.path = path + (("?" + query) if query else "")
        self.headers = self._headers(environ)
        try:
            n = int(environ.get("CONTENT_LENGTH") or 0)
        except ValueError:
            n = 0
        if n < 0 or n > 200_000:
            n = 0
        raw = environ["wsgi.input"].read(n) if n else b""
        self.rfile = BytesIO(raw)
        self.wfile = BytesIO()
        self._status = "200 OK"
        self._resp = []
        self.close_connection = True

    def _headers(self, environ):
        lines = []
        for key, value in environ.items():
            if key.startswith("HTTP_"):
                lines.append("%s: %s" % (key[5:].replace("_", "-"), value))
        if environ.get("CONTENT_TYPE"):
            lines.append("Content-Type: %s" % environ["CONTENT_TYPE"])
        if environ.get("CONTENT_LENGTH"):
            lines.append("Content-Length: %s" % environ["CONTENT_LENGTH"])
        return Parser().parsestr("\n".join(lines) + "\n\n")

    def send_response(self, code, message=None):
        try:
            phrase = HTTPStatus(int(code)).phrase
        except ValueError:
            phrase = "OK"
        self._status = "%s %s" % (code, message or phrase)

    def send_header(self, keyword, value):
        self._resp.append((str(keyword), str(value)))

    def end_headers(self):
        return

    def send_error(self, code, message=None, explain=None):
        body = (message or HTTPStatus(int(code)).phrase).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "text/plain; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_request(self, code="-", size="-"):
        return


def application(environ, start_response):
    handler = _WsgiAdapter(environ)
    method = handler.command.upper()
    fn = getattr(handler, "do_" + method, None)
    if fn is None:
        handler.send_error(405)
    else:
        fn()
    start_response(handler._status, handler._resp)
    return [handler.wfile.getvalue()]
