/* ÉCLAT HAIR — boutique de démonstration : vitrine (catalogue, panier, commande, WhatsApp, rendez-vous) */
const KEY = 'eclat-hair-demo-v1';
let db;
const fresh = () => ({ produits: seedProduits(), orders: seedOrders(), rdv: seedRdv(), avis: seedAvis(), settings: seedSettings(), cart: [], favs: [], nextOrder: 1049, nextId: 100, nextRdv: 10 });
function load() {
  try { const d = JSON.parse(localStorage.getItem(KEY)); if (d && Array.isArray(d.produits) && Array.isArray(d.orders) && d.settings) return d; } catch (e) {}
  return fresh();
}
function persist() { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) { toast('Mémoire du navigateur pleine : photos trop lourdes.'); } }

/* ---------- Outils ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' F CFA';
const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const digits = (s) => String(s || '').replace(/\D/g, '');
const dFr = (iso) => { const [y, m, d] = iso.split('-'); return `${d}/${m}/${y}`; };
const dateFr = (t) => new Date(t).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
const todayISO = () => new Date().toISOString().slice(0, 10);
const hh = (h) => h.replace(':', ' h ').replace(' h 00', ' h');
const imgSrc = (x) => (/^(data:|img\/|https?:)/.test(x) ? x : IMG(x));
const prod = (id) => db.produits.find((p) => p.id === id);
const ic = (n) => ({
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>', heart: '<path d="M12 20s-7.5-4.6-9.2-9.4C1.6 7 3.6 4 6.6 4c2 0 3.4 1.1 4.2 2.4h.4C12 5.1 13.400 4 15.400 4c3 0 5 3 3.800 6.600C17.500 15.400 12 20 12 20Z"/>',
  bag: '<path d="M5 8h14l-1 12H6L5 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>', menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  truck: '<path d="M2 6h11v10H2zM13 10h4l3 3v3h-7"/><circle cx="7" cy="17.500" r="1.800"/><circle cx="16.500" cy="17.500" r="1.800"/>',
  shield: '<path d="M12 3 4 6v6c0 4.500 3.400 7.700 8 9 4.600-1.300 8-4.500 8-9V6l-8-3Z"/><path d="m9 12 2 2 4-4"/>',
  chat: '<path d="M4 5h16v11H9l-5 4V5Z"/>', phone: '<path d="M6 3h4l1.500 4-2 1.500a11 11 0 0 0 5 5l1.500-2 4 1.500v4a2 2 0 0 1-2 2A15 15 0 0 1 4 5a2 2 0 0 1 2-2Z"/>',
  gem: '<path d="m6 3-4 6 10 12L22 9l-4-6H6Z"/><path d="M2 9h20M9 3l3 6 3-6"/>', x: '<path d="M6 6l12 12M18 6 6 18"/>',
}[n] || '');
const svg = (n, extra = '') => `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" ${extra}>${ic(n)}</svg>`;

/* ---------- Disponibilité et promotions ---------- */
function status(p) {
  if (p.dispo === 'rupture' || (p.dispo === 'auto' && p.stock <= 0)) return { k: 'bad', label: 'Rupture de stock', out: true };
  if (p.dispo === 'limite' || (p.dispo === 'auto' && p.stock <= 3)) return { k: 'warn', label: 'Stock limité', out: false };
  return { k: 'ok', label: 'Disponible', out: false };
}
const promoOn = (p) => p.ancien > p.prix && (!p.promoEnd || p.promoEnd > Date.now());
const pct = (p) => Math.round((1 - p.prix / p.ancien) * 100);
const daysLeft = (p) => Math.max(1, Math.ceil((p.promoEnd - Date.now()) / DAY));
const leftText = (p) => (!p.promoEnd ? 'Offre limitée' : daysLeft(p) === 1 ? 'Dernier jour' : `Plus que ${daysLeft(p)} jours`);
function cdText(end) {
  const ms = end - Date.now(); if (ms <= 0) return 'Offre terminée';
  const d = Math.floor(ms / DAY), h = Math.floor(ms % DAY / 3600000), m = Math.floor(ms % 3600000 / 60000), s = Math.floor(ms % 60000 / 1000);
  return `${d}j ${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
}
const priceHTML = (p) => promoOn(p) ? `<div class="price"><b>${fmt(p.prix)}</b><s>${fmt(p.ancien)}</s><em>-${pct(p)} %</em></div>` : `<div class="price"><b>${fmt(p.prix)}</b></div>`;

/* ---------- Panier ---------- */
const cartCount = () => db.cart.reduce((t, l) => t + l.q, 0);
const cartSous = () => db.cart.reduce((t, l) => t + (prod(l.id) ? prod(l.id).prix * l.q : 0), 0);
function fee(sous, mode, ville) {
  if (mode === 'Retrait en boutique' || !sous) return 0;
  if (sous >= db.settings.gratuitDes) return 0;
  return ville && ville !== 'Abidjan' ? db.settings.fraisInterieur : db.settings.fraisAbidjan;
}
function addToCart(id, q = 1, silent) {
  const p = prod(id); if (!p || status(p).out) return;
  const l = db.cart.find((x) => x.id === id);
  const max = Math.max(1, p.stock || 99);
  if (l) l.q = Math.min(l.q + q, max); else db.cart.push({ id, q: Math.min(q, max) });
  persist(); refreshCart();
  if (!silent) toast(`« ${p.nom} » ajouté au panier`);
}
function setQty(id, q) { const l = db.cart.find((x) => x.id === id); if (!l) return; const p = prod(id); l.q = Math.max(1, Math.min(q, Math.max(1, p ? p.stock : 99))); persist(); refreshCart(); }
function removeFromCart(id) { db.cart = db.cart.filter((x) => x.id !== id); persist(); refreshCart(); }
function toggleFav(id) {
  const i = db.favs.indexOf(id); if (i >= 0) db.favs.splice(i, 1); else { db.favs.push(id); toast('Ajouté à vos favoris'); }
  persist(); $$(`[data-a=fav][data-id="${id}"]`).forEach((b) => b.setAttribute('aria-pressed', db.favs.includes(id))); refreshHeader();
}
function toast(msg) {
  const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; $('#toasts').appendChild(t);
  setTimeout(() => { t.style.opacity = 0; t.style.transition = 'opacity .4s'; setTimeout(() => t.remove(), 400); }, 2600);
}

/* ---------- WhatsApp ---------- */
const waLink = (msg) => `https://wa.me/${db.settings.whatsapp}?text=${encodeURIComponent(msg)}`;
function msgOrder(lignes, c, total) {
  const bloc = lignes.map((l) => `${l.nom}\nPrix : ${fmt(l.prix)}\nQuantité : ${l.q}`).join('\n\n');
  return `Bonjour, je souhaite commander :\n\n${bloc}\n\nTotal : ${fmt(total)}\n\nNom : ${c.nom || ''}\nTéléphone : ${c.tel || ''}\nAdresse : ${[c.commune, c.ville, c.adresse].filter(Boolean).join(', ')}\nMode de livraison : ${c.livraison || ''}\n\nMerci.`;
}
const waGeneric = () => waLink('Bonjour, je souhaite avoir des informations sur vos perruques et extensions.');

/* ---------- Routage ---------- */
let route = { path: [], q: {} };
function parseHash() {
  const h = location.hash.replace(/^#\/?/, ''); const [p, qs] = h.split('?');
  route = { path: p.split('/').filter(Boolean).map(decodeURIComponent), q: Object.fromEntries(new URLSearchParams(qs || '')) };
}
function setMeta(title, desc) {
  document.title = title;
  const m = $('meta[name=description]'); if (m && desc) m.setAttribute('content', desc);
}
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
  closeAll();
  setLD(null);
  if (isAdmin) { renderAdmin(route.path[1] || 'dashboard'); window.scrollTo(0, 0); afterRender(); return; }
  const pages = { '': pageHome, boutique: pageShop, produit: pageProduct, favoris: pageFavs, commande: pageCheckout, confirmation: pageConfirm, 'rendez-vous': pageRdv, 'a-propos': pageAbout };
  $('#page').innerHTML = (pages[top] || pageHome)();
  refreshHeader();
  if (top === 'boutique') shopInit();
  if (top === 'commande') checkoutSum();
  if (top === 'rendez-vous') rdvHours();
  window.scrollTo({ top: 0, behavior: 'instant' });
  afterRender();
}
function afterRender() {
  const io = window.__io || (window.__io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .08 }));
  $$('.rv:not(.in)').forEach((el) => io.observe(el));
  tick();
}
function tick() { $$('[data-cd]').forEach((el) => { el.textContent = cdText(+el.dataset.cd); }); }
setInterval(tick, 1000);

