/* LAGUNE AUTO — espace gérant de démonstration : tableau de bord, planning, réservations, flotte, clients, tarifs */
'use strict';
const adm = { start: null, sf: '', q: '', draft: null, editId: null };
const SECS = [['dashboard', 'Tableau de bord', 'cal'], ['planning', 'Planning', 'cal'], ['reservations', 'Réservations', 'key'], ['flotte', 'Flotte', 'car'], ['clients', 'Clients', 'user'], ['tarifs', 'Tarifs & réglages', 'gear']];
const sCls = (s) => 'st' + Math.max(0, STATUTS.indexOf(s));
const opts = (list, cur) => list.map((x) => `<option ${x === cur ? 'selected' : ''}>${esc(x)}</option>`).join('');
const resaTotal = (r) => { const q = resaQuote(r); return q ? q.total : (r.total || 0); };
const occupiesDay = (r, d) => actives(r) && r.debut <= d && d < r.fin;
function renderAdmin(sec) {
  if (!SECS.some(([k]) => k === sec)) sec = 'dashboard';
  const s = SECS.find(([k]) => k === sec);
  document.title = `${s[1]} — Espace gérant | ${db.settings.nom}`;
  const view = { dashboard: aDash, planning: aPlan, reservations: aResas, flotte: aFleet, clients: aClients, tarifs: aSet }[sec];
  $('#admin').innerHTML = `<div class="admin"><nav class="side" aria-label="Menu gérant"><a class="logo" href="#/"><i>L</i>${esc(db.settings.nom)}</a>
    ${SECS.map(([k, l, i]) => `<a href="#/admin/${k}" ${k === sec ? 'aria-current="page"' : ''}>${svg(i)}${l}</a>`).join('')}
    <a class="sp" href="#/">← Voir le site client</a></nav>
    <main class="amain" id="amain" tabindex="-1"><div class="ahead"><h1>${s[1]}</h1><div class="row-a"><span class="pill demo">Démo · données fictives enregistrées dans votre navigateur</span>${sec === 'planning' || sec === 'reservations' ? '<button class="btn amber sm" type="button" data-a="newResa">+ Nouvelle réservation</button>' : ''}${sec === 'flotte' ? '<button class="btn amber sm" type="button" data-a="vEdit">+ Ajouter un véhicule</button>' : ''}</div></div>${view()}</main></div>`;
}
const reload = () => renderAdmin(route.path[1] || 'dashboard');

