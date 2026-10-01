/* ÉCLAT HAIR — espace administrateur de démonstration */
const adm = { pq: '', of: '', cq: '', draft: null, editId: null };
const SECS = [['dashboard', 'Dashboard'], ['produits', 'Produits'], ['commandes', 'Commandes'], ['clients', 'Clients'], ['stock', 'Stock'], ['promotions', 'Promotions'], ['rendez-vous', 'Rendez-vous'], ['avis', 'Avis'], ['parametres', 'Paramètres']];
const SECIC = { dashboard: 'gem', produits: 'bag', commandes: 'truck', clients: 'heart', stock: 'shield', promotions: 'gem', 'rendez-vous': 'phone', avis: 'chat', parametres: 'menu' };
const opts = (list, cur) => list.map((v) => `<option ${v === cur ? 'selected' : ''}>${esc(v)}</option>`).join('');
const sIdx = (s) => STATUTS.indexOf(s);
const caOrders = () => db.orders.filter((o) => o.statut !== 'Annulée');
function clientsList() {
  const m = new Map();
  db.orders.forEach((o) => { const k = digits(o.tel); const c = m.get(k) || { nom: o.nom, tel: o.tel, ville: o.ville, n: 0, total: 0, last: 0 }; if (o.statut !== 'Annulée') { c.n++; c.total += o.total; } c.last = Math.max(c.last, o.date); m.set(k, c); });
  db.rdv.forEach((r) => { const k = digits(r.tel); if (!m.has(k)) m.set(k, { nom: r.nom, tel: r.tel, ville: 'Abidjan', n: 0, total: 0, last: 0 }); });
  return [...m.values()].sort((a, b) => b.total - a.total);
}
function renderAdmin(sec) {
  if (!SECS.some(([k]) => k === sec)) sec = 'dashboard';
  const view = { dashboard: aDash, produits: aProd, commandes: aOrd, clients: aCli, stock: aStock, promotions: aPromo, 'rendez-vous': aRdv, avis: aAvis, parametres: aSet }[sec];
  document.title = `Admin — ${SECS.find(([k]) => k === sec)[1]} | ÉCLAT HAIR`;
  $('#admin').innerHTML = `<div class="admin"><nav class="side" aria-label="Menu administrateur"><a class="logo" href="#/">ÉCLAT<span>·</span>HAIR</a>
    ${SECS.map(([k, l]) => `<a href="#/admin/${k}" ${k === sec ? 'aria-current="page"' : ''}>${svg(SECIC[k])}${l}</a>`).join('')}
    <a class="sp" href="#/">← Voir la boutique</a></nav>
    <div class="amain"><div class="ahead"><h1>${SECS.find(([k]) => k === sec)[1]}</h1><span class="demo-pill">Mode démonstration · données fictives, enregistrées dans votre navigateur</span></div>${view()}</div></div>`;
}
function reload() { renderAdmin(route.path[1] || 'dashboard'); }

