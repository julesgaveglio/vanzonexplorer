# Import automatique des avis Google Maps

## 🚀 Utilisation

### 1. Configurer les variables d'environnement

Dans le fichier `.env` à la racine du projet :

```env
# Google Places API
GOOGLE_PLACES_API_KEY=ta_clé_api_google_places_ici
GOOGLE_PLACE_ID=ton_place_id_google_maps_ici

# Sanity API Token (avec droits d'écriture)
SANITY_API_TOKEN=ton_token_sanity_ici
```

### 2. Obtenir les clés

#### Google Places API Key
1. Va sur [Google Cloud Console](https://console.cloud.google.com/)
2. Crée un projet ou utilise un existant
3. Active **Places API**
4. Crée une clé API avec restriction HTTP (localhost:3000)
5. Copie la clé dans `GOOGLE_PLACES_API_KEY`

#### Place ID Google Maps
1. Ouvre ta fiche Google Maps
2. Partage → Copier le lien
3. Le Place ID est dans l'URL (ex: `0x...:0x...`)
4. Copie dans `GOOGLE_PLACE_ID`

#### Sanity API Token
1. Va sur [sanity.io/manage](https://www.sanity.io/manage)
2. Projet → API → Tokens
3. Crée un nouveau token avec **Write** permissions
4. Copie dans `SANITY_API_TOKEN`

### 3. Lancer l'import

```bash
npm run import-reviews
```

## 📋 Ce que fait le script

- ✅ Récupère tous les avis Google Places
- ✅ Upload les photos de profil dans Sanity Assets
- ✅ Crée des documents `testimonial` dans Sanity
- ✅ Préserve le rating (1-5 étoiles)
- ✅ Ajoute "Client Google Maps" comme rôle
- ✅ Marque tous comme `featured: false` (à activer manuellement)

## 🎯 Résultat

Les avis apparaîtront automatiquement dans la section "Ce qu'ils en disent" de la page d'accueil, après le prochain rechargement du site.

## ⚠️ Notes

- Le script peut être lancé plusieurs fois (il dupliquera les avis)
- Pour éviter les doublons, supprime d'abord les anciens avis dans le Studio
- Les photos de profil sont uploadées dans Sanity Assets (CDN permanent)