/* ----- Tableau de bord ----- */
function aDash() {
  const t = today(), mois = t.slice(0, 7);
  const act = db.resas.filter(actives);
  const enCours = act.filter((r) => r.debut <= t && t < r.fin && r.statut !== 'En attente');
  const aVenir = act.filter((r) => r.debut > t);
  const attente = act.filter((r) => r.statut === 'En attente');
  const ca = act.filter((r) => r.debut.slice(0, 7) === mois).reduce((s, r) => s + resaTotal(r), 0);
  let busy = 0; const fleet = db.flotte.filter((v) => v.statut !== 'maintenance');
  for (let i = 0; i < 30; i++) { const d = addDays(t, i); busy += fleet.filter((v) => act.some((r) => r.vehicule === v.id && occupiesDay(r, d))).length; }
  const occ = fleet.length ? Math.round(busy / (fleet.length * 30) * 100) : 0;
  const libres = fleet.filter((v) => !act.some((r) => r.vehicule === v.id && occupiesDay(r, t))).length;
  const months = [...Array(6)].map((_, i) => { const d = parseISO(t); d.setDate(1); d.setMonth(d.getMonth() - (5 - i)); const k = isoLocal(d).slice(0, 7); return { l: d.toLocaleDateString('fr-FR', { month: 'short' }), v: act.filter((r) => r.debut.slice(0, 7) === k && r.statut !== 'En attente').reduce((s, r) => s + resaTotal(r), 0) }; });
  const mx = Math.max(1, ...months.map((m) => m.v));
  const moves = act.filter((r) => [t, addDays(t, 1)].includes(r.debut) || [t, addDays(t, 1)].includes(r.fin)).sort((a, b) => (a.debut + a.heure).localeCompare(b.debut + b.heure));
  return `<div class="kpis"><div class="kpi"><b>${fmt(ca)}</b><span>Chiffre d'affaires du mois</span></div><div class="kpi"><b>${occ} %</b><span>Taux d'occupation (30 j)</span></div><div class="kpi"><b>${enCours.length}</b><span>Locations en cours</span></div><div class="kpi"><b>${aVenir.length}</b><span>Réservations à venir</span></div><div class="kpi"><b style="color:${attente.length ? 'var(--warn)' : 'inherit'}">${attente.length}</b><span>À confirmer</span></div><div class="kpi"><b>${libres} / ${db.flotte.length}</b><span>Véhicules libres aujourd'hui</span></div></div>
  <div class="two"><div class="panel"><h2>Chiffre d'affaires (6 mois)</h2><div class="bars">${months.map((m) => `<div title="${fmt(m.v)}"><i style="height:${Math.round(m.v / mx * 100)}%"></i>${m.l}</div>`).join('')}</div></div>
  <div class="panel"><h2>À confirmer</h2>${attente.length ? attente.slice(0, 5).map((r) => `<div style="display:flex;justify-content:space-between;gap:10px;align-items:center;padding:9px 0;border-bottom:1px solid var(--line)"><span><b>${esc(r.nom)}</b><br><small class="muted">${esc((veh(r.vehicule) || {}).nom || '')} · ${dFr(r.debut)} → ${dFr(r.fin)}</small></span><button class="btn xs" type="button" data-a="rStat" data-id="${r.id}" data-s="Confirmée">Confirmer</button></div>`).join('') : '<p class="muted">Aucune réservation en attente.</p>'}</div></div>
  <div class="panel"><h2>Départs et retours (aujourd'hui et demain)</h2>${moves.length ? `<div class="tblw"><table class="tbl"><thead><tr><th>Quand</th><th>Mouvement</th><th>Véhicule</th><th>Client</th><th>Lieu</th></tr></thead><tbody>${moves.map((r) => { const dep = [t, addDays(t, 1)].includes(r.debut); const d = dep ? r.debut : r.fin; return `<tr><td><b>${d === t ? 'Aujourd’hui' : 'Demain'}</b>${dep ? ' · ' + hh(r.heure) : ''}</td><td><span class="pill ${dep ? 'st1' : 'st3'}">${dep ? 'Départ' : 'Retour'}</span></td><td>${esc((veh(r.vehicule) || {}).nom || '')}</td><td>${esc(r.nom)}<br><small class="muted">${esc(r.tel)}</small></td><td>${esc(lieu(r.lieu).nom)}</td></tr>`; }).join('')}</tbody></table></div>` : '<p class="muted">Aucun mouvement prévu.</p>'}</div>`;
}