/* Dashboard */
function aDash() {
  const ca = caOrders().reduce((t, o) => t + o.total, 0), dispo = db.produits.filter((p) => !status(p).out).length, rupt = db.produits.length - dispo;
  const days = [...Array(7)].map((_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); const k = d.toDateString(); return { l: d.toLocaleDateString('fr-FR', { weekday: 'short' }), v: caOrders().filter((o) => new Date(o.date).toDateString() === k).reduce((t, o) => t + o.total, 0) }; });
  const mx = Math.max(1, ...days.map((d) => d.v));
  const low = db.produits.filter((p) => p.stock <= 3).slice(0, 6);
  return `<div class="kpis"><div class="kpi"><b>${db.orders.length}</b><span>Commandes</span></div><div class="kpi"><b>${fmt(ca)}</b><span>Chiffre d'affaires</span></div><div class="kpi"><b>${clientsList().length}</b><span>Clientes</span></div><div class="kpi"><b>${dispo}</b><span>Produits disponibles</span></div><div class="kpi"><b style="color:${rupt ? 'var(--bad)' : 'inherit'}">${rupt}</b><span>En rupture</span></div><div class="kpi"><b>${db.rdv.filter((r) => r.statut !== 'Annulé').length}</b><span>Rendez-vous</span></div></div>
  <div class="two"><div class="panel"><h2>Ventes des 7 derniers jours</h2><div class="chart">${days.map((d) => `<div title="${fmt(d.v)}"><i style="height:${Math.round(d.v / mx * 100)}%"></i>${d.l}</div>`).join('')}</div></div>
  <div class="panel"><h2>Stock à surveiller</h2>${low.length ? low.map((p) => `<p style="display:flex;justify-content:space-between;gap:10px;padding:7px 0;border-bottom:1px solid var(--line);font-size:14px"><span>${esc(p.nom)}</span><span class="st ${status(p).k}">${p.stock}</span></p>`).join('') : '<p class="muted">Tout est en stock.</p>'}<p style="margin-top:12px"><a class="link" href="#/admin/stock">Gérer le stock</a></p></div></div>
  <div class="panel"><h2>Commandes récentes</h2>${ordersTable(db.orders.slice(0, 5), true)}<p style="margin-top:12px"><a class="link" href="#/admin/commandes">Toutes les commandes</a></p></div>`;
}

