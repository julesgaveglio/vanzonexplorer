---
name: Schéma Supabase Marketplace Vanzon
description: Tables Supabase prévues pour la marketplace de location de vans — schéma validé lors de la session stratégique avril 2026
type: reference
---

## Tables marketplace (à créer — pas encore en base au 2026-04-04)

Cohérentes avec les tables existantes : `profiles`, `products`, `brands`, `vans_location`, `prospects`, `road_trip_requests`.

### marketplace_vans
Vans tiers proposés par des propriétaires inscrits.
```
id uuid PK
owner_id uuid → profiles.id
title, description, daily_rate, city, region, lat, lng
brand, model, year, length_cm, max_occupancy
amenities text[]  -- ["cuisine","douche","vélos","wifi"]
photos text[]     -- URLs Supabase Storage
status text       -- pending | active | inactive | suspended
also_on_yescapa boolean DEFAULT true
created_at, updated_at
```

### marketplace_availabilities
Calendrier jour par jour par van.
```
id uuid PK
van_id → marketplace_vans.id
date date
status text  -- available | booked | blocked
UNIQUE(van_id, date)
```

### marketplace_bookings
Réservations confirmées ou en cours.
```
id uuid PK
van_id → marketplace_vans.id
renter_id → profiles.id (nullable si non-inscrit)
renter_email, renter_name, renter_phone
start_date, end_date
nights GENERATED (end_date - start_date)
daily_rate, subtotal, platform_fee, owner_payout, insurance_fee, total_amount
status text  -- pending | confirmed | cancelled | completed | disputed
payment_status  -- unpaid | paid | refunded
stripe_payment_intent text
notes text
created_at, updated_at
```

### marketplace_insurances
```
id uuid PK
booking_id → marketplace_bookings.id UNIQUE
provider  -- manual | wakam | chapka | april
policy_number, coverage_start, coverage_end, premium
status  -- active | cancelled | claimed
certificate_url
```

### marketplace_contracts
```
id uuid PK
booking_id → marketplace_bookings.id UNIQUE
template_version, pdf_url
renter_signed_at, owner_signed_at timestamptz
docusign_envelope_id
```

### marketplace_reviews
```
id uuid PK
booking_id UNIQUE, van_id, reviewer_id
rating int (1-5), comment, owner_reply
```

### marketplace_messages
```
id uuid PK
booking_id, sender_id
content text, read_at
```

---

## Points d'attention techniques

- **Paiement** : Stripe Connect obligatoire (intermédiaire de paiement = agrément ACPR requis)
- **KYC propriétaires** : Stripe Connect force le KYC — prévoir 2-4 semaines d'onboarding
- **Déclaration fiscale** : collecter SIRET/INSEE des propriétaires dès inscription (obligation art. 242 bis CGI)
- **Index critiques** : `marketplace_vans(status, region)`, `marketplace_availabilities(van_id, date)`, `marketplace_bookings(van_id, status)`
