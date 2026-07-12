#!/usr/bin/env python3
"""
Upload PPTX to Google Drive and convert to Google Slides.
Usage: python3 scripts/upload-to-drive.py <pptx_file> [folder_id]
"""

import os, sys, http.server, urllib.parse, threading, webbrowser
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env.local'))

CLIENT_ID = os.getenv('GOOGLE_GSC_CLIENT_ID')
CLIENT_SECRET = os.getenv('GOOGLE_GSC_CLIENT_SECRET')
REDIRECT_URI = 'http://localhost:3333/callback'

SCOPES = ' '.join([
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.settings.basic',
    'https://www.googleapis.com/auth/gmail.readonly',
])

# Args
pptx_path = sys.argv[1] if len(sys.argv) > 1 else None
folder_id = sys.argv[2] if len(sys.argv) > 2 else '1S-GqIOp6koQmK2a3S-_x7OlKNCHQuZ0P'

if not pptx_path or not os.path.exists(pptx_path):
    print(f"❌ Fichier introuvable: {pptx_path}")
    sys.exit(1)

file_name = os.path.splitext(os.path.basename(pptx_path))[0]

auth_params = {
    'client_id': CLIENT_ID,
    'redirect_uri': REDIRECT_URI,
    'response_type': 'code',
    'scope': SCOPES,
    'access_type': 'offline',
    'prompt': 'consent',
}
auth_url = 'https://accounts.google.com/o/oauth2/v2/auth?' + urllib.parse.urlencode(auth_params)

print(f"\n📄 Fichier: {pptx_path}")
print(f"📁 Dossier Drive: {folder_id}")
print(f"\n🔗 Ouverture du navigateur pour autorisation...\n")

auth_code = None

class CallbackHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        global auth_code
        parsed = urllib.parse.urlparse(self.path)
        params = urllib.parse.parse_qs(parsed.query)

        if 'error' in params:
            error = params['error'][0]
            print(f"\n❌ Erreur Google: {error}")
            if error == 'redirect_uri_mismatch':
                print("   ➜ Ajoute http://localhost:3333/callback dans Google Cloud Console")
            self.send_response(200)
            self.end_headers()
            self.wfile.write(f"❌ Erreur: {error}".encode())
            return

        if 'code' in params:
            auth_code = params['code'][0]
            self.send_response(200)
            self.end_headers()
            self.wfile.write("✅ Autorisé ! Retourne dans le terminal.".encode())
            threading.Thread(target=self.server.shutdown).start()
        else:
            self.send_response(200)
            self.end_headers()
            self.wfile.write("En attente...".encode())

    def log_message(self, format, *args):
        pass  # Silence logs

# Start server and open browser
server = http.server.HTTPServer(('localhost', 3333), CallbackHandler)
webbrowser.open(auth_url)

print("⏳ En attente d'autorisation sur http://localhost:3333...\n")
server.serve_forever()

if not auth_code:
    print("❌ Pas de code reçu")
    sys.exit(1)

print("✅ Code reçu, échange contre un token...")

# Exchange code for tokens
import urllib.request, json

token_data = urllib.parse.urlencode({
    'code': auth_code,
    'client_id': CLIENT_ID,
    'client_secret': CLIENT_SECRET,
    'redirect_uri': REDIRECT_URI,
    'grant_type': 'authorization_code',
}).encode()

req = urllib.request.Request('https://oauth2.googleapis.com/token', data=token_data)
with urllib.request.urlopen(req) as resp:
    tokens = json.loads(resp.read())

access_token = tokens.get('access_token')
refresh_token = tokens.get('refresh_token')

if not access_token:
    print(f"❌ Erreur token: {tokens}")
    sys.exit(1)

print(f"✅ Access token obtenu")

if refresh_token:
    print(f"\n💾 Nouveau refresh token (avec scope Drive) :")
    print(f"   GOOGLE_GMAIL_REFRESH_TOKEN={refresh_token}")
    print(f"   → Mets-le à jour dans .env.local pour les prochains uploads\n")

# Upload to Drive
print(f"📤 Upload de {file_name}...")

from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
from google.oauth2.credentials import Credentials

creds = Credentials(token=access_token)
service = build('drive', 'v3', credentials=creds)

file_metadata = {
    'name': file_name,
    'parents': [folder_id],
    'mimeType': 'application/vnd.google-apps.presentation',  # Convert to Slides
}

media = MediaFileUpload(
    pptx_path,
    mimetype='application/vnd.openxmlformats-officedocument.presentationml.presentation',
    resumable=True,
)

file = service.files().create(
    body=file_metadata,
    media_body=media,
    fields='id, name, webViewLink',
).execute()

print(f"\n🎉 UPLOAD RÉUSSI !")
print(f"   Nom:  {file.get('name')}")
print(f"   ID:   {file.get('id')}")
print(f"   Lien: {file.get('webViewLink')}")
print(f"\n   → Ouvre le lien ci-dessus pour voir le Google Slides !")