/* Produits */
function prodRows() {
  const q = norm(adm.pq), l = db.produits.filter((p) => !q || norm(p.nom).includes(q));
  return l.map((p) => { const s = status(p); return `<tr><td><img class="th" src="${imgSrc(p.imgs[0])}" alt=""></td><td><b>${esc(p.nom)}</b><br><small class="muted">${esc(p.texture)} · ${p.longueur}" · ${esc(p.couleur)}</small></td><td>${fmt(p.prix)}${promoOn(p) ? `<br><small class="gold">-${pct(p)} %</small>` : ''}</td><td>${p.stock}</td><td><span class="st ${s.k}">${s.label}</span></td><td><div class="row-a"><button class="btn line xs" data-a="padd" data-id="${p.id}">Modifier</button><button class="btn danger xs" data-a="pdel" data-id="${p.id}">Supprimer</button></div></td></tr>`; }).join('') || '<tr><td colspan="6" class="muted">Aucun produit.</td></tr>';
}
function aProd() {
  return `<div class="panel"><div class="ahead" style="margin-bottom:12px"><input class="t" id="apq" type="search" placeholder="Rechercher un produit…" value="${esc(adm.pq)}" style="max-width:340px" aria-label="Rechercher"><button class="btn gold sm" data-a="padd">+ Ajouter un produit</button></div>
  <div class="tblw"><table class="tbl"><thead><tr><th></th><th>Produit</th><th>Prix</th><th>Stock</th><th>Disponibilité</th><th>Actions</th></tr></thead><tbody id="ptb">${prodRows()}</tbody></table></div></div>`;
}
const TAGS = [['nouveau', 'Nouveautés'], ['best', 'Best-seller'], ['hd', 'HD'], ['premium', 'Premium'], ['colore', 'Colorée'], ['ext', 'Extensions']];
function imgsHTML() {
  return `<div class="imgs">${adm.draft.imgs.map((im, i) => `<div><img src="${imgSrc(im)}" alt="Photo ${i + 1}"><button type="button" data-a="pimgrm" data-i="${i}" aria-label="Retirer la photo ${i + 1}">×</button></div>`).join('') || '<small class="muted">Aucune photo</small>'}</div>`;
}
function prodModal(id) {
  const p = id ? prod(id) : P({ id: '', nom: '', texture: 'Body Wave', longueur: 22, couleur: 'Noir naturel', prix: 100000, stock: 5, imgs: [], desc: '' });
  adm.editId = id || null; adm.draft = { imgs: p.imgs.slice() };
  $('#modalRoot').oninput = $('#modalRoot').onchange = null;
  const days = p.promoEnd ? Math.max(1, Math.ceil((p.promoEnd - Date.now()) / DAY)) : '';
  $('#modalRoot').innerHTML = `<div class="modal" role="dialog" aria-modal="true" aria-labelledby="pmt"><div class="box wide"><div style="display:flex;justify-content:space-between"><h2 id="pmt" style="font-size:30px">${id ? 'Modifier le produit' : 'Ajouter un produit'}</h2><button class="ibtn" data-a="closeModal" aria-label="Fermer">${svg('x')}</button></div>
  <form id="pform" novalidate><div class="fgrid"><div class="full"><label class="f" for="pn">Nom</label><input class="t" id="pn" name="nom" value="${esc(p.nom)}"></div>
  <div><label class="f" for="pt">Texture</label><select class="t" id="pt" name="texture">${opts(TEXTURES, p.texture)}</select></div>
  <div><label class="f" for="pl">Longueur (pouces)</label><input class="t" id="pl" name="longueur" type="number" min="4" max="40" value="${p.longueur}"></div>
  <div><label class="f" for="pc">Couleur</label><select class="t" id="pc" name="couleur">${opts(COULEURS, p.couleur)}</select></div>
  <div><label class="f" for="ph">Type de cheveux</label><select class="t" id="ph" name="cheveux">${opts(CHEVEUX, p.cheveux)}</select></div>
  <div><label class="f" for="pla">Type de lace</label><select class="t" id="pla" name="lace">${opts(LACES, p.lace)}</select></div>
  <div><label class="f" for="pd">Densité</label><select class="t" id="pd" name="densite">${opts(DENSITES, p.densite)}</select></div>
  <div><label class="f" for="pp">Prix (F CFA)</label><input class="t" id="pp" name="prix" inputmode="numeric" value="${p.prix}"></div>
  <div><label class="f" for="pa">Ancien prix (promotion)</label><input class="t" id="pa" name="ancien" inputmode="numeric" value="${p.ancien || ''}" placeholder="Vide = pas de promo"></div>
  <div><label class="f" for="pj">Promotion : durée (jours)</label><input class="t" id="pj" name="jours" inputmode="numeric" value="${days}" placeholder="Ex. 3"></div>
  <div><label class="f" for="ps">Stock (quantité)</label><input class="t" id="ps" name="stock" inputmode="numeric" value="${p.stock}"></div>
  <div class="full"><label class="f" for="pv">Disponibilité</label><select class="t" id="pv" name="dispo"><option value="auto" ${p.dispo === 'auto' ? 'selected' : ''}>Automatique (selon le stock)</option><option value="dispo" ${p.dispo === 'dispo' ? 'selected' : ''}>Disponible</option><option value="limite" ${p.dispo === 'limite' ? 'selected' : ''}>Stock limité</option><option value="rupture" ${p.dispo === 'rupture' ? 'selected' : ''}>Rupture de stock</option></select></div>
  <div class="full"><span class="f" style="display:block;font-size:13px;font-weight:600;margin:14px 0 6px">Collections</span><div style="display:flex;gap:14px;flex-wrap:wrap">${TAGS.map(([k, l]) => `<label class="chk"><input type="checkbox" name="tag" value="${k}" ${p.tags.includes(k) ? 'checked' : ''}> ${l}</label>`).join('')}</div></div>
  <div class="full"><label class="f" for="pde">Description</label><textarea class="t" id="pde" name="desc">${esc(p.desc)}</textarea></div>
  <div class="full"><span style="display:block;font-size:13px;font-weight:600;margin:14px 0 6px">Photos (la première est la photo principale)</span><div id="pimgs">${imgsHTML()}</div>
    <label class="f" for="pfile">Ajouter plusieurs photos depuis votre appareil</label><input class="t" id="pfile" type="file" accept="image/*" multiple>
    <p class="muted" style="font-size:12.5px;margin-top:8px">Ou choisissez dans la bibliothèque de la démo :</p><div class="lib">${Object.keys(allLib()).map((k) => `<img src="img/${k}.jpg" alt="Photo ${k}" data-a="plib" data-k="${k}" tabindex="0">`).join('')}</div></div></div>
  <p class="err" id="perr" role="alert"></p><div class="row-a" style="margin-top:8px"><button class="btn gold" type="submit">Enregistrer</button><button class="btn line" type="button" data-a="closeModal">Annuler</button></div></form></div></div>`;
}
const allLib = () => { const o = {}; db.produits.forEach((p) => p.imgs.forEach((i) => { if (/^\d+$/.test(i)) o[i] = 1; })); CATEGORIES.forEach((c) => { o[c.img] = 1; }); return o; };
function resize(file) {
  return new Promise((res) => { const r = new FileReader(); r.onload = () => { const im = new Image(); im.onload = () => { const k = Math.min(1, 800 / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); res(c.toDataURL('image/jpeg', .78)); }; im.onerror = () => res(null); im.src = r.result; }; r.onerror = () => res(null); r.readAsDataURL(file); });
}
function saveProduct(f) {
  const v = (n) => (f.elements[n].value || '').trim(), num = (n) => parseInt(digits(v(n)), 10);
  const nom = v('nom'), prix = num('prix'), stock = isNaN(num('stock')) ? NaN : num('stock'), ancien = isNaN(num('ancien')) ? 0 : num('ancien'), jours = isNaN(num('jours')) ? 0 : num('jours');
  const m = nom.length < 3 ? 'Indiquez le nom du produit.' : !(prix > 0) ? 'Indiquez un prix.' : isNaN(stock) ? 'Indiquez le stock.' : (ancien && ancien <= prix) ? 'L\'ancien prix doit être supérieur au prix.' : !adm.draft.imgs.length ? 'Ajoutez au moins une photo.' : '';
  $('#perr').textContent = m; if (m) return;
  const data = { nom, texture: v('texture'), longueur: +v('longueur') || 20, couleur: v('couleur'), cheveux: v('cheveux'), lace: v('lace'), densite: v('densite'), prix, ancien, promoEnd: ancien ? Date.now() + (jours || 3) * DAY : 0, stock, dispo: v('dispo'), tags: $$('input[name=tag]:checked', f).map((x) => x.value), desc: v('desc') || 'Perruque de qualité sélectionnée par la boutique.', imgs: adm.draft.imgs.slice() };
  if (adm.editId) Object.assign(prod(adm.editId), data);
  else { let id = norm(nom).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'produit'; while (prod(id)) id += '-' + db.nextId++; db.produits.unshift(Object.assign(P({}), data, { id })); }
  persist(); A.closeModal(); reload(); toast(adm.editId ? 'Produit modifié' : 'Produit ajouté au catalogue');
}