/* ----- Planning ----- */
function aPlan() {
  if (!adm.start) adm.start = addDays(today(), -2);
  const N = 14, days = [...Array(N)].map((_, i) => addDays(adm.start, i)), end = addDays(adm.start, N), t = today();
  const rows = db.flotte.map((v) => {
    const rs = db.resas.filter((r) => r.vehicule === v.id && actives(r) && r.debut < end && adm.start < r.fin);
    const startMap = {};
    rs.forEach((r) => { const s = r.debut < adm.start ? adm.start : r.debut; const e = r.fin > end ? end : r.fin; startMap[s] = { r, span: nights(s, e) }; });
    return `<tr><td class="v">${esc(v.nom)}<small>${esc(v.cat)}${v.statut === 'maintenance' ? ' · maintenance' : ''}</small></td>${days.map((d) => { const b = startMap[d]; return `<td class="c ${d === t ? 'todayc' : ''} ${v.statut === 'maintenance' ? 'maint' : ''}">${b ? `<button type="button" class="gbar ${sCls(b.r.statut)}" style="width:calc(${b.span * 100}% + ${b.span - 1}px - 4px)" data-a="rView" data-id="${b.r.id}" title="${esc(b.r.nom)} · ${dNum(b.r.debut)} → ${dNum(b.r.fin)} · ${b.r.statut}">${esc(b.r.nom)}</button>` : ''}</td>`; }).join('')}</tr>`;
  }).join('');
  return `<div class="panel"><div class="row-a" style="justify-content:space-between;margin-bottom:12px"><div class="row-a"><button class="btn line sm" type="button" data-a="plan" data-d="-7">‹ Semaine précédente</button><button class="btn line sm" type="button" data-a="plan" data-d="0">Aujourd'hui</button><button class="btn line sm" type="button" data-a="plan" data-d="7">Semaine suivante ›</button></div><b>${dFr(adm.start, { day: 'numeric', month: 'long' })} → ${dFr(addDays(end, -1), { day: 'numeric', month: 'long', year: 'numeric' })}</b></div>
  <div class="gantt"><table><thead><tr><th style="text-align:left;padding-left:10px">Véhicule</th>${days.map((d) => { const dt = parseISO(d), we = dt.getDay() === 0 || dt.getDay() === 6; return `<th class="${we ? 'we' : ''} ${d === t ? 'today' : ''}">${dt.toLocaleDateString('fr-FR', { weekday: 'narrow' })}<br>${dt.getDate()}</th>`; }).join('')}</tr></thead><tbody>${rows}</tbody></table></div>
  <div class="gleg"><span><i style="background:#FFE2A3"></i>En attente</span><span><i style="background:#BFD5FF"></i>Confirmée</span><span><i style="background:#A9E2BD"></i>En cours</span><span><i style="background:#D9DDE3"></i>Terminée</span><span><i style="background:repeating-linear-gradient(45deg,#F3F4F6,#F3F4F6 3px,#E7E9ED 3px,#E7E9ED 6px)"></i>Maintenance</span></div>
  <p class="muted" style="font-size:13px;margin-top:8px">Touchez une réservation pour la voir, la confirmer ou l'annuler.</p></div>`;
}
function resaModal(r) {
  const v = veh(r.vehicule) || { nom: '?', imgs: [''] }, q = resaQuote(r);
  $('#modalRoot').innerHTML = `<div class="modal" role="dialog" aria-modal="true" aria-labelledby="rmt"><div class="box"><div style="display:flex;justify-content:space-between;gap:10px"><h2 id="rmt" style="font-size:24px">Réservation n° ${r.id}</h2><button class="ibtn" type="button" data-a="closeModal" aria-label="Fermer" style="color:var(--ink)">${svg('x')}</button></div>
    <div class="mini" style="margin-top:10px"><img src="${imgSrc(v.imgs[0])}" alt=""><div><b>${esc(v.nom)}</b><p class="muted" style="font-size:13.5px">${dFr(r.debut)} à ${hh(r.heure || '09:00')} → ${dFr(r.fin)} · ${esc(lieu(r.lieu).nom)}</p><span class="pill ${sCls(r.statut)}">${r.statut}</span></div></div>
    <p style="margin:12px 0 0"><b>${esc(r.nom)}</b> · ${esc(r.tel)}${r.piece ? ' · ' + esc(r.piece) : ''}${r.commentaire ? '<br><span class="muted">« ' + esc(r.commentaire) + ' »</span>' : ''}</p>
    ${q ? quoteLines(v, q) : ''}
    <div class="row-a" style="margin-top:16px">${STATUTS.filter((s) => s !== r.statut).map((s) => `<button class="btn ${s === 'Annulée' ? 'danger' : 'line'} sm" type="button" data-a="rStat" data-id="${r.id}" data-s="${s}">${s === 'Annulée' ? 'Annuler' : 'Passer en « ' + s + ' »'}</button>`).join('')}<a class="btn wa sm" target="_blank" rel="noopener" href="${clientWa(r)}">WhatsApp client</a></div></div></div>`;
}
const clientWa = (r) => `https://wa.me/225${digits(r.whatsapp || r.tel).replace(/^225/, '')}?text=${encodeURIComponent(`Bonjour ${r.nom}, votre réservation n° ${r.id} (${(veh(r.vehicule) || {}).nom || ''}, du ${dNum(r.debut)} au ${dNum(r.fin)}) est : ${r.statut}. ${db.settings.nom}`)}`;
function newResaModal() {
  const avail = db.flotte.filter((v) => v.statut !== 'maintenance');
  $('#modalRoot').innerHTML = `<div class="modal" role="dialog" aria-modal="true" aria-labelledby="nmt"><div class="box"><div style="display:flex;justify-content:space-between;gap:10px"><h2 id="nmt" style="font-size:24px">Nouvelle réservation</h2><button class="ibtn" type="button" data-a="closeModal" aria-label="Fermer" style="color:var(--ink)">${svg('x')}</button></div>
    <p class="muted" style="margin-top:4px">Pour une réservation prise par téléphone ou en agence. Les conflits de dates sont vérifiés.</p>
    <form id="nform" novalidate><div class="fgrid"><div class="full"><label class="f" for="nv">Véhicule</label><select class="t" id="nv" name="v">${avail.map((v) => `<option value="${v.id}">${esc(v.nom)} (${fmt(v.prix)}/j)</option>`).join('')}</select></div>
    <div><label class="f" for="nd">Départ</label><input class="t" type="date" id="nd" name="d" value="${today()}"></div><div><label class="f" for="nf">Retour</label><input class="t" type="date" id="nf" name="f" value="${addDays(today(), 2)}"></div>
    <div><label class="f" for="nn">Client</label><input class="t" id="nn" name="n"></div><div><label class="f" for="nt">Téléphone</label><input class="t" id="nt" name="t" type="tel"></div>
    <div><label class="f" for="nl">Lieu</label><select class="t" id="nl" name="l">${LIEUX.map((l) => `<option value="${l.id}">${esc(l.nom)}</option>`).join('')}</select></div><div><label class="f" for="ns">Statut</label><select class="t" id="ns" name="s">${opts(STATUTS.slice(0, 3), 'Confirmée')}</select></div>
    <div class="full"><label class="chk" style="margin-top:12px"><input type="checkbox" name="ch"><span>Avec chauffeur</span></label></div></div>
    <p class="err" id="nerr" role="alert"></p><div class="row-a"><button class="btn amber" type="submit">Enregistrer</button><button class="btn line" type="button" data-a="closeModal">Annuler</button></div></form></div></div>`;
  $('#nn').focus();
}