/* ---------- En-tête, menu, pied ---------- */
const NAV = [['#/boutique', 'Boutique'], ['#/boutique?cat=Nouveaut%C3%A9s', 'Nouveautés'], ['#/#offres', 'Offres'], ['#/rendez-vous', 'Rendez-vous'], ['#/#avis', 'Avis'], ['#/a-propos', 'À propos']];
function refreshHeader() {
  const cur = '#/' + (route.path[0] || '');
  $('#hdr').innerHTML = `<div class="wrap">
    <button class="ibtn burger" data-a="menu" aria-label="Ouvrir le menu">${svg('menu')}</button>
    <a class="logo" href="#/" aria-label="ÉCLAT HAIR, accueil">ÉCLAT<span>·</span>HAIR</a>
    <nav class="main" aria-label="Navigation principale">${NAV.map(([h, l]) => `<a href="${h}" ${h === cur || (h === '#/boutique' && cur === '#/produit') ? 'aria-current="page"' : ''}>${l}</a>`).join('')}</nav>
    <div class="tools">
      <button class="ibtn" data-a="search" aria-label="Rechercher">${svg('search')}</button>
      <a class="ibtn" href="#/favoris" aria-label="Mes favoris (${db.favs.length})">${svg('heart')}${db.favs.length ? `<span class="badge">${db.favs.length}</span>` : ''}</a>
      <button class="ibtn" data-a="cart" aria-label="Ouvrir le panier (${cartCount()} article${cartCount() > 1 ? 's' : ''})">${svg('bag')}${cartCount() ? `<span class="badge">${cartCount()}</span>` : ''}</button>
    </div></div>`;
  $('#mnav').innerHTML = `<button class="x" data-a="closeAll" aria-label="Fermer le menu">×</button>${NAV.map(([h, l]) => `<a href="${h}" data-a="closeAll">${l}</a>`).join('')}<a href="#/favoris" data-a="closeAll">Mes favoris</a><a href="${waGeneric()}" target="_blank" rel="noopener" style="color:#6FE39A">Écrire sur WhatsApp</a>`;
  $('#waFloat').href = waGeneric();
}
function pageFoot() {
  return `<section class="dstbox"><div class="wrap"><p class="k">Cette solution a été conçue par DST Technologie</p><p class="s">Votre partenaire digital pour développer votre entreprise.</p><div class="row"><a class="btn gold" href="../../index.html#/contact">Créer mon site web</a><a class="btn ghost-w" href="#/admin">Voir l'espace administrateur</a><a class="btn ghost-w" href="../../index.html#/realisations">Autres exemples</a></div></div></section>
  <footer class="bot"><div class="wrap">
    <div><a class="logo" href="#/" style="color:#fff">ÉCLAT<span>·</span>HAIR</a><p style="margin-top:12px;max-width:34ch">Perruques et extensions capillaires de qualité, livrées partout en Côte d'Ivoire.</p></div>
    <div><h4>Boutique</h4><a href="#/boutique">Toutes les perruques</a><a href="#/boutique?cat=Extensions">Extensions</a><a href="#/boutique?cat=Perruques%20HD">Perruques HD</a><a href="#/favoris">Mes favoris</a></div>
    <div><h4>Services</h4><a href="#/rendez-vous">Prendre rendez-vous</a><a href="#/#offres">Offres du moment</a><a href="#/a-propos">À propos</a></div>
    <div><h4>Contact</h4><a href="${waGeneric()}" target="_blank" rel="noopener">WhatsApp</a><a href="#" data-a="soc">Instagram</a><a href="#" data-a="soc">TikTok</a><a href="#" data-a="soc">Facebook</a><span>${esc(db.settings.adresse)}</span></div>
    <p class="legal">Site de démonstration réalisé par DST Technologie. Boutique, produits, prix, avis et clients fictifs. Photos libres de droits (Pexels), à remplacer par vos propres photos.</p></div></footer>`;
}

/* ---------- Cartes produit ---------- */
function card(p, o = {}) {
  const s = status(p), fav = db.favs.includes(p.id);
  return `<article class="pc ${o.rv ? 'rv' : ''}">
    <a class="ph" href="#/produit/${p.id}" aria-label="Voir ${esc(p.nom)}"><img src="${imgSrc(p.imgs[0])}" alt="${esc(p.nom)}, ${esc(p.texture)} ${esc(p.couleur)}" loading="lazy" width="480" height="600">${p.imgs[1] ? `<img class="alt" src="${imgSrc(p.imgs[1])}" alt="" loading="lazy">` : ''}</a>
    <div class="tags">${promoOn(p) ? `<span class="tag red">-${pct(p)} %</span>` : ''}${p.tags.includes('nouveau') ? '<span class="tag">NOUVEAU</span>' : ''}${p.tags.includes('premium') ? '<span class="tag gold">PREMIUM</span>' : ''}</div>
    <button class="fav" data-a="fav" data-id="${p.id}" aria-pressed="${fav}" aria-label="Ajouter ${esc(p.nom)} aux favoris">${svg('heart')}</button>
    <div class="bd"><span class="meta">${esc(p.texture)} · ${p.longueur}"</span>
      <h3><a href="#/produit/${p.id}">${esc(p.nom)}</a></h3>
      ${priceHTML(p)}
      <span class="st ${s.k}">${s.label}${s.k === 'warn' && p.stock > 0 && p.dispo === 'auto' ? ` (${p.stock})` : ''}</span>
      ${o.cd && promoOn(p) && p.promoEnd ? `<div class="cd" aria-label="Fin de l'offre"><span>${leftText(p)}</span><span data-cd="${p.promoEnd}">${cdText(p.promoEnd)}</span></div>` : ''}
      <div class="acts"><a class="btn line sm" href="#/produit/${p.id}">Voir le produit</a><button class="btn sm" data-a="buy" data-id="${p.id}" ${s.out ? 'disabled' : ''}>${s.out ? 'Indisponible' : 'Commander'}</button></div>
    </div></article>`;
}