/* Commandes */
function ordersTable(list, mini) {
  return `<div class="tblw"><table class="tbl"><thead><tr><th>N°</th><th>Client</th>${mini ? '' : '<th>Produits</th>'}<th>Montant</th><th>Livraison</th><th>Statut</th>${mini ? '' : '<th></th>'}</tr></thead><tbody>${list.map((o) => `<tr><td><b>#${o.id}</b><br><small class="muted">${dateFr(o.date)}</small></td><td>${esc(o.nom)}<br><small class="muted">${esc(o.tel)}</small></td>${mini ? '' : `<td>${o.lignes.map((l) => `${l.q}× ${esc(l.nom)}`).join('<br>')}</td>`}<td><b>${fmt(o.total)}</b></td><td>${esc(o.livraison)}<br><small class="muted">${esc([o.commune, o.ville].filter((x) => x && x !== '—').join(', '))}</small></td>
    <td>${mini ? `<span class="pill s${sIdx(o.statut)}">${o.statut}</span>` : `<label class="sr" for="st${o.id}">Statut de la commande ${o.id}</label><select class="sel" id="st${o.id}" data-a2="ostat" data-id="${o.id}">${opts(STATUTS, o.statut)}</select>`}</td>
    ${mini ? '' : `<td><a class="btn wa xs" target="_blank" rel="noopener" href="https://wa.me/${'225' + digits(o.whatsapp).replace(/^225/, '')}?text=${encodeURIComponent('Bonjour ' + o.nom + ', votre commande n°' + o.id + ' est : ' + o.statut + '. Merci !')}">WhatsApp</a></td>`}</tr>`).join('') || '<tr><td colspan="7" class="muted">Aucune commande.</td></tr>'}</tbody></table></div>`;
}
function aOrd() {
  const l = db.orders.filter((o) => !adm.of || o.statut === adm.of);
  return `<div class="panel"><div class="row-a" style="margin-bottom:12px"><button class="btn xs ${adm.of ? 'line' : ''}" data-a="of" data-s="">Toutes (${db.orders.length})</button>${STATUTS.map((s) => `<button class="btn xs ${adm.of === s ? '' : 'line'}" data-a="of" data-s="${s}">${s} (${db.orders.filter((o) => o.statut === s).length})</button>`).join('')}</div>${ordersTable(l)}</div>`;
}
function setStatut(id, ns) {
  const o = db.orders.find((x) => String(x.id) === String(id)); if (!o) return;
  if (ns === 'Annulée' && !o.restocked) { o.lignes.forEach((l) => { const p = prod(l.id); if (p) p.stock += l.q; }); o.restocked = true; }
  else if (ns !== 'Annulée' && o.restocked) { o.lignes.forEach((l) => { const p = prod(l.id); if (p) p.stock = Math.max(0, p.stock - l.q); }); o.restocked = false; }
  o.statut = ns; persist(); reload(); toast(`Commande #${o.id} : ${ns}`);
}