/* ----- Réservations ----- */
function resaRows() {
  const q = norm(adm.q);
  const l = db.resas.filter((r) => (!adm.sf || r.statut === adm.sf) && (!q || norm(r.nom + ' ' + r.tel + ' ' + r.id + ' ' + ((veh(r.vehicule) || {}).nom || '')).includes(q))).sort((a, b) => b.debut.localeCompare(a.debut));
  return l.map((r) => { const v = veh(r.vehicule) || { nom: '(supprimé)', caution: 0 }, qq = resaQuote(r); const cau = qq ? qq.caution : 0; return `<tr><td><b>#${r.id}</b></td><td>${esc(r.nom)}<br><small class="muted">${esc(r.tel)}</small></td><td>${esc(v.nom)}${r.chauffeur || v.chauffeur === 'inclus' ? '<br><small class="muted">avec chauffeur</small>' : ''}</td><td class="num">${dNum(r.debut)} → ${dNum(r.fin)}<br><small class="muted">${nights(r.debut, r.fin)} j · ${esc(lieu(r.lieu).nom)}</small></td><td class="num"><b>${fmt(resaTotal(r))}</b></td>
    <td>${cau ? `<button class="btn xs ${r.caution ? '' : 'line'}" type="button" data-a="rCau" data-id="${r.id}" aria-pressed="${!!r.caution}">${r.caution ? 'Reçue ✓' : 'À encaisser'}</button><br><small class="muted num">${fmt(cau)}</small>` : '<small class="muted">Aucune</small>'}</td>
    <td><label class="vh" for="rs${r.id}">Statut ${r.id}</label><select class="sel" id="rs${r.id}" data-r="${r.id}">${opts(STATUTS, r.statut)}</select></td>
    <td><div class="row-a"><button class="btn line xs" type="button" data-a="rView" data-id="${r.id}">Détails</button><a class="btn wa xs" target="_blank" rel="noopener" href="${clientWa(r)}">WhatsApp</a></div></td></tr>`; }).join('') || '<tr><td colspan="8" class="muted">Aucune réservation.</td></tr>';
}
function aResas() {
  return `<div class="panel"><div class="row-a" style="margin-bottom:12px"><button class="btn xs ${adm.sf ? 'line' : ''}" type="button" data-a="sf" data-s="">Toutes (${db.resas.length})</button>${STATUTS.map((s) => `<button class="btn xs ${adm.sf === s ? '' : 'line'}" type="button" data-a="sf" data-s="${s}">${s} (${db.resas.filter((r) => r.statut === s).length})</button>`).join('')}</div>
  <input class="t" id="rq" type="search" placeholder="Rechercher : client, téléphone, véhicule, n°…" value="${esc(adm.q)}" style="max-width:420px;margin-bottom:12px" aria-label="Rechercher une réservation">
  <div class="tblw"><table class="tbl"><thead><tr><th>N°</th><th>Client</th><th>Véhicule</th><th>Dates</th><th>Montant</th><th>Caution</th><th>Statut</th><th><span class="vh">Actions</span></th></tr></thead><tbody id="rtb">${resaRows()}</tbody></table></div></div>`;
}

