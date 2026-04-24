#!/usr/bin/env python3
"""
Transcribe only the VBA videos missing from Vanzon Memory.
Uses Whisper (medium model) for French transcription.

Usage: python3 scripts/vba-transcribe-missing.py
"""

import whisper
import os
import json
import sys

VBA_ROOT = "/Users/julesgaveglio/Desktop/Projets/Vanzon 🚐/Formation/Van Business Academy"
OUTPUT_DIR = "/Users/julesgaveglio/vanzon-website-claude-code/scripts/transcripts"

# Only videos we DON'T have transcripts for yet
MISSING = {
    "Module 1": [
        "Vidéo 4 - Quel projet de van te correspond VRAIMENT ?.mov",
    ],
    "Module 4": [
        "Vidéo 1 - Présentation de l'aménagement VASP L1H1.mov",
        "AIRTABLE H1L1 VASP.mov",
    ],
    "Module 5 - Les travaux": [
        "tuto table coullissante VASP(1).mov",
    ],
    "Module 7 - Ce qu'il faut savoir sur l'homologation VASP": [
        "Vidéo 1 - Introduction VASP.mov",
        "Vidéo 2 - Ce que ton aménagement DOIT comporter pour être éligible à l'homologation.mov",
        "Vidéo 3 - Le processus complet pour l'homologation.mov",
        "Les cout adiministratif VASP.mov",
        "Vidéo 5 - Avantages et inconvégniants VASP.mov",
        "BONUS - Perplexity.mov",
    ],
    "Module 8 - Les normes VASP à connaître avant les travaux": [
        "Normes aération.mov",
        "Les normes pour l'aménagement.mov",
        "Les normes pour le circuit d'eau.mov",
        "Normes Électricité.mov",
        "Les normes pour plaque électrique.mov",
        "Les normes pour le gaz.mov",
        "Issue de secour.mov",
        "Normes marche-pied.mov",
        "La norme sur la pesée.mov",
        "Les étiquettes obligatoires.mov",
        "Les objets obligatoires.mov",
    ],
    "Module 9 -  Remplir le dossier VASP": [
        "Demande de réception.mov",
        "Les trvaux attestation.mov",
        "Vidéo 3 - Certificat de conformité : barré rouge.mov",
        "Les photos de son van.mov",
    ],
    "Module 10 - BUSINESS de location": [
        "Vidéo 0 - Petite précision avant de commencer.mov",
        "Vidéo 5 - Fixer ses prix & maîtriser la saisonnalité.mov",
    ],
}

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # Count total
    total = sum(len(v) for v in MISSING.values())
    print(f"🎙️  Transcription de {total} vidéos manquantes")
    print(f"📂 Output: {OUTPUT_DIR}\n")

    # Load Whisper model (medium = good quality for French, ~5GB RAM)
    print("⏳ Chargement du modèle Whisper (medium)...")
    model = whisper.load_model("medium")
    print("✅ Modèle chargé\n")

    done = 0
    results = {}

    for module_dir, files in MISSING.items():
        module_path = os.path.join(VBA_ROOT, module_dir)
        if not os.path.isdir(module_path):
            print(f"⚠️  Dossier introuvable: {module_dir}")
            continue

        for filename in files:
            filepath = os.path.join(module_path, filename)
            if not os.path.isfile(filepath):
                print(f"⚠️  Fichier introuvable: {filepath}")
                continue

            done += 1
            size_mb = os.path.getsize(filepath) / 1048576
            print(f"[{done}/{total}] 🎬 {module_dir} / {filename} ({size_mb:.0f} MB)")

            try:
                result = model.transcribe(filepath, language="fr", fp16=False)
                text = result["text"].strip()

                # Save individual transcript
                safe_name = filename.replace("/", "_").replace(".mov", "").replace(".MOV", "").replace(".mp4", "")
                out_file = os.path.join(OUTPUT_DIR, f"{module_dir} — {safe_name}.txt")
                with open(out_file, "w", encoding="utf-8") as f:
                    f.write(text)

                results[f"{module_dir}/{filename}"] = text
                print(f"   ✅ {len(text)} caractères transcrits\n")

            except Exception as e:
                print(f"   ❌ Erreur: {e}\n")
                results[f"{module_dir}/{filename}"] = f"ERREUR: {e}"

    # Save all results as JSON for easy import
    json_path = os.path.join(OUTPUT_DIR, "_all_transcripts.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    print(f"\n🎉 Terminé! {done}/{total} vidéos transcrites")
    print(f"📄 JSON complet: {json_path}")

if __name__ == "__main__":
    main()
