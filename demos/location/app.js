/* LAGUNE AUTO — démo location de véhicules : vitrine, recherche par dates, fiche véhicule, réservation, WhatsApp */
'use strict';
const KEY = 'lagune-auto-demo-v1';
let db;
const fresh = () => ({ flotte: seedFlotte(), resas: seedResas(), avis: seedAvis(), settings: seedSettings(), nextResa: 2117, search: null });
function load() {
  try { const d = JSON.parse(localStorage.getItem(KEY)); if (d && Array.isArray(d.flotte) && Array.isArray(d.resas) && d.settings) return d; } catch (e) {}
  return fresh();
}
function persist() { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) { toast('Mémoire du navigateur pleine : photos trop lourdes.'); } }

/* ---------- Outils ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' F CFA';
const digits = (s) => String(s || '').replace(/\D/g, '');
const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const parseISO = (s) => { const [y, m, d] = String(s).split('-').map(Number); return new Date(y, (m || 1) - 1, d || 1, 12); };
const addDays = (s, n) => { const d = parseISO(s); d.setDate(d.getDate() + n); return isoLocal(d); };
const nights = (a, b) => (a && b ? Math.round((parseISO(b) - parseISO(a)) / DAY) : 0);
const today = () => dayIso(0);
const dFr = (s, o = { weekday: 'short', day: 'numeric', month: 'short' }) => parseISO(s).toLocaleDateString('fr-FR', o);
const dNum = (s) => parseISO(s).toLocaleDateString('fr-FR');
const hh = (h) => h.replace(':', ' h ').replace(' h 00', ' h');
const imgSrc = (x) => (/^(data:|img\/|https?:)/.test(x) ? x : IMG(x));
const veh = (id) => db.flotte.find((v) => v.id === id);
const lieu = (id) => LIEUX.find((l) => l.id === id) || LIEUX[0];
const ICO = {
  seat: '<path d="M7 4v9h10"/><path d="M7 13l-1 7"/><path d="M17 13l1 7"/><path d="M7 9h8"/>',
  gear: '<circle cx="6" cy="6" r="2"/><circle cx="12" cy="6" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="6" cy="18" r="2"/><circle cx="12" cy="18" r="2"/><path d="M6 8v8M12 8v8M18 8v4H6"/>',
  fuel: '<path d="M4 20V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v15"/><path d="M3 20h12"/><path d="M14 10h2a2 2 0 0 1 2 2v4a1.5 1.5 0 0 0 3 0V9l-3-3"/><path d="M7 8h4"/>',
  snow: '<path d="M12 2v20M4.9 7l14.2 10M19.1 7 4.9 17"/>',
  cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  check: '<path d="M20 6 9 17l-5-5"/>', shield: '<path d="M12 3 4 6v6c0 4.5 3.4 7.7 8 9 4.6-1.3 8-4.5 8-9V6l-8-3Z"/><path d="m9 12 2 2 4-4"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', pin: '<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11Z"/><circle cx="12" cy="10" r="2.5"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>', x: '<path d="M6 6l12 12M18 6 6 18"/>', user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  key: '<circle cx="8" cy="15" r="4"/><path d="m10.8 12.2 8.2-8.2M17 6l2 2M15 8l2 2"/>', arrow: '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
  car: '<path d="M5 17h14v-5l-2-5H7l-2 5z"/><path d="M5 12h14"/><circle cx="8" cy="17" r="2"/><circle cx="16" cy="17" r="2"/>',
};
const svg = (n, cls = 'icon') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICO[n] || ''}</svg>`;
function toast(msg) {
  const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; $('#toasts').appendChild(t);
  setTimeout(() => { t.style.transition = 'opacity .4s'; t.style.opacity = 0; setTimeout(() => t.remove(), 400); }, 2800);
}

/* ---------- Recherche (dates, lieu, chauffeur) ---------- */
let S;
function initSearch() {
  const s = db.search;
  S = s && s.debut >= today() && s.fin > s.debut ? s : { debut: dayIso(1), fin: dayIso(4), heure: '09:00', lieu: 'cocody', chauffeur: false, options: [] };
  if (!Array.isArray(S.options)) S.options = [];
  db.search = S;
}
function setSearch(k, v) {
  S[k] = v;
  if (k === 'debut') { if (S.debut < today()) S.debut = today(); if (!S.fin || S.fin <= S.debut) S.fin = addDays(S.debut, Math.max(1, nights(S.debut, S.fin) || 3)); }
  if (k === 'fin' && S.fin <= S.debut) { S.fin = addDays(S.debut, 1); toast('La date de retour doit être après la date de départ.'); }
  db.search = S; persist();
}

/* ---------- Disponibilités et prix ---------- */
const actives = (r) => r.statut !== 'Annulée';
const conflicts = (v, deb, fin, except) => db.resas.filter((r) => r.vehicule === v.id && actives(r) && r.id !== except && r.debut < fin && deb < r.fin);
function availability(v, deb = S.debut, fin = S.fin) {
  if (v.statut === 'maintenance') return { k: 'warn', label: 'En maintenance', ok: false };
  if (!deb || !fin || fin <= deb) return { k: 'ok', label: 'Disponible', ok: true };
  return conflicts(v, deb, fin).length ? { k: 'bad', label: 'Indisponible à ces dates', ok: false } : { k: 'ok', label: 'Disponible à ces dates', ok: true };
}
function remisePct(j) { return db.settings.remises.filter((r) => j >= r.des).reduce((m, r) => Math.max(m, r.pct), 0); }
function quote(v, o = S) {
  const jours = Math.max(1, nights(o.debut, o.fin));
  const base = v.prix * jours, pct = remisePct(jours), remise = Math.round(base * pct / 100);
  const inclus = v.chauffeur === 'inclus', avecCh = inclus || !!o.chauffeur;
  const chauffeur = !inclus && o.chauffeur ? db.settings.chauffeurJour * jours : 0;
  const l = lieu(o.lieu), lieuAmt = l.frais;
  const opts = OPTIONS.filter((x) => (o.options || []).includes(x.id)).map((x) => ({ id: x.id, nom: x.nom, amt: x.parJour ? x.prix * jours : x.prix }));
  const total = base - remise + chauffeur + lieuAmt + opts.reduce((t, x) => t + x.amt, 0);
  return { jours, base, pct, remise, inclus, avecCh, chauffeur, lieuNom: l.nom, lieuAmt, opts, total, caution: avecCh ? 0 : v.caution };
}
function quoteLines(v, q) {
  return `<div class="lines">
    <div><span>${fmt(v.prix)} × ${q.jours} jour${q.jours > 1 ? 's' : ''}</span><span>${fmt(q.base)}</span></div>
    ${q.remise ? `<div class="disc"><span>Remise longue durée (−${q.pct} %)</span><span>−${fmt(q.remise)}</span></div>` : ''}
    ${q.inclus ? '<div><span>Chauffeur professionnel</span><span>Inclus</span></div>' : q.chauffeur ? `<div><span>Chauffeur (${fmt(db.settings.chauffeurJour)} / jour)</span><span>${fmt(q.chauffeur)}</span></div>` : ''}
    <div><span>${esc(q.lieuNom)}</span><span>${q.lieuAmt ? fmt(q.lieuAmt) : 'Gratuit'}</span></div>
    ${q.opts.map((x) => `<div><span>${esc(x.nom)}</span><span>${fmt(x.amt)}</span></div>`).join('')}
    <div class="tot"><span>Total</span><span class="num">${fmt(q.total)}</span></div>
    <div class="cau"><span>Caution remboursable</span><span>${q.caution ? fmt(q.caution) : 'Aucune (avec chauffeur)'}</span></div></div>`;
}
const fromPrice = (cat) => Math.min(...db.flotte.filter((v) => v.cat === cat).map((v) => v.prix));