/* ----- Flotte ----- */
function aFleet() {
  const t = today();
  return `<div class="panel"><div class="tblw"><table class="tbl"><thead><tr><th><span class="vh">Photo</span></th><th>Véhicule</th><th>Prix / jour</th><th>Caution</th><th>Chauffeur</th><th>Réservations à venir</th><th>État</th><th><span class="vh">Actions</span></th></tr></thead><tbody>${db.flotte.map((v) => { const nb = db.resas.filter((r) => r.vehicule === v.id && actives(r) && r.fin > t).length; return `<tr><td><img class="th" src="${imgSrc(v.imgs[0])}" alt=""></td><td><b>${esc(v.nom)}</b><br><small class="muted">${esc(v.cat)} · ${v.annee} · ${v.places} places</small></td><td class="num"><b>${fmt(v.prix)}</b></td><td class="num">${v.caution ? fmt(v.caution) : '—'}</td><td>${v.chauffeur === 'inclus' ? 'Inclus' : 'En option'}</td><td class="num">${nb}</td>
    <td><label class="vh" for="vs${v.id}">État de ${esc(v.nom)}</label><select class="sel" id="vs${v.id}" data-vs="${v.id}"><option value="dispo" ${v.statut === 'dispo' ? 'selected' : ''}>Disponible</option><option value="maintenance" ${v.statut === 'maintenance' ? 'selected' : ''}>Maintenance</option></select></td>
    <td><div class="row-a"><button class="btn line xs" type="button" data-a="vEdit" data-id="${v.id}">Modifier</button><button class="btn danger xs" type="button" data-a="vDel" data-id="${v.id}">Supprimer</button></div></td></tr>`; }).join('')}</tbody></table></div></div>`;
}
const imgsHTML = () => `<div class="imgs">${adm.draft.map((im, i) => `<div><img src="${imgSrc(im)}" alt="Photo ${i + 1}"><button type="button" data-a="imgRm" data-i="${i}" aria-label="Retirer la photo ${i + 1}">×</button></div>`).join('') || '<small class="muted">Aucune photo</small>'}</div>`;
function vehModal(id) {
  const v = id ? veh(id) : V({ id: '', nom: '', cat: 'Berline', places: 5, annee: new Date().getFullYear(), prix: 40000, imgs: [], desc: '' });
  adm.editId = id || null; adm.draft = v.imgs.slice();
  const lib = [...new Set(db.flotte.flatMap((x) => x.imgs).filter((i) => /^\d+$/.test(i)))];
  $('#modalRoot').innerHTML = `<div class="modal" role="dialog" aria-modal="true" aria-labelledby="vmt"><div class="box"><div style="display:flex;justify-content:space-between"><h2 id="vmt" style="font-size:26px">${id ? 'Modifier le véhicule' : 'Ajouter un véhicule'}</h2><button class="ibtn" type="button" data-a="closeModal" aria-label="Fermer" style="color:var(--ink)">${svg('x')}</button></div>
  <form id="vform" novalidate><div class="fgrid"><div class="full"><label class="f" for="vn">Nom du véhicule</label><input class="t" id="vn" name="nom" value="${esc(v.nom)}" placeholder="Ex. Toyota Corolla"></div>
  <div><label class="f" for="vc">Catégorie</label><select class="t" id="vc" name="cat">${opts(CATS.map((c) => c.id), v.cat)}</select></div><div><label class="f" for="va">Année</label><input class="t" id="va" name="annee" inputmode="numeric" value="${v.annee}"></div>
  <div><label class="f" for="vp">Places</label><input class="t" id="vp" name="places" inputmode="numeric" value="${v.places}"></div><div><label class="f" for="vb">Boîte</label><select class="t" id="vb" name="boite">${opts(['Automatique', 'Manuelle'], v.boite)}</select></div>
  <div><label class="f" for="vf">Carburant</label><select class="t" id="vf" name="carburant">${opts(['Essence', 'Diesel', 'Hybride', 'Électrique'], v.carburant)}</select></div><div><label class="f" for="vch">Chauffeur</label><select class="t" id="vch" name="chauffeur"><option value="option" ${v.chauffeur !== 'inclus' ? 'selected' : ''}>En option</option><option value="inclus" ${v.chauffeur === 'inclus' ? 'selected' : ''}>Toujours inclus</option></select></div>
  <div><label class="f" for="vpx">Prix par jour (F CFA)</label><input class="t" id="vpx" name="prix" inputmode="numeric" value="${v.prix}"></div><div><label class="f" for="vca">Caution (F CFA)</label><input class="t" id="vca" name="caution" inputmode="numeric" value="${v.caution}"></div>
  <div class="full"><label class="f" for="vd">Description</label><textarea class="t" id="vd" name="desc">${esc(v.desc)}</textarea></div>
  <div class="full"><span style="display:block;font-size:13px;font-weight:800;margin:14px 0 6px">Photos (la première est la photo principale)</span><div id="vimgs">${imgsHTML()}</div>
    <label class="f" for="vfile">Ajouter des photos depuis votre appareil</label><input class="t" id="vfile" type="file" accept="image/*" multiple>
    <p class="muted" style="font-size:12.5px;margin-top:8px">Ou choisissez dans la bibliothèque de la démo :</p><div class="lib">${lib.map((k) => `<button type="button" data-a="lib" data-k="${k}" aria-label="Ajouter la photo ${k}"><img src="img/${k}.jpg" alt=""></button>`).join('')}</div></div></div>
  <p class="err" id="verr" role="alert"></p><div class="row-a" style="margin-top:6px"><button class="btn amber" type="submit">Enregistrer</button><button class="btn line" type="button" data-a="closeModal">Annuler</button></div></form></div></div>`;
}
function resize(file) {
  return new Promise((res) => { const r = new FileReader(); r.onload = () => { const im = new Image(); im.onload = () => { const k = Math.min(1, 1000 / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); res(c.toDataURL('image/jpeg', .78)); }; im.onerror = () => res(null); im.src = r.result; }; r.onerror = () => res(null); r.readAsDataURL(file); });
}
function saveVeh(f) {
  const val = (n) => String(f.elements[n].value || '').trim(), num = (n) => parseInt(digits(val(n)), 10);
  const nom = val('nom'), prix = num('prix'), places = num('places'), annee = num('annee'), caution = num('caution') || 0;
  const m = nom.length < 3 ? 'Indiquez le nom du véhicule.' : !(prix > 0) ? 'Indiquez le prix par jour.' : !(places > 0 && places < 60) ? 'Indiquez le nombre de places.' : !(annee > 1980 && annee < 2100) ? 'Indiquez une année valide.' : !adm.draft.length ? 'Ajoutez au moins une photo.' : '';
  $('#verr').textContent = m; if (m) return;
  const data = { nom, cat: val('cat'), annee, places, boite: val('boite'), carburant: val('carburant'), chauffeur: val('chauffeur'), prix, caution: val('chauffeur') === 'inclus' ? 0 : caution, desc: val('desc') || 'Véhicule récent, entretenu et assuré.', imgs: adm.draft.slice() };
  if (adm.editId) Object.assign(veh(adm.editId), data);
  else { let id = norm(nom).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'vehicule'; while (veh(id)) id += '-2'; db.flotte.push(V(Object.assign({ id }, data))); }
  persist(); A.closeModal(); reload(); toast(adm.editId ? 'Véhicule modifié' : 'Véhicule ajouté à la flotte');
}

