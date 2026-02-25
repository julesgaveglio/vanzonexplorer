# Vanzon Explorer - Site Vanlife

Site web showcase pour Vanzon Explorer - location de vans aménagés au Pays Basque.

## 🚐 Fonctionnalités

- **Location de vans** : Catalogue interactif avec système de réservation
- **Formation Van Business Academy** : Formation complète pour créer son business de location
- **CMS Sanity** : Gestion de contenu pour les vans, témoignages et spots
- **Avis Google Maps** : Intégration de 24 vrais avis clients
- **Design moderne** : UI glassmorphism avec Tailwind CSS
- **Responsive** : Optimisé mobile et desktop

## 🛠️ Stack Technique

- **Frontend** : Next.js 14 (App Router), TypeScript, Tailwind CSS
- **CMS** : Sanity v3 avec next-sanity
- **Animations** : Framer Motion
- **Images** : Next.js Image optimization
- **Deployment** : GitHub Pages

## 🚀 Démarrage rapide

### Installation

```bash
npm install
```

### Variables d'environnement

Crée un fichier `.env.local` :

```env
NEXT_PUBLIC_SANITY_PROJECT_ID=lewexa74
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_READ_TOKEN=votre_token_lecture
SANITY_API_WRITE_TOKEN=votre_token_ecriture
```

### Lancer le développement

```bash
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000) dans ton navigateur.

### Sanity Studio

```bash
npm run dev
```

Puis va sur [http://localhost:3000/studio](http://localhost:3000/studio)

## 📦 Scripts utiles

- `npm run dev` : Serveur de développement
- `npm run build` : Build pour production
- `npm run export` : Export statique
- `npm run sync-reviews API_KEY` : Synchroniser les avis Google Maps
- `npm run import-manual-reviews` : Importer les avis manuellement

## 🚀 Déploiement sur GitHub Pages

### 1. Créer le repository GitHub

1. Va sur [GitHub](https://github.com) et crée un nouveau repository `vanzon-website`
2. Ne coche pas "Initialize with README"
3. Copie l'URL du repository

### 2. Connecter le projet

```bash
git remote add origin https://github.com/TON_USERNAME/vanzon-website.git
git branch -M main
git push -u origin main
```

### 3. Configurer GitHub Pages

1. Va dans les settings du repository GitHub
2. Onglet "Pages" → Source "GitHub Actions"
3. Le workflow `.github/workflows/deploy.yml` gérera le déploiement automatique

### 4. Ajouter les secrets

Dans les settings du repository → Secrets and variables → Actions :

- `NEXT_PUBLIC_SANITY_PROJECT_ID`: lewexa74
- `NEXT_PUBLIC_SANITY_DATASET`: production

### 5. Déploiement automatique

Chaque `push` sur `main` déclenchera le déploiement sur GitHub Pages.

## 📝 Structure du projet

```
src/
├── app/
│   ├── (site)/          # Pages publiques
│   │   ├── page.tsx     # Homepage
│   │   ├── location/    # Location de vans
│   │   ├── formation/   # Formation academy
│   │   └── layout.tsx   # Layout du site
│   ├── api/             # Routes API
│   └── studio/          # Sanity Studio
├── components/
│   ├── formation/       # Composants formation
│   ├── van/            # Composants vans
│   ├── ui/             # UI components
│   └── layout/         # Layout components
├── lib/
│   └── sanity/         # Client Sanity
sanity/
├── schemas/            # Schémas Sanity
└── config.ts
scripts/                # Scripts utilitaires
```

## 🎨 Design System

- **Couleurs** : Thème blanc avec glassmorphism
- **Typography** : Geist font family
- **Components** : GlassCard, LiquidButton, Badge
- **Responsive** : Mobile-first design

## 📞 Contact

Pour toute question ou support, contacte Jules de Vanzon Explorer.

---

**Développé avec ❤️ pour Vanzon Explorer**
