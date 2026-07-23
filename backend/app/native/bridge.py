import sys
import json
import struct
import requests
from datetime import datetime, timezone

BACKEND_URL = "https://safelens-zttx.onrender.com/api"

def read_message():
    raw_length = sys.stdin.buffer.read(4)
    if not raw_length:
        return None
    length = struct.unpack('=I', raw_length)[0]
    message = sys.stdin.buffer.read(length).decode('utf-8')
    return json.loads(message)

def send_message(message):
    encoded = json.dumps(message).encode('utf-8')
    sys.stdout.buffer.write(struct.pack('=I', len(encoded)))
    sys.stdout.buffer.write(encoded)
    sys.stdout.buffer.flush()

def handle_message(message):
    msg_type = message.get('type')

    if msg_type == 'LOG_SCAN':
        try:
            response = requests.post(
                f"{BACKEND_URL}/v1/scans/log",
                json=message.get('payload'),
                timeout=5
            )
            return {
                "success": True,
                "type": "LOG_SCAN_ACK",
                "data": response.json(),
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        except Exception as e:
            return {
                "success": False,
                "type": "ERROR",
                "error": str(e),
                "timestamp": datetime.now(timezone.utc).isoformat()
            }

    elif msg_type == 'UPLOAD_SCAN':
        try:
            payload = message.get('payload', {})
            response = requests.post(
                f"{BACKEND_URL}/v1/scans/upload",
                json=payload,
                timeout=5
            )
            return {
                "success": True,
                "type": "UPLOAD_ACK",
                "data": response.json(),
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        except Exception as e:
            return {
                "success": False,
                "type": "ERROR",
                "error": str(e),
                "timestamp": datetime.now(timezone.utc).isoformat()
            }

    elif msg_type == 'PING':
        return {
            "success": True,
            "type": "PONG",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

    else:
        return {
            "success": False,
            "type": "ERROR",
            "error": f"Unknown message type: {msg_type}",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

if __name__ == '__main__':
    while True:
        message = read_message()
        if message is None:
            break
        response = handle_message(message)
        send_message(response)