/* ----- Clients ----- */
function aClients() {
  const m = new Map();
  db.resas.forEach((r) => { const k = digits(r.tel); const c = m.get(k) || { nom: r.nom, tel: r.tel, wa: r.whatsapp || r.tel, n: 0, total: 0, last: '' }; if (actives(r)) { c.n++; c.total += resaTotal(r); } if (r.debut > c.last) c.last = r.debut; m.set(k, c); });
  const l = [...m.values()].sort((a, b) => b.total - a.total);
  return `<div class="panel"><div class="tblw"><table class="tbl"><thead><tr><th>Client</th><th>Téléphone</th><th>Locations</th><th>Total</th><th>Dernière location</th><th><span class="vh">Actions</span></th></tr></thead><tbody>${l.map((c) => `<tr><td><b>${esc(c.nom)}</b></td><td>${esc(c.tel)}</td><td class="num">${c.n}</td><td class="num"><b>${fmt(c.total)}</b></td><td>${c.last ? dNum(c.last) : '—'}</td><td><a class="btn wa xs" target="_blank" rel="noopener" href="https://wa.me/225${digits(c.wa).replace(/^225/, '')}?text=${encodeURIComponent('Bonjour ' + c.nom + ', ')}">WhatsApp</a></td></tr>`).join('')}</tbody></table></div></div>`;
}