/* ---------- WhatsApp ---------- */
const waLink = (msg) => `https://wa.me/${db.settings.whatsapp}?text=${encodeURIComponent(msg)}`;
const waGeneric = () => waLink(`Bonjour ${db.settings.nom}, je souhaite louer un véhicule. Pouvez-vous me conseiller ?`);
function msgResa(v, o, q, c = {}) {
  return `Bonjour ${db.settings.nom}, je souhaite réserver :\n\nVéhicule : ${v.nom}\nDu : ${dFr(o.debut, { weekday: 'long', day: 'numeric', month: 'long' })} à ${hh(o.heure || '09:00')}\nAu : ${dFr(o.fin, { weekday: 'long', day: 'numeric', month: 'long' })}\nDurée : ${q.jours} jour${q.jours > 1 ? 's' : ''}\nLieu : ${q.lieuNom}\nChauffeur : ${q.avecCh ? (q.inclus ? 'inclus' : 'oui') : 'non'}${q.opts.length ? '\nOptions : ' + q.opts.map((x) => x.nom).join(', ') : ''}\n\nTotal : ${fmt(q.total)}\nCaution : ${q.caution ? fmt(q.caution) + ' (remboursable)' : 'aucune'}${c.nom ? '\n\nNom : ' + c.nom : ''}${c.tel ? '\nTéléphone : ' + c.tel : ''}\n\nMerci de confirmer.`;
}

/* ---------- Routage ---------- */
let route = { path: [], q: {} };
function parseHash() {
  const h = location.hash.replace(/^#\/?/, ''); const [p, qs] = h.split('?');
  route = { path: p.split('/').filter(Boolean).map(decodeURIComponent), q: Object.fromEntries(new URLSearchParams(qs || '')) };
}
function setMeta(title, desc) { document.title = title; const m = $('meta[name=description]'); if (m && desc) m.setAttribute('content', desc); }
function setLD(obj) {
  let s = $('#ld-dyn'); if (!obj) { if (s) s.remove(); return; }
  if (!s) { s = document.createElement('script'); s.type = 'application/ld+json'; s.id = 'ld-dyn'; document.head.appendChild(s); }
  s.textContent = JSON.stringify(obj);
}
function go() {
  parseHash();
  const top = route.path[0] || '';
  const isAdmin = top === 'admin';
  $('#store').hidden = isAdmin; $('#admin').hidden = !isAdmin;
  document.body.classList.toggle('adm', isAdmin);
  $('#waFloat').hidden = isAdmin;
  closeAll(); setLD(null);
  if (isAdmin) { renderAdmin(route.path[1] || 'dashboard'); window.scrollTo(0, 0); return; }
  const pages = { '': pageHome, flotte: pageFleet, vehicule: pageVehicle, reserver: pageCheckout, confirmation: pageConfirm };
  $('#page').innerHTML = (pages[top] || pageHome)();
  refreshHeader();
  if (top === 'flotte') fleetList();
  window.scrollTo({ top: 0, behavior: 'instant' });
  afterRender();
}
function afterRender() {
  const io = window.__io || (window.__io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .08 }));
  $$('.rv:not(.in)').forEach((el) => io.observe(el));
}

/* ---------- En-tête, menu, pied ---------- */
const NAV = [['#/', 'Accueil'], ['#/flotte', 'Nos véhicules'], ['#/#services', 'Services'], ['#/#conditions', 'Conditions'], ['#/#avis', 'Avis']];
function refreshHeader() {
  const cur = '#/' + (route.path[0] || '');
  $('#hdr').innerHTML = `<div class="wrap">
    <button class="ibtn burger" data-a="menu" aria-label="Ouvrir le menu">${svg('menu')}</button>
    <a class="logo" href="#/" aria-label="${esc(db.settings.nom)}, accueil"><i>L</i>${esc(db.settings.nom)}</a>
    <nav class="main" aria-label="Navigation principale">${NAV.map(([h, l]) => `<a href="${h}" ${h === cur || (h === '#/flotte' && (cur === '#/vehicule' || cur === '#/reserver')) ? 'aria-current="page"' : ''}>${l}</a>`).join('')}</nav>
    <div class="tools"><a class="btn amber sm" href="#/flotte">Réserver</a></div></div>`;
  $('#mnav').innerHTML = `<button class="x" data-a="closeAll" aria-label="Fermer le menu">×</button>${NAV.map(([h, l]) => `<a href="${h}" data-a="closeAll">${l}</a>`).join('')}<a href="${waGeneric()}" target="_blank" rel="noopener" style="color:#7EE2A8">Écrire sur WhatsApp</a>`;
  $('#waFloat').href = waGeneric();
}
function foot() {
  return `<section class="dstbox" aria-label="Conçu par DST Technologie"><div class="wrap"><p class="k">Cette solution a été conçue par DST Technologie</p><p class="s">Votre agence de location peut avoir le même site : réservations en ligne, planning de la flotte et WhatsApp.</p><div class="row"><a class="btn" href="../../index.html#/contact">Créer mon site web</a><a class="btn line" href="#/admin">Voir l'espace gérant</a><a class="btn line" href="../../index.html#/realisations">Autres démos</a></div></div></section>
  <footer class="bot"><div class="wrap">
    <div><a class="logo" href="#/" style="color:#fff"><i>L</i>${esc(db.settings.nom)}</a><p style="margin-top:12px;max-width:34ch">Location de véhicules avec ou sans chauffeur à Abidjan et dans toute la Côte d'Ivoire.</p></div>
    <div><h2>Véhicules</h2>${CATS.map((c) => `<a href="#/flotte?cat=${encodeURIComponent(c.id)}">${c.id}</a>`).join('')}</div>
    <div><h2>Services</h2><a href="#/flotte?ch=1">Avec chauffeur</a><a href="#/flotte?cat=Prestige">Mariages et cérémonies</a><a href="#/#conditions">Conditions de location</a><a href="#/admin">Espace gérant (démo)</a></div>
    <div><h2>Contact</h2><a href="${waGeneric()}" target="_blank" rel="noopener">WhatsApp</a><a href="tel:+2250503206666">05 03 20 66 66</a><span>${esc(db.settings.adresse)}</span><span>7 j/7 · 7 h – 20 h</span></div>
    <p class="legal">Site de démonstration réalisé par DST Technologie. Véhicules, prix, avis et réservations fictifs. Photos libres de droits (Pexels).</p></div></footer>`;
}