/* Clients */
function aCli() {
  const q = norm(adm.cq), l = clientsList().filter((c) => !q || norm(c.nom + c.tel).includes(q));
  return `<div class="panel"><input class="t" id="acq" type="search" placeholder="Rechercher une cliente…" value="${esc(adm.cq)}" style="max-width:340px;margin-bottom:12px" aria-label="Rechercher une cliente"><div class="tblw"><table class="tbl"><thead><tr><th>Cliente</th><th>Téléphone</th><th>Ville</th><th>Commandes</th><th>Total dépensé</th><th></th></tr></thead><tbody>${l.map((c) => `<tr><td><b>${esc(c.nom)}</b></td><td>${esc(c.tel)}</td><td>${esc(c.ville)}</td><td>${c.n}</td><td>${fmt(c.total)}</td><td><a class="btn wa xs" target="_blank" rel="noopener" href="https://wa.me/225${digits(c.tel).replace(/^225/, '')}?text=${encodeURIComponent('Bonjour ' + c.nom + ', ')}">WhatsApp</a></td></tr>`).join('') || '<tr><td colspan="6" class="muted">Aucune cliente.</td></tr>'}</tbody></table></div></div>`;
}

/* Stock */
function aStock() {
  return `<div class="panel"><p class="muted" style="margin-bottom:12px">Modifiez les quantités : la disponibilité (vert, orange, rouge) se met à jour sur la boutique.</p><div class="tblw"><table class="tbl"><thead><tr><th></th><th>Produit</th><th>Quantité</th><th>Disponibilité affichée</th><th>Forcer</th></tr></thead><tbody>${db.produits.map((p) => { const s = status(p); return `<tr><td><img class="th" src="${imgSrc(p.imgs[0])}" alt=""></td><td><b>${esc(p.nom)}</b></td><td><div class="qty"><button data-a="stk" data-id="${p.id}" data-d="-1" aria-label="Retirer une unité de ${esc(p.nom)}">−</button><b>${p.stock}</b><button data-a="stk" data-id="${p.id}" data-d="1" aria-label="Ajouter une unité de ${esc(p.nom)}">+</button></div> <button class="btn line xs" data-a="stk" data-id="${p.id}" data-d="10">+10</button></td><td><span class="st ${s.k}">${s.label}</span></td><td><label class="sr" for="dv${p.id}">Disponibilité de ${esc(p.nom)}</label><select class="sel" id="dv${p.id}" data-a2="dispo" data-id="${p.id}"><option value="auto" ${p.dispo === 'auto' ? 'selected' : ''}>Automatique</option><option value="dispo" ${p.dispo === 'dispo' ? 'selected' : ''}>Disponible</option><option value="limite" ${p.dispo === 'limite' ? 'selected' : ''}>Stock limité</option><option value="rupture" ${p.dispo === 'rupture' ? 'selected' : ''}>Rupture</option></select></td></tr>`; }).join('')}</tbody></table></div></div>`;
}

