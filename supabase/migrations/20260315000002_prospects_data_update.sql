-- Mon Fourgon Shop
UPDATE prospects SET
  description = 'Expertise technique, idéal code promo',
  emails = ARRAY['contact@mon-fourgon-shop.fr'],
  website = 'https://www.mon-fourgon-shop.fr'
WHERE name = 'Mon Fourgon Shop';

-- H2R Équipements
UPDATE prospects SET
  description = 'Catalogue immense, vente en ligne',
  emails = ARRAY['pro@h2r-equipements.com'],
  website = 'https://www.h2r-equipements.com'
WHERE name = 'H2R Équipements';

-- Dometic (has email + pre-written contact email)
UPDATE prospects SET
  description = 'Frigos compression & ouvertures',
  emails = ARRAY['info@dometic.fr'],
  website = 'https://www.dometic.com/fr-fr',
  generated_email = 'Bonjour,

En constituant notre sélection de marques pour Vanzon Explorer, Dometic s''est imposée comme une évidence. Votre positionnement sur le confort nomade et l''exigence de vos équipements, notamment sur la réfrigération et l''énergie, correspondent exactement aux attentes de notre communauté.

Vanzon Explorer est une plateforme privée dédiée à l''aménagement van. Nos membres paient un abonnement pour accéder à des offres exclusives auprès de marques rigoureusement sélectionnées. Vous avez ainsi la garantie qu''aucun site de bons de réduction publics n''aura accès à vos offres, ce qui protège votre image de marque et votre réseau de distribution.

Ce que nous vous proposons est simple : en échange d''un avantage exclusif pour nos membres, nous référençons vos produits phares sur notre plateforme avec des liens directs vers votre site. Cela améliore concrètement votre référencement naturel grâce à des backlinks qualifiés, tout en vous apportant un trafic ciblé d''acheteurs à forte intention d''achat pour leur aménagement.

Aucune contrainte de votre côté. Cette approche vous parlerait-elle ? Si oui, nous serions ravis d''en discuter par email, à votre convenance.

Bien cordialement,',
  generated_subject = 'Partenariat Vanzon Explorer × Dometic — offre exclusive membres',
  status = 'email_genere'
WHERE name = 'Dometic';

-- Victron Energy
UPDATE prospects SET
  description = 'Leader électricité, ultra-fiable',
  website = 'https://www.victronenergy.fr'
WHERE name = 'Victron Energy';

-- Energie Mobile
UPDATE prospects SET
  description = 'Solaire & Lithium, SAV France',
  website = 'https://www.energiemobile.com'
WHERE name = 'Energie Mobile';

-- EcoFlow
UPDATE prospects SET
  description = 'Batteries nomades, très marketing',
  website = 'https://fr.ecoflow.com'
WHERE name = 'EcoFlow';

-- Truma
UPDATE prospects SET
  description = 'Standard chauffage/chauffe-eau gaz',
  website = 'https://www.truma.com/fr'
WHERE name = 'Truma';

-- Webasto
UPDATE prospects SET
  description = 'Spécialiste chauffage diesel (Air Top)',
  website = 'https://www.webasto-comfort.com'
WHERE name = 'Webasto';

-- Thetford
UPDATE prospects SET
  description = 'Toilettes chimiques & éviers',
  website = 'https://www.thetford-europe.com/fr'
WHERE name = 'Thetford';

-- Thule
UPDATE prospects SET
  description = 'Stores & porte-vélos haut de gamme',
  website = 'https://www.thule.com/fr-fr'
WHERE name = 'Thule';

-- Fiamma
UPDATE prospects SET
  description = 'Accessoires carrosserie (Store/Lanterneau)',
  website = 'https://www.fiamma.it/fr/'
WHERE name = 'Fiamma';

-- Trelino
UPDATE prospects SET
  description = 'Toilettes sèches (écologie/vanlife)',
  website = 'https://www.trelino.com/fr'
WHERE name = 'Trelino';

-- Trobolo
UPDATE prospects SET
  description = 'Toilettes à séparation, design bois',
  website = 'https://trobolo.com/fr'
WHERE name = 'Trobolo';

-- Narbonne Accessoires
UPDATE prospects SET
  description = 'Réseau physique n°1 en France',
  website = 'https://www.narbonneaccessoires.fr'
WHERE name = 'Narbonne Accessoires';

-- Reimo
UPDATE prospects SET
  description = 'Référence européenne (Grossiste)',
  website = 'https://www.reimo.com/fr/'
WHERE name = 'Reimo';

-- Obelink
UPDATE prospects SET
  description = 'Prix discount, énorme stock Europe',
  website = 'https://www.obelink.fr'
WHERE name = 'Obelink';