/* ---------- Accueil ---------- */
function pageHome() {
  setMeta('ÉCLAT HAIR | Perruques HD, Body Wave et extensions à Abidjan', 'Perruques HD, Body Wave, Deep Wave, Straight et extensions capillaires à Abidjan. Prix en FCFA, livraison en Côte d\'Ivoire, commande sur WhatsApp.');
  const vedettes = db.produits.filter((p) => p.tags.includes('best') || p.tags.includes('nouveau')).slice(0, 8);
  const offres = db.produits.filter((p) => promoOn(p) && p.promoEnd).slice(0, 4);
  const avis = db.avis.filter((a) => a.visible).slice(0, 3);
  const shots = ['32213600', '33141463', '11757361', '10059921', '37600597', '32767408'];
  return `
  <section class="hero" aria-labelledby="h1"><div class="bg"><img src="img/32213600.jpg" alt="Femme portant une perruque longue noire ondulée" fetchpriority="high"></div>
    <div class="wrap"><span class="eyebrow">Perruques &amp; extensions · Abidjan</span>
      <h1 id="h1">Révélez votre beauté avec nos <em>collections exclusives</em></h1>
      <p class="lead">Découvrez des perruques et extensions soigneusement sélectionnées pour sublimer votre style.</p>
      <div class="cta"><a class="btn gold" href="#/boutique">Découvrir la collection</a><a class="btn wa" href="${waGeneric()}" target="_blank" rel="noopener">Commander sur WhatsApp</a></div>
      <p class="deliv"><i></i>Livraison disponible en Côte d'Ivoire</p></div></section>
  <section class="trust" aria-label="Nos engagements"><div class="wrap">
    <div>${svg('truck')}<span><b>Livraison partout</b>Abidjan et intérieur du pays</span></div>
    <div>${svg('shield')}<span><b>Qualité contrôlée</b>Cheveux sélectionnés un à un</span></div>
    <div>${svg('phone')}<span><b>Paiement mobile</b>Wave, Orange Money</span></div>
    <div>${svg('chat')}<span><b>Conseils WhatsApp</b>Réponse rapide, 7j/7</span></div></div></section>
  <section class="sec"><div class="wrap"><div class="sechead rv"><div><span class="eyebrow">Nos collections</span><h2>Trouvez votre style</h2></div><a class="link" href="#/boutique">Tout voir</a></div>
    <div class="cats">${CATEGORIES.map((c) => `<a class="cat rv" href="#/boutique?cat=${encodeURIComponent(c.id)}"><img src="img/${c.img}.jpg" alt="Collection ${esc(c.id)}" loading="lazy"><span>${c.id}<small>${c.sub}</small></span></a>`).join('')}</div></div></section>
  <section class="sec" style="padding-top:0"><div class="wrap"><div class="sechead rv"><div><span class="eyebrow">Sélection</span><h2>Nos pièces favorites</h2></div><p>Prix, disponibilité et photos toujours à jour : vos clientes voient tout, sans vous écrire.</p></div>
    <div class="grid g4">${vedettes.map((p) => card(p, { rv: 1 })).join('')}</div>
    <p style="text-align:center;margin-top:36px"><a class="btn line" href="#/boutique">Voir toute la boutique</a></p></div></section>
  ${offres.length ? `<section class="sec offers" id="offres"><div class="wrap"><div class="sechead rv"><div><span class="eyebrow">Offres du moment</span><h2>Jusqu'à -${Math.max(...offres.map(pct))} % sur une sélection</h2></div><p style="color:#B9B0A2">Des promotions à durée limitée, avec compte à rebours.</p></div>
    <div class="grid g4">${offres.map((p) => card(p, { rv: 1, cd: 1 })).join('')}</div></div></section>` : '<span id="offres"></span>'}
  <section class="sec"><div class="wrap"><div class="sechead rv"><div><span class="eyebrow">Simple comme bonjour</span><h2>Commander en 3 étapes</h2></div></div>
    <div class="steps"><div class="step rv"><div class="n">1</div><h3>Choisissez</h3><p class="muted">Parcourez les collections, filtrez par longueur, texture ou couleur et vérifiez la disponibilité.</p></div>
    <div class="step rv"><div class="n">2</div><h3>Commandez</h3><p class="muted">Ajoutez au panier et validez, ou envoyez votre commande directement sur WhatsApp.</p></div>
    <div class="step rv"><div class="n">3</div><h3>Recevez</h3><p class="muted">Livraison à domicile à Abidjan et dans tout le pays, ou retrait en boutique.</p></div></div></div></section>
  <section class="sec" style="background:#fff"><div class="wrap rdvbox"><div class="rv"><span class="eyebrow">Rendez-vous</span><h2 style="margin:10px 0 14px">Prenez rendez-vous en boutique</h2><p class="muted">Pose, personnalisation, coiffure ou entretien : réservez votre créneau en ligne, sans attendre ni appeler.</p>
    <div class="svcs">${SERVICES_RDV.map((s) => `<div><span>${esc(s)}</span><span class="gold">✓</span></div>`).join('')}</div></div>
    <div class="card rv" data-rdvbox>${rdvForm()}</div></div></section>
  <section class="sec" id="avis"><div class="wrap"><div class="sechead rv"><div><span class="eyebrow">Avis clientes</span><h2>Elles nous font confiance</h2></div></div>
    <div class="reviews">${avis.map((a) => `<figure class="rev rv" style="margin:0"><div class="stars" aria-label="${a.note} étoiles sur 5">${'★'.repeat(a.note)}${'☆'.repeat(5 - a.note)}</div><q>${esc(a.texte)}</q><small>${esc(a.nom)} · ${esc(a.ville)}</small></figure>`).join('')}</div></div></section>
  <section class="sec social"><div class="wrap"><div class="sechead rv"><div><span class="eyebrow">Réseaux sociaux</span><h2>Suivez-nous sur Instagram et TikTok</h2><p>Nouveautés, avant/après et coulisses de la boutique. Votre site complète vos réseaux au lieu de dépendre d'eux.</p></div></div>
    <div class="shots rv">${shots.map((s) => `<a href="#" data-a="soc" aria-label="Voir sur Instagram"><img src="img/${s}.jpg" alt="Publication Instagram de la boutique" loading="lazy"></a>`).join('')}</div>
    <div class="soc rv"><a class="btn" href="#" data-a="soc">Instagram</a><a class="btn" href="#" data-a="soc">TikTok</a><a class="btn line" href="#" data-a="soc">Facebook</a><a class="btn wa" href="${waGeneric()}" target="_blank" rel="noopener">WhatsApp</a></div></div></section>
  ${aboutBlock()}${pageFoot()}`;
}
function aboutBlock() {
  return `<section class="sec" id="apropos"><div class="wrap split about"><div class="pic rv"><img src="img/12618341.jpg" alt="Intérieur de la boutique avec des perruques exposées" loading="lazy"></div>
    <div class="rv"><span class="eyebrow">À propos</span><h2 style="margin:10px 0 0">Une expérience d'achat simple et élégante</h2>
    <p>Notre mission est de proposer des perruques de qualité et d'offrir à chaque cliente une expérience d'achat simple, élégante et professionnelle.</p>
    <p>Chaque pièce est sélectionnée, contrôlée puis présentée avec ses vraies caractéristiques : longueur, texture, densité, type de lace. Vous savez exactement ce que vous commandez.</p>
    <div class="stats"><div><b>500+</b><span>clientes accompagnées</span></div><div><b>14</b><span>modèles en boutique</span></div><div><b>7j/7</b><span>conseils sur WhatsApp</span></div></div></div></div></section>`;
}
function pageAbout() { setMeta('À propos | ÉCLAT HAIR', 'Découvrez la boutique ÉCLAT HAIR : perruques de qualité et expérience d\'achat professionnelle à Abidjan.'); return `<div class="pagehead"><div class="wrap"><h1>À propos</h1></div></div>${aboutBlock()}${pageFoot()}`; }

