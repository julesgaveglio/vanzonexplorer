---
name: Risques juridiques marketplace — Points non-négociables
description: Points légaux à anticiper avant le lancement de la marketplace de location de vans entre particuliers
type: project
---

## 1. Paiement (critique avant le premier euro)

Collecter des fonds pour les reverser sans agrément ACPR = illégal (activité bancaire non autorisée).

**Solution obligatoire** : Stripe Connect (Standard ou Express), Mangopay, ou Lemonway.
- Stripe Connect gère KYC, conformité, reversements automatiques
- Prévoir 2-4 semaines pour setup + validation des premiers comptes propriétaires

**Ne jamais** faire transiter les paiements sur un compte bancaire ordinaire de la SAS.

---

## 2. Assurance (critique avant la première réservation)

Toute location de véhicule à moteur doit être assurée en France.

**Court terme (MVP)** : clause contractuelle obligeant les propriétaires à souscrire une assurance "véhicule en location à des tiers" (~300-500€/an). Leur responsabilité.

**Moyen terme** : partenariat assureur.
- **Chapka / April** : produits catalogue pour location entre particuliers, délai d'onboarding réaliste
- **Wakam** : API d'assurance B2B, mais onboarding 3-6 mois + volume minimum garanti requis

---

## 3. Déclaration fiscale des propriétaires (art. 242 bis CGI)

Depuis 2020, les plateformes de mise en relation doivent déclarer annuellement à la DGFiP les revenus générés par chaque utilisateur.

**Action** : collecter le SIRET/numéro fiscal de chaque propriétaire lors de l'inscription. Prévoir un mécanisme de déclaration automatique (fichier CSV DGFiP en fin d'année).

---

## 4. Objet social de la SAS

Vérifier que "mise en relation pour location de véhicules" ou "exploitation de plateforme numérique" figure dans les statuts de Van Zone Explorer. Si non, modification au greffe avant le premier utilisateur tiers.

---

## 5. RGPD

Collecte de données personnelles (locataires, propriétaires) : nom, email, téléphone, IBAN.
- Mettre à jour la politique de confidentialité
- Registre des traitements
- Consentement explicite à la collecte

---

## 6. CGU et responsabilité de la plateforme

La plateforme est un intermédiaire, pas un loueur. À définir clairement dans les CGU :
- Responsabilité en cas de sinistre incombe aux parties (propriétaire + locataire)
- Processus de litige : dépôt de garantie bloqué sur Stripe, état des lieux numérique obligatoire, délai de contestation

**Recommandation** : faire relire les CGU par un avocat spécialisé marketplace (budget ~500-1 000€) avant le premier utilisateur tiers.

---

## How to apply

Quand Jules développe des fonctionnalités marketplace : vérifier que paiement (Stripe Connect) et assurance (clause propriétaire) sont en place avant toute mise en production publique. Ces deux points sont bloquants légalement.
