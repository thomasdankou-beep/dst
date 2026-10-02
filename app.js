/* DST Technologie — site vitrine (JavaScript vanilla, sans dépendance).
   Le contenu HTML se trouve dans <template id="tpl"> (index.html) ; ce fichier contient
   les données (services, secteurs…), l'état de la page et un petit moteur de gabarit. */
"use strict";

/* ============ 1. DONNÉES ============ */
const WA_NUM = '2250503206666';
const OPTIONS = { formMode: 'Multi-étapes', servicesLayout: 'Grille', mobileBar: true }; // formMode : 'Multi-étapes' | 'Page unique' ; servicesLayout : 'Grille' (cartes illustrées) | 'Onglets'
const PRICE_WEB_UNTIL = '31 décembre 2026'; // date de fin de l'offre promotionnelle
const PRICE_WEB = '50 000 FCFA'; // prix promotionnel d'un site vitrine (affiché : carte du service et page Services)
const IMG_V = '3'; // changez ce chiffre après avoir remplacé une photo (évite l'ancienne image en mémoire)
const IMG_EXT = ['jpg', 'jpeg', 'png', 'webp']; // photos : assets/images/<id>.jpg (voir LISEZ-MOI)

const SERVICES = [
  { id: 'web', label: 'Site web', title: 'Création de sites web', long: 'Un site qui présente clairement votre activité, inspire confiance et transforme vos visiteurs en clients, sur mobile comme sur ordinateur.', features: ['Design aux couleurs de votre marque', 'Affichage optimisé pour le mobile', 'Boutons d’appel et WhatsApp intégrés', 'Bases du référencement Google'] },
  { id: 'ecommerce', label: 'E-commerce', title: 'E-commerce', long: 'Une boutique en ligne où vos clients parcourent votre catalogue, commandent et paient à toute heure, sans attendre votre réponse.', features: ['Catalogue produits avec photos et prix', 'Panier et commande en ligne', 'Paiement mobile money et carte', 'Suivi des commandes et livraisons'] },
  { id: 'reservation', label: 'Réservation en ligne', title: 'Réservation en ligne', long: 'Fini les allers-retours de messages : vos clients choisissent la prestation et le créneau, vous recevez une réservation confirmée.', features: ['Agenda de vos disponibilités', 'Confirmation de rendez-vous', 'Acompte en ligne en option', 'Historique des réservations'] },
  { id: 'paiement', label: 'Paiement en ligne', title: 'Paiement en ligne', long: 'Encaissez directement sur votre site avec les moyens de paiement que vos clients utilisent déjà au quotidien.', listTitle: 'Moyens de paiement intégrés', features: ['Wave', 'Orange Money', 'MTN Money', 'Moov Money', 'Carte bancaire'] },
  { id: 'digitalisation', label: 'Digitalisation', title: 'Digitalisation des entreprises', long: 'Cahiers, fichiers Excel, messages éparpillés : nous transformons vos tâches manuelles en outils simples qui vous font gagner du temps.', features: ['Analyse de vos processus actuels', 'Formulaires et tableaux de bord', 'Automatisation des tâches répétitives', 'Prise en main accompagnée'] },
  { id: 'crm', label: 'CRM & gestion clients', title: 'CRM & gestion clients', long: 'Retrouvez en un instant l’historique de chaque client : ses commandes, ses paiements, ses rendez-vous et vos échanges.', features: ['Fiches clients centralisées', 'Suivi des commandes et paiements', 'Historique des rendez-vous', 'Relances et fidélisation'] },
  { id: 'surmesure', label: 'Solution sur mesure', title: 'Solutions sur mesure', long: 'Votre activité a ses propres règles. Nous concevons la plateforme qui les respecte, de l’idée à la mise en ligne.', features: ['Étude détaillée de vos besoins', 'Plateformes web et outils métier', 'Évolutions au rythme de votre croissance', 'Accompagnement après le lancement'] },
  { id: 'seo', label: 'SEO / Référencement', title: 'SEO / Référencement', long: 'Nous améliorons la visibilité de votre entreprise sur Google pour que les clients qui cherchent vos services vous trouvent, vous.', features: ['Audit de votre visibilité', 'Optimisation des pages et contenus', 'Fiche d’établissement Google', 'Suivi du positionnement'] },
];
const SHORT = {
  web: 'Sites vitrines modernes, rapides et optimisés.',
  ecommerce: 'Présentez et vendez vos produits en ligne, à toute heure.',
  reservation: 'Vos clients prennent rendez-vous directement depuis votre site.',
  paiement: 'Wave, Orange Money, MTN Money, Moov Money et carte bancaire.',
  digitalisation: 'Vos processus manuels deviennent des outils numériques.',
  crm: 'Clients, commandes, paiements et rendez-vous au même endroit.',
  surmesure: 'Des plateformes adaptées aux besoins spécifiques de votre entreprise.',
  seo: 'Améliorez la visibilité de votre entreprise sur Google.',
};
SERVICES.forEach((x) => { x.short = SHORT[x.id]; });
SERVICES.find((x) => x.id === 'web').price = PRICE_WEB;
const PAYS = [
  { label: 'Wave', color: '#1DC8F2' },
  { label: 'Orange Money', color: '#FF7900' },
  { label: 'MTN Money', color: '#FFCC00' },
  { label: 'Moov Money', color: '#0093DD' },
  { label: 'Carte bancaire', color: '#2A3A8C' },
];
const CONSEIL = { id: 'conseil', label: 'Je ne sais pas encore, conseillez-moi', title: 'À définir avec un conseiller' };
const SECTORS = [
  { name: 'Commerçants', hint: 'Catalogue, commandes et paiement mobile' },
  { name: 'Salons de coiffure', hint: 'Réservation et acompte en ligne' },
  { name: 'Vendeuses de perruques', hint: 'Boutique en ligne et livraison' },
  { name: 'Boutiques', hint: 'Vente en ligne et fidélisation' },
  { name: 'Prestataires événementiels', hint: 'Vitrine, galerie et demandes de devis' },
  { name: 'Entreprises', hint: 'Digitalisation et outils sur mesure' },
  { name: 'Restaurateurs', hint: 'Menu en ligne et commandes' },
  { name: 'Professionnels indépendants', hint: 'Site vitrine et prise de rendez-vous' },
  { name: 'Entrepreneurs', hint: 'Lancement de votre activité en ligne' },
];
const ICO = (p, n = 22) => `<svg width="${n}" height="${n}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
const SECTOR_ICONS = [
  ICO('<path d="M3 9l1.5-5h15L21 9"/><path d="M4 9v11h16V9"/><path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0"/>'),                                   // commerçants
  ICO('<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4 8.12 15.88"/><path d="M14.47 14.48 20 20"/><path d="M8.12 8.12 12 12"/>'),       // salons de coiffure
  ICO('<path d="M5 14V10a7 7 0 0 1 14 0v4"/><path d="M5 14c0 3 1 5 3 6"/><path d="M19 14c0 3-1 5-3 6"/><path d="M9 11c2 0 4-1 6-3"/>'),                             // perruques
  ICO('<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>'),                                      // boutiques
  ICO('<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 15l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z"/>'),                            // événementiel
  ICO('<rect x="5" y="3" width="14" height="18" rx="1"/><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2"/><path d="M10 21v-3h4v3"/>'),                     // entreprises
  ICO('<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>'),                        // restaurateurs
  ICO('<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>'),                                                // indépendants
  ICO('<path d="M12 2c3 2 5 6 5 10l-2 3H9l-2-3c0-4 2-8 5-10z"/><circle cx="12" cy="9" r="1.5"/><path d="M9 15l-2 4 3-1"/><path d="M15 15l2 4-3-1"/>'),             // entrepreneurs
];
SECTORS.forEach((x, i) => { x.icon = SECTOR_ICONS[i]; });
const BUDGETS = ['Moins de 100 000 FCFA', '100 000 – 300 000 FCFA', '300 000 – 750 000 FCFA', '750 000 – 1 500 000 FCFA', 'Plus de 1 500 000 FCFA', 'Je ne sais pas encore'];
const DELAIS = ['Dès que possible', 'Dans le mois', 'Dans les 3 mois', 'Pas de date précise'];
const SITES = ['Oui', 'Non', 'Réseaux sociaux uniquement'];
const PREFS = ['WhatsApp', 'Appel', 'Email'];
const STEP_LABELS = ['Besoin', 'Activité', 'Budget', 'Coordonnées'];
const PAGES = ['accueil', 'services', 'realisations', 'contact'];
const TITLES = {
  accueil: 'DST Technologie — Votre partenaire digital',
  services: 'Services — DST Technologie',
  realisations: 'Réalisations — DST Technologie',
  contact: 'Contact & devis — DST Technologie',
};
const CASES = {
  salon: ['reservation', 'paiement', 'crm'],
  perruques: ['ecommerce', 'paiement'],
  restaurant: ['ecommerce', 'paiement'],
  evenementiel: ['web', 'crm'],
  boutique: ['crm', 'digitalisation'],
  entreprise: ['surmesure', 'digitalisation'],
};
const emptyForm = () => ({ services: [], secteur: '', description: '', site: '', budget: '', delai: '', nom: '', entreprise: '', tel: '', email: '', pref: 'WhatsApp' });

/* ============ 2. ÉTAT ============ */
let state = { tab: 0, page: 'accueil', w: window.innerWidth || 1280, menuOpen: false, step: 0, sent: false, errors: {}, form: emptyForm(), demo: { step: 0, pay: '' }, mail: { status: '' } };
const formRef = { current: null };
let pendingScroll = null;

function setState(patch, after) {
  state = Object.assign({}, state, typeof patch === 'function' ? patch(state) : patch);
  render();
  if (after) after();
}

/* ============ 3. NAVIGATION ============ */
function route() {
  const seg = (window.location.hash || '').replace(/^#\/?/, '').split(/[/?]/)[0];
  return PAGES.includes(seg) ? seg : 'accueil';
}
function syncRoute(scroll) {
  const page = route();
  document.title = TITLES[page];
  setState({ page, menuOpen: false }, () => {
    if (pendingScroll) {
      const id = pendingScroll;
      pendingScroll = null;
      window.scrollTo({ top: 0, behavior: 'instant' });
      requestAnimationFrame(() => scrollToId('svc-' + id));
    } else if (scroll) {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  });
}
function go(page) {
  const target = page === 'accueil' ? '#/' : '#/' + page;
  const current = window.location.hash || '#/';
  if (current === target) syncRoute(true);
  else window.location.hash = target;
}
function scrollToId(id) {
  const el = document.getElementById(id);
  if (!el) return;
  window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 90, behavior: 'smooth' });
}
function openService(id) {
  if (state.page === 'services') { scrollToId('svc-' + id); return; }
  pendingScroll = id;
  go('services');
}
function goDevis(services) {
  setState(s => ({ mail: { status: '' }, step: 0, sent: false, errors: {}, menuOpen: false, form: services ? Object.assign({}, s.form, { services: services.slice() }) : s.form }));
  go('contact');
}

/* ============ 4. FORMULAIRE DE DEVIS ============ */
function setField(k, v) {
  const hadError = !!state.errors[k];
  state.form = Object.assign({}, state.form, { [k]: v });
  if (hadError) setState({ errors: Object.assign({}, state.errors, { [k]: '' }) });
}
function setFieldNow(k, v) { // pour les choix (boutons radio) : met aussi l'affichage à jour
  setState(s => ({ form: Object.assign({}, s.form, { [k]: v }), errors: Object.assign({}, s.errors, { [k]: '' }) }));
}
function toggleService(id) {
  setState(s => {
    const cur = s.form.services;
    const next = cur.includes(id) ? cur.filter(x => x !== id) : cur.concat(id);
    return { form: Object.assign({}, s.form, { services: next }), errors: Object.assign({}, s.errors, { services: '' }) };
  });
}
function validate(steps) {
  const f = state.form, e = {};
  if (steps.includes(0) && !f.services.length) e.services = 'Choisissez au moins une option.';
  if (steps.includes(1) && !f.secteur) e.secteur = 'Indiquez votre secteur d’activité.';
  if (steps.includes(3)) {
    if (f.nom.trim().length < 2) e.nom = 'Indiquez votre nom.';
    if (f.tel.replace(/\D/g, '').length < 8) e.tel = 'Indiquez un numéro valide, par exemple 05 03 20 66 66.';
    if (f.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) e.email = 'Cette adresse email semble incomplète.';
  }
  setState({ errors: e });
  return Object.keys(e).length === 0;
}
function toFormTop() {
  const el = formRef.current;
  if (!el) return;
  const top = el.getBoundingClientRect().top;
  if (top < 80) window.scrollTo({ top: top + window.scrollY - 100, behavior: 'smooth' });
}
function nextStep() {
  if (!validate([state.step])) return;
  setState(s => ({ step: Math.min(3, s.step + 1) }), toFormTop);
}
function prevStep() {
  setState(s => ({ step: Math.max(0, s.step - 1), errors: {} }), toFormTop);
}
function submitForm(single) {
  if (!validate(single ? [0, 1, 2, 3] : [3])) return;
  setState({ sent: true, mail: { status: '' } }, toFormTop);
}
/* --- Envoi de la demande par e-mail ---
   1) on essaie devis.php (hébergement avec PHP) ; 2) sinon on propose d'ouvrir l'application e-mail du client,
   avec le message déjà rédigé (lien mailto:). */
const DST_EMAIL = 'infos@dsttechnologie.com';
function mailtoHref() {
  const f = state.form;
  const corps = 'Bonjour DST Technologie, je souhaite recevoir un devis.\n\n' + recapRows().map(r => r.k + ' : ' + r.v).join('\n');
  return 'mailto:' + DST_EMAIL + '?subject=' + encodeURIComponent('Demande de devis - ' + (f.entreprise.trim() || f.nom.trim() || 'site web')) +
    '&body=' + encodeURIComponent(corps.replace(/\n/g, '\r\n'));
}
async function sendDevisMail() {
  if (state.mail.status === 'sending' || state.mail.status === 'sent') return;
  setState({ mail: { status: 'sending' } });
  const f = state.form;
  try {
    const res = await fetch('devis.php', { method: 'POST', body: JSON.stringify({
      nom: f.nom.trim(), entreprise: f.entreprise.trim(), telephone: f.tel.trim(), email: f.email.trim(), rows: recapRows()
    }) });
    let r = null; try { r = await res.json(); } catch (e) { /* réponse non JSON : pas de PHP */ }
    if (res.ok && r && r.ok === true) { setState({ mail: { status: 'sent', copie: r.copie === true } }); return; }
    throw new Error(r && r.error ? r.error : 'HTTP ' + res.status);
  } catch (err) {
    setState({ mail: { status: 'fallback', reason: err.message } });
  }
}

function svcTitle(id) {
  if (id === CONSEIL.id) return CONSEIL.title;
  const s = SERVICES.find(x => x.id === id);
  return s ? s.title : id;
}
function recapRows() {
  const f = state.form;
  return [
    ['Besoin', f.services.map(svcTitle).join(', ')],
    ['Secteur', f.secteur],
    ['Projet', f.description.trim()],
    ['Site actuel', f.site],
    ['Budget', f.budget],
    ['Délai', f.delai],
    ['Nom', f.nom.trim()],
    ['Entreprise', f.entreprise.trim()],
    ['Téléphone', f.tel.trim()],
    ['Email', f.email.trim()],
    ['Contact préféré', f.pref],
  ].filter(r => r[1]).map(([k, v]) => ({ k, v }));
}

/* ============ DÉMO INTERACTIVE (page d'accueil) ============
   Le visiteur peut « commander » sur le faux téléphone ; sans action de sa part, la démo se joue toute seule. */
let demoManual = false, demoTimer = null, pressedAt = 0;
const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function demoSet(step, pay) { setState({ demo: { step, pay: pay || '' } }); }
function demoTick() {
  clearTimeout(demoTimer);
  const busy = demoManual || state.page !== 'accueil' || document.hidden || window.scrollY > 900 || Date.now() - pressedAt < 1200 || document.querySelector('.phone:hover');
  if (demoManual) return;
  if (busy) { demoTimer = setTimeout(demoTick, 1500); return; }
  const d = state.demo;
  if (d.step === 0) { demoSet(1); demoTimer = setTimeout(demoTick, 2300); }
  else if (d.step === 1) { demoSet(2, 'Wave'); demoTimer = setTimeout(demoTick, 4600); }
  else { demoSet(0); demoTimer = setTimeout(demoTick, 3200); }
}

/* ============ 5. VALEURS UTILISÉES PAR LE GABARIT ============ */
function computeVals() {
  const s = state, f = s.form, p = s.page;
  const single = OPTIONS.formMode === 'Page unique';
  const desktop = s.w >= 960;

  const cur = {};
  PAGES.forEach(k => { cur[k] = p === k ? 'page' : 'false'; });
  const open = {};
  SERVICES.forEach(x => { open[x.id] = (e) => { if (e && e.preventDefault) e.preventDefault(); openService(x.id); }; });
  const caseDevis = {};
  Object.keys(CASES).forEach(k => { caseDevis[k] = () => goDevis(CASES[k]); });

  const services = SERVICES.map((x, i) => Object.assign({}, x, {
    num: String(i + 1).padStart(2, '0'),
    domId: 'svc-' + x.id,
    listTitle: x.listTitle || 'Ce que comprend ce service',
    devis: () => goDevis([x.id]),
    open: (e) => { if (e && e.preventDefault) e.preventDefault(); openService(x.id); },
  }));
  const svcIndex = services.map(x => ({ num: x.num, title: x.title, jump: () => scrollToId(x.domId) }));

  const tile = (on) => ({
    cls: on ? 'is-on' : '',
    bd: on ? 'var(--color-accent)' : 'var(--color-divider)',
    bg: on ? 'var(--color-accent-100)' : 'transparent',
  });
  const svcOpts = SERVICES.concat([CONSEIL]).map(o => {
    const on = f.services.includes(o.id);
    return Object.assign({
      label: o.label, selected: on, aria: on ? 'true' : 'false',
      boxBd: on ? 'var(--color-accent)' : 'var(--color-neutral-500)',
      boxBg: on ? 'var(--color-accent)' : 'transparent',
      toggle: () => toggleService(o.id),
    }, tile(on));
  });
  const radios = (key, list) => list.map(label => {
    const on = f[key] === label;
    return Object.assign({ label, checked: on, pick: () => setFieldNow(key, label) }, tile(on));
  });

  const on = {};
  ['description', 'nom', 'entreprise', 'tel', 'email'].forEach(k => { on[k] = (e) => setField(k, e.target.value); });
  const err = {}, hasErr = {}, bdr = {};
  ['services', 'secteur', 'nom', 'tel', 'email'].forEach(k => {
    err[k] = s.errors[k] || '';
    hasErr[k] = !!s.errors[k];
    bdr[k] = s.errors[k] ? 'var(--color-accent-700)' : 'var(--color-divider)';
  });

  const steps = STEP_LABELS.map((label, i) => {
    const now = i === s.step, done = i < s.step;
    return {
      num: '0' + (i + 1), label, cls: now ? 'is-now' : done ? 'is-done' : '',
      bar: now ? 'var(--color-accent)' : done ? 'var(--color-accent-2)' : 'var(--color-divider)',
      fg: now || done ? 'var(--color-text)' : 'var(--color-neutral-700)',
    };
  });
  const vis = (i) => !s.sent && (single || s.step === i);

  const recap = recapRows();
  const msg = 'Bonjour DST Technologie, je souhaite recevoir un devis.\n' + recap.map(r => r.k + ' : ' + r.v).join('\n');
  const firstName = f.nom.trim().split(/\s+/)[0] || '';
  const tabs = SERVICES.map((x, i) => {
    const a = i === s.tab;
    return { num: String(i + 1).padStart(2, '0'), title: x.title, cls: a ? 'is-on' : '', aria: a ? 'true' : 'false', bg: a ? 'var(--color-accent-100)' : 'transparent', fg: a ? 'var(--color-accent-800)' : 'var(--color-text)', bar: a ? 'inset 6px 0 0 var(--color-accent)' : 'none', pick: () => setState({ tab: i }) };
  });
  const tx = SERVICES[s.tab] || SERVICES[0];

  const dm = s.demo;
  const demo = {
    s0: dm.step === 0, s1: dm.step === 1, s2: dm.step === 2, notS2: dm.step !== 2,
    payLabel: dm.pay,
    start: () => { demoManual = true; demoSet(1); },
    reset: () => { demoManual = true; demoSet(0); },
    pays: PAYS.map(x => ({ label: x.label, color: x.color, pick: () => { demoManual = true; demoSet(2, x.label); } })),
  };

  const price = { web: PRICE_WEB, until: PRICE_WEB_UNTIL };

  return {
    demo, price,
    isHome: p === 'accueil', isServices: p === 'services', isReal: p === 'realisations', isContact: p === 'contact',
    showClose: p !== 'contact',
    desktop, mobile: !desktop,
    menuOpen: s.menuOpen, menuClosed: !s.menuOpen, menuPanel: s.menuOpen && !desktop, menuAria: s.menuOpen ? 'true' : 'false',
    toggleMenu: () => setState(st => ({ menuOpen: !st.menuOpen })),
    closeMenu: () => setState({ menuOpen: false }),
    cur, open, caseDevis,
    goDevis: () => goDevis(),
    sectors: SECTORS,
    services, svcIndex,
    formRef,
    single,
    steps,
    show: { stepper: !single && !s.sent, s1: vis(0), s2: vis(1), s3: vis(2), s4: vis(3) },
    svcOpts,
    sectorOpts: radios('secteur', SECTORS.map(x => x.name).concat('Autre secteur')),
    siteOpts: radios('site', SITES),
    budgetOpts: radios('budget', BUDGETS),
    delaiOpts: radios('delai', DELAIS),
    prefOpts: PREFS.map(label => ({ label, cls: f.pref === label ? 'is-on' : '', checked: f.pref === label, pick: () => setFieldNow('pref', label) })),
    f, on, err, hasErr, bdr,
    nav: {
      bar: !s.sent,
      back: !single && !s.sent && s.step > 0,
      noBack: !s.sent && (single || s.step === 0),
      next: !single && !s.sent && s.step < 3,
      submit: !s.sent && (single || s.step === 3),
    },
    next: nextStep,
    back: prevStep,
    submit: () => submitForm(single),
    sent: s.sent,
    greet: firstName ? ' ' + firstName : '',
    recap,
    waDevis: 'https://wa.me/' + WA_NUM + '?text=' + encodeURIComponent(msg),
    mail: {
      sent: s.mail.status === 'sent', fallback: s.mail.status === 'fallback',
      off: s.mail.status === 'sending' || s.mail.status === 'sent',
      label: s.mail.status === 'sending' ? 'Envoi en cours…' : s.mail.status === 'sent' ? 'Envoyé par e-mail ✓' : 'Envoyer par e-mail',
      copieMsg: s.mail.copie ? ' Une confirmation a été envoyée à ' + f.email.trim() + ' (pensez à vérifier vos courriers indésirables).' : '',
      href: mailtoHref(),
      send: sendDevisMail,
    },
    edit: () => setState({ sent: false, mail: { status: '' }, step: single ? 0 : 3 }),
    svcTabs: OPTIONS.servicesLayout === 'Onglets',
    svcGrid: OPTIONS.servicesLayout !== 'Onglets',
    tabs,
    tabSel: { num: String((s.tab || 0) + 1).padStart(2, '0'), title: tx.title, long: tx.long, price: tx.price || '', priceUntil: tx.price ? PRICE_WEB_UNTIL : '', features: tx.features, devis: () => goDevis([tx.id]), more: (e) => { if (e && e.preventDefault) e.preventDefault(); openService(tx.id); } },
    showMobileBar: OPTIONS.mobileBar && !desktop,
  };
}

/* ============ 6. MOTEUR DE GABARIT ============
   Lit <template id="tpl"> et produit le DOM : <sc-if value>, <sc-for list as>, {{ chemin.valeur }},
   onClick / onChange, style-hover, ref. */
const BIND = /\{\{\s*([^}]*?)\s*\}\}/g;
const SINGLE = /^\s*\{\{\s*([^}]*?)\s*\}\}\s*$/;

function lookup(expr, scope) {
  if (expr === 'true') return true;
  if (expr === 'false') return false;
  let v = scope;
  for (const k of expr.split('.')) { if (v == null) return undefined; v = v[k]; }
  return v;
}
const truthy = (v) => !!v && v !== 'false';
const interpolate = (str, scope) => str.replace(BIND, (_, e) => { const v = lookup(e, scope); return v == null || v === false ? '' : String(v); });

const slotCache = new Map();   // les photos déjà construites sont réutilisées à chaque affichage (pas de clignotement)
const keepCache = new Map();
let usedSlots = new Set(), keepUsed = new Set();

function makeSlot(el, id) { // remplace <image-slot id="…"> : affiche assets/images/<id>.(jpg|png|webp) s'il existe, sinon un cadre vide
  const box = document.createElement('div');
  box.style.cssText = 'position:relative;width:100%;height:100%;display:flex;align-items:center;justify-content:center;text-align:center;padding:16px;box-sizing:border-box;font-size:14px;color:var(--ink-3);background:var(--soft);';
  const cap = document.createElement('span');
  cap.textContent = el.getAttribute('placeholder') || el.getAttribute('alt') || '';
  box.appendChild(cap);
  const img = document.createElement('img');
  img.alt = el.getAttribute('alt') || '';
  img.decoding = 'async';
  if (el.getAttribute('eager') === null) img.loading = 'lazy';
  img.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:0;transition:opacity .5s;';
  if (el.getAttribute('pos')) img.style.objectPosition = el.getAttribute('pos');
  let i = 0;
  img.onload = () => { img.style.opacity = '1'; cap.style.display = 'none'; };
  img.onerror = () => { i++; if (i < IMG_EXT.length) img.src = 'assets/images/' + id + '.' + IMG_EXT[i] + '?v=' + IMG_V; };
  img.src = 'assets/images/' + id + '.' + IMG_EXT[0] + '?v=' + IMG_V;
  box.appendChild(img);
  return box;
}
function imageSlot(el) {
  const id = el.getAttribute('id') || '';
  const first = !!id && !usedSlots.has(id);
  if (first) { usedSlots.add(id); if (slotCache.has(id)) return slotCache.get(id); }
  const box = makeSlot(el, id);
  if (first) slotCache.set(id, box);
  return box;
}

function applyHover(el, css) {
  const decls = css.split(';').map(d => d.trim()).filter(Boolean).map(d => { const i = d.indexOf(':'); return [d.slice(0, i).trim(), d.slice(i + 1).trim()]; });
  let saved = null;
  el.addEventListener('pointerenter', (e) => {
    if (e.pointerType && e.pointerType !== 'mouse') return;
    saved = decls.map(([p]) => [p, el.style.getPropertyValue(p)]);
    decls.forEach(([p, v]) => el.style.setProperty(p, v));
  });
  el.addEventListener('pointerleave', () => {
    if (saved) saved.forEach(([p, v]) => v ? el.style.setProperty(p, v) : el.style.removeProperty(p));
    saved = null;
  });
}

function build(node, scope, out) {
  if (node.nodeType === 3) { out.appendChild(document.createTextNode(interpolate(node.nodeValue, scope))); return; }
  if (node.nodeType !== 1) return;
  const tag = node.localName;
  if (tag === 'sc-if') {
    if (truthy(lookup((node.getAttribute('value') || '').replace(BIND, '$1').trim(), scope))) node.childNodes.forEach(c => build(c, scope, out));
    return;
  }
  if (tag === 'sc-for') {
    const list = lookup((node.getAttribute('list') || '').replace(BIND, '$1').trim(), scope) || [];
    const as = node.getAttribute('as');
    list.forEach(item => {
      const child = Object.create(scope);
      child[as] = item;
      node.childNodes.forEach(c => build(c, child, out));
    });
    return;
  }
  if (tag === 'image-slot') { out.appendChild(imageSlot(node)); return; }

  // data-keep="clé" : élément statique construit une seule fois puis réutilisé (logo, etc.)
  const keepKey = node.getAttribute('data-keep');
  let keepFirst = false;
  if (keepKey && !keepUsed.has(keepKey)) {
    keepUsed.add(keepKey); keepFirst = true;
    if (keepCache.has(keepKey)) { out.appendChild(keepCache.get(keepKey)); return; }
  }

  const el = node.namespaceURI === 'http://www.w3.org/1999/xhtml' ? document.createElement(tag) : document.createElementNS(node.namespaceURI, tag);
  let hover = null, ref = null;
  for (const a of Array.from(node.attributes)) {
    const name = a.name, val = a.value;
    if (name.startsWith('hint-placeholder')) continue;
    if (name === 'style-hover') { hover = val; continue; }
    const single = SINGLE.exec(val);
    if (name === 'ref' && single) { ref = lookup(single[1], scope); continue; }
    if (name === 'data-keep') continue;
    if (name === 'disabled' && single) { if (truthy(lookup(single[1], scope))) el.disabled = true; continue; }
    if (name === 'data-html' && single) { el.innerHTML = String(lookup(single[1], scope) ?? ''); continue; }
    if (name === 'onclick' && single) { const fn = lookup(single[1], scope); if (fn) el.addEventListener('click', fn); continue; }
    if (name === 'onchange' && single) {
      const fn = lookup(single[1], scope);
      if (fn) el.addEventListener(el.type === 'radio' || el.type === 'checkbox' ? 'change' : 'input', fn);
      continue;
    }
    if ((name === 'checked') && single) { el.checked = truthy(lookup(single[1], scope)); continue; }
    if (name === 'value' && single && 'value' in el) { el.value = String(lookup(single[1], scope) ?? ''); continue; }
    el.setAttribute(name, val.indexOf('{{') >= 0 ? interpolate(val, scope) : val);
  }
  node.childNodes.forEach(c => build(c, scope, el));
  if (el.tagName === 'TEXTAREA' && node.getAttribute('value')) el.value = interpolate(node.getAttribute('value'), scope);
  if (hover) applyHover(el, hover);
  if (ref) ref.current = el;
  if (keepFirst) keepCache.set(keepKey, el);
  out.appendChild(el);
}

/* ============ 7. AFFICHAGE ============ */
let templateRoot = null, appEl = null;
let lastPage = null, io = null;
const revealed = new Set();   // rang des blocs déjà apparus (pour ne pas rejouer l'animation à chaque clic)
const openFaq = new Set();    // questions de la FAQ ouvertes

function setupReveal() {
  const nodes = Array.from(appEl.querySelectorAll('.rv'));
  if (lastPage !== state.page) { revealed.clear(); lastPage = state.page; }
  if (io) { io.disconnect(); io = null; }
  nodes.forEach((n, i) => { if (revealed.has(i)) n.classList.add('in'); });
  const rest = nodes.filter((n, i) => !revealed.has(i));
  if (!('IntersectionObserver' in window)) { rest.forEach(n => n.classList.add('in')); return; }
  io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      revealed.add(nodes.indexOf(e.target));
      io.unobserve(e.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  rest.forEach(n => io.observe(n));
}

function render() {
  if (!templateRoot) return;
  // On retient l'élément actif (son rang parmi les éléments de même type) pour le retrouver après l'affichage
  const ae = document.activeElement;
  let focus = null;
  if (ae && appEl.contains(ae)) {
    focus = { tag: ae.tagName, index: Array.from(appEl.querySelectorAll(ae.tagName)).indexOf(ae) };
    if (typeof ae.selectionStart === 'number') { try { focus.s = ae.selectionStart; focus.e = ae.selectionEnd; } catch (e) {} }
  }
  const y = window.scrollY;
  usedSlots = new Set(); keepUsed = new Set();
  const frag = document.createDocumentFragment();
  const scope = computeVals();
  templateRoot.childNodes.forEach(c => build(c, scope, frag));
  appEl.replaceChildren(frag);
  setupReveal();
  appEl.querySelectorAll('details[data-k]').forEach(d => { if (openFaq.has(d.dataset.k)) d.open = true; });
  if (window.scrollY !== y) window.scrollTo({ top: y, behavior: 'instant' });
  if (focus && focus.index >= 0) {
    const el = appEl.querySelectorAll(focus.tag)[focus.index];
    if (el) {
      el.focus({ preventScroll: true });
      if (focus.s != null) { try { el.setSelectionRange(focus.s, focus.e); } catch (e) {} }
    }
  }
}

/* ============ 8. DÉMARRAGE ============ */
document.addEventListener('DOMContentLoaded', () => {
  appEl = document.getElementById('app');
  templateRoot = document.getElementById('tpl').content;
  appEl.addEventListener('toggle', (e) => { const d = e.target; if (d && d.matches && d.matches('details[data-k]')) { if (d.open) openFaq.add(d.dataset.k); else openFaq.delete(d.dataset.k); } }, true);
  // pendant un clic ou un appui, la démo automatique attend (sinon le clic pourrait se perdre)
  ['pointerdown', 'keydown'].forEach((t) => document.addEventListener(t, () => { pressedAt = Date.now(); }, true));
  window.addEventListener('hashchange', () => syncRoute(true));
  window.addEventListener('resize', () => {
    const wasDesktop = state.w >= 960, w = window.innerWidth;
    state.w = w;
    if ((w >= 960) !== wasDesktop) render(); // on ne reconstruit la page que si l'on change de mise en page (mobile / ordinateur)
  });
  syncRoute(false);
  if (!reducedMotion) demoTimer = setTimeout(demoTick, 3500);
});