/* ---------- Boutique ---------- */
let F = {};
function resetF(q) { F = { q: q.q || '', cat: q.cat || '', min: 0, max: 250000, len: [], tex: [], col: [], hair: [], dispo: '', sort: 'pertinence' }; }
function lenBucket(n) { return n <= 14 ? 'Court (jusqu\'à 14")' : n <= 22 ? 'Moyen (16" à 22")' : n <= 28 ? 'Long (24" à 28")' : 'Très long (30" et +)'; }
const LENS = ['Court (jusqu\'à 14")', 'Moyen (16" à 22")', 'Long (24" à 28")', 'Très long (30" et +)'];
function filtered() {
  let l = db.produits.filter((p) => {
    if (F.q && !norm(`${p.nom} ${p.texture} ${p.couleur} ${p.cheveux}`).includes(norm(F.q))) return false;
    if (F.cat) { const c = CATEGORIES.concat([EXTRA_CAT]).find((x) => x.id === F.cat); if (c && !c.test(p)) return false; }
    if (p.prix < F.min || p.prix > F.max) return false;
    if (F.len.length && !F.len.includes(lenBucket(p.longueur))) return false;
    if (F.tex.length && !F.tex.includes(p.texture)) return false;
    if (F.col.length && !F.col.includes(p.couleur)) return false;
    if (F.hair.length && !F.hair.includes(p.cheveux)) return false;
    if (F.dispo) { const k = status(p).k; if ((F.dispo === 'ok' && k !== 'ok') || (F.dispo === 'warn' && k !== 'warn') || (F.dispo === 'bad' && k !== 'bad') || (F.dispo === 'stock' && k === 'bad')) return false; }
    return true;
  });
  const by = { 'prix-asc': (a, b) => a.prix - b.prix, 'prix-desc': (a, b) => b.prix - a.prix, nouveautes: (a, b) => (b.tags.includes('nouveau') | 0) - (a.tags.includes('nouveau') | 0), promos: (a, b) => (promoOn(b) | 0) - (promoOn(a) | 0) };
  if (by[F.sort]) l = l.slice().sort(by[F.sort]);
  return l;
}
const chk = (name, vals, cur) => vals.map((v) => `<label class="chk"><input type="checkbox" data-f="${name}" value="${esc(v)}" ${cur.includes(v) ? 'checked' : ''}> ${esc(v)}</label>`).join('');
function pageShop() {
  parseHash(); resetF(route.q);
  setMeta(F.cat ? `${F.cat} | Boutique ÉCLAT HAIR` : 'Boutique perruques et extensions | ÉCLAT HAIR', 'Toutes nos perruques HD, Body Wave, Deep Wave, Straight et extensions. Filtrez par prix, longueur, texture, couleur et disponibilité.');
  return `<div class="pagehead"><div class="wrap"><p class="crumbs"><a href="#/">Accueil</a> / Boutique${F.cat ? ' / ' + esc(F.cat) : ''}</p><h1>${F.cat ? esc(F.cat) : 'Toute la collection'}</h1></div></div>
  <div class="wrap shop"><aside class="filters" id="filters" aria-label="Filtres"><div style="display:flex;justify-content:space-between;align-items:center"><h3>Filtres</h3><button class="ibtn xf" data-a="filters" aria-label="Fermer les filtres">${svg('x')}</button></div>
    <div class="fset"><h4>Recherche</h4><input class="t" type="search" id="fq" placeholder="Nom du produit…" value="${esc(F.q)}" aria-label="Rechercher un produit"></div>
    <div class="fset"><h4>Catégorie</h4><select class="t" id="fcat"><option value="">Toutes</option>${CATEGORIES.concat([EXTRA_CAT]).map((c) => `<option ${F.cat === c.id ? 'selected' : ''}>${c.id}</option>`).join('')}</select></div>
    <div class="fset"><h4>Prix : <span id="plab"></span></h4><label class="sr" for="pmin">Prix minimum</label><input class="range" type="range" id="pmin" min="0" max="250000" step="5000" value="${F.min}"><label class="sr" for="pmax">Prix maximum</label><input class="range" type="range" id="pmax" min="0" max="250000" step="5000" value="${F.max}"></div>
    <div class="fset"><h4>Longueur</h4>${chk('len', LENS, F.len)}</div>
    <div class="fset"><h4>Texture</h4>${chk('tex', TEXTURES, F.tex)}</div>
    <div class="fset"><h4>Couleur</h4>${chk('col', COULEURS, F.col)}</div>
    <div class="fset"><h4>Type de cheveux</h4>${chk('hair', CHEVEUX, F.hair)}</div>
    <div class="fset"><h4>Disponibilité</h4><select class="t" id="fdispo"><option value="">Toutes</option><option value="stock">En stock</option><option value="ok">Disponible</option><option value="warn">Stock limité</option><option value="bad">Rupture de stock</option></select></div>
    <button class="btn line block" data-a="resetF">Réinitialiser</button><button class="btn block xf" style="margin-top:10px" data-a="filters">Voir les résultats</button></aside>
    <div><div class="toolbar"><button class="btn line sm fbtn" data-a="filters">Filtrer</button><p id="rcount" class="muted"></p>
      <label class="sr" for="fsort">Trier</label><select class="sel" id="fsort"><option value="pertinence">Pertinence</option><option value="prix-asc">Prix croissant</option><option value="prix-desc">Prix décroissant</option><option value="nouveautes">Nouveautés</option><option value="promos">Promotions</option></select></div>
      <div class="grid" id="shopList"></div></div></div>${pageFoot()}`;
}
function shopInit() { $('#fdispo').value = F.dispo; shopList(); }
function shopList() {
  const l = filtered();
  $('#plab').textContent = `${fmt(F.min)} – ${fmt(F.max)}`;
  $('#rcount').textContent = `${l.length} produit${l.length > 1 ? 's' : ''}`;
  $('#shopList').innerHTML = l.length ? l.map((p) => card(p)).join('') : `<div class="empty" style="grid-column:1/-1"><h3>Aucun résultat</h3><p>Essayez d'élargir vos filtres.</p><p style="margin-top:14px"><button class="btn line sm" data-a="resetF">Réinitialiser les filtres</button></p></div>`;
}
document.addEventListener('input', (e) => {
  const t = e.target;
  if (t.id === 'fq') { F.q = t.value; shopList(); }
  else if (t.id === 'pmin' || t.id === 'pmax') { F.min = +$('#pmin').value; F.max = +$('#pmax').value; if (F.min > F.max) { if (t.id === 'pmin') { F.max = F.min; $('#pmax').value = F.max; } else { F.min = F.max; $('#pmin').value = F.min; } } shopList(); }
  else if (t.id === 'sq') suggest(t.value);
});
document.addEventListener('change', (e) => {
  const t = e.target;
  if (t.dataset.f) { const k = t.dataset.f; F[k] = $$(`[data-f=${k}]:checked`).map((x) => x.value); shopList(); }
  else if (t.id === 'fcat') { F.cat = t.value; shopList(); }
  else if (t.id === 'fdispo') { F.dispo = t.value; shopList(); }
  else if (t.id === 'fsort') { F.sort = t.value; shopList(); }
  else if (t.id === 'rdate') rdvHours();
  else if (t.id === 'cville' || t.name === 'livraison') checkoutSum();
});