/* ---------- Composants ---------- */
const specs = (v) => `<div class="specs"><span>${svg('seat')}${v.places} places</span><span>${svg('gear')}${v.boite === 'Automatique' ? 'Auto' : 'Manuelle'}</span><span>${svg('fuel')}${v.carburant}</span>${v.clim ? `<span>${svg('snow')}Clim</span>` : ''}</div>`;
function card(v, o = {}) {
  const a = availability(v), q = quote(v);
  return `<article class="vc ${o.rv ? 'rv' : ''}">
    <a class="ph" href="#/vehicule/${v.id}" aria-label="Voir ${esc(v.nom)}"><img src="${imgSrc(v.imgs[0])}" alt="${esc(v.nom)}" loading="lazy" decoding="async" width="640" height="400"></a>
    <div class="badges">${v.tags.includes('populaire') ? '<span class="bdg amber">Très demandé</span>' : ''}${v.chauffeur === 'inclus' ? '<span class="bdg">Avec chauffeur</span>' : ''}</div>
    <div class="bd"><span class="cat-l">${esc(v.cat)} · ${v.annee}</span><h3><a href="#/vehicule/${v.id}">${esc(v.nom)}</a></h3>${specs(v)}
      <span class="av ${a.k}">${a.label}</span>
      <div class="foot"><div class="price"><b>${fmt(v.prix)}</b> <small>/ jour</small><span class="tot">${q.jours} j : ${fmt(q.total)}${q.remise ? ` (−${q.pct} %)` : ''}</span></div>
      <a class="btn sm ${a.ok ? '' : 'line'}" href="#/vehicule/${v.id}">${a.ok ? 'Réserver' : 'Voir'}</a></div></div></article>`;
}
function searchFields(ctx) {
  return `<div><label for="${ctx}-lieu">Lieu de prise en charge</label><select class="t" id="${ctx}-lieu" data-s="lieu">${LIEUX.map((l) => `<option value="${l.id}" ${S.lieu === l.id ? 'selected' : ''}>${esc(l.nom)}${l.frais ? ' (+' + fmt(l.frais) + ')' : ''}</option>`).join('')}</select></div>
    <div><label for="${ctx}-deb">Départ</label><input class="t" type="date" id="${ctx}-deb" data-s="debut" min="${today()}" value="${S.debut}"></div>
    <div><label for="${ctx}-fin">Retour</label><input class="t" type="date" id="${ctx}-fin" data-s="fin" min="${addDays(S.debut, 1)}" value="${S.fin}"></div>
    <label class="sw ${ctx === 'fs' ? 'full2' : ''}"><input type="checkbox" data-s="chauffeur" ${S.chauffeur ? 'checked' : ''}> Avec chauffeur</label>`;
}

