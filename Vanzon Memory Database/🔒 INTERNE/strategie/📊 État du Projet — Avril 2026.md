# 📊 État du Projet — Avril 2026
> Dernière mise à jour : 2026-04-05

## 🎯 Objectif
2 000€/mois net → expatriation Thaïlande fin 2027

## 📈 Revenus actuels
- Location directe (Yoni + Xalbat via Yescapa) : ~400-750€/mois (7j/mois × 80€ × 2 vans, -16% commission Yescapa)
- Marketplace : 0€ (MVP-0 non lancé)
- Affiliation : 0€ (pas encore mis en place)
- Formation (Mario) : non comptée — contrat non signé

## 🚀 Initiatives actives

### Marketplace (priorité #1)
- **Statut :** 🟢 MVP-1 live — wizard 4 étapes, auth Clerk (Google OAuth), dashboard van owner, table `marketplace_vans` + `photo_slots`
- **Leads chauds :** 3 personnes en DM Facebook (2026-04-05), discussions en cours, inscriptions pas encore faites
- **Objectif MVP-0 :** 5 propriétaires inscrits (0/5 à date)
- **Prochaine étape :** Convertir les 3 leads Facebook en premières vraies annonces
- **Schéma Supabase :** `marketplace_vans` avec photo_slots, location_address, location_postal_code

### SEO / Blog (moteur de fond)
- **Statut :** 🟢 Automatisé, 3 articles/semaine
- **Articles publiés :** vérifier Sanity pour le compte exact
- **Pipeline :** blog-writer (lun/mer/ven 7h UTC) + queue-builder mensuel + link-optimizer + cluster-updater
- **Backlinks :** 🟢 Automatisé (2026-04-04) — agent daily Mar-Ven 9h30 Paris, 5 emails/jour, reply detection + follow-up J+4. 72 prospects en DB (53 découverts, 17 contactés, 2 obtenus). 10 axes diversifiés (surf/outdoor, annuaires, presse, éco-tourisme, road trip, camping, institutionnels, gîtes, mariage, nomad).
- **Trafic organique :** à vérifier via GSC
- **Road Trip IA :** actif, pipeline seed → publisher → feedback automatisé
- **Pinterest :** recherche faite, poster inactif (compte Trial)

### Formation — Van Business Academy (Mario)
- **Statut :** ⚠️ Contrat SAS non signé
- **Contenu :** ~50 vidéos sur Podia (sigmafactory.fr, pas encore vanzon)
- **Risques :** Mario 20% SAS sans contrat formel, retards sur SigmaFactory.fr, contenu sous son nom pas Vanzon
- **Règle :** NE PAS compter dans les projections financières

### Flotte (expansion)
- **Statut :** 🔴 Bloqué
- **Plan :** 2 vans VASP supplémentaires (~38 000€)
- **Financement :** devait venir de Mario → bloqué
- **Potentiel :** exploitation location + revente 50-55k€ en 2-3 ans
- **Règle :** NE PAS compter dans les projections avant injection réelle des fonds

### Le Club (ex Club Privé)
- **Statut :** 🟢 Actif, 100% gratuit
- **Rôle :** fidélisation, promos partenaires, signaux SEO positifs
- **Accès :** Supabase `profiles.plan = "club_member"`

## 🚧 Blocages critiques
1. **Contrat Mario** — 20% SAS sans contrat signé = risque juridique majeur
2. **Financement flotte** — bloqué tant que Mario n'injecte pas les fonds
3. **Marketplace MVP** — Jules seul sur le dev, pas de deadline fixée
4. **Pinterest poster** — compte Trial, upgrade Standard nécessaire
5. **Dépendance Elio** — seule personne terrain pour la logistique vans

## ✅ Décisions récentes
- [2026-03] Club Privé 100% gratuit (abandon 9,99€/mois + Stripe)
- [2026-03] Schéma Supabase marketplace validé (7 tables)
- [2026-04] CTTE confirmé pour Yoni et Xalbat (PAS VASP)
- [2026-04-04] MVP-0 marketplace live (/proposer-votre-van) + prospection Facebook groupes vanlife
- [2026-04-04] Système backlinks automatisé déployé (72 prospects, 10 axes, agent daily + weekly)
- [2026-04-04] 8 emails OT + campings envoyés manuellement, 2 réponses positives (cosyvans.fr, labelvanlife.com)
- [2026-04-05] MVP-1 marketplace déployé — wizard complet, auth Clerk Google, dashboard van owner, photo slots structurés
- [2026-04-05] 3 leads chauds Facebook en DM — discussions en cours pour inscription
- [2026-04-05] Demandes Apple Maps Business envoyées, Pages Jaunes actif, WikiCampers en cours (Yoni + Xalbat)
- [2026-04-05] Notifications Telegram : nouvel inscrit + nouvelle annonce van avec lien admin

## 📅 Prochains jalons
- [x] ~~Lancer MVP-0 marketplace (landing + formulaire)~~ ✅ 2026-04-04
- [x] ~~Système backlinks automatisé~~ ✅ 2026-04-04
- [ ] Convertir les 3 leads Facebook en premières inscriptions (priorité absolue)
- [ ] Obtenir 5 propriétaires inscrits sur la marketplace (0/5 à date)
- [ ] Finaliser WikiCampers — Yoni + Xalbat en ligne
- [ ] Vérifier validation Apple Maps Business
- [ ] Inscriptions annuaires manuels restants (en-pays-basque.fr, tourisme64, france-voyage, CCI)
- [ ] Signer le contrat SAS avec Mario
- [ ] Atteindre 100 articles indexés
- [ ] Optimiser fiches Yescapa pour haute saison (15/04)
- [ ] Première réservation directe (hors Yescapa)

## 📊 KPIs à suivre
- Trafic organique mensuel (GSC)
- Nombre d'articles publiés
- Taux d'occupation vans (jours/mois)
- Membres Club inscrits
- Road trips générés