/* Recherche globale */
function openSearch() {
  const r = $('#searchRoot'); if (r.innerHTML) { r.innerHTML = ''; return; }
  r.innerHTML = `<div class="searchbar"><div class="wrap"><form id="sform" role="search"><label class="sr" for="sq">Rechercher un produit</label><input id="sq" type="search" placeholder="Rechercher une perruque (ex. Body Wave, Deep Wave…)" autocomplete="off"><button class="btn" type="submit">Rechercher</button></form><div class="sugg" id="sugg" hidden></div></div></div>`;
  $('#sq').focus();
}
function suggest(v) {
  const s = $('#sugg'); if (!s) return;
  const l = v.trim() ? db.produits.filter((p) => norm(`${p.nom} ${p.texture} ${p.couleur}`).includes(norm(v))).slice(0, 5) : [];
  s.hidden = !l.length;
  s.innerHTML = `<div class="wrap">${l.map((p) => `<a href="#/produit/${p.id}"><img src="${imgSrc(p.imgs[0])}" alt=""><span><b>${esc(p.nom)}</b><br><small class="muted">${fmt(p.prix)}</small></span></a>`).join('')}</div>`;
}

/* ---------- Fiche produit ---------- */
function pageProduct() {
  const p = prod(route.path[1]);
  if (!p) return `<div class="wrap empty"><h1>Produit introuvable</h1><p><a class="btn" href="#/boutique">Retour à la boutique</a></p></div>${pageFoot()}`;
  const s = status(p);
  setMeta(`${p.nom} — ${fmt(p.prix)} | ÉCLAT HAIR`, `${p.nom} : ${p.texture}, ${p.couleur}, ${p.cheveux}, lace ${p.lace}. ${fmt(p.prix)}. Livraison en Côte d'Ivoire, commande sur WhatsApp.`);
  setLD({ '@context': 'https://schema.org', '@type': 'Product', name: p.nom, image: p.imgs.map((i) => new URL(imgSrc(i), location.href).href), description: p.desc, sku: p.id, brand: { '@type': 'Brand', name: 'ÉCLAT HAIR' }, offers: { '@type': 'Offer', priceCurrency: 'XOF', price: p.prix, availability: s.out ? 'https://schema.org/OutOfStock' : s.k === 'warn' ? 'https://schema.org/LimitedAvailability' : 'https://schema.org/InStock', url: location.href } });
  const rel = db.produits.filter((x) => x.id !== p.id && x.texture === p.texture || x.id !== p.id && x.tags.some((t) => p.tags.includes(t))).slice(0, 4);
  return `<div class="wrap"><p class="crumbs" style="padding-top:22px"><a href="#/">Accueil</a> / <a href="#/boutique">Boutique</a> / ${esc(p.texture)}</p>
  <div class="pdp"><div class="gal"><div class="main" id="gmain"><img src="${imgSrc(p.imgs[0])}" alt="${esc(p.nom)}, vue 1"></div>
    <div class="thumbs" role="group" aria-label="Photos du produit">${p.imgs.map((im, i) => `<button data-a="thumb" data-i="${i}" aria-current="${i === 0}" aria-label="Voir la photo ${i + 1}"><img src="${imgSrc(im)}" alt=""></button>`).join('')}</div></div>
  <div class="info"><span class="eyebrow">${esc(p.texture)} · ${esc(p.cheveux)}</span><h1>${esc(p.nom)}</h1>${priceHTML(p)}
    <p style="margin:10px 0"><span class="st ${s.k}">${s.label}${s.k === 'warn' && p.dispo === 'auto' && p.stock > 0 ? ` : plus que ${p.stock} en stock` : ''}</span></p>
    ${promoOn(p) && p.promoEnd ? `<div class="cd big" style="width:fit-content"><span>${leftText(p)}</span><span data-cd="${p.promoEnd}">${cdText(p.promoEnd)}</span></div>` : ''}
    <p class="muted" style="margin-top:14px">${esc(p.desc)}</p>
    <table class="spec"><tbody><tr><th>Longueur</th><td>${p.longueur} pouces</td></tr><tr><th>Texture</th><td>${esc(p.texture)}</td></tr><tr><th>Couleur</th><td>${esc(p.couleur)}</td></tr><tr><th>Type de cheveux</th><td>${esc(p.cheveux)}</td></tr><tr><th>Type de lace</th><td>${esc(p.lace)}</td></tr><tr><th>Densité</th><td>${esc(p.densite)}</td></tr></tbody></table>
    <div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap"><span id="qlab" class="sr">Quantité</span><div class="qty" role="group" aria-labelledby="qlab"><button data-a="pq" data-d="-1" aria-label="Moins">−</button><b id="pq">1</b><button data-a="pq" data-d="1" aria-label="Plus">+</button></div>
      <button class="btn line" data-a="fav" data-id="${p.id}" aria-pressed="${db.favs.includes(p.id)}">${svg('heart')} Ajouter aux favoris</button></div>
    <div class="buy"><button class="btn" data-a="addp" data-id="${p.id}" ${s.out ? 'disabled' : ''}>Ajouter au panier</button><button class="btn wa" data-a="wap" data-id="${p.id}" ${s.out ? 'disabled' : ''}>Commander sur WhatsApp</button>
      ${s.out ? `<a class="btn line full" target="_blank" rel="noopener" href="${waLink('Bonjour, pouvez-vous me prévenir quand « ' + p.nom + ' » sera de nouveau disponible ? Merci.')}">Me prévenir sur WhatsApp</a>` : ''}</div>
    <div class="assur"><span>${svg('truck')} Livraison en Côte d'Ivoire (offerte dès ${fmt(db.settings.gratuitDes)})</span><span>${svg('shield')} Qualité contrôlée avant expédition</span></div></div></div>
  ${rel.length ? `<section class="sec" style="padding-top:20px"><div class="sechead"><h2>Vous aimerez aussi</h2></div><div class="grid g4">${rel.map((x) => card(x)).join('')}</div></section>` : ''}</div>${pageFoot()}`;
}
function waModal(p, q) {
  const root = $('#modalRoot');
  root.innerHTML = `<div class="modal" role="dialog" aria-modal="true" aria-labelledby="wmt"><div class="box"><div style="display:flex;justify-content:space-between;gap:10px"><h2 id="wmt" style="font-size:28px">Commander sur WhatsApp</h2><button class="ibtn" data-a="closeModal" aria-label="Fermer">${svg('x')}</button></div>
    <p class="muted" style="margin-top:6px">Renseignez vos informations : le message est préparé pour vous.</p>
    <div class="fgrid"><div><label class="f" for="wn">Nom</label><input class="t" id="wn" autocomplete="name"></div><div><label class="f" for="wt">Téléphone</label><input class="t" id="wt" type="tel" inputmode="tel" autocomplete="tel"></div>
    <div><label class="f" for="wc">Commune / ville</label><input class="t" id="wc" list="communes" autocomplete="off"><datalist id="communes">${COMMUNES.map((c) => `<option value="${c}">`).join('')}</datalist></div>
    <div><label class="f" for="wl">Mode de livraison</label><select class="t" id="wl"><option>Livraison à domicile</option><option>Retrait en boutique</option></select></div></div>
    <div class="wapre" id="wapre" aria-live="polite"></div>
    <p class="muted" style="font-size:12.5px;margin-bottom:12px">Démo : le message part vers DST Technologie. Sur votre site, il arrivera sur VOTRE WhatsApp.</p>
    <a class="btn wa block" id="wasend" target="_blank" rel="noopener" href="#">Envoyer sur WhatsApp</a></div></div>`;
  const upd = () => {
    const c = { nom: $('#wn').value.trim(), tel: $('#wt').value.trim(), commune: $('#wc').value.trim(), livraison: $('#wl').value };
    const total = p.prix * q + fee(p.prix * q, c.livraison, 'Abidjan');
    const m = msgOrder([{ nom: p.nom, prix: p.prix, q }], c, total).replace('Adresse : ', 'Commune : ');
    $('#wapre').textContent = m; $('#wasend').href = waLink(m);
  };
  root.oninput = root.onchange = upd; upd(); $('#wn').focus();
}