/* Promotions */
function aPromo() {
  return `<div class="panel"><p class="muted" style="margin-bottom:12px">Appliquez une réduction en pourcentage pendant quelques jours : le compte à rebours s'affiche sur la boutique.</p><div class="tblw"><table class="tbl"><thead><tr><th>Produit</th><th>Prix</th><th>Promotion</th><th>Nouvelle promo</th></tr></thead><tbody>${db.produits.map((p) => `<tr><td><b>${esc(p.nom)}</b></td><td>${fmt(p.prix)}${promoOn(p) ? `<br><s class="muted">${fmt(p.ancien)}</s>` : ''}</td><td>${promoOn(p) ? `<span class="pill s2">-${pct(p)} % · ${p.promoEnd ? leftText(p) : 'en cours'}</span>` : '<span class="muted">Aucune</span>'}</td>
    <td><div class="row-a" style="align-items:center"><label class="sr" for="pc${p.id}">Réduction en pourcentage</label><input class="t" id="pc${p.id}" inputmode="numeric" placeholder="%" value="20" style="width:70px;padding:7px"><label class="sr" for="pj${p.id}">Durée en jours</label><input class="t" id="pj${p.id}" inputmode="numeric" placeholder="jours" value="3" style="width:76px;padding:7px"><button class="btn xs" data-a="promo" data-id="${p.id}">Appliquer</button>${promoOn(p) ? `<button class="btn danger xs" data-a="promoend" data-id="${p.id}">Terminer</button>` : ''}</div></td></tr>`).join('')}</tbody></table></div></div>`;
}

/* Rendez-vous */
function aRdv() {
  const l = db.rdv.slice().sort((a, b) => (a.date + a.heure).localeCompare(b.date + b.heure));
  return `<div class="panel"><div class="tblw"><table class="tbl"><thead><tr><th>Date</th><th>Service</th><th>Cliente</th><th>Statut</th><th>Actions</th></tr></thead><tbody>${l.map((r) => `<tr><td><b>${dFr(r.date)}</b><br>${hh(r.heure)}</td><td>${esc(r.service)}</td><td>${esc(r.nom)}<br><small class="muted">${esc(r.tel)}</small></td><td><span class="pill ${r.statut === 'Confirmé' ? 's1' : r.statut === 'Annulé' ? 's5' : 's2'}">${r.statut}</span></td><td><div class="row-a"><button class="btn xs" data-a="rdvs" data-id="${r.id}" data-s="Confirmé">Confirmer</button><button class="btn line xs" data-a="rdvs" data-id="${r.id}" data-s="Annulé">Annuler</button><a class="btn wa xs" target="_blank" rel="noopener" href="https://wa.me/225${digits(r.whatsapp).replace(/^225/, '')}?text=${encodeURIComponent('Bonjour ' + r.nom + ', votre rendez-vous du ' + dFr(r.date) + ' à ' + hh(r.heure) + ' est ' + r.statut.toLowerCase() + '.')}">WhatsApp</a></div></td></tr>`).join('') || '<tr><td colspan="5" class="muted">Aucun rendez-vous.</td></tr>'}</tbody></table></div></div>`;
}

