/* Données fictives de la boutique de démonstration ÉCLAT HAIR */
const DAY = 86400000;
const IMG = (id) => `img/${id}.jpg`;
const CATEGORIES = [
  { id: 'Nouveautés', img: '38169888', sub: 'Dernières arrivées', test: (p) => p.tags.includes('nouveau') },
  { id: 'Best-sellers', img: '10059921', sub: 'Les plus demandées', test: (p) => p.tags.includes('best') },
  { id: 'Perruques HD', img: '9052358', sub: 'Lace HD invisible', test: (p) => p.tags.includes('hd') },
  { id: 'Body Wave', img: '11757361', sub: 'Ondulations douces', test: (p) => p.texture === 'Body Wave' },
  { id: 'Deep Wave', img: '33141463', sub: 'Boucles profondes', test: (p) => p.texture === 'Deep Wave' },
  { id: 'Straight', img: '17320163', sub: 'Lisses et brillantes', test: (p) => p.texture === 'Straight' },
  { id: 'Perruques colorées', img: '4724468', sub: 'Osez la couleur', test: (p) => p.tags.includes('colore') },
  { id: 'Collections Premium', img: '32767408', sub: 'Édition haut de gamme', test: (p) => p.tags.includes('premium') },
];
const EXTRA_CAT = { id: 'Extensions', test: (p) => p.tags.includes('ext') };
const TEXTURES = ['Body Wave', 'Deep Wave', 'Straight', 'Water Wave', 'Curly', 'Tresses'];
const COULEURS = ['Noir naturel', 'Brun chocolat', 'Miel', 'Bordeaux', 'Blond 613', 'Rose'];
const CHEVEUX = ['Cheveux humains Remy', 'Vierge brésilien', 'Vierge péruvien', 'Fibre premium'];
const LACES = ['HD Lace 13x4', 'HD Lace 13x6', 'Lace Closure 5x5', 'Full Lace', 'Sans lace (U-part)'];
const DENSITES = ['130 %', '150 %', '180 %', '200 %', '250 %'];
const SERVICES_RDV = ['Pose de perruque', 'Personnalisation (coupe, bleaching, baby hair)', 'Coiffure', 'Entretien et lavage'];
const HEURES = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'];
const STATUTS = ['Nouvelle', 'Confirmée', 'En préparation', 'Expédiée', 'Livrée', 'Annulée'];
const VILLES = ['Abidjan', 'Bouaké', 'Yamoussoukro', 'San-Pédro', 'Daloa', 'Korhogo', 'Autre ville'];
const COMMUNES = ['Cocody', 'Yopougon', 'Marcory', 'Treichville', 'Plateau', 'Abobo', 'Adjamé', 'Koumassi', 'Port-Bouët', 'Bingerville', 'Attécoubé'];