/* ---------- Favoris ---------- */
function pageFavs() {
  setMeta('Mes favoris | ÉCLAT HAIR', 'Retrouvez vos perruques préférées.');
  const l = db.favs.map(prod).filter(Boolean);
  return `<div class="pagehead"><div class="wrap"><h1>Mes favoris</h1></div></div><div class="wrap" style="padding:34px 0 80px">${l.length ? `<div class="grid g4">${l.map((p) => card(p)).join('')}</div>` : `<div class="empty"><h3>Aucun favori pour le moment</h3><p>Touchez le cœur sur un produit pour le retrouver ici.</p><p style="margin-top:16px"><a class="btn" href="#/boutique">Découvrir la collection</a></p></div>`}</div>${pageFoot()}`;
}

/* ---------- Panier (tiroir) ---------- */
function refreshCart() {
  const sous = cartSous(), f = fee(sous, 'Livraison à domicile', 'Abidjan'), n = cartCount();
  $('#drawer').innerHTML = `<header><h2 style="font-size:28px">Mon panier <small class="muted" style="font-size:15px">(${n})</small></h2><button class="ibtn" data-a="closeAll" aria-label="Fermer le panier">${svg('x')}</button></header>
  <div class="body">${db.cart.length ? db.cart.map((l) => { const p = prod(l.id); if (!p) return ''; return `<div class="cl"><img src="${imgSrc(p.imgs[0])}" alt=""><div><h4>${esc(p.nom)}</h4><p class="muted" style="font-size:13px">${fmt(p.prix)}</p><div class="qty" style="margin-top:6px"><button data-a="cq" data-id="${p.id}" data-d="-1" aria-label="Moins">−</button><b>${l.q}</b><button data-a="cq" data-id="${p.id}" data-d="1" aria-label="Plus">+</button></div><button class="rm" data-a="crm" data-id="${p.id}">Supprimer</button></div><b>${fmt(p.prix * l.q)}</b></div>`; }).join('') : `<div class="empty"><p>Votre panier est vide.</p><p style="margin-top:14px"><a class="btn sm" href="#/boutique" data-a="closeAll">Découvrir la collection</a></p></div>`}</div>
  ${db.cart.length ? `<footer><div class="sum"><div><span>Sous-total</span><b>${fmt(sous)}</b></div><div><span>Livraison (Abidjan)</span><b>${f ? fmt(f) : 'Offerte'}</b></div><div class="tot"><span>Total</span><span>${fmt(sous + f)}</span></div></div>
  <p class="muted" style="font-size:12.5px;margin:8px 0 12px">Frais définitifs calculés selon votre ville à l'étape suivante.${sous < db.settings.gratuitDes ? ` Livraison offerte dès ${fmt(db.settings.gratuitDes)}.` : ''}</p><a class="btn block" href="#/commande" data-a="closeAll">Passer la commande</a></footer>` : ''}`;
  refreshHeader();
}
function openDrawer() { refreshCart(); $('#drawer').classList.add('open'); $('#drawer').setAttribute('aria-hidden', 'false'); $('#ov').classList.add('open'); }
function closeAll() {
  ['#drawer', '#mnav', '#ov'].forEach((s) => $(s) && $(s).classList.remove('open')); $('#drawer') && $('#drawer').setAttribute('aria-hidden', 'true');
  const f = $('#filters'); if (f) f.classList.remove('open');
}

