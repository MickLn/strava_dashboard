#!/usr/bin/env python3
"""
Script de synchronisation automatique avec l'API Strava v3.
Exécuté par GitHub Actions ou en local.
"""

import os
import json
import ssl
import urllib.request
import urllib.parse
from datetime import datetime, timezone

# Désactiver la vérification stricte SSL pour la compatibilité macOS locale
try:
    ssl._create_default_https_context = ssl._create_unverified_context
except AttributeError:
    pass

# Charger les variables depuis .env local si présent
env_path = os.path.join(os.path.dirname(__file__), "..", ".env")
if os.path.exists(env_path):
    with open(env_path, "r", encoding="utf-8") as f:
        for line in f:
            if "=" in line and not line.startswith("#"):
                k, v = line.strip().split("=", 1)
                os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))

STRAVA_CLIENT_ID = os.environ.get("STRAVA_CLIENT_ID")
STRAVA_CLIENT_SECRET = os.environ.get("STRAVA_CLIENT_SECRET")
STRAVA_REFRESH_TOKEN = os.environ.get("STRAVA_REFRESH_TOKEN")

OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "..", "public", "data", "strava_data.json")

SHOE_IMAGE_MAP = {
    "adizero": "/images/shoes/adizero_evo_sl.png",
    "ultraboost": "/images/shoes/ultraboost_gtx.png",
    "pegasus": "/images/shoes/pegasus_41.png",
    "brooks": "/images/shoes/brooks_hyperion_max.png",
    "default": "/images/shoes/adizero_evo_sl.png"
}

def get_shoe_image(shoe_name):
    name_lower = (shoe_name or "").lower()
    if "adizero" in name_lower or "evo" in name_lower:
        return SHOE_IMAGE_MAP["adizero"]
    elif "ultraboost" in name_lower or "gtx" in name_lower:
        return SHOE_IMAGE_MAP["ultraboost"]
    elif "pegasus" in name_lower:
        return SHOE_IMAGE_MAP["pegasus"]
    elif "brooks" in name_lower or "hyperion" in name_lower:
        return SHOE_IMAGE_MAP["brooks"]
    return SHOE_IMAGE_MAP["default"]

def refresh_access_token():
    """Échange le refresh token contre un access token éphémère"""
    if not (STRAVA_CLIENT_ID and STRAVA_CLIENT_SECRET and STRAVA_REFRESH_TOKEN):
        print("⚠️ Secrets Strava non trouvés. Utilisation du dataset existant.")
        return None

    url = "https://www.strava.com/oauth/token"
    payload = urllib.parse.urlencode({
        "client_id": STRAVA_CLIENT_ID,
        "client_secret": STRAVA_CLIENT_SECRET,
        "refresh_token": STRAVA_REFRESH_TOKEN,
        "grant_type": "refresh_token"
    }).encode("utf-8")

    req = urllib.request.Request(url, data=payload, method="POST")
    try:
        with urllib.request.urlopen(req) as response:
            res = json.loads(response.read().decode("utf-8"))
            return res.get("access_token")
    except Exception as e:
        print(f"❌ Erreur lors du refresh token: {e}")
        return None

def fetch_strava(endpoint, access_token):
    """Effectue un appel GET authentifié sur l'API Strava"""
    url = f"https://www.strava.com/api/v3/{endpoint}"
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {access_token}"})
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode("utf-8"))
    except Exception as e:
        print(f"❌ Erreur API Strava ({endpoint}): {e}")
        return None

def format_time_short(seconds):
    h = seconds // 3600
    m = (seconds % 3600) // 60
    s = seconds % 60
    if h > 0:
        return f"{h}h {m}m"
    return f"{m}m {s:02d}s"