/* ----- Tarifs et réglages ----- */
function aSet() {
  const s = db.settings;
  return `<form class="panel" id="sform" novalidate><h2>Tarifs</h2><div class="fgrid"><div><label class="f" for="sch">Chauffeur, par jour (F CFA)</label><input class="t" id="sch" name="chauffeurJour" inputmode="numeric" value="${s.chauffeurJour}"></div><div></div>
  ${s.remises.map((r, i) => `<div><label class="f" for="rd${i}">Remise ${i + 1} : à partir de (jours)</label><input class="t" id="rd${i}" name="rd${i}" inputmode="numeric" value="${r.des}"></div><div><label class="f" for="rp${i}">Remise ${i + 1} : pourcentage</label><input class="t" id="rp${i}" name="rp${i}" inputmode="numeric" value="${r.pct}"></div>`).join('')}</div>
  <h2 style="margin-top:22px">Agence</h2><div class="fgrid"><div><label class="f" for="snom">Nom de l'agence</label><input class="t" id="snom" name="nom" value="${esc(s.nom)}"></div><div><label class="f" for="swa">Numéro WhatsApp (avec indicatif)</label><input class="t" id="swa" name="whatsapp" value="${esc(s.whatsapp)}"></div><div class="full"><label class="f" for="sad">Adresse</label><input class="t" id="sad" name="adresse" value="${esc(s.adresse)}"></div></div>
  <p class="muted" style="font-size:13px;margin-top:10px">Dans cette démo, le numéro WhatsApp est celui de DST Technologie. Sur votre site, ce sera le vôtre.</p><button class="btn amber sm" type="submit" style="margin-top:12px">Enregistrer</button></form>
  <div class="panel"><h2>Données de démonstration</h2><p class="muted" style="margin-bottom:12px">Remet la flotte, les réservations et les réglages dans leur état de départ.</p><button class="btn danger sm" type="button" data-a="resetDb">Réinitialiser la démo</button></div>`;
}