/* ---------- Commande ---------- */
function pageCheckout() {
  setMeta('Passer la commande | ÉCLAT HAIR', 'Validez votre commande de perruques et extensions.');
  if (!db.cart.length) return `<div class="pagehead"><div class="wrap"><h1>Commande</h1></div></div><div class="wrap empty"><h3>Votre panier est vide</h3><p style="margin-top:16px"><a class="btn" href="#/boutique">Découvrir la collection</a></p></div>${pageFoot()}`;
  return `<div class="pagehead"><div class="wrap"><p class="crumbs"><a href="#/">Accueil</a> / Commande</p><h1>Finaliser ma commande</h1></div></div>
  <div class="wrap checkout"><form class="card" id="oform" novalidate><h2 style="font-size:28px;margin-bottom:6px">Vos informations</h2>
    <div class="fgrid"><div class="full"><label class="f" for="onom">Nom complet</label><input class="t" id="onom" name="nom" autocomplete="name"></div>
    <div><label class="f" for="otel">Téléphone</label><input class="t" id="otel" name="tel" type="tel" inputmode="tel" autocomplete="tel" placeholder="Ex. 07 00 00 00 00"></div>
    <div><label class="f" for="owa">Numéro WhatsApp</label><input class="t" id="owa" name="wa" type="tel" inputmode="tel" placeholder="Identique au téléphone si vide"></div>
    <div><label class="f" for="cville">Ville</label><select class="t" id="cville" name="ville">${VILLES.map((v) => `<option>${v}</option>`).join('')}</select></div>
    <div><label class="f" for="ocom">Commune</label><input class="t" id="ocom" name="commune" list="communes" autocomplete="off" placeholder="Ex. Cocody"><datalist id="communes">${COMMUNES.map((c) => `<option value="${c}">`).join('')}</datalist></div>
    <div class="full"><label class="f" for="oadr">Adresse</label><input class="t" id="oadr" name="adresse" autocomplete="street-address" placeholder="Quartier, rue, repère"></div></div>
    <fieldset style="border:0;padding:0;margin:14px 0 0"><legend class="f" style="padding:0">Mode de livraison</legend><div class="radios"><label><input type="radio" name="livraison" value="Livraison à domicile" checked><span>Livraison à domicile<br><small class="muted">Abidjan et intérieur du pays</small></span></label><label><input type="radio" name="livraison" value="Retrait en boutique"><span>Retrait en boutique<br><small class="muted">Gratuit · Cocody</small></span></label></div></fieldset>
    <label class="f" for="ocom2">Commentaire (facultatif)</label><textarea class="t" id="ocom2" name="commentaire" placeholder="Précisions pour la livraison, couleur, coupe…"></textarea>
    <p class="err" id="oerr" role="alert"></p><button class="btn gold block" type="submit" style="margin-top:8px">Valider la commande</button><p class="muted" style="font-size:12.5px;margin-top:10px">Paiement à la livraison, Wave ou Orange Money : la boutique vous confirme par WhatsApp.</p></form>
  <aside class="card"><h2 style="font-size:26px;margin-bottom:8px">Récapitulatif</h2>${db.cart.map((l) => { const p = prod(l.id); return p ? `<div class="cl"><img src="${imgSrc(p.imgs[0])}" alt=""><div><h4>${esc(p.nom)}</h4><p class="muted" style="font-size:13px">Quantité : ${l.q}</p></div><b>${fmt(p.prix * l.q)}</b></div>` : ''; }).join('')}<div class="sum" id="osum" style="margin-top:14px"></div></aside></div>${pageFoot()}`;
}
function checkoutSum() {
  const el = $('#osum'); if (!el) return;
  const mode = ($('input[name=livraison]:checked') || {}).value, ville = ($('#cville') || {}).value, sous = cartSous(), f = fee(sous, mode, ville);
  el.innerHTML = `<div><span>Sous-total</span><b>${fmt(sous)}</b></div><div><span>Livraison</span><b>${f ? fmt(f) : mode === 'Retrait en boutique' ? 'Gratuit' : 'Offerte'}</b></div><div class="tot"><span>Total</span><span>${fmt(sous + f)}</span></div>`;
  const com = $('#ocom'); if (com) com.disabled = ville !== 'Abidjan' && false;
}
document.addEventListener('submit', (e) => {
  const f = e.target; if (!f.id && !f.classList.contains('rdv-form')) return; e.preventDefault();
  if (f.id === 'sform') { location.hash = '#/boutique?q=' + encodeURIComponent($('#sq').value.trim()); $('#searchRoot').innerHTML = ''; }
  else if (f.id === 'oform') submitOrder(f);
  else if (f.classList.contains('rdv-form')) submitRdv(f);
});
function submitOrder(f) {
  const v = (n) => (f.elements[n].value || '').trim(), mode = $('input[name=livraison]:checked').value;
  const nom = v('nom'), tel = v('tel'), wa = v('wa') || tel, ville = v('ville'), commune = v('commune'), adresse = v('adresse');
  const m = nom.length < 3 ? 'Indiquez votre nom complet.' : digits(tel).length < 8 ? 'Indiquez un numéro de téléphone valide.' : digits(wa).length < 8 ? 'Le numéro WhatsApp n\'est pas valide.' : (mode === 'Livraison à domicile' && (adresse.length < 4 || (ville === 'Abidjan' && commune.length < 2))) ? 'Indiquez votre commune et votre adresse de livraison.' : '';
  $('#oerr').textContent = m; if (m) return;
  const lignes = db.cart.filter((l) => prod(l.id)).map((l) => ({ id: l.id, nom: prod(l.id).nom, prix: prod(l.id).prix, q: l.q }));
  const sous = lignes.reduce((t, l) => t + l.prix * l.q, 0), frais = fee(sous, mode, ville);
  const o = { id: db.nextOrder++, date: Date.now(), nom, tel, whatsapp: wa, ville, commune, adresse, livraison: mode, lignes, sous, frais, total: sous + frais, statut: 'Nouvelle', commentaire: v('commentaire') };
  lignes.forEach((l) => { const p = prod(l.id); p.stock = Math.max(0, p.stock - l.q); });
  db.orders.unshift(o); db.cart = []; persist(); refreshCart();
  location.hash = '#/confirmation/' + o.id;
}
function pageConfirm() {
  const o = db.orders.find((x) => String(x.id) === route.path[1]);
  setMeta('Commande enregistrée | ÉCLAT HAIR', 'Votre commande a bien été enregistrée.');
  if (!o) return `<div class="wrap empty"><h1>Commande introuvable</h1><p><a class="btn" href="#/boutique">Retour à la boutique</a></p></div>${pageFoot()}`;
  const m = msgOrder(o.lignes, { nom: o.nom, tel: o.tel, commune: o.commune, ville: o.ville, adresse: o.adresse, livraison: o.livraison }, o.total);
  return `<div class="wrap recap" style="padding:44px 0 80px;max-width:760px"><div class="ok">✓</div><h1 style="font-size:clamp(32px,5vw,52px)">Merci ${esc(o.nom.split(' ')[0])}, commande enregistrée</h1>
  <p class="muted" style="margin:10px 0 24px">Commande n° <b>${o.id}</b> · La boutique vous confirme par WhatsApp. (Démonstration : aucune commande réelle n'est transmise.)</p>
  <div class="card"><h2 style="font-size:26px;margin-bottom:6px">Récapitulatif</h2>${o.lignes.map((l) => `<div class="cl" style="grid-template-columns:1fr auto"><div><h4>${esc(l.nom)}</h4><p class="muted" style="font-size:13px">${fmt(l.prix)} × ${l.q}</p></div><b>${fmt(l.prix * l.q)}</b></div>`).join('')}
    <div class="sum" style="margin-top:14px"><div><span>Sous-total</span><b>${fmt(o.sous)}</b></div><div><span>Livraison</span><b>${o.frais ? fmt(o.frais) : 'Offerte / retrait'}</b></div><div class="tot"><span>Total</span><span>${fmt(o.total)}</span></div></div>
    <p class="muted" style="margin-top:14px;font-size:14px"><b>${esc(o.livraison)}</b> · ${esc([o.commune, o.ville, o.adresse].filter((x) => x && x !== '—').join(', ') || '—')}<br>Téléphone : ${esc(o.tel)} · WhatsApp : ${esc(o.whatsapp)}</p></div>
  <h2 style="font-size:26px;margin:26px 0 6px">Accélérez avec WhatsApp</h2><div class="wapre">${esc(m)}</div>
  <div style="display:flex;gap:12px;flex-wrap:wrap"><a class="btn wa" href="${waLink(m)}" target="_blank" rel="noopener">Envoyer sur WhatsApp</a><a class="btn line" href="#/boutique">Continuer mes achats</a></div></div>${pageFoot()}`;
}

