/* Données fictives de la démo LAGUNE AUTO (location de véhicules à Abidjan) — DST Technologie */
const DAY = 86400000;
const IMG = (id) => `img/${id}.jpg`;
const CATS = [
  { id: 'Citadine', img: '20475125', sub: 'Pratique en ville, petit budget' },
  { id: 'Berline', img: '17233277', sub: 'Confort pour vos rendez-vous' },
  { id: 'SUV & 4x4', img: '18029607', sub: 'Routes de l’intérieur, famille' },
  { id: 'Prestige', img: '10638649', sub: 'Mariages, VIP, cérémonies' },
  { id: 'Minibus', img: '36200411', sub: 'Groupes, séminaires, navettes' },
  { id: 'Pick-up', img: '19143577', sub: 'Chantiers et transport' },
];
const LIEUX = [
  { id: 'cocody', nom: 'Agence Cocody (Riviera 3)', frais: 0 },
  { id: 'marcory', nom: 'Agence Marcory (Zone 4)', frais: 0 },
  { id: 'aeroport', nom: 'Aéroport FHB (Port-Bouët)', frais: 10000 },
  { id: 'domicile', nom: 'Livraison à domicile (Abidjan)', frais: 5000 },
];
const OPTIONS = [
  { id: 'assurance', nom: 'Assurance tous risques (franchise réduite)', prix: 7500, parJour: true },
  { id: 'interieur', nom: 'Sortie hors d’Abidjan (intérieur du pays)', prix: 10000, parJour: true },
  { id: 'bebe', nom: 'Siège bébé / rehausseur', prix: 2000, parJour: true },
  { id: 'wifi', nom: 'Wi-Fi 4G embarqué', prix: 3000, parJour: true },
];
const HEURES = ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];
const STATUTS = ['En attente', 'Confirmée', 'En cours', 'Terminée', 'Annulée'];
const PIECES = ['CNI', 'Passeport', 'Carte consulaire', 'Permis de conduire'];
const V = (o) => Object.assign({ boite: 'Automatique', carburant: 'Essence', clim: true, km: 'Kilométrage illimité à Abidjan', statut: 'dispo', chauffeur: 'option', tags: [], caution: 200000 }, o);
function seedFlotte() {
  return [
    V({ id: 'kia-picanto', nom: 'Kia Picanto', cat: 'Citadine', places: 4, annee: 2022, prix: 20000, caution: 100000, imgs: ['20475125', '20475023'], tags: ['populaire'], desc: 'La citadine idéale pour circuler et se garer facilement à Abidjan. Économique, climatisée et boîte automatique.' }),
    V({ id: 'hyundai-eon', nom: 'Hyundai Eon', cat: 'Citadine', places: 5, annee: 2021, prix: 18000, boite: 'Manuelle', caution: 100000, imgs: ['8984923'], desc: 'Petit prix, faible consommation : parfaite pour les courses du quotidien et les trajets en ville.' }),
    V({ id: 'hyundai-elantra', nom: 'Hyundai Elantra', cat: 'Berline', places: 5, annee: 2022, prix: 35000, imgs: ['12206292'], tags: ['populaire'], desc: 'Berline moderne et confortable, écran tactile et caméra de recul. Idéale pour les rendez-vous professionnels.' }),
    V({ id: 'bmw-serie-3', nom: 'BMW Série 3', cat: 'Berline', places: 5, annee: 2021, prix: 60000, caution: 400000, imgs: ['33521845', '30226183'], desc: 'Élégance et sportivité. Une berline premium pour vos déplacements d’affaires ou un week-end à Assinie.' }),
    V({ id: 'mercedes-classe-e', nom: 'Mercedes Classe E', cat: 'Berline', places: 5, annee: 2020, prix: 75000, carburant: 'Diesel', caution: 500000, imgs: ['17233277', '9459158'], tags: ['mariage'], desc: 'Le confort Mercedes pour vos invités, vos clients ou votre cortège de mariage.' }),
    V({ id: 'mercedes-gla', nom: 'Mercedes GLA', cat: 'SUV & 4x4', places: 5, annee: 2021, prix: 65000, caution: 400000, imgs: ['12066299'], desc: 'SUV compact premium : position de conduite haute, finitions soignées et faible encombrement en ville.' }),
    V({ id: 'range-evoque', nom: 'Range Rover Evoque', cat: 'SUV & 4x4', places: 5, annee: 2021, prix: 85000, carburant: 'Diesel', caution: 500000, imgs: ['36359193', '18231626'], desc: 'Le style Range Rover dans un format citadin. Parfait pour se démarquer.' }),
    V({ id: 'land-cruiser-v8', nom: 'Toyota Land Cruiser V8', cat: 'SUV & 4x4', places: 7, annee: 2020, prix: 120000, carburant: 'Diesel', caution: 800000, imgs: ['18029607', '18029615', '18029616', '18029606'], tags: ['populaire', 'mariage'], desc: 'La référence pour les routes de l’intérieur du pays et les missions. 7 places, robuste et très confortable.' }),
    V({ id: 'range-sport', nom: 'Range Rover Sport', cat: 'Prestige', places: 5, annee: 2020, prix: 150000, carburant: 'Diesel', caution: 1000000, imgs: ['31574911', '29082604'], tags: ['mariage'], desc: 'Puissance et prestige : le SUV des grandes occasions et des invités de marque.' }),
    V({ id: 'mercedes-classe-s', nom: 'Mercedes Classe S', cat: 'Prestige', places: 5, annee: 2021, prix: 200000, carburant: 'Diesel', chauffeur: 'inclus', caution: 0, imgs: ['10638649'], tags: ['mariage'], desc: 'Limousine avec chauffeur en tenue. Pour les mariés, les délégations et les visiteurs VIP.' }),
    V({ id: 'mercedes-classe-g', nom: 'Mercedes Classe G', cat: 'Prestige', places: 5, annee: 2019, prix: 250000, chauffeur: 'inclus', caution: 0, imgs: ['3473486'], tags: ['mariage'], desc: 'L’icône. Avec chauffeur, pour une entrée remarquée à votre événement.' }),
    V({ id: 'toyota-hiace', nom: 'Toyota Hiace 15 places', cat: 'Minibus', places: 15, annee: 2019, prix: 70000, boite: 'Manuelle', carburant: 'Diesel', chauffeur: 'inclus', caution: 0, imgs: ['36200411', '19548262'], tags: ['populaire'], desc: 'Minibus avec chauffeur pour vos groupes : séminaires, excursions, transferts d’invités.' }),
    V({ id: 'toyota-granace', nom: 'Toyota Granace VIP', cat: 'Minibus', places: 8, annee: 2022, prix: 140000, carburant: 'Diesel', chauffeur: 'inclus', caution: 0, imgs: ['20940679'], desc: 'Van de luxe à sièges pivotants. Pour vos délégations et transferts aéroport haut de gamme.' }),
    V({ id: 'toyota-hilux', nom: 'Toyota Hilux', cat: 'Pick-up', places: 5, annee: 2022, prix: 70000, boite: 'Manuelle', carburant: 'Diesel', caution: 500000, imgs: ['19143577', '18240251'], desc: 'Pick-up double cabine robuste, pour les chantiers, le transport de matériel et les pistes.' }),
  ];
}
function isoLocal(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
function dayIso(n) { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + n); return isoLocal(d); }
function seedResas() {
  const R = (id, v, s, e, nom, tel, statut, opts = {}) => Object.assign({ id, vehicule: v, debut: dayIso(s), fin: dayIso(e), heure: '09:00', lieu: 'cocody', retour: 'cocody', nom, tel, whatsapp: tel, chauffeur: false, options: [], statut, caution: false, paiement: 'Wave', cree: Date.now() + Math.min(s, 0) * DAY - 3 * DAY }, opts);
  return [
    R(2101, 'land-cruiser-v8', -58, -52, 'Koffi Yao', '07 07 11 22 33', 'Terminée', { chauffeur: true, options: ['interieur'] }),
    R(2102, 'kia-picanto', -45, -38, 'Mariam Traoré', '05 05 22 33 44', 'Terminée'),
    R(2103, 'mercedes-classe-s', -30, -29, 'Aïcha & Serge (mariage)', '01 01 33 44 55', 'Terminée', { lieu: 'domicile' }),
    R(2104, 'hyundai-elantra', -20, -13, 'Société BTP Ivoire', '27 22 44 55 66', 'Terminée', { options: ['assurance'] }),
    R(2105, 'toyota-hiace', -12, -10, 'Église Bethel Yopougon', '07 08 55 66 77', 'Terminée'),
    R(2106, 'range-sport', -6, -4, 'Fatou Diallo', '05 06 66 77 88', 'Terminée', { chauffeur: true }),
    R(2107, 'land-cruiser-v8', -2, 4, 'ONG Santé Plus', '27 21 77 88 99', 'En cours', { chauffeur: true, options: ['interieur', 'assurance'], caution: true }),
    R(2108, 'hyundai-elantra', -1, 2, 'Jean-Marc Kouassi', '07 09 88 99 00', 'En cours', { caution: true }),
    R(2109, 'kia-picanto', 0, 3, 'Nadège Aka', '01 02 99 00 11', 'Confirmée', { lieu: 'aeroport', caution: true }),
    R(2110, 'mercedes-classe-e', 2, 3, 'Mariage Konan', '05 04 10 20 30', 'Confirmée', { lieu: 'domicile' }),
    R(2111, 'mercedes-classe-s', 2, 3, 'Mariage Konan', '05 04 10 20 30', 'Confirmée', { lieu: 'domicile' }),
    R(2112, 'toyota-hilux', 3, 10, 'Chantier Bingerville', '07 01 23 45 67', 'En attente'),
    R(2113, 'bmw-serie-3', 5, 7, 'Arnaud Bamba', '07 07 45 45 45', 'En attente', { options: ['assurance'] }),
    R(2114, 'toyota-granace', 8, 9, 'Délégation Banque CI', '27 20 30 40 50', 'Confirmée', { lieu: 'aeroport' }),
    R(2115, 'range-evoque', 10, 14, 'Prisca N’Guessan', '05 01 02 03 04', 'En attente'),
    R(2116, 'toyota-hiace', 12, 13, 'Séminaire Assinie', '07 77 66 55 44', 'Confirmée', { options: ['interieur'] }),
  ];
}
function seedAvis() {
  return [
    { nom: 'Koffi Y.', role: 'Mission à Korhogo', note: 5, texte: 'Land Cruiser propre, chauffeur ponctuel et prudent. Je réserverai à nouveau pour ma prochaine mission.' },
    { nom: 'Aïcha K.', role: 'Mariage à Cocody', note: 5, texte: 'La Classe S était magnifique et le chauffeur en tenue. Nos invités ont adoré.' },
    { nom: 'Jean-Marc K.', role: 'Location 1 semaine', note: 4, texte: 'Réservation en 5 minutes sur le site, le prix affiché était le bon. Voiture livrée à l’aéroport.' },
  ];
}
function seedSettings() {
  return { nom: 'LAGUNE AUTO', whatsapp: '2250503206666', chauffeurJour: 15000, remises: [{ des: 3, pct: 10 }, { des: 7, pct: 15 }, { des: 30, pct: 25 }], adresse: 'Cocody Riviera 3, Abidjan (adresse fictive)' };
}