/* ---------- Accueil ---------- */
function pageHome() {
  setMeta(`${db.settings.nom} | Location de voitures à Abidjan, avec ou sans chauffeur`, 'Louez une citadine, une berline, un 4x4, un véhicule de prestige ou un minibus à Abidjan. Disponibilités en temps réel, prix tout compris, réservation en ligne ou sur WhatsApp.');
  const pop = db.flotte.filter((v) => v.tags.includes('populaire')).slice(0, 3);
  const SV = [
    { t: 'Location sans chauffeur', p: 'Citadines, berlines et 4x4 récents, assurés et entretenus. Kilométrage illimité à Abidjan.', img: '7144201', h: '#/flotte' },
    { t: 'Avec chauffeur', p: 'Chauffeurs professionnels, ponctuels et discrets, pour vos rendez-vous, missions et visiteurs.', img: '20940679', h: '#/flotte?ch=1' },
    { t: 'Mariages et cérémonies', p: 'Classe S, Classe G, Range Rover : un cortège à la hauteur de votre grand jour.', img: '10638649', h: '#/flotte?cat=Prestige' },
    { t: 'Entreprises et longue durée', p: 'Jusqu’à −25 % dès 30 jours, facture au nom de votre société et véhicule de remplacement.', img: '18029616', h: '#/flotte?cat=SUV%20%26%204x4' },
  ];
  const FAQ = [
    ['Quels documents faut-il pour louer sans chauffeur ?', 'Une pièce d’identité valide (CNI, passeport ou carte consulaire) et un permis de conduire de plus de 2 ans. Le conducteur doit avoir au moins 23 ans.'],
    ['Comment fonctionne la caution ?', 'La caution est versée au départ (Wave, Orange Money, MTN Money ou espèces) et rendue au retour du véhicule, après vérification. Aucune caution n’est demandée pour une location avec chauffeur.'],
    ['Le carburant est-il compris ?', 'Le véhicule est livré avec le plein et doit être rendu avec le plein. Avec chauffeur, le carburant reste à la charge du client selon le trajet.'],
    ['Puis-je aller à l’intérieur du pays ?', 'Oui, avec l’option « Sortie hors d’Abidjan ». Pour les longs trajets, nous recommandons un 4x4 avec chauffeur.'],
    ['Comment annuler ?', 'Annulation gratuite jusqu’à 48 h avant le départ. Ensuite, l’acompte versé est conservé.'],
  ];
  return `
  <section class="hero" aria-labelledby="h1"><div class="bg"><img src="img/18029645.jpg" alt="Trois Toyota Land Cruiser garés devant l'agence" fetchpriority="high"></div>
    <div class="wrap"><span class="eyebrow" style="color:var(--amber-2)">Location de véhicules · Abidjan</span>
      <h1 id="h1">Le bon véhicule, <em>au bon prix</em>, réservé en 2 minutes.</h1>
      <p class="lead">Citadines, berlines, 4x4, prestige et minibus, avec ou sans chauffeur. Disponibilités en temps réel et prix tout compris, sans surprise.</p>
      <form class="search" id="hsearch" role="search" aria-label="Rechercher un véhicule">${searchFields('hs')}<button class="btn amber" type="submit">${svg('car')} Voir les véhicules</button></form>
      <div class="trustline"><span>${svg('shield')}Véhicules assurés</span><span>${svg('check')}Prix affiché = prix payé</span><span>${svg('clock')}Assistance 7 j/7</span><span>${svg('pin')}Livraison à l'aéroport</span></div></div></section>
  <section class="sec"><div class="wrap"><div class="sechead rv"><div><span class="eyebrow">Notre flotte</span><h2>${db.flotte.length} véhicules, 6 catégories</h2></div><a class="link" href="#/flotte">Voir toute la flotte</a></div>
    <div class="cats">${CATS.map((c) => `<a class="cat rv" href="#/flotte?cat=${encodeURIComponent(c.id)}"><img src="img/${c.img}.jpg" alt="" loading="lazy"><em>dès ${fmt(fromPrice(c.id))}/j</em><span>${c.id}<small>${c.sub}</small></span></a>`).join('')}</div></div></section>
  <section class="sec" style="padding-top:0"><div class="wrap"><div class="sechead rv"><div><span class="eyebrow">Les plus demandés</span><h2>Réservés chaque semaine</h2></div><p class="l">Prix pour vos dates (${dFr(S.debut)} → ${dFr(S.fin)}), remise longue durée comprise.</p></div>
    <div class="grid g3">${pop.map((v) => card(v, { rv: 1 })).join('')}</div></div></section>
  <section class="sec dark" id="services"><div class="wrap"><div class="sechead rv on-dark"><div><span class="eyebrow">Services</span><h2>Une location adaptée à chaque besoin</h2></div></div>
    <div class="svc">${SV.map((s) => `<article class="rv"><div class="im"><img src="img/${s.img}.jpg" alt="" loading="lazy"></div><div class="tx"><h3>${s.t}</h3><p>${s.p}</p><a class="link" style="color:#fff;margin-top:6px;align-self:flex-start" href="${s.h}">Voir les véhicules</a></div></article>`).join('')}</div></div></section>
  <section class="sec"><div class="wrap"><div class="sechead rv"><div><span class="eyebrow">Simple et rapide</span><h2>Réserver en 3 étapes</h2></div></div>
    <div class="steps"><div class="step rv"><span class="n">1</span><h3>Choisissez vos dates</h3><p>Seuls les véhicules libres à vos dates sont proposés, avec le prix total déjà calculé.</p></div>
    <div class="step rv"><span class="n">2</span><h3>Réservez en ligne</h3><p>Indiquez vos options (chauffeur, aéroport, assurance) et validez. Vous pouvez aussi envoyer la demande sur WhatsApp.</p></div>
    <div class="step rv"><span class="n">3</span><h3>Prenez la route</h3><p>Récupérez le véhicule en agence, à l’aéroport ou faites-vous livrer. Caution par Wave ou Orange Money.</p></div></div></div></section>
  <section class="sec" id="conditions" style="background:#fff"><div class="wrap split"><div class="pic rv"><img src="img/4173191.jpg" alt="Remise des clés d'un véhicule à un client" loading="lazy"></div>
    <div class="rv"><span class="eyebrow">Conditions de location</span><h2 style="margin:10px 0 0">Claires dès le départ</h2>
      <div class="conds"><div>${svg('check')}<span><b>Permis de plus de 2 ans</b> et pièce d’identité valide (sans chauffeur).</span></div><div>${svg('check')}<span><b>Caution remboursable</b>, rendue au retour du véhicule.</span></div><div>${svg('check')}<span><b>Annulation gratuite</b> jusqu’à 48 h avant le départ.</span></div><div>${svg('check')}<span><b>Remises</b> : −10 % dès 3 jours, −15 % dès 7 jours, −25 % dès 30 jours.</span></div></div>
      <div style="margin-top:22px">${FAQ.map(([q, a]) => `<details class="faq"><summary>${q}</summary><p>${a}</p></details>`).join('')}</div></div></div></section>
  <section class="sec" id="avis"><div class="wrap"><div class="sechead rv"><div><span class="eyebrow">Avis clients</span><h2>Ils ont pris la route avec nous</h2></div></div>
    <div class="reviews">${db.avis.map((a) => `<figure class="rv"><div class="stars" aria-label="${a.note} étoiles sur 5">${'★'.repeat(a.note)}${'☆'.repeat(5 - a.note)}</div><blockquote>« ${esc(a.texte)} »</blockquote><figcaption><b>${esc(a.nom)}</b> · ${esc(a.role)}</figcaption></figure>`).join('')}</div>
    <p class="muted" style="font-size:13px;margin-top:14px">Avis fictifs, pour la démonstration.</p></div></section>
  ${foot()}`;
}

