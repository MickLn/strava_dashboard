#!/usr/bin/env python3
"""
Échange le code d'autorisation temporaire contre un refresh token complet.
Lit les identifiants depuis les variables d'environnement ou le fichier .env local.
Usage : python3 scripts/exchange_token.py <CODE>
"""

import os
import sys
import json
import ssl
import urllib.request
import urllib.parse

try:
    ssl._create_default_https_context = ssl._create_unverified_context
except AttributeError:
    pass

# Charger les variables depuis .env si présent
env_path = os.path.join(os.path.dirname(__file__), "..", ".env")
if os.path.exists(env_path):
    with open(env_path, "r", encoding="utf-8") as f:
        for line in f:
            if "=" in line and not line.startswith("#"):
                k, v = line.strip().split("=", 1)
                os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))

CLIENT_ID = os.environ.get("STRAVA_CLIENT_ID")
CLIENT_SECRET = os.environ.get("STRAVA_CLIENT_SECRET")

def main():
    if not (CLIENT_ID and CLIENT_SECRET):
        print("❌ Erreur : STRAVA_CLIENT_ID ou STRAVA_CLIENT_SECRET manquants.")
        print("Ajoutez-les dans votre fichier .env ou en variables d'environnement.")
        return

    if len(sys.argv) < 2:
        print("Usage: python3 scripts/exchange_token.py <AUTHORIZATION_CODE>")
        return

    code = sys.argv[1].strip()
    if "code=" in code:
        parsed = urllib.parse.urlparse(code)
        params = urllib.parse.parse_qs(parsed.query)
        code = params.get("code", [code])[0]

    print(f"🔄 Échange sécurisé du code d'autorisation...")

    url = "https://www.strava.com/oauth/token"
    payload = urllib.parse.urlencode({
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "code": code,
        "grant_type": "authorization_code"
    }).encode("utf-8")

    req = urllib.request.Request(url, data=payload, method="POST")
    try:
        with urllib.request.urlopen(req) as response:
            res = json.loads(response.read().decode("utf-8"))
            print("\n🎉 SUCCÈS ! Refresh Token obtenu.")
            print(f"REFRESH_TOKEN : {res.get('refresh_token')}")
            return res.get("refresh_token")
    except Exception as e:
        print(f"❌ Erreur lors de l'échange : {e}")

if __name__ == "__main__":
    main()