/* ----- Actions ----- */
function setStatut(id, s) { const r = db.resas.find((x) => String(x.id) === String(id)); if (!r) return; if (s !== 'Annulée' && r.statut === 'Annulée') { const v = veh(r.vehicule); if (v && conflicts(v, r.debut, r.fin, r.id).length) { toast('Impossible : le véhicule est déjà réservé sur ces dates.'); reload(); return; } } r.statut = s; persist(); A.closeModal(); reload(); toast(`Réservation #${r.id} : ${s}`); }
Object.assign(A, {
  plan(el) { const d = +el.dataset.d; adm.start = d === 0 ? addDays(today(), -2) : addDays(adm.start, d); reload(); },
  rView(el) { const r = db.resas.find((x) => String(x.id) === el.dataset.id); if (r) resaModal(r); },
  rStat(el) { setStatut(el.dataset.id, el.dataset.s); },
  rCau(el) { const r = db.resas.find((x) => String(x.id) === el.dataset.id); r.caution = !r.caution; persist(); $('#rtb').innerHTML = resaRows(); toast(r.caution ? 'Caution marquée comme reçue' : 'Caution à encaisser'); },
  sf(el) { adm.sf = el.dataset.s; reload(); },
  newResa() { newResaModal(); },
  vEdit(el) { vehModal(el.dataset.id); },
  vDel(el) { const v = veh(el.dataset.id); if (!v) return; const nb = db.resas.filter((r) => r.vehicule === v.id && actives(r) && r.fin > today()).length; if (!confirm(`Supprimer « ${v.nom} » de la flotte ?${nb ? `\n${nb} réservation(s) à venir le concernent.` : ''}`)) return; db.flotte = db.flotte.filter((x) => x.id !== v.id); persist(); reload(); toast('Véhicule supprimé'); },
  imgRm(el) { adm.draft.splice(+el.dataset.i, 1); $('#vimgs').innerHTML = imgsHTML(); },
  lib(el) { adm.draft.push(el.dataset.k); $('#vimgs').innerHTML = imgsHTML(); },
  resetDb() { if (!confirm('Remettre la démo dans son état de départ ?')) return; try { localStorage.removeItem(KEY); } catch (e) {} db = fresh(); window.db = db; initSearch(); persist(); reload(); toast('Démo réinitialisée'); },
});
document.addEventListener('change', async (e) => {
  const t = e.target;
  if (t.dataset.r) setStatut(t.dataset.r, t.value);
  else if (t.dataset.vs) { const v = veh(t.dataset.vs); v.statut = t.value; persist(); reload(); toast(`${v.nom} : ${t.value === 'maintenance' ? 'en maintenance' : 'disponible'}`); }
  else if (t.id === 'vfile' && adm.draft) { for (const f of t.files) { const d = await resize(f); if (d) adm.draft.push(d); } t.value = ''; $('#vimgs').innerHTML = imgsHTML(); }
});
document.addEventListener('input', (e) => { if (e.target.id === 'rq') { adm.q = e.target.value; $('#rtb').innerHTML = resaRows(); } });
document.addEventListener('submit', (e) => {
  const f = e.target;
  if (f.id === 'vform') { e.preventDefault(); saveVeh(f); }
  else if (f.id === 'nform') {
    e.preventDefault();
    const val = (n) => String(f.elements[n].value || '').trim(), v = veh(val('v')), d = val('d'), fi = val('f');
    const m = !v ? 'Choisissez un véhicule.' : !d || !fi || fi <= d ? 'La date de retour doit être après le départ.' : val('n').length < 2 ? 'Indiquez le nom du client.' : digits(val('t')).length < 8 ? 'Indiquez un téléphone valide.' : conflicts(v, d, fi).length ? `${v.nom} est déjà réservé sur ces dates.` : '';
    $('#nerr').textContent = m; if (m) return;
    const r = { id: db.nextResa++, vehicule: v.id, debut: d, fin: fi, heure: '09:00', lieu: val('l'), retour: val('l'), nom: val('n'), tel: val('t'), whatsapp: val('t'), chauffeur: f.elements.ch.checked && v.chauffeur !== 'inclus', options: [], statut: val('s'), caution: false, paiement: 'À l\'agence', cree: Date.now() };
    db.resas.push(r); persist(); A.closeModal(); reload(); toast(`Réservation #${r.id} enregistrée`);
  } else if (f.id === 'sform') {
    e.preventDefault();
    const val = (n) => String(f.elements[n].value || '').trim(), n = (k) => parseInt(digits(val(k)), 10) || 0;
    const s = db.settings;
    s.chauffeurJour = n('chauffeurJour'); s.remises = s.remises.map((r, i) => ({ des: Math.max(1, n('rd' + i)), pct: Math.min(80, n('rp' + i)) })).sort((a, b) => a.des - b.des);
    s.nom = val('nom') || 'LAGUNE AUTO'; s.whatsapp = digits(val('whatsapp')) || s.whatsapp; s.adresse = val('adresse');
    persist(); reload(); toast('Réglages enregistrés');
  }
});