/* Avis */
function aAvis() {
  return `<div class="panel"><div class="reviews" style="grid-template-columns:repeat(auto-fill,minmax(260px,1fr))">${db.avis.map((a) => `<div class="rev"><div class="stars">${'★'.repeat(a.note)}${'☆'.repeat(5 - a.note)}</div><q style="font-size:19px">${esc(a.texte)}</q><small>${esc(a.nom)} · ${esc(a.ville)}</small><div class="row-a" style="margin-top:12px"><span class="pill ${a.visible ? 's1' : 's2'}">${a.visible ? 'Publié' : 'Masqué'}</span><button class="btn line xs" data-a="avisv" data-id="${a.id}">${a.visible ? 'Masquer' : 'Publier'}</button><button class="btn danger xs" data-a="avisd" data-id="${a.id}">Supprimer</button></div></div>`).join('') || '<p class="muted">Aucun avis.</p>'}</div></div>
  <form class="panel" id="aform" novalidate><h2>Ajouter un avis</h2><div class="fgrid"><div><label class="f" for="an">Nom</label><input class="t" id="an" name="nom"></div><div><label class="f" for="av">Ville</label><input class="t" id="av" name="ville" value="Abidjan"></div><div><label class="f" for="ano">Note</label><select class="t" id="ano" name="note"><option>5</option><option>4</option><option>3</option></select></div><div class="full"><label class="f" for="at">Avis</label><textarea class="t" id="at" name="texte"></textarea></div></div><p class="err" id="aerr"></p><button class="btn gold sm" type="submit">Publier l'avis</button></form>`;
}

/* Paramètres */
function aSet() {
  const s = db.settings;
  return `<form class="panel" id="setform" novalidate><h2>Boutique</h2><div class="fgrid"><div><label class="f" for="sn">Nom de la boutique</label><input class="t" id="sn" name="boutique" value="${esc(s.boutique)}"></div><div><label class="f" for="sw">Numéro WhatsApp (avec indicatif)</label><input class="t" id="sw" name="whatsapp" value="${esc(s.whatsapp)}"></div>
  <div><label class="f" for="sa">Livraison Abidjan (F CFA)</label><input class="t" id="sa" name="fraisAbidjan" inputmode="numeric" value="${s.fraisAbidjan}"></div><div><label class="f" for="si">Livraison intérieur du pays (F CFA)</label><input class="t" id="si" name="fraisInterieur" inputmode="numeric" value="${s.fraisInterieur}"></div>
  <div><label class="f" for="sg">Livraison offerte dès (F CFA)</label><input class="t" id="sg" name="gratuitDes" inputmode="numeric" value="${s.gratuitDes}"></div><div><label class="f" for="sad">Adresse</label><input class="t" id="sad" name="adresse" value="${esc(s.adresse)}"></div></div>
  <p class="muted" style="font-size:13px;margin-top:10px">Dans cette démo, le numéro WhatsApp est celui de DST Technologie. Sur votre site, ce sera le vôtre.</p><button class="btn gold sm" type="submit" style="margin-top:12px">Enregistrer</button></form>
  <div class="panel"><h2>Données de démonstration</h2><p class="muted" style="margin-bottom:12px">Remet les produits, commandes, clientes et rendez-vous dans leur état de départ.</p><button class="btn danger sm" data-a="resetdb">Réinitialiser la démo</button></div>`;
}