/* ---------- Rendez-vous ---------- */
function rdvForm(done) {
  if (done) return done;
  return `<h3 style="font-size:28px;margin-bottom:4px">Réserver un créneau</h3><form class="rdv-form" novalidate>
  <label class="f" for="rsvc">Service</label><select class="t" id="rsvc" name="service">${SERVICES_RDV.map((s) => `<option>${esc(s)}</option>`).join('')}</select>
  <div class="fgrid"><div><label class="f" for="rdate">Date</label><input class="t" id="rdate" name="date" type="date" min="${todayISO()}" value="${new Date(Date.now() + DAY).toISOString().slice(0, 10)}"></div>
  <div><label class="f" for="rheure">Heure</label><select class="t" id="rheure" name="heure">${HEURES.map((h) => `<option value="${h}">${hh(h)}</option>`).join('')}</select></div>
  <div><label class="f" for="rnom">Nom</label><input class="t" id="rnom" name="nom" autocomplete="name"></div>
  <div><label class="f" for="rtel">Téléphone</label><input class="t" id="rtel" name="tel" type="tel" inputmode="tel" autocomplete="tel"></div>
  <div class="full"><label class="f" for="rwa">WhatsApp</label><input class="t" id="rwa" name="wa" type="tel" inputmode="tel" placeholder="Identique au téléphone si vide"></div></div>
  <p class="err" role="alert"></p><button class="btn gold block" type="submit">Confirmer le rendez-vous</button></form>`;
}
function rdvHours() {
  const d = $('#rdate'), sel = $('#rheure'); if (!d || !sel) return;
  const taken = db.rdv.filter((r) => r.date === d.value && r.statut !== 'Annulé').map((r) => r.heure);
  $$('option', sel).forEach((o) => { o.disabled = taken.includes(o.value); o.textContent = hh(o.value) + (o.disabled ? ' (complet)' : ''); });
  if (sel.selectedOptions[0] && sel.selectedOptions[0].disabled) { const f = $$('option', sel).find((o) => !o.disabled); if (f) sel.value = f.value; }
}
function submitRdv(f) {
  const v = (n) => (f.elements[n].value || '').trim();
  const nom = v('nom'), tel = v('tel'), wa = v('wa') || tel, date = v('date'), heure = v('heure'), service = v('service');
  const m = nom.length < 2 ? 'Indiquez votre nom.' : digits(tel).length < 8 ? 'Indiquez un numéro de téléphone valide.' : digits(wa).length < 8 ? 'Le numéro WhatsApp n\'est pas valide.' : !date || date < todayISO() ? 'Choisissez une date à venir.' : db.rdv.some((r) => r.date === date && r.heure === heure && r.statut !== 'Annulé') ? 'Ce créneau est déjà pris, choisissez une autre heure.' : '';
  f.querySelector('.err').textContent = m; if (m) return;
  db.rdv.push({ id: db.nextRdv++, service, date, heure, nom, tel, whatsapp: wa, statut: 'En attente' }); persist();
  const msg = `Bonjour, je viens de réserver un rendez-vous :\n${service}\nLe ${dFr(date)} à ${hh(heure)}\nNom : ${nom}\nTéléphone : ${tel}\n\nMerci de confirmer.`;
  f.closest('[data-rdvbox],.card').innerHTML = `<div class="recap"><div class="ok">✓</div><h3 style="font-size:28px">Rendez-vous demandé</h3><p class="muted" style="margin:8px 0 16px">${esc(service)}<br>Le ${dFr(date)} à ${hh(heure)}. La boutique vous confirme par WhatsApp.</p><a class="btn wa" href="${waLink(msg)}" target="_blank" rel="noopener">Confirmer sur WhatsApp</a></div>`;
}
function pageRdv() {
  setMeta('Prendre rendez-vous | ÉCLAT HAIR', 'Réservez la pose, la personnalisation, la coiffure ou l\'entretien de votre perruque à Abidjan.');
  return `<div class="pagehead"><div class="wrap"><p class="crumbs"><a href="#/">Accueil</a> / Rendez-vous</p><h1>Prendre rendez-vous</h1></div></div>
  <div class="wrap" style="padding:40px 0 80px"><div class="rdvbox"><div><h2>Nos services en boutique</h2><p class="muted" style="margin-top:10px">Choisissez un service et un créneau libre. Vous recevez la confirmation sur WhatsApp.</p><div class="svcs">${SERVICES_RDV.map((s) => `<div><span>${esc(s)}</span><span class="gold">✓</span></div>`).join('')}</div></div><div class="card" data-rdvbox>${rdvForm()}</div></div></div>${pageFoot()}`;
}

/* ---------- Actions (clics) ---------- */
const A = {
  menu() { $('#mnav').classList.add('open'); },
  closeAll() { closeAll(); },
  search() { openSearch(); },
  cart() { openDrawer(); },
  filters() { $('#filters').classList.toggle('open'); $('#ov').classList.toggle('open', $('#filters').classList.contains('open')); },
  resetF() { resetF({}); location.hash.startsWith('#/boutique?') ? (location.hash = '#/boutique') : go(); },
  fav(el) { toggleFav(el.dataset.id); },
  buy(el) { addToCart(el.dataset.id, 1, true); location.hash = '#/commande'; },
  addp(el) { addToCart(el.dataset.id, +$('#pq').textContent); },
  pq(el) { const b = $('#pq'); b.textContent = Math.max(1, Math.min(10, +b.textContent + +el.dataset.d)); },
  wap(el) { waModal(prod(el.dataset.id), +$('#pq').textContent); },
  thumb(el) { const p = prod(route.path[1]), i = +el.dataset.i; $('#gmain').innerHTML = `<img src="${imgSrc(p.imgs[i])}" alt="${esc(p.nom)}, vue ${i + 1}">`; $$('.thumbs button').forEach((b) => b.setAttribute('aria-current', b === el)); },
  cq(el) { const l = db.cart.find((x) => x.id === el.dataset.id); if (l) setQty(l.id, l.q + +el.dataset.d); },
  crm(el) { removeFromCart(el.dataset.id); },
  closeModal() { const r = $('#modalRoot'); r.innerHTML = ''; r.oninput = r.onchange = null; },
  soc() { toast('Démo : ici s\'ouvrirait votre page de réseau social.'); },
};
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-a]');
  if (e.target.id === 'ov') return closeAll();
  if (e.target.classList && e.target.classList.contains('modal')) return A.closeModal();
  if (!el || !A[el.dataset.a]) return;
  if (el.tagName === 'A' && el.dataset.a === 'soc') e.preventDefault();
  if (el.dataset.a === 'closeAll' && el.tagName === 'A') { closeAll(); return; }
  A[el.dataset.a](el, e);
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeAll(); A.closeModal(); const r = $('#searchRoot'); if (r) r.innerHTML = ''; } });
window.addEventListener('hashchange', () => {
  // Ancres internes de l'accueil (#/#offres) : retour à l'accueil puis défilement
  const m = location.hash.match(/^#\/#(\w+)/);
  if (m) { if (route.path[0]) { history.replaceState(null, '', '#/'); go(); } setTimeout(() => { const t = document.getElementById(m[1]); if (t) t.scrollIntoView({ behavior: 'smooth' }); }, 60); return; }
  go();
});
function boot() { db = load(); window.db = db; refreshCart(); if (location.hash.match(/^#\/#/)) { const id = location.hash.slice(3); history.replaceState(null, '', '#/'); go(); setTimeout(() => { const t = document.getElementById(id); if (t) t.scrollIntoView(); }, 80); } else go(); }