def format_pace(meters_per_sec):
    if not meters_per_sec or meters_per_sec <= 0:
        return "--:-- /km"
    sec_per_km = 1000 / meters_per_sec
    m = int(sec_per_km // 60)
    s = int(sec_per_km % 60)
    return f"{m}:{s:02d} /km"

def extract_records(activities):
    """Calcule les Top 3 authentiques pour 5k, 10k et sorties longues (>15k) par segments contigus et courses globales"""
    efforts_5k = []
    efforts_10k = []
    efforts_15k = []

    def format_pace_exact(sec_total, dist_meters):
        if not dist_meters or dist_meters <= 0:
            return "--:-- /km"
        sec_per_km = sec_total / (dist_meters / 1000.0)
        m = int(sec_per_km // 60)
        s = int(sec_per_km % 60)
        return f"{m}:{s:02d} /km"

    for act in activities:
        act_id = act.get("id")
        name = act.get("name", "Run")
        date_str = act.get("start_date_local", "").split("T")[0]
        dist = act.get("distance", 0)
        time_s = act.get("moving_time", 0)

        # 1. Vérifier les segments contigus depuis les splits kilométriques réels
        splits = act.get("splits_metric", [])
        if splits and len(splits) >= 5:
            for start in range(len(splits) - 4):
                w_dist = sum(s.get("distance", 0) for s in splits[start:start+5])
                w_time = sum(s.get("moving_time", 0) for s in splits[start:start+5])
                if w_dist >= 4900:
                    scale = 5000.0 / w_dist
                    t_5k = int(w_time * scale)
                    efforts_5k.append({
                        "timeSeconds": t_5k,
                        "timeFormatted": format_time_short(t_5k),
                        "activityName": name,
                        "activityId": act_id,
                        "date": date_str,
                        "distanceKm": 5.0,
                        "paceFormatted": format_pace_exact(t_5k, 5000)
                    })

        if splits and len(splits) >= 10:
            for start in range(len(splits) - 9):
                w_dist = sum(s.get("distance", 0) for s in splits[start:start+10])
                w_time = sum(s.get("moving_time", 0) for s in splits[start:start+10])
                if w_dist >= 9800:
                    scale = 10000.0 / w_dist
                    t_10k = int(w_time * scale)
                    efforts_10k.append({
                        "timeSeconds": t_10k,
                        "timeFormatted": format_time_short(t_10k),
                        "activityName": name,
                        "activityId": act_id,
                        "date": date_str,
                        "distanceKm": 10.0,
                        "paceFormatted": format_pace_exact(t_10k, 10000)
                    })

        # 2. Vérifier les courses isolées
        if 4800 <= dist <= 6500 and time_s > 0:
            scale = 5000.0 / dist if dist < 5000 else 1.0
            t_adj = int(time_s * scale) if dist < 5000 else time_s
            efforts_5k.append({
                "timeSeconds": t_adj,
                "timeFormatted": format_time_short(t_adj),
                "activityName": name,
                "activityId": act_id,
                "date": date_str,
                "distanceKm": round(dist / 1000, 1),
                "paceFormatted": format_pace(act.get("average_speed", 0))
            })

        if 9500 <= dist <= 12500 and time_s > 0:
            scale = 10000.0 / dist if dist < 10000 else 1.0
            t_adj = int(time_s * scale) if dist < 10000 else time_s
            efforts_10k.append({
                "timeSeconds": t_adj,
                "timeFormatted": format_time_short(t_adj),
                "activityName": name,
                "activityId": act_id,
                "date": date_str,
                "distanceKm": round(dist / 1000, 1),
                "paceFormatted": format_pace(act.get("average_speed", 0))
            })

        if dist >= 14500 and time_s > 0:
            efforts_15k.append({
                "timeSeconds": time_s,
                "timeFormatted": format_time_short(time_s),
                "activityName": name,
                "activityId": act_id,
                "date": date_str,
                "distanceKm": round(dist / 1000, 1),
                "paceFormatted": format_pace(act.get("average_speed", 0))
            })

    def dedupe_and_rank(items):
        seen = {}
        for item in items:
            aid = item["activityId"]
            if aid not in seen or item["timeSeconds"] < seen[aid]["timeSeconds"]:
                seen[aid] = item
        ranked = list(seen.values())
        ranked.sort(key=lambda x: x["timeSeconds"])
        for idx, r in enumerate(ranked[:3]):
            r["rank"] = idx + 1
        return ranked[:3]

    return {
        "top5k": dedupe_and_rank(efforts_5k),
        "top10k": dedupe_and_rank(efforts_10k),
        "top15k": dedupe_and_rank(efforts_15k)
    }

def main():
    print("🚀 Démarrage de la synchronisation Strava...")
    token = refresh_access_token()
    if not token:
        print("ℹ️ Mode démo / Pas de token actif.")
        return

    # 1. Athlète
    athlete = fetch_strava("athlete", token)
    if not athlete:
        print("❌ Impossible de récupérer l'athlète.")
        return

    athlete_id = athlete.get("id")

    # 2. Stats
    stats = fetch_strava(f"athletes/{athlete_id}/stats", token) or {}

    # 3. Activités (récupérer les activités par pagination jusqu'à 600 runs)
    all_runs = []
    page = 1
    while page <= 3:
        activities_raw = fetch_strava(f"athlete/activities?per_page=200&page={page}", token) or []
        if not activities_raw:
            break
        runs_page = [a for a in activities_raw if a.get("type") == "Run" or a.get("sport_type") == "Run"]
        for r in runs_page:
            if not r.get("calories") or r.get("calories") == 0:
                r["calories"] = round((r.get("distance", 0) / 1000.0) * 72.5)
        all_runs.extend(runs_page)
        if len(activities_raw) < 200:
            break
        page += 1

    # Récupérer les splits_metric authentiques pour les courses récentes (dans la limite API de Strava)
    # Charger l'ancien cache pour ne pas re-télécharger les splits déjà présents
    existing_splits_cache = {}
    if os.path.exists(OUTPUT_PATH):
        try:
            with open(OUTPUT_PATH, "r", encoding="utf-8") as f:
                old_data = json.load(f)
                for old_act in old_data.get("activities", []):
                    if old_act.get("splits_metric"):
                        existing_splits_cache[old_act.get("id")] = old_act["splits_metric"]
        except Exception:
            pass

    detail_fetch_count = 0
    for act in all_runs:
        act_id = act.get("id")
        if act_id in existing_splits_cache:
            act["splits_metric"] = existing_splits_cache[act_id]
        elif detail_fetch_count < 80:
            try:
                detailed = fetch_strava(f"activities/{act_id}", token)
                if detailed and detailed.get("splits_metric"):
                    act["splits_metric"] = detailed.get("splits_metric")
                    if detailed.get("elev_high") is not None:
                        act["elev_high"] = detailed.get("elev_high")
                    if detailed.get("elev_low") is not None:
                        act["elev_low"] = detailed.get("elev_low")
                    detail_fetch_count += 1
            except Exception as e:
                print(f"Note splits {act_id}: {e}")

    # 4. Chaussures
    shoes = athlete.get("shoes", [])
    gear_items = []
    for s in shoes:
        s_id = s.get("id")
        gear_detail = fetch_strava(f"gear/{s_id}", token) or s
        name = gear_detail.get("name") or s.get("name", "Running Shoes")
        gear_items.append({
            "id": s_id,
            "primary": s.get("primary", False),
            "name": name,
            "distance": gear_detail.get("distance", s.get("distance", 0)),
            "brand_name": gear_detail.get("brand_name", ""),
            "model_name": gear_detail.get("model_name", ""),
            "max_distance_km": 1000 if "evo" in name.lower() else 800,
            "image_url": get_shoe_image(name)
        })

    # Si aucune chaussure n'est retournée par l'API, créer les paires par défaut
    if not gear_items:
        gear_items = [
            {
                "id": "g101",
                "primary": True,
                "name": "Adidas Adizero EVO SL",
                "distance": 1349000,
                "brand_name": "Adidas",
                "max_distance_km": 1500,
                "image_url": SHOE_IMAGE_MAP["adizero"]
            },
            {
                "id": "g102",
                "primary": False,
                "name": "Adidas Ultraboost 21 GTX",
                "distance": 431000,
                "brand_name": "Adidas",
                "max_distance_km": 800,
                "image_url": SHOE_IMAGE_MAP["ultraboost"]
            },
            {
                "id": "g103",
                "primary": False,
                "name": "Nike Pegasus 41 Blueprint",
                "distance": 225000,
                "brand_name": "Nike",
                "max_distance_km": 800,
                "image_url": SHOE_IMAGE_MAP["pegasus"]
            }
        ]

    # Records calculés
    records = extract_records(all_runs)

    dataset = {
        "last_updated": datetime.now(timezone.utc).isoformat(),
        "athlete": {
            "id": athlete.get("id"),
            "username": athlete.get("username", "athlete"),
            "firstname": athlete.get("firstname", "Runner"),
            "lastname": athlete.get("lastname", ""),
            "city": athlete.get("city", "Paris"),
            "country": athlete.get("country", "France"),
            "profile_medium": athlete.get("profile_medium", ""),
            "profile": athlete.get("profile", ""),
            "bio": athlete.get("bio", "")
        },
        "stats": stats,
        "gear": gear_items,
        "records": records,
        "activities": all_runs
    }

    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(dataset, f, indent=2, ensure_ascii=False)

    print(f"✅ Données synchronisées avec succès ({len(all_runs)} runs synchronisés) -> {OUTPUT_PATH}")

if __name__ == "__main__":
    main()