/* ---------- Flotte ---------- */
let F = {};
function resetF(q) { F = { cat: q.cat ? [q.cat] : [], boite: [], carb: [], places: 0, max: 260000, dispo: false, sort: 'prix-asc' }; if (q.ch === '1') setSearch('chauffeur', true); }
function filtered() {
  let l = db.flotte.filter((v) => (!F.cat.length || F.cat.includes(v.cat)) && (!F.boite.length || F.boite.includes(v.boite)) && (!F.carb.length || F.carb.includes(v.carburant)) && v.places >= F.places && v.prix <= F.max && (!F.dispo || availability(v).ok) && (!S.chauffeur || v.chauffeur !== 'non'));
  const by = { 'prix-asc': (a, b) => a.prix - b.prix, 'prix-desc': (a, b) => b.prix - a.prix, places: (a, b) => b.places - a.places, recent: (a, b) => b.annee - a.annee };
  return l.slice().sort(by[F.sort] || by['prix-asc']);
}
const fc = (k, vals) => vals.map((v) => `<label class="c"><input type="checkbox" data-f="${k}" value="${esc(v)}" ${F[k].includes(v) ? 'checked' : ''}> ${esc(v)}</label>`).join('');
function pageFleet() {
  parseHash(); resetF(route.q);
  setMeta(`Nos véhicules${F.cat.length ? ' : ' + F.cat.join(', ') : ''} | ${db.settings.nom}`, 'Toute la flotte disponible à vos dates : citadines, berlines, 4x4, prestige, minibus et pick-up, avec ou sans chauffeur.');
  return `<div class="pagehead"><div class="wrap"><p class="crumbs"><a href="#/">Accueil</a> / Nos véhicules</p><h1>${F.cat.length === 1 ? esc(F.cat[0]) : 'Toute la flotte'}</h1></div></div>
  <form class="searchbar" id="fsearch" role="search" aria-label="Dates de location"><div class="wrap">${searchFields('fs')}<button class="btn amber" type="submit">Actualiser</button></div></form>
  <div class="wrap shop"><aside class="filters" id="filters" aria-label="Filtres">
    <div style="display:flex;justify-content:space-between;align-items:center"><h2 style="font-size:22px">Filtres</h2><button class="ibtn xf" type="button" data-a="filters" aria-label="Fermer les filtres">${svg('x')}</button></div>
    <div class="fset"><h3>Catégorie</h3>${fc('cat', CATS.map((c) => c.id))}</div>
    <div class="fset"><h3>Boîte de vitesses</h3>${fc('boite', ['Automatique', 'Manuelle'])}</div>
    <div class="fset"><h3>Carburant</h3>${fc('carb', ['Essence', 'Diesel'])}</div>
    <div class="fset"><h3><label for="fplaces">Places minimum</label></h3><select class="t" id="fplaces"><option value="0">Toutes</option><option value="5">5 et plus</option><option value="7">7 et plus</option><option value="8">8 et plus</option><option value="15">15</option></select></div>
    <div class="fset"><h3><label for="fmax">Prix maximum par jour</label></h3><input class="range" type="range" id="fmax" min="15000" max="260000" step="5000" value="${F.max}"><p class="num" id="fmaxl" style="font-weight:800;margin-top:4px"></p></div>
    <div class="fset"><label class="c"><input type="checkbox" id="fdispo"> Uniquement disponibles à mes dates</label></div>
    <button class="btn line block" type="button" data-a="resetF">Réinitialiser</button><button class="btn block xf" type="button" style="margin-top:8px" data-a="filters">Voir les résultats</button></aside>
    <div><div class="toolbar"><button class="btn line sm fbtn" type="button" data-a="filters">Filtres</button><p id="rcount" class="muted" style="font-weight:700"></p>
      <label class="vh" for="fsort">Trier</label><select class="sel" id="fsort"><option value="prix-asc">Prix croissant</option><option value="prix-desc">Prix décroissant</option><option value="places">Nombre de places</option><option value="recent">Plus récents</option></select></div>
      <div class="grid g3" id="list"></div></div></div>${foot()}`;
}
function fleetList() {
  const l = filtered();
  const ok = l.filter((v) => availability(v).ok).length;
  $('#fmaxl').textContent = fmt(F.max) + ' / jour';
  $('#rcount').textContent = `${l.length} véhicule${l.length > 1 ? 's' : ''} · ${ok} disponible${ok > 1 ? 's' : ''} du ${dFr(S.debut)} au ${dFr(S.fin)}`;
  $('#list').innerHTML = l.length ? l.map((v) => card(v)).join('') : `<div class="empty" style="grid-column:1/-1"><h3>Aucun véhicule ne correspond</h3><p>Élargissez vos filtres ou changez vos dates.</p><p style="margin-top:14px"><button class="btn line sm" type="button" data-a="resetF">Réinitialiser les filtres</button></p></div>`;
}