/* Actions admin */
Object.assign(A, {
  padd(el) { prodModal(el.dataset.id); },
  pdel(el) { const p = prod(el.dataset.id); if (p && confirm(`Supprimer « ${p.nom} » du catalogue ?`)) { db.produits = db.produits.filter((x) => x.id !== p.id); db.cart = db.cart.filter((l) => l.id !== p.id); db.favs = db.favs.filter((f) => f !== p.id); persist(); reload(); toast('Produit supprimé'); } },
  pimgrm(el) { adm.draft.imgs.splice(+el.dataset.i, 1); $('#pimgs').innerHTML = imgsHTML(); },
  plib(el) { adm.draft.imgs.push(el.dataset.k); $('#pimgs').innerHTML = imgsHTML(); },
  of(el) { adm.of = el.dataset.s; reload(); },
  stk(el) { const p = prod(el.dataset.id); p.stock = Math.max(0, p.stock + +el.dataset.d); persist(); reload(); },
  promo(el) {
    const p = prod(el.dataset.id), pc = parseInt($('#pc' + p.id).value, 10), j = parseInt($('#pj' + p.id).value, 10);
    if (!(pc > 0 && pc < 90) || !(j > 0)) return toast('Indiquez un pourcentage (1 à 89) et une durée en jours.');
    const base = promoOn(p) ? p.ancien : p.prix; p.ancien = base; p.prix = Math.round(base * (1 - pc / 100) / 500) * 500; p.promoEnd = Date.now() + j * DAY;
    persist(); reload(); toast(`-${pc} % appliqué sur « ${p.nom} »`);
  },
  promoend(el) { const p = prod(el.dataset.id); p.prix = p.ancien; p.ancien = 0; p.promoEnd = 0; persist(); reload(); toast('Promotion terminée'); },
  rdvs(el) { const r = db.rdv.find((x) => String(x.id) === el.dataset.id); r.statut = el.dataset.s; persist(); reload(); },
  avisv(el) { const a = db.avis.find((x) => String(x.id) === el.dataset.id); a.visible = !a.visible; persist(); reload(); },
  avisd(el) { db.avis = db.avis.filter((x) => String(x.id) !== el.dataset.id); persist(); reload(); },
  resetdb() { if (!confirm('Remettre la démo dans son état de départ ?')) return; localStorage.removeItem(KEY); db = fresh(); window.db = db; persist(); refreshCart(); reload(); toast('Démo réinitialisée'); },
});
document.addEventListener('change', async (e) => {
  const t = e.target;
  if (t.dataset.a2 === 'ostat') setStatut(t.dataset.id, t.value);
  else if (t.dataset.a2 === 'dispo') { prod(t.dataset.id).dispo = t.value; persist(); reload(); }
  else if (t.id === 'pfile' && adm.draft) { for (const f of t.files) { const d = await resize(f); if (d) adm.draft.imgs.push(d); } t.value = ''; $('#pimgs').innerHTML = imgsHTML(); }
});
document.addEventListener('input', (e) => {
  if (e.target.id === 'apq') { adm.pq = e.target.value; $('#ptb').innerHTML = prodRows(); }
  else if (e.target.id === 'acq') { adm.cq = e.target.value; const pos = e.target.selectionStart; reload(); const i = $('#acq'); i.focus(); i.setSelectionRange(pos, pos); }
});
document.addEventListener('submit', (e) => {
  const f = e.target;
  if (f.id === 'pform') saveProduct(f);
  else if (f.id === 'aform') {
    const v = (n) => f.elements[n].value.trim();
    if (v('nom').length < 2 || v('texte').length < 5) { $('#aerr').textContent = 'Indiquez un nom et un avis.'; return; }
    db.avis.unshift({ id: db.nextId++, nom: v('nom'), ville: v('ville'), note: +v('note'), texte: v('texte'), visible: true }); persist(); reload(); toast('Avis publié');
  } else if (f.id === 'setform') {
    const v = (n) => f.elements[n].value.trim(), n = (k) => parseInt(digits(v(k)), 10) || 0;
    Object.assign(db.settings, { boutique: v('boutique') || 'ÉCLAT HAIR', whatsapp: digits(v('whatsapp')) || db.settings.whatsapp, fraisAbidjan: n('fraisAbidjan'), fraisInterieur: n('fraisInterieur'), gratuitDes: n('gratuitDes'), adresse: v('adresse') });
    persist(); refreshHeader(); toast('Paramètres enregistrés');
  }
});