const P = (o) => Object.assign({ ancien: 0, dispo: 'auto', promoEnd: 0, tags: [], lace: 'HD Lace 13x4', densite: '180 %', cheveux: 'Cheveux humains Remy' }, o);
function seedProduits() {
  const now = Date.now();
  return [
    P({ id: 'hd-body-wave-24', nom: 'HD Body Wave 24 pouces', texture: 'Body Wave', longueur: 24, couleur: 'Noir naturel', prix: 150000, stock: 8, imgs: ['32213600', '11757361', '10059921'], tags: ['best', 'hd'], desc: 'Notre perruque phare : des ondulations souples et brillantes, une lace HD qui disparaît sur la peau et une densité généreuse. Elle se coiffe, se lisse et se colore sans perdre sa tenue.' }),
    P({ id: 'deep-wave-26', nom: 'Deep Wave 26 pouces', texture: 'Deep Wave', longueur: 26, couleur: 'Noir naturel', prix: 175000, stock: 5, imgs: ['33141463', '20800320', '18644578'], tags: ['best', 'nouveau'], lace: 'HD Lace 13x6', densite: '200 %', desc: 'Des boucles profondes et définies, légères à porter. La lace 13x6 offre une ligne de cheveux naturelle et un grand choix de raies.' }),
    P({ id: 'straight-hd-lace-22', nom: 'Straight HD Lace 22 pouces', texture: 'Straight', longueur: 22, couleur: 'Noir naturel', prix: 135000, stock: 2, imgs: ['10059921', '9052358', '32213600'], tags: ['hd', 'best'], desc: 'Un lisse soyeux et fluide, sans frisottis. Cheveux faciles à entretenir, à porter tous les jours comme pour les grandes occasions.' }),
    P({ id: 'body-wave-premium-28', nom: 'Body Wave Premium 28 pouces', texture: 'Body Wave', longueur: 28, couleur: 'Brun chocolat', prix: 220000, stock: 4, imgs: ['11757361', '32213600', '33141463'], tags: ['premium', 'nouveau', 'hd'], lace: 'HD Lace 13x6', densite: '250 %', cheveux: 'Vierge brésilien', desc: 'Notre collection signature : cheveux vierges sélectionnés, densité 250 % et longueur spectaculaire. Une pièce d\'exception qui se transmet de saison en saison.' }),
    P({ id: 'bob-frange-12', nom: 'Bob Straight Frange 12 pouces', texture: 'Straight', longueur: 12, couleur: 'Brun chocolat', prix: 85000, stock: 9, imgs: ['17320163', '9052358'], tags: ['nouveau'], lace: 'Sans lace (U-part)', densite: '150 %', desc: 'Le bob carré avec frange : chic, pratique et prêt à porter en 2 minutes. Idéal au bureau comme en soirée.' }),
    P({ id: 'deep-wave-bordeaux-28', nom: 'Deep Wave Bordeaux 28 pouces', texture: 'Deep Wave', longueur: 28, couleur: 'Bordeaux', prix: 195000, ancien: 245000, promoEnd: now + 3 * DAY, stock: 3, imgs: ['32767403', '32767408', '33141463'], tags: ['colore', 'premium'], lace: 'HD Lace 13x6', densite: '200 %', desc: 'Une couleur bordeaux profonde et lumineuse, déjà colorée par nos soins. Boucles longues et définies, effet glamour garanti.' }),
    P({ id: 'kinky-curly-18', nom: 'Kinky Curly Afro 18 pouces', texture: 'Curly', longueur: 18, couleur: 'Noir naturel', prix: 120000, stock: 7, imgs: ['18039499', '5085560', '11215202'], tags: ['best'], lace: 'HD Lace 13x4', densite: '180 %', desc: 'Le volume naturel des boucles afro, légères et pleines de vie. Parfaite pour une allure naturelle sans passer des heures chez le coiffeur.' }),
    P({ id: 'blond-613-straight-26', nom: 'Blond 613 Straight 26 pouces', texture: 'Straight', longueur: 26, couleur: 'Blond 613', prix: 185000, stock: 3, imgs: ['6923241', '6923222', '14730872'], tags: ['colore', 'premium', 'hd'], lace: 'HD Lace 13x6', densite: '180 %', desc: 'Le blond 613 lumineux, prêt à colorer ou à porter tel quel. Cheveux souples au toucher soyeux.' }),
    P({ id: 'pixie-curly-10', nom: 'Pixie Curly Naturel 10 pouces', texture: 'Curly', longueur: 10, couleur: 'Miel', prix: 65000, ancien: 80000, promoEnd: now + 2 * DAY + 5 * 3600000, stock: 12, imgs: ['4443925', '18644578'], tags: ['nouveau'], lace: 'Sans lace (U-part)', densite: '150 %', cheveux: 'Fibre premium', desc: 'Une coupe courte bouclée, légère et facile à vivre. Reflets miel pour illuminer le visage.' }),
    P({ id: 'box-braids-30', nom: 'Box Braids Wig 30 pouces', texture: 'Tresses', longueur: 30, couleur: 'Noir naturel', prix: 140000, stock: 0, imgs: ['37600597', '38169888', '5304044'], tags: ['best'], lace: 'Full Lace', densite: '150 %', cheveux: 'Fibre premium', desc: 'Des box braids sur lace, sans les heures de pose. Légères, confortables et prêtes à porter.' }),
    P({ id: 'party-rose-curly-16', nom: 'Party Pink Curly 16 pouces', texture: 'Curly', longueur: 16, couleur: 'Rose', prix: 75000, stock: 6, imgs: ['4724468', '4718638'], tags: ['colore', 'nouveau'], lace: 'Sans lace (U-part)', densite: '180 %', cheveux: 'Fibre premium', desc: 'Pour les soirées, shootings et anniversaires : une perruque rose bouclée qui ne passe pas inaperçue.' }),
    P({ id: 'water-wave-hd-20', nom: 'Water Wave HD 20 pouces', texture: 'Water Wave', longueur: 20, couleur: 'Brun chocolat', prix: 130000, ancien: 160000, promoEnd: now + 3 * DAY, stock: 5, imgs: ['20800320', '33141463', '36624783'], tags: ['hd'], lace: 'HD Lace 13x4', desc: 'Des vagues mouillées naturelles, qui reprennent leur forme après chaque lavage. Fini naturel et brillant.' }),
    P({ id: 'bundles-bresilien-3x', nom: 'Extensions Bresilien Bundles 18-20-22"', texture: 'Body Wave', longueur: 20, couleur: 'Noir naturel', prix: 95000, ancien: 110000, promoEnd: now + 5 * DAY, stock: 15, imgs: ['5159828', '9052358', '10059921'], tags: ['ext', 'best'], lace: 'Sans lace (U-part)', cheveux: 'Vierge brésilien', desc: 'Lot de 3 tissages (18, 20 et 22 pouces) en cheveux vierges brésiliens. Pour poser, coudre ou créer votre propre perruque.' }),
    P({ id: 'closure-hd-5x5', nom: 'Closure HD 5x5 — 16 pouces', texture: 'Straight', longueur: 16, couleur: 'Noir naturel', prix: 45000, stock: 20, imgs: ['9052358', '5159828'], tags: ['ext', 'hd'], lace: 'Lace Closure 5x5', cheveux: 'Vierge brésilien', desc: 'La closure HD 5x5 pour finir vos tissages avec une ligne de cheveux invisible.' }),
  ];
}
function seedOrders() {
  const now = Date.now();
  const mk = (n, jours, nom, tel, ville, commune, liv, lignes, statut) => {
    const sous = lignes.reduce((t, l) => t + l.prix * l.q, 0);
    const frais = liv === 'Retrait en boutique' ? 0 : ville === 'Abidjan' ? 2000 : 5000;
    return { id: n, date: now - jours * DAY - (n % 7) * 3600000, nom, tel, whatsapp: tel, ville, commune, adresse: 'Adresse de livraison', livraison: liv, lignes, sous, frais, total: sous + frais, statut, commentaire: '' };
  };
  return [
    mk(1048, 0, 'Awa Koné', '07 07 00 00 01', 'Abidjan', 'Cocody', 'Livraison à domicile', [{ id: 'hd-body-wave-24', nom: 'HD Body Wave 24 pouces', prix: 150000, q: 1 }], 'Nouvelle'),
    mk(1047, 1, 'Mariam Traoré', '05 05 00 00 02', 'Abidjan', 'Yopougon', 'Retrait en boutique', [{ id: 'deep-wave-26', nom: 'Deep Wave 26 pouces', prix: 175000, q: 1 }], 'Confirmée'),
    mk(1046, 2, 'Nadège Yao', '01 01 00 00 03', 'Bouaké', '—', 'Livraison à domicile', [{ id: 'straight-hd-lace-22', nom: 'Straight HD Lace 22 pouces', prix: 135000, q: 1 }, { id: 'closure-hd-5x5', nom: 'Closure HD 5x5 — 16 pouces', prix: 45000, q: 1 }], 'En préparation'),
    mk(1045, 3, 'Fatou Diallo', '07 08 00 00 04', 'Abidjan', 'Marcory', 'Livraison à domicile', [{ id: 'bob-frange-12', nom: 'Bob Straight Frange 12 pouces', prix: 85000, q: 2 }], 'Expédiée'),
    mk(1044, 4, 'Aïcha Bamba', '05 06 00 00 05', 'Abidjan', 'Cocody', 'Livraison à domicile', [{ id: 'body-wave-premium-28', nom: 'Body Wave Premium 28 pouces', prix: 220000, q: 1 }], 'Livrée'),
    mk(1043, 5, 'Sandrine Kouassi', '07 09 00 00 06', 'Yamoussoukro', '—', 'Livraison à domicile', [{ id: 'kinky-curly-18', nom: 'Kinky Curly Afro 18 pouces', prix: 120000, q: 1 }], 'Livrée'),
    mk(1042, 6, 'Estelle N\'Guessan', '01 02 00 00 07', 'Abidjan', 'Plateau', 'Retrait en boutique', [{ id: 'water-wave-hd-20', nom: 'Water Wave HD 20 pouces', prix: 130000, q: 1 }], 'Livrée'),
    mk(1041, 6, 'Prisca Aka', '05 04 00 00 08', 'Abidjan', 'Abobo', 'Livraison à domicile', [{ id: 'party-rose-curly-16', nom: 'Party Pink Curly 16 pouces', prix: 75000, q: 1 }], 'Annulée'),
  ];
}
function seedRdv() {
  const d = (n) => new Date(Date.now() + n * DAY).toISOString().slice(0, 10);
  return [
    { id: 1, service: 'Pose de perruque', date: d(1), heure: '10:00', nom: 'Awa Koné', tel: '07 07 00 00 01', whatsapp: '07 07 00 00 01', statut: 'Confirmé' },
    { id: 2, service: 'Personnalisation (coupe, bleaching, baby hair)', date: d(1), heure: '14:00', nom: 'Mariam Traoré', tel: '05 05 00 00 02', whatsapp: '05 05 00 00 02', statut: 'En attente' },
    { id: 3, service: 'Coiffure', date: d(2), heure: '11:00', nom: 'Fatou Diallo', tel: '07 08 00 00 04', whatsapp: '07 08 00 00 04', statut: 'Confirmé' },
    { id: 4, service: 'Entretien et lavage', date: d(4), heure: '15:00', nom: 'Aïcha Bamba', tel: '05 06 00 00 05', whatsapp: '05 06 00 00 05', statut: 'En attente' },
  ];
}
function seedAvis() {
  return [
    { id: 1, nom: 'Aïcha B.', ville: 'Cocody', note: 5, texte: 'Très belle qualité et livraison rapide.', visible: true },
    { id: 2, nom: 'Nadège Y.', ville: 'Bouaké', note: 5, texte: 'Ma perruque correspond parfaitement aux photos.', visible: true },
    { id: 3, nom: 'Mariam T.', ville: 'Yopougon', note: 5, texte: 'Service professionnel et très bon accueil.', visible: true },
    { id: 4, nom: 'Sandrine K.', ville: 'Yamoussoukro', note: 4, texte: 'Cheveux très doux, la pose en boutique était parfaite.', visible: false },
  ];
}
function seedSettings() {
  return { boutique: 'ÉCLAT HAIR', whatsapp: '2250503206666', fraisAbidjan: 2000, fraisInterieur: 5000, gratuitDes: 250000, adresse: 'Cocody Riviera 3, Abidjan (adresse fictive)' };
}