/* ---------- Fiche véhicule ---------- */
let calOffset = 0;
function calHTML(v) {
  const base = new Date(); base.setDate(1); base.setMonth(base.getMonth() + calOffset); base.setHours(12, 0, 0, 0);
  const y = base.getFullYear(), m = base.getMonth(), first = (new Date(y, m, 1).getDay() + 6) % 7, nb = new Date(y, m + 1, 0).getDate();
  const booked = new Set();
  db.resas.filter((r) => r.vehicule === v.id && actives(r)).forEach((r) => { for (let d = r.debut; d < r.fin; d = addDays(d, 1)) booked.add(d); });
  let cells = ['lun', 'mar', 'mer', 'jeu', 'ven', 'sam', 'dim'].map((d) => `<span class="dow">${d}</span>`).join('') + '<span></span>'.repeat(first);
  for (let d = 1; d <= nb; d++) {
    const s = isoLocal(new Date(y, m, d, 12)), cls = ['d'];
    if (s < today()) cls.push('past'); else if (booked.has(s)) cls.push('booked'); else if (s >= S.debut && s < S.fin) cls.push('sel');
    if (s === today()) cls.push('today');
    cells += `<span class="${cls.join(' ')}" ${booked.has(s) && s >= today() ? 'title="Réservé"' : ''}>${d}</span>`;
  }
  return `<div class="ch"><button class="ibtn" type="button" data-a="cal" data-d="-1" aria-label="Mois précédent" ${calOffset <= 0 ? 'disabled' : ''} style="color:var(--ink)">‹</button><b>${base.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</b><button class="ibtn" type="button" data-a="cal" data-d="1" aria-label="Mois suivant" style="color:var(--ink)">›</button></div>
    <div class="grid7">${cells}</div><div class="leg"><span><i style="background:var(--bad-bg);border:1px solid var(--bad)"></i>Réservé</span><span><i style="background:var(--ink)"></i>Vos dates</span></div>`;
}
function bookBox(v) {
  const a = availability(v), q = quote(v);
  return `<h2>Réserver ce véhicule</h2>
    <div class="fgrid" style="margin-top:6px"><div><label class="f" for="vb-deb">Départ</label><input class="t" type="date" id="vb-deb" data-s="debut" min="${today()}" value="${S.debut}"></div>
    <div><label class="f" for="vb-fin">Retour</label><input class="t" type="date" id="vb-fin" data-s="fin" min="${addDays(S.debut, 1)}" value="${S.fin}"></div>
    <div><label class="f" for="vb-h">Heure de départ</label><select class="t" id="vb-h" data-s="heure">${HEURES.map((h) => `<option value="${h}" ${S.heure === h ? 'selected' : ''}>${hh(h)}</option>`).join('')}</select></div>
    <div><label class="f" for="vb-l">Prise en charge</label><select class="t" id="vb-l" data-s="lieu">${LIEUX.map((l) => `<option value="${l.id}" ${S.lieu === l.id ? 'selected' : ''}>${esc(l.nom)}</option>`).join('')}</select></div></div>
    <div style="display:grid;gap:8px;margin-top:14px">
      ${v.chauffeur === 'inclus' ? `<p class="note" style="margin:0">${svg('user')} Ce véhicule est loué <b>avec chauffeur</b> (inclus dans le prix).</p>` : `<label class="chk"><input type="checkbox" data-s="chauffeur" ${S.chauffeur ? 'checked' : ''}><span>Avec chauffeur<small>Pas de caution, conduite assurée</small></span><span class="p">+${fmt(db.settings.chauffeurJour)}/j</span></label>`}
      ${OPTIONS.map((o) => `<label class="chk"><input type="checkbox" data-opt="${o.id}" ${S.options.includes(o.id) ? 'checked' : ''}><span>${esc(o.nom)}</span><span class="p">+${fmt(o.prix)}${o.parJour ? '/j' : ''}</span></label>`).join('')}
    </div>
    ${quoteLines(v, q)}
    ${a.ok ? '' : `<p class="note bad">${a.k === 'warn' ? 'Ce véhicule est en maintenance. Choisissez un autre véhicule.' : 'Ce véhicule est déjà réservé à ces dates. Changez vos dates ou choisissez un autre véhicule.'}</p>`}
    <div style="display:grid;gap:8px;margin-top:14px"><a class="btn amber block" href="#/reserver/${v.id}" ${a.ok ? '' : 'aria-disabled="true" data-a="noop"'}>Réserver · ${fmt(q.total)}</a><button class="btn wa block" type="button" data-a="wa" data-id="${v.id}" ${a.ok ? '' : 'disabled'}>Réserver sur WhatsApp</button></div>
    <p class="muted" style="font-size:12.5px;margin-top:10px">Annulation gratuite jusqu’à 48 h avant le départ.</p>`;
}
function pageVehicle() {
  const v = veh(route.path[1]);
  if (!v) return `<div class="wrap empty"><h1>Véhicule introuvable</h1><p style="margin-top:14px"><a class="btn" href="#/flotte">Voir la flotte</a></p></div>${foot()}`;
  calOffset = 0;
  setMeta(`Location ${v.nom} à Abidjan — ${fmt(v.prix)}/jour | ${db.settings.nom}`, `Louez la ${v.nom} (${v.cat}, ${v.places} places, ${v.boite.toLowerCase()}) à Abidjan dès ${fmt(v.prix)} par jour${v.chauffeur === 'inclus' ? ', chauffeur inclus' : ', avec ou sans chauffeur'}.`);
  setLD({ '@context': 'https://schema.org', '@type': 'Product', name: `Location ${v.nom}`, image: v.imgs.map((i) => new URL(imgSrc(i), location.href).href), description: v.desc, category: v.cat, offers: { '@type': 'Offer', priceCurrency: 'XOF', price: v.prix, unitText: 'jour', availability: v.statut === 'maintenance' ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock' } });
  const rel = db.flotte.filter((x) => x.cat === v.cat && x.id !== v.id).slice(0, 3);
  return `<div class="wrap"><p class="crumbs" style="color:var(--ink-2);padding-top:20px"><a href="#/">Accueil</a> / <a href="#/flotte">Nos véhicules</a> / <a href="#/flotte?cat=${encodeURIComponent(v.cat)}">${esc(v.cat)}</a></p>
  <div class="vp"><div>
    <span class="eyebrow">${esc(v.cat)} · ${v.annee}</span><h1 style="font-size:clamp(30px,4.4vw,52px);margin:8px 0 16px">${esc(v.nom)}</h1>
    <div class="gal"><div class="main" id="gmain"><img src="${imgSrc(v.imgs[0])}" alt="${esc(v.nom)}, photo 1"></div>
      ${v.imgs.length > 1 ? `<div class="thumbs" role="group" aria-label="Photos">${v.imgs.map((im, i) => `<button type="button" data-a="thumb" data-i="${i}" aria-current="${i === 0}" aria-label="Photo ${i + 1}"><img src="${imgSrc(im)}" alt=""></button>`).join('')}</div>` : ''}</div>
    <div class="specgrid"><div><small>Places</small><b>${v.places}</b></div><div><small>Boîte</small><b>${v.boite}</b></div><div><small>Carburant</small><b>${v.carburant}</b></div><div><small>Climatisation</small><b>${v.clim ? 'Oui' : 'Non'}</b></div><div><small>Kilométrage</small><b>${v.chauffeur === 'inclus' ? 'Selon trajet' : 'Illimité (Abidjan)'}</b></div><div><small>Caution</small><b>${v.caution ? fmt(v.caution) : 'Aucune'}</b></div></div>
    <p class="muted" style="font-size:16.5px">${esc(v.desc)}</p>
    <h2 style="font-size:22px;margin:28px 0 12px">Tarifs dégressifs</h2>
    <table class="rates"><thead><tr><th>Durée</th><th>Prix par jour</th></tr></thead><tbody><tr><td>1 à 2 jours</td><td>${fmt(v.prix)}</td></tr>${db.settings.remises.map((r) => `<tr><td>${r.des} jours et plus (−${r.pct} %)</td><td>${fmt(v.prix * (1 - r.pct / 100))}</td></tr>`).join('')}</tbody></table>
    <h2 style="font-size:22px;margin:28px 0 12px">Disponibilités</h2><div class="cal" id="cal">${calHTML(v)}</div>
  </div>
  <aside class="book" id="book" aria-label="Réservation">${bookBox(v)}</aside></div>
  ${rel.length ? `<section class="sec" style="padding-top:10px"><div class="sechead"><h2>Dans la même catégorie</h2></div><div class="grid g3">${rel.map((x) => card(x)).join('')}</div></section>` : ''}</div>${foot()}`;
}
function refreshVehicle() { const v = veh(route.path[1]); if (!v) return; const f = document.activeElement && document.activeElement.id; $('#book').innerHTML = bookBox(v); $('#cal').innerHTML = calHTML(v); if (f && $('#' + f)) $('#' + f).focus(); }
function waModal(v) {
  const q = quote(v);
  $('#modalRoot').innerHTML = `<div class="modal" role="dialog" aria-modal="true" aria-labelledby="wmt"><div class="box"><div style="display:flex;justify-content:space-between;gap:10px"><h2 id="wmt" style="font-size:26px">Réserver sur WhatsApp</h2><button class="ibtn" type="button" data-a="closeModal" aria-label="Fermer" style="color:var(--ink)">${svg('x')}</button></div>
    <p class="muted" style="margin-top:6px">Votre message est prêt : ajoutez votre nom et votre numéro.</p>
    <div class="fgrid"><div><label class="f" for="wn">Nom</label><input class="t" id="wn" autocomplete="name"></div><div><label class="f" for="wt">Téléphone</label><input class="t" id="wt" type="tel" inputmode="tel" autocomplete="tel"></div></div>
    <div class="wapre" id="wapre" aria-live="polite"></div>
    <p class="muted" style="font-size:12.5px;margin-bottom:12px">Démo : le message part vers DST Technologie. Sur votre site, il arrive sur VOTRE WhatsApp.</p>
    <a class="btn wa block" id="wasend" target="_blank" rel="noopener" href="#">Envoyer sur WhatsApp</a></div></div>`;
  const upd = () => { const m = msgResa(v, S, q, { nom: $('#wn').value.trim(), tel: $('#wt').value.trim() }); $('#wapre').textContent = m; $('#wasend').href = waLink(m); };
  const root = $('#modalRoot'); root.oninput = upd; upd(); $('#wn').focus();
}

/* ---------- Réservation ---------- */
function pageCheckout() {
  const v = veh(route.path[1]);
  setMeta(`Réservation ${v ? v.nom : ''} | ${db.settings.nom}`, 'Finalisez votre réservation de véhicule.');
  if (!v) return `<div class="wrap empty"><h1>Véhicule introuvable</h1><p style="margin-top:14px"><a class="btn" href="#/flotte">Voir la flotte</a></p></div>${foot()}`;
  const a = availability(v), q = quote(v), self = !q.avecCh;
  if (!a.ok) return `<div class="wrap empty"><h1>${esc(v.nom)} n'est pas disponible</h1><p>Il est ${a.k === 'warn' ? 'en maintenance' : 'déjà réservé du ' + dFr(S.debut) + ' au ' + dFr(S.fin)}.</p><p style="margin-top:14px"><a class="btn" href="#/flotte">Voir les véhicules disponibles</a></p></div>${foot()}`;
  return `<div class="pagehead"><div class="wrap"><p class="crumbs"><a href="#/">Accueil</a> / <a href="#/vehicule/${v.id}">${esc(v.nom)}</a> / Réservation</p><h1>Finaliser la réservation</h1></div></div>
  <div class="wrap checkout"><form class="card" id="rform" novalidate><h2 style="font-size:24px">Conducteur et contact</h2>
    <div class="fgrid"><div class="full"><label class="f" for="rnom">Nom complet *</label><input class="t" id="rnom" name="nom" autocomplete="name"></div>
    <div><label class="f" for="rtel">Téléphone *</label><input class="t" id="rtel" name="tel" type="tel" inputmode="tel" autocomplete="tel" placeholder="07 00 00 00 00"></div>
    <div><label class="f" for="rwa">WhatsApp</label><input class="t" id="rwa" name="wa" type="tel" inputmode="tel" placeholder="Identique si vide"></div>
    <div><label class="f" for="rpiece">Pièce d'identité *</label><select class="t" id="rpiece" name="piece">${PIECES.map((p) => `<option>${p}</option>`).join('')}</select></div>
    <div><label class="f" for="rnum">Numéro de la pièce *</label><input class="t" id="rnum" name="num" autocomplete="off"></div>
    ${self ? `<div class="full"><label class="chk" style="margin-top:12px"><input type="checkbox" name="permis"><span>Je confirme avoir un permis de conduire de plus de 2 ans *<small>Il sera vérifié à la remise du véhicule.</small></span></label></div>` : ''}
    ${S.lieu === 'domicile' ? '<div class="full"><label class="f" for="radr">Adresse de livraison *</label><input class="t" id="radr" name="adresse" placeholder="Commune, quartier, repère" autocomplete="street-address"></div>' : ''}
    <div class="full"><label class="f" for="rcom">Commentaire</label><textarea class="t" id="rcom" name="commentaire" placeholder="Numéro de vol, trajet prévu, besoins particuliers…"></textarea></div></div>
    <fieldset style="border:0;padding:0;margin:16px 0 0"><legend class="f" style="padding:0">Paiement de l'acompte (30 %)${q.caution ? ' et de la caution' : ''}</legend><div class="radios">${['Wave', 'Orange Money', 'MTN Money', 'À l\'agence'].map((p, i) => `<label class="chk"><input type="radio" name="paiement" value="${p}" ${i === 0 ? 'checked' : ''}><span>${p}</span></label>`).join('')}</div></fieldset>
    <label class="chk" style="margin-top:14px"><input type="checkbox" name="cgv"><span>J'accepte les conditions de location (caution, carburant, annulation gratuite jusqu'à 48 h) *</span></label>
    <p class="err" id="rerr" role="alert"></p><button class="btn amber block" type="submit" style="margin-top:8px">Confirmer la réservation · ${fmt(q.total)}</button>
    <p class="muted" style="font-size:12.5px;margin-top:10px">Acompte à verser : ${fmt(Math.round(q.total * .3))}. Démonstration : aucun paiement n'est demandé.</p></form>
  <aside class="card"><div class="mini"><img src="${imgSrc(v.imgs[0])}" alt=""><div><b>${esc(v.nom)}</b><p class="muted" style="font-size:13.5px">${dFr(S.debut)} à ${hh(S.heure)} → ${dFr(S.fin)}</p><a href="#/vehicule/${v.id}" style="font-size:13.5px;font-weight:800">Modifier</a></div></div>${quoteLines(v, q)}</aside></div>${foot()}`;
}
function submitResa(f) {
  const v = veh(route.path[1]); if (!v) return;
  const val = (n) => (f.elements[n] ? String(f.elements[n].value || '').trim() : '');
  const q = quote(v), self = !q.avecCh;
  const nom = val('nom'), tel = val('tel'), wa = val('wa') || tel;
  const m = nom.length < 3 ? 'Indiquez votre nom complet.' : digits(tel).length < 8 ? 'Indiquez un numéro de téléphone valide.' : digits(wa).length < 8 ? 'Le numéro WhatsApp n’est pas valide.' : val('num').length < 4 ? 'Indiquez le numéro de votre pièce d’identité.' : (self && !f.elements.permis.checked) ? 'Confirmez avoir un permis de plus de 2 ans.' : (S.lieu === 'domicile' && val('adresse').length < 4) ? 'Indiquez l’adresse de livraison.' : !f.elements.cgv.checked ? 'Acceptez les conditions de location.' : !availability(v).ok ? 'Ce véhicule vient d’être réservé à ces dates.' : '';
  $('#rerr').textContent = m; if (m) return;
  const r = { id: db.nextResa++, vehicule: v.id, debut: S.debut, fin: S.fin, heure: S.heure, lieu: S.lieu, retour: S.lieu, nom, tel, whatsapp: wa, piece: val('piece'), adresse: val('adresse'), commentaire: val('commentaire'), chauffeur: !!S.chauffeur && v.chauffeur !== 'inclus', options: S.options.slice(), statut: 'En attente', caution: false, paiement: (f.querySelector('input[name=paiement]:checked') || {}).value || 'Wave', total: q.total, cree: Date.now() };
  db.resas.push(r); persist();
  location.hash = '#/confirmation/' + r.id;
}
function resaQuote(r) { const v = veh(r.vehicule); return v ? quote(v, { debut: r.debut, fin: r.fin, lieu: r.lieu, chauffeur: r.chauffeur, options: r.options }) : null; }
function pageConfirm() {
  const r = db.resas.find((x) => String(x.id) === route.path[1]); const v = r && veh(r.vehicule);
  setMeta(`Réservation enregistrée | ${db.settings.nom}`, 'Votre réservation est enregistrée.');
  if (!r || !v) return `<div class="wrap empty"><h1>Réservation introuvable</h1><p style="margin-top:14px"><a class="btn" href="#/flotte">Voir la flotte</a></p></div>${foot()}`;
  const q = resaQuote(r), m = msgResa(v, r, q, { nom: r.nom, tel: r.tel }).replace('je souhaite réserver', `voici ma réservation n° ${r.id}`);
  return `<div class="wrap recap" style="padding:44px 0 80px;max-width:780px"><div class="okc">✓</div><h1 style="font-size:clamp(30px,5vw,48px)">Merci ${esc(r.nom.split(' ')[0])}, votre réservation est enregistrée</h1>
    <p class="muted" style="margin:10px 0 24px">Réservation n° <b>${r.id}</b>. L'agence vous confirme la disponibilité sur WhatsApp sous 30 minutes. (Démonstration : rien n'est réellement transmis.)</p>
    <div class="card"><div class="mini"><img src="${imgSrc(v.imgs[0])}" alt=""><div><b>${esc(v.nom)}</b><p class="muted" style="font-size:13.5px">${dFr(r.debut)} à ${hh(r.heure)} → ${dFr(r.fin)} · ${esc(lieu(r.lieu).nom)}</p></div></div>${quoteLines(v, q)}</div>
    <h2 style="font-size:24px;margin:26px 0 6px">Accélérez la confirmation</h2><div class="wapre">${esc(m)}</div>
    <div style="display:flex;gap:10px;flex-wrap:wrap"><a class="btn wa" href="${waLink(m)}" target="_blank" rel="noopener">Envoyer sur WhatsApp</a><a class="btn line" href="#/flotte">Voir d'autres véhicules</a><a class="btn line" href="#/admin/reservations">Voir côté gérant</a></div></div>${foot()}`;
}

/* ---------- Actions ---------- */
function closeAll() { ['#mnav', '#ov'].forEach((s) => $(s) && $(s).classList.remove('open')); const f = $('#filters'); if (f) f.classList.remove('open'); }
const A = {
  skip() { const m = $('#admin').hidden ? $('#page') : $('.amain'); if (m) { m.setAttribute('tabindex', '-1'); m.focus(); } },
  menu() { $('#mnav').classList.add('open'); },
  closeAll() { closeAll(); },
  filters() { const f = $('#filters'); f.classList.toggle('open'); $('#ov').classList.toggle('open', f.classList.contains('open')); },
  resetF() { location.hash.indexOf('#/flotte?') === 0 ? (location.hash = '#/flotte') : go(); },
  thumb(el) { const v = veh(route.path[1]), i = +el.dataset.i; $('#gmain').innerHTML = `<img src="${imgSrc(v.imgs[i])}" alt="${esc(v.nom)}, photo ${i + 1}">`; $$('.thumbs button').forEach((b) => b.setAttribute('aria-current', b === el)); },
  cal(el) { calOffset = Math.max(0, calOffset + +el.dataset.d); $('#cal').innerHTML = calHTML(veh(route.path[1])); },
  wa(el) { waModal(veh(el.dataset.id)); },
  closeModal() { const r = $('#modalRoot'); r.innerHTML = ''; r.oninput = null; },
  noop(el, e) { e.preventDefault(); },
};
document.addEventListener('click', (e) => {
  if (e.target.id === 'ov') return closeAll();
  if (e.target.classList && e.target.classList.contains('modal')) return A.closeModal();
  const el = e.target.closest('[data-a]');
  if (!el || !A[el.dataset.a]) return;
  if (el.dataset.a === 'closeAll' && el.tagName === 'A') { closeAll(); return; }
  A[el.dataset.a](el, e);
});
document.addEventListener('change', (e) => {
  const t = e.target, top = route.path[0] || '';
  if (t.dataset.s) {
    setSearch(t.dataset.s, t.type === 'checkbox' ? t.checked : t.value);
    $$('[data-s=debut]').forEach((x) => { x.value = S.debut; }); $$('[data-s=fin]').forEach((x) => { x.value = S.fin; x.min = addDays(S.debut, 1); });
    if (top === 'flotte') fleetList(); else if (top === 'vehicule') refreshVehicle(); else if (top === 'reserver') go();
  } else if (t.dataset.opt) {
    S.options = t.checked ? S.options.concat(t.dataset.opt) : S.options.filter((x) => x !== t.dataset.opt); setSearch('options', S.options); refreshVehicle();
  } else if (t.dataset.f) { F[t.dataset.f] = $$(`[data-f=${t.dataset.f}]:checked`).map((x) => x.value); fleetList(); }
  else if (t.id === 'fplaces') { F.places = +t.value; fleetList(); }
  else if (t.id === 'fdispo') { F.dispo = t.checked; fleetList(); }
  else if (t.id === 'fsort') { F.sort = t.value; fleetList(); }
});
document.addEventListener('input', (e) => { if (e.target.id === 'fmax') { F.max = +e.target.value; fleetList(); } });
document.addEventListener('submit', (e) => {
  const f = e.target; if (!['hsearch', 'fsearch', 'rform'].includes(f.id)) return;
  e.preventDefault();
  if (f.id === 'hsearch') location.hash = '#/flotte';
  else if (f.id === 'fsearch') fleetList();
  else submitResa(f);
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeAll(); A.closeModal(); } });
window.addEventListener('hashchange', () => {
  const m = location.hash.match(/^#\/#(\w+)/);
  if (m) { if (route.path[0]) { history.replaceState(null, '', '#/'); go(); } setTimeout(() => { const t = document.getElementById(m[1]); if (t) t.scrollIntoView({ behavior: 'smooth' }); }, 60); return; }
  go();
});
function boot() {
  db = load(); window.db = db; initSearch();
  const m = location.hash.match(/^#\/#(\w+)/);
  if (m) { history.replaceState(null, '', '#/'); go(); setTimeout(() => { const t = document.getElementById(m[1]); if (t) t.scrollIntoView(); }, 80); } else go();
}
document.addEventListener('DOMContentLoaded', boot);
