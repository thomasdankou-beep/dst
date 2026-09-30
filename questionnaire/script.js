/* ==========================================================
   DST TECHNOLOGIE – Questionnaire client (JavaScript vanilla)
   Structure :
     1. CONFIG        → paramètres (endpoint d'envoi, clé de stockage)
     2. STEPS         → les 12 étapes et toutes les questions (modifiable ici)
     3. État & stockage local
     4. Rendu (accueil, étapes, récapitulatif)
     5. Validation
     6. Export (JSON, PDF via impression) et envoi
   ========================================================== */
"use strict";

/* ---------- 1. CONFIG ---------- */
const CONFIG = {
  // Adresse du script d'envoi. "envoyer.php" = fichier PHP placé dans le même dossier sur votre hébergement.
  // (Peut aussi être l'URL d'une autre API ou d'un script Google.) Laisser vide = aucun envoi réel.
  endpoint: "envoyer.php",
  storageKey: "dst-questionnaire-perruques-v1"
};

/* Petites icônes pour certaines cartes (facultatif) */
const ICONS = {
  "Carte bancaire": "💳", "Wave": "🌊", "Orange Money": "🟠", "MTN Money": "🟡",
  "Moov Money": "🔵", "Paiement à la livraison": "🚚", "Livraison à domicile": "🏠",
  "Point relais": "📍", "Retrait en boutique": "🏬", "WhatsApp": "💬", "SMS": "📱",
  "E-mail": "✉️", "Instagram": "📸", "Facebook": "👍", "TikTok": "🎵", "WhatsApp Business": "💼"
};

const OUI_NON = ["Oui", "Non"];
const JOURS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

/* ---------- 2. STEPS ----------
   Types de champs : text, tel, number, date, time, textarea, radio, check, consent, signature
   req:true → obligatoire. Une option nommée "Autre" affiche un champ de précision. */
const STEPS = [
  { id: "entreprise", title: "Informations sur votre entreprise", fields: [
    { id: "nom_entreprise", q: "Nom de l’entreprise / marque", type: "text", req: true, ph: "Ex. ABC Hair" },
    { id: "responsable", q: "Nom et fonction du responsable", type: "text", req: true, ph: "Ex. Awa Koné, Gérante" },
    { id: "telephone", q: "Téléphone / WhatsApp professionnel", type: "tel", req: true, ph: "Ex. +225 07 00 00 00 00", attr: 'inputmode="tel" autocomplete="tel"' },
    { id: "adresse", q: "Adresse / localisation", type: "text", ph: "Ex. Cocody, Abidjan" },
    { id: "reseaux", q: "Réseaux sociaux utilisés", type: "check", opts: ["Instagram", "Facebook", "TikTok", "WhatsApp Business", "Autre"] },
    { id: "identite", q: "Disposez-vous déjà d’un logo et d’une identité visuelle ?", type: "radio", opts: ["Oui", "Non", "À créer par DST TECHNOLOGIE"] }
  ]},
  { id: "objectifs", title: "Objectifs du site", fields: [
    { id: "objectifs", q: "Quels sont vos objectifs principaux ?", type: "check", req: true, reqMsg: "Sélectionnez au moins un objectif principal.",
      opts: ["Présenter l’entreprise", "Vendre les perruques en ligne", "Recevoir des commandes 24h/24", "Prendre des rendez-vous", "Gérer les paiements", "Organiser les livraisons", "Développer la visibilité", "Autre"] },
    { id: "solution", q: "Quelle solution souhaitez-vous ?", type: "radio",
      opts: ["Boutique en ligne", "Boutique + rendez-vous", "Boutique + paiement + livraison", "Solution complète avec tableau de bord"] }
  ]},
  { id: "catalogue", title: "Catalogue et vente de perruques", fields: [
    { id: "produits", q: "Quels produits souhaitez-vous vendre ?", type: "check", opts: ["Perruques", "Mèches / extensions", "Accessoires", "Produits capillaires", "Prestations", "Autre"] },
    { id: "nb_produits", q: "Nombre approximatif de produits au lancement", type: "radio", compact: true, opts: ["1–20", "21–50", "51–100", "101–300", "Plus de 300"] },
    { id: "infos_produit", q: "Quelles informations doivent apparaître sur chaque produit ?", type: "check",
      opts: ["Photos", "Prix", "Description", "Couleur", "Longueur", "Type de cheveux", "Disponibilité", "Stock", "Variantes"] },
    { id: "panier", q: "Le client doit-il pouvoir ajouter les produits à un panier puis passer commande ?", type: "radio", compact: true, opts: OUI_NON },
    { id: "gestion_produits", q: "Souhaitez-vous gérer vous-même les produits, prix et stocks depuis un espace administrateur ?", type: "radio", opts: ["Oui", "Non", "Je souhaite une assistance DST"] }
  ]},
  { id: "commandes", title: "Commandes en ligne", fields: [
    { id: "infos_commande", q: "Quelles informations le client doit-il fournir lors de la commande ?", type: "check",
      opts: ["Nom", "Prénom", "Téléphone", "WhatsApp", "Adresse", "Commune", "Quartier", "Point de livraison", "Autre"] },
    { id: "notif_commande", q: "Souhaitez-vous recevoir une notification lorsqu’une nouvelle commande est passée ?", type: "check",
      opts: ["WhatsApp", "E-mail", "Notification dans le tableau de bord", "SMS"] },
    { id: "statuts", q: "Quels statuts de commande souhaitez-vous suivre ?", type: "check",
      opts: ["En attente", "Confirmée", "Payée", "En préparation", "Expédiée", "Livrée", "Annulée"] },
    { id: "statut_client", q: "Souhaitez-vous permettre au client de consulter le statut de sa commande ?", type: "radio", compact: true, opts: OUI_NON }
  ]},
  { id: "paiement", title: "Paiement en ligne", fields: [
    { id: "moyens_paiement", q: "Quels moyens de paiement souhaitez-vous proposer ?", type: "check",
      opts: ["Carte bancaire", "Wave", "Orange Money", "MTN Money", "Moov Money", "Paiement à la livraison", "Autre"] },
    { id: "paiement_obligatoire", q: "Le paiement doit-il être obligatoire avant la confirmation de la commande ?", type: "radio", opts: ["Oui", "Non", "Selon le produit / la commande"] },
    { id: "modalites", q: "Souhaitez-vous accepter un acompte ou un paiement en plusieurs tranches ?", type: "check",
      opts: ["Paiement intégral", "Acompte", "2 tranches", "3 tranches", "Autre"] },
    { id: "recu", q: "Après paiement, souhaitez-vous un reçu / une confirmation automatique ?", type: "radio", compact: true, opts: OUI_NON }
  ]},
  { id: "rdv", title: "Rendez-vous en ligne", fields: [
    { id: "rdv_prestations", q: "Pour quelles prestations le client doit-il pouvoir prendre rendez-vous ?", type: "check",
      opts: ["Essayage", "Pose de perruque", "Consultation / conseil", "Coiffure", "Vente en boutique", "Autre"] },
    { id: "rdv_jours", q: "Jours disponibles", type: "check", compact: true, opts: JOURS },
    { id: "rdv_horaires", q: "Horaires disponibles", type: "range" },
    { id: "rdv_duree", q: "Durée moyenne d’un rendez-vous", type: "radio", compact: true, opts: ["15 min", "30 min", "45 min", "1 h", "1 h 30", "2 h ou plus"] },
    { id: "rdv_blocage", q: "Souhaitez-vous bloquer automatiquement les créneaux déjà réservés ?", type: "radio", compact: true, opts: OUI_NON },
    { id: "rdv_confirmation", q: "Confirmation du rendez-vous", type: "check", opts: ["WhatsApp", "SMS", "E-mail", "Notification sur le site"] }
  ]},
  { id: "livraison", title: "Livraison", fields: [
    { id: "zones", q: "Dans quelles zones effectuez-vous les livraisons ?", type: "textarea", ph: "Ex. Abidjan (Cocody, Yopougon, Marcory…), livraison possible à l’intérieur du pays" },
    { id: "frais", q: "Comment souhaitez-vous calculer les frais de livraison ?", type: "check",
      opts: ["Tarif fixe", "Selon la commune", "Selon la distance", "Selon le montant de la commande", "À définir avec DST"] },
    { id: "modes_remise", q: "Quels modes de remise souhaitez-vous proposer ?", type: "check", opts: ["Livraison à domicile", "Point relais", "Retrait en boutique"] },
    { id: "choix_mode", q: "Le client doit-il choisir son mode de livraison pendant la commande ?", type: "radio", compact: true, opts: OUI_NON },
    { id: "suivi_livraison", q: "Souhaitez-vous suivre le statut de la livraison ?", type: "radio", compact: true, opts: OUI_NON },
    { id: "notif_livraison", q: "Souhaitez-vous que le client reçoive une notification lorsque la commande est livrée ?", type: "radio", compact: true, opts: OUI_NON }
  ]},
  { id: "gestion", title: "Gestion et tableau de bord", fields: [
    { id: "fonctions_admin", q: "Quelles fonctions souhaitez-vous gérer depuis votre espace administrateur ?", type: "check",
      opts: ["Produits", "Stock", "Commandes", "Clients", "Paiements", "Rendez-vous", "Livraisons", "Promotions", "Statistiques", "Factures / reçus"] },
    { id: "historique", q: "Souhaitez-vous conserver l’historique des clientes ?", type: "check",
      opts: ["Coordonnées", "Achats", "Paiements", "Rendez-vous", "Adresses", "Notes / observations"] },
    { id: "nb_admins", q: "Combien de personnes devront avoir accès à l’administration ?", type: "number", ph: "Ex. 2", attr: 'min="1" inputmode="numeric"' },
    { id: "niveaux_acces", q: "Souhaitez-vous différents niveaux d’accès pour les employés ?", type: "radio", compact: true, opts: ["Oui", "Non", "À définir"] }
  ]},
  { id: "design", title: "Design et contenu", fields: [
    { id: "style", q: "Quel style souhaitez-vous pour votre boutique en ligne ?", type: "check",
      opts: ["Luxe / Premium", "Élégant / féminin", "Moderne / minimaliste", "Coloré", "Sobre / professionnel", "Autre"] },
    { id: "couleurs", q: "Couleurs souhaitées", type: "text", ph: "Ex. Noir et or, rose poudré…" },
    { id: "elements", q: "Avez-vous déjà les éléments suivants ?", type: "check",
      opts: ["Logo", "Photos professionnelles", "Descriptions des produits", "Tarifs", "Textes de présentation", "Catalogue"] },
    { id: "accompagnement", q: "Quel accompagnement souhaitez-vous de DST TECHNOLOGIE ?", type: "check",
      opts: ["Création des textes", "Retouche / optimisation des photos", "Création du catalogue", "Création des visuels", "Accompagnement complet"] }
  ]},
  { id: "technique", title: "Nom de domaine, hébergement et maintenance", fields: [
    { id: "domaine", q: "Disposez-vous déjà d’un nom de domaine ?", type: "radio", opts: ["Oui", "Non", "Je souhaite une proposition DST"] },
    { id: "hebergement", q: "Disposez-vous déjà d’un hébergement ?", type: "radio", opts: ["Oui", "Non", "Je souhaite une proposition DST"] },
    { id: "confier", q: "Quels éléments souhaitez-vous confier à DST TECHNOLOGIE ?", type: "check",
      opts: ["Nom de domaine", "Hébergement", "E-mails professionnels", "SSL / sécurité", "Sauvegardes", "Maintenance"] },
    { id: "maintenance", q: "Souhaitez-vous un contrat de maintenance après la mise en ligne ?", type: "radio", opts: ["Oui", "Non", "À discuter"] }
  ]},
  { id: "budget", title: "Délai, budget et priorités", fields: [
    { id: "delai", q: "Délai souhaité pour la mise en ligne", type: "radio", req: true, reqMsg: "Choisissez un délai souhaité.",
      opts: ["Urgent", "1–2 semaines", "3–4 semaines", "1–2 mois", "Pas de délai particulier"] },
    { id: "budget", q: "Budget prévu pour le projet", type: "radio", req: true, reqMsg: "Choisissez une tranche de budget.",
      opts: ["Moins de 150 000 FCFA", "150 000–300 000 FCFA", "300 000–500 000 FCFA", "500 000–750 000 FCFA", "Plus de 750 000 FCFA", "Je souhaite recevoir une proposition adaptée"] },
    { id: "indispensables", q: "Fonctionnalités indispensables à votre activité", type: "check",
      opts: ["Vente en ligne", "Paiement en ligne", "Rendez-vous", "Livraison", "Gestion du stock", "Gestion clientes", "Notifications", "Tableau de bord"] },
    { id: "autres_besoins", q: "Autres besoins ou fonctionnalités particulières", type: "textarea", ph: "Décrivez ici tout besoin spécifique…" }
  ]},
  { id: "validation", title: "Validation du besoin", fields: [
    { id: "declaration", q: "Je confirme que les informations fournies correspondent à mes besoins actuels. Elles serviront de base au cadrage du projet et à l’établissement de la proposition commerciale.",
      type: "consent", req: true, reqMsg: "Vous devez confirmer la déclaration pour continuer." },
    { id: "nom_valideur", q: "Nom du responsable", type: "text", req: true, ph: "Nom et prénom" },
    { id: "date_validation", q: "Date", type: "date", req: true },
    { id: "signature", q: "Signature électronique", type: "signature", req: true, reqMsg: "Veuillez signer dans le cadre prévu." },
    { id: "observations", q: "Observations complémentaires", type: "textarea", ph: "Un message pour l’équipe DST ? (facultatif)" }
  ]}
];

/* ---------- 3. ÉTAT & STOCKAGE LOCAL ---------- */
const $ = (s) => document.querySelector(s);
const stage = $("#stage");
const fresh = () => ({ view: "welcome", step: 0, answers: {}, fromRecap: false });

function load() {
  try { return JSON.parse(localStorage.getItem(CONFIG.storageKey)) || fresh(); }
  catch (e) { return fresh(); }
}
function save() {
  try { localStorage.setItem(CONFIG.storageKey, JSON.stringify(state)); } catch (e) { /* stockage indisponible */ }
}
let state = load();
const hasProgress = () => Object.keys(state.answers).length > 0 || state.step > 0;
const allFields = () => STEPS.flatMap((s) => s.fields);

const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const today = () => new Date().toISOString().slice(0, 10);

/* ---------- 4. RENDU ---------- */
function fieldHTML(f) {
  const a = state.answers, v = a[f.id];
  const star = f.req ? ' <span class="req" aria-hidden="true">*</span><span class="sr" hidden> (obligatoire)</span>' : "";
  const err = `<p class="err" id="err-${f.id}" role="alert"></p>`;
  const ariaReq = f.req ? ' aria-required="true"' : "";

  switch (f.type) {
    case "text": case "tel": case "number": case "date": case "time": {
      const val = f.type === "date" && !v ? "" : (v || "");
      return `<div class="field" data-field="${f.id}">
        <label class="label" for="${f.id}">${f.q}${star}</label>
        <input class="input" id="${f.id}" name="${f.id}" type="${f.type}" value="${esc(val)}"
          ${f.ph ? `placeholder="${esc(f.ph)}"` : ""} ${f.attr || ""}${ariaReq} aria-describedby="err-${f.id}">${err}</div>`;
    }
    case "textarea":
      return `<div class="field" data-field="${f.id}">
        <label class="label" for="${f.id}">${f.q}${star}</label>
        <textarea class="input" id="${f.id}" name="${f.id}" ${f.ph ? `placeholder="${esc(f.ph)}"` : ""}
          aria-describedby="err-${f.id}">${esc(v || "")}</textarea>${err}</div>`;

    case "range": // deux champs "time" : ouverture / fermeture
      return `<div class="field" data-field="${f.id}"><span class="label">${f.q}</span>
        <div class="row2">
          <div><label class="label" for="${f.id}_de" style="font-weight:500">De</label>
            <input class="input" type="time" id="${f.id}_de" name="${f.id}_de" value="${esc(a[f.id + "_de"] || "")}"></div>
          <div><label class="label" for="${f.id}_a" style="font-weight:500">À</label>
            <input class="input" type="time" id="${f.id}_a" name="${f.id}_a" value="${esc(a[f.id + "_a"] || "")}"></div>
        </div></div>`;

    case "radio": case "check": {
      const cur = f.type === "check" ? (v || []) : v;
      const items = f.opts.map((o, i) => {
        const id = `${f.id}_${i}`;
        const on = f.type === "check" ? cur.includes(o) : cur === o;
        return `<label class="opt" for="${id}">
          <input type="${f.type === "check" ? "checkbox" : "radio"}" id="${id}" name="${f.id}" value="${esc(o)}" ${on ? "checked" : ""}>
          <span class="card">${ICONS[o] ? `<span class="ico" aria-hidden="true">${ICONS[o]}</span>` : ""}
          <span class="txt">${o}</span><span class="mark" aria-hidden="true"></span></span></label>`;
      }).join("");
      const hasOther = f.opts.includes("Autre");
      const otherOn = hasOther && (f.type === "check" ? cur.includes("Autre") : cur === "Autre");
      const other = hasOther ? `<input class="input other" id="${f.id}__autre" name="${f.id}__autre" type="text"
          placeholder="Précisez…" aria-label="Précisez « Autre »" value="${esc(a[f.id + "__autre"] || "")}" ${otherOn ? "" : "hidden"}>` : "";
      return `<fieldset class="field" data-field="${f.id}" aria-describedby="err-${f.id}">
        <legend class="label">${f.q}${star}</legend>
        <div class="opts ${f.compact ? "compact" : ""}">${items}</div>${other}${err}</fieldset>`;
    }
    case "consent":
      return `<div class="field" data-field="${f.id}">
        <p class="quote">${f.q}</p>
        <div class="opts"><label class="opt" for="${f.id}"><input type="checkbox" id="${f.id}" name="${f.id}" ${v ? "checked" : ""}${ariaReq}>
          <span class="card"><span class="txt"><strong>J’ai lu et je confirme cette déclaration</strong>${star}</span><span class="mark" aria-hidden="true"></span></span></label></div>${err}</div>`;

    case "signature":
      return `<div class="field" data-field="${f.id}"><span class="label" id="lbl-sig">${f.q}${star}</span>
        <div class="sig-box"><canvas id="sigCanvas" aria-labelledby="lbl-sig" role="img"></canvas>
          <span class="sig-hint">Signez avec le doigt ou la souris</span></div>
        <div class="sig-tools"><button type="button" class="btn btn-ghost btn-sm" data-act="clear-sig">Effacer la signature</button></div>${err}</div>`;
  }
  return "";
}

function render(animate = true) {
  save();
  const progress = $("#progress");
  progress.hidden = state.view !== "step";

  if (state.view === "welcome") stage.innerHTML = welcomeHTML();
  else if (state.view === "step") { stage.innerHTML = stepHTML(); initSignature(); updateProgress(); }
  else if (state.view === "recap") stage.innerHTML = recapHTML();

  stage.classList.remove("anim");
  if (animate) { void stage.offsetWidth; stage.classList.add("anim"); }
  stage.focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function welcomeHTML() {
  return `<div class="center">
    <span class="step-tag">BIENVENUE</span>
    <h2>Parlons de votre projet</h2>
    <p class="intro">12 étapes courtes. Vos réponses sont enregistrées automatiquement sur cet appareil : vous pouvez fermer la page et reprendre plus tard.</p>
    <div class="stack">
      ${hasProgress()
        ? `<button class="btn btn-primary" data-act="resume">Continuer mon questionnaire</button>
           <button class="btn btn-danger" data-act="reset">Réinitialiser le formulaire</button>`
        : `<button class="btn btn-primary" data-act="start">Commencer le questionnaire</button>`}
    </div></div>`;
}

function stepHTML() {
  const s = STEPS[state.step], n = state.step + 1, last = n === STEPS.length;
  if (s.id === "validation" && !state.answers.date_validation) state.answers.date_validation = today();
  return `<form id="form" novalidate autocomplete="on">
    <span class="step-tag">ÉTAPE ${String(n).padStart(2, "0")}</span>
    <h2 id="stepTitle">${s.title}</h2>
    ${s.fields.some((f) => f.req) ? '<p class="legend-req"><span class="req">*</span> Champ obligatoire</p>' : '<p class="intro">Toutes les questions de cette étape sont facultatives.</p>'}
    ${s.fields.map(fieldHTML).join("")}
    <div class="nav">
      <button type="button" class="btn btn-ghost" data-act="back">← ${state.fromRecap ? "Récapitulatif" : state.step === 0 ? "Accueil" : "Retour"}</button>
      <button type="button" class="btn btn-primary" data-act="next">${state.fromRecap ? "Enregistrer et revenir au récapitulatif" : last ? "Voir le récapitulatif" : "Continuer"} →</button>
    </div>
    <div class="center"><button type="button" class="link-reset" data-act="reset">Réinitialiser le formulaire</button></div>
  </form>`;
}

function updateProgress() {
  const n = state.step + 1, pct = Math.round((n / STEPS.length) * 100);
  $("#progressLabel").textContent = `Étape ${n} / ${STEPS.length}`;
  $("#progressPct").textContent = `${pct} %`;
  $("#barFill").style.width = pct + "%";
  $("#bar").setAttribute("aria-valuenow", pct);
  $("#dots").innerHTML = STEPS.map((_, i) => `<li class="${i < state.step ? "done" : i === state.step ? "now" : ""}"></li>`).join("");
}

/* Valeur affichable d'un champ (récap / export) */
function display(f) {
  const a = state.answers, v = a[f.id];
  const withOther = (x) => (x === "Autre" && a[f.id + "__autre"] ? `Autre : ${a[f.id + "__autre"]}` : x);
  if (f.type === "range") { const d = a[f.id + "_de"], b = a[f.id + "_a"]; return d || b ? `de ${d || "?"} à ${b || "?"}` : ""; }
  if (f.type === "check") return (v || []).map(withOther).join(", ");
  if (f.type === "date") return v ? v.split("-").reverse().join("/") : ""; // 2026-09-29 -> 29/09/2026
  if (f.type === "radio") return v ? withOther(v) : "";
  if (f.type === "consent") return v ? "Déclaration confirmée" : "";
  if (f.type === "signature") return "";
  return v || "";
}

function recapHTML() {
  const secs = STEPS.map((s, i) => {
    const rows = s.fields.map((f) => {
      if (f.type === "signature") return state.answers.signature ? `<div><dt>${f.q}</dt><dd><img src="${state.answers.signature}" alt="Signature"></dd></div>` : "";
      const d = display(f);
      return d ? `<div><dt>${f.type === "consent" ? "Déclaration" : f.q}</dt><dd>${f.type === "check" ? "✓ " : ""}${esc(d).replace(/, /g, "<br>✓ ")}</dd></div>` : "";
    }).join("");
    return `<section class="recap-sec"><div class="recap-head"><h3>${String(i + 1).padStart(2, "0")} · ${s.title}</h3>
      <button class="btn btn-ghost btn-sm" data-act="edit" data-step="${i}">Modifier</button></div>
      <dl class="recap-list">${rows || '<div><dd style="font-weight:400;color:#5b6785">Aucune réponse</dd></div>'}</dl></section>`;
  }).join("");
  return `<span class="step-tag">RÉCAPITULATIF</span>
    <h2>Récapitulatif de votre projet</h2>
    <p class="intro">Vérifiez vos réponses. Utilisez « Modifier » pour corriger une section.</p>
    ${secs}
    <div class="actions">
      <button class="btn btn-ghost" data-act="pdf">📄 Télécharger le questionnaire (PDF)</button>
      <button class="btn btn-ghost" data-act="json">⬇ Fichier JSON</button>
      <button class="btn btn-primary" data-act="submit">Envoyer ma demande à DST Technologie</button>
    </div>
    <div id="submitResult" role="status"></div>`;
}

/* ---------- Signature (canvas) ---------- */
function initSignature() {
  const c = $("#sigCanvas"); if (!c) return;
  const dpr = window.devicePixelRatio || 1;
  c.width = c.clientWidth * dpr; c.height = c.clientHeight * dpr;
  const ctx = c.getContext("2d");
  ctx.scale(dpr, dpr); ctx.lineWidth = 2.2; ctx.lineCap = "round"; ctx.strokeStyle = "#0b1f4b";
  if (state.answers.signature) {
    const img = new Image();
    img.onload = () => ctx.drawImage(img, 0, 0, c.clientWidth, c.clientHeight);
    img.src = state.answers.signature;
  }
  let drawing = false;
  const pos = (e) => { const r = c.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  c.addEventListener("pointerdown", (e) => { drawing = true; c.setPointerCapture(e.pointerId); ctx.beginPath(); ctx.moveTo(...pos(e)); });
  c.addEventListener("pointermove", (e) => { if (!drawing) return; ctx.lineTo(...pos(e)); ctx.stroke(); });
  const end = () => { if (!drawing) return; drawing = false; state.answers.signature = c.toDataURL("image/png"); save(); };
  c.addEventListener("pointerup", end); c.addEventListener("pointercancel", end);
}

/* ---------- Collecte des réponses de l'étape affichée ---------- */
function collect() {
  const form = $("#form"); if (!form) return;
  STEPS[state.step].fields.forEach((f) => {
    const a = state.answers;
    if (f.type === "check") a[f.id] = [...form.querySelectorAll(`input[name="${f.id}"]:checked`)].map((i) => i.value);
    else if (f.type === "radio") { const r = form.querySelector(`input[name="${f.id}"]:checked`); a[f.id] = r ? r.value : ""; }
    else if (f.type === "consent") a[f.id] = form.querySelector(`#${f.id}`).checked;
    else if (f.type === "range") { a[f.id + "_de"] = form.querySelector(`#${f.id}_de`).value; a[f.id + "_a"] = form.querySelector(`#${f.id}_a`).value; }
    else if (f.type !== "signature") a[f.id] = form.querySelector(`#${f.id}`).value.trim();
    const o = form.querySelector(`#${f.id}__autre`); if (o) a[f.id + "__autre"] = o.value.trim();
  });
  save();
}

/* ---------- 5. VALIDATION ---------- */
function validateStep() {
  const a = state.answers; let first = null;
  STEPS[state.step].fields.forEach((f) => {
    const box = document.querySelector(`[data-field="${f.id}"]`), out = $(`#err-${f.id}`);
    let msg = "";
    const v = a[f.id];
    if (f.req) {
      if (f.type === "check" && !(v || []).length) msg = f.reqMsg || "Sélectionnez au moins une option.";
      else if (f.type === "radio" && !v) msg = f.reqMsg || "Veuillez choisir une option.";
      else if (f.type === "consent" && !v) msg = f.reqMsg;
      else if (f.type === "signature" && !a.signature) msg = f.reqMsg;
      else if (["text", "tel", "number", "date", "textarea"].includes(f.type) && !v) msg = "Ce champ est obligatoire.";
    }
    if (!msg && f.id === "nom_entreprise" && !v) msg = "Veuillez indiquer le nom de votre entreprise ou marque.";
    if (!msg && f.id === "responsable" && !v) msg = "Veuillez indiquer le nom et la fonction du responsable.";
    if (!msg && f.id === "telephone") {
      if (!v) msg = "Veuillez indiquer un numéro de téléphone ou WhatsApp.";
      else if (!/^\+?[\d\s().-]{8,18}$/.test(v) || v.replace(/\D/g, "").length < 8) msg = "Numéro invalide : saisissez au moins 8 chiffres (ex. +225 07 00 00 00 00).";
    }
    if (!msg && f.id === "nb_admins" && v && Number(v) < 1) msg = "Indiquez un nombre supérieur ou égal à 1.";
    if (out) out.textContent = msg;
    if (box) box.classList.toggle("invalid", !!msg);
    const input = box && box.querySelector("input.input, textarea");
    if (input && f.type !== "range") input.setAttribute("aria-invalid", msg ? "true" : "false");
    if (msg && !first) first = box;
  });
  if (first) {
    first.scrollIntoView({ behavior: "smooth", block: "center" });
    const t = first.querySelector("input, textarea, canvas, button"); if (t) t.focus({ preventScroll: true });
  }
  return !first;
}

/* ---------- Événements (délégation) ---------- */
stage.addEventListener("change", (e) => {
  if (!e.target.closest("#form")) return;
  // Affiche / masque le champ « Autre »
  const fs = e.target.closest("fieldset"), other = fs && fs.querySelector(".other");
  if (other) {
    const on = [...fs.querySelectorAll("input[name]:checked")].some((i) => i.value === "Autre");
    other.hidden = !on; if (on && e.target.value === "Autre") other.focus();
  }
  collect();
});
stage.addEventListener("input", (e) => { if (e.target.closest("#form")) collect(); });

stage.addEventListener("click", (e) => {
  const b = e.target.closest("[data-act]"); if (!b) return;
  const act = b.dataset.act;
  switch (act) {
    case "start": case "resume": state.view = "step"; render(); break;
    case "next":
      collect();
      if (!validateStep()) return;
      // Après un « Modifier » depuis le récapitulatif, on y retourne directement
      if (state.fromRecap || state.step >= STEPS.length - 1) { state.fromRecap = false; state.step = STEPS.length - 1; state.view = "recap"; render(); }
      else { state.step++; render(); }
      break;
    case "back":
      collect();
      if (state.fromRecap) { state.fromRecap = false; state.step = STEPS.length - 1; state.view = "recap"; }
      else if (state.step === 0) { state.view = "welcome"; } else state.step--;
      render(); break;
    case "edit": state.step = Number(b.dataset.step); state.fromRecap = true; state.view = "step"; render(); break;
    case "clear-sig": { const c = $("#sigCanvas"); c.getContext("2d").clearRect(0, 0, c.width, c.height); state.answers.signature = ""; save(); break; }
    case "reset": resetForm(); break;
    case "json": downloadJSON(); break;
    case "pdf": downloadPDF(); break;
    case "submit": submitQuestionnaire(); break;
  }
});

function resetForm() {
  if (!confirm("Voulez-vous vraiment effacer toutes vos réponses ? Cette action est irréversible.")) return;
  try { localStorage.removeItem(CONFIG.storageKey); } catch (e) {}
  state = fresh(); render();
}

/* ---------- 6. EXPORT & ENVOI ---------- */
/* Données structurées prêtes à être envoyées à une API */
function buildPayload() {
  const reponses = {};
  STEPS.forEach((s, i) => {
    reponses[s.id] = { etape: i + 1, titre: s.title, champs: {} };
    s.fields.forEach((f) => {
      if (f.type === "signature") return;
      reponses[s.id].champs[f.id] = { question: f.type === "consent" ? "Déclaration de validation" : f.q, reponse: f.type === "check" ? (state.answers[f.id] || []) : display(f) || "" };
      if (f.type === "check" && state.answers[f.id + "__autre"]) reponses[s.id].champs[f.id].autre = state.answers[f.id + "__autre"];
    });
  });
  return {
    meta: { formulaire: "Questionnaire client DST TECHNOLOGIE – boutique de perruques", version: 1, genere_le: new Date().toISOString() },
    reponses,
    signature_png_base64: state.answers.signature || ""
  };
}

function downloadJSON() {
  const blob = new Blob([JSON.stringify(buildPayload(), null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `questionnaire-dst-${(state.answers.nom_entreprise || "client").toLowerCase().replace(/[^a-z0-9]+/g, "-")}.json`;
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(a.href);
}

/* ---------- PDF (bibliothèque jsPDF : assets/vendor/jspdf.umd.min.js) ---------- */
// Les polices PDF standard n'affichent que le jeu Latin-1 : on retire emojis et symboles spéciaux.
const pdfSafe = (s) => String(s ?? "")
  .replace(/[‘’]/g, "'").replace(/[“”]/g, '"')
  .replace(/[–—]/g, "-").replace(/…/g, "...").replace(/[  ]/g, " ")
  .replace(/[^\u0000-ÿ]/g, "");

const loadImage = (src) => new Promise((ok) => {
  const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = src;
});

/* Logo DST : lu depuis assets/logo-dst-technologie.png (ignoré s'il est absent). */
async function logoData() {
  const img = await loadImage("assets/logo-dst-technologie.png");
  if (!img) return null;
  try {
    const c = document.createElement("canvas");
    c.width = img.naturalWidth; c.height = img.naturalHeight;
    c.getContext("2d").drawImage(img, 0, 0);
    return { url: c.toDataURL("image/png"), ratio: img.naturalWidth / img.naturalHeight };
  } catch (e) { return null; } // ex. page ouverte en double-clic (file://) : le navigateur bloque la lecture de l'image
}

const pdfName = () => `Questionnaire-DST-${(state.answers.nom_entreprise || "client")
  .normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${today()}.pdf`;

/* Construit le PDF final (texte sélectionnable, pagination automatique, signature incluse). */
async function buildPdf() {
  if (!window.jspdf) throw new Error("bibliothèque PDF introuvable (assets/vendor/jspdf.umd.min.js)");
  const { jsPDF } = window.jspdf, a = state.answers;
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true }); // compress : PDF léger (e-mail)
  const W = 210, M = 16, CW = W - 2 * M, BOTTOM = 280;
  const C = { navy: [11, 31, 75], royal: [29, 78, 216], soft: [232, 239, 255], gray: [243, 245, 249], muted: [91, 103, 133], line: [217, 223, 236] };
  const ink = (c) => doc.setTextColor(c[0], c[1], c[2]);
  const fill = (c) => doc.setFillColor(c[0], c[1], c[2]);
  const font = (style, size, color) => { doc.setFont("helvetica", style); doc.setFontSize(size); ink(color); };
  let y = 12;
  const ensure = (h) => { if (y + h > BOTTOM) { doc.addPage(); y = 18; } };
  // Écrit des lignes une à une (saute de page si besoin, même pour un très long texte)
  const write = (lines, x, lh) => lines.forEach((l) => { ensure(lh); doc.text(l, x, y); y += lh; });

  /* En-tête : logo (ou nom en texte) + bandeau bleu marine */
  const logo = await logoData();
  if (logo) {
    let h = 14, w = h * logo.ratio; if (w > 50) { w = 50; h = w / logo.ratio; }
    doc.addImage(logo.url, "PNG", M, y, w, h);
  } else { font("bold", 15, C.navy); doc.text("DST TECHNOLOGIE", M, y + 9); }
  font("normal", 9, C.muted); doc.text("Questionnaire de cadrage client", W - M, y + 9, { align: "right" });
  y += 20;
  fill(C.navy); doc.roundedRect(M, y, CW, 24, 3, 3, "F");
  font("bold", 17, [255, 255, 255]); doc.text("QUESTIONNAIRE CLIENT", M + 8, y + 10);
  font("normal", 10.5, [255, 255, 255]); doc.text(pdfSafe("Création d'une boutique en ligne de perruques"), M + 8, y + 17.5);
  y += 32;

  /* Encadré « en un coup d'œil » */
  const info = [["Entreprise", a.nom_entreprise], ["Responsable", a.responsable], ["Téléphone / WhatsApp", a.telephone],
    ["Budget prévu", a.budget], ["Délai souhaité", a.delai], ["Date de validation", display({ id: "date_validation", type: "date" })]];
  const bh = Math.ceil(info.length / 2) * 15 + 4;
  fill(C.gray); doc.roundedRect(M, y, CW, bh, 3, 3, "F");
  info.forEach(([k, v], i) => {
    const x = M + 6 + (i % 2) * (CW / 2), yy = y + 8 + Math.floor(i / 2) * 15;
    font("normal", 8, C.muted); doc.text(pdfSafe(k), x, yy);
    font("bold", 9.5, C.navy); doc.text(doc.splitTextToSize(pdfSafe(v || "-"), CW / 2 - 10).slice(0, 2), x, yy + 4.6);
  });
  y += bh + 8;

  /* Sections : seules les questions renseignées sont listées */
  for (const [i, s] of STEPS.entries()) {
    const items = [];
    s.fields.forEach((f) => {
      if (f.type === "signature") { if (a.signature) items.push({ q: f.q, sig: true }); return; }
      if (f.type === "check") {
        const v = (a[f.id] || []).map((o) => (o === "Autre" && a[f.id + "__autre"] ? `Autre : ${a[f.id + "__autre"]}` : o));
        if (v.length) items.push({ q: f.q, list: v });
      } else if (f.type === "consent") {
        if (a[f.id]) items.push({ q: "Déclaration de validation", val: `${f.q} (confirmée par le client)` });
      } else { const v = display(f); if (v) items.push({ q: f.q, val: v }); }
    });

    ensure(24);
    fill(C.soft); doc.roundedRect(M, y, CW, 8, 2, 2, "F");
    font("bold", 10.5, C.navy); doc.text(pdfSafe(`${String(i + 1).padStart(2, "0")}   ${s.title.toUpperCase()}`), M + 4, y + 5.6);
    y += 13;
    if (!items.length) { font("italic", 9, C.muted); doc.text("Aucune réponse", M + 4, y); y += 8; continue; }

    for (const it of items) {
      font("normal", 8.5, C.muted);
      const ql = doc.splitTextToSize(pdfSafe(it.q), CW - 8);
      ensure(ql.length * 3.8 + 9);
      doc.text(ql, M + 4, y); y += ql.length * 3.8 + 1.8;
      if (it.sig) {
        const im = await loadImage(a.signature), w = 70, h = im ? (w * im.naturalHeight) / im.naturalWidth : 25;
        // La signature peut être très grande sur un téléphone haute résolution : on la réduit (PDF plus léger)
        let sigUrl = a.signature;
        if (im && im.naturalWidth > 700) {
          const c = document.createElement("canvas"); c.width = 700; c.height = Math.round((700 * im.naturalHeight) / im.naturalWidth);
          c.getContext("2d").drawImage(im, 0, 0, c.width, c.height); sigUrl = c.toDataURL("image/png");
        }
        ensure(h + 4);
        doc.setDrawColor(C.line[0], C.line[1], C.line[2]); doc.roundedRect(M + 4, y, w, h, 2, 2, "S");
        doc.addImage(sigUrl, "PNG", M + 4, y, w, h); y += h + 2;
      } else if (it.list) {
        for (const opt of it.list) {
          font("bold", 10, C.navy);
          const ls = doc.splitTextToSize(pdfSafe(opt), CW - 16);
          ensure(4.8); fill(C.royal); doc.circle(M + 6.2, y - 1.2, 0.8, "F");
          write(ls, M + 10, 4.8);
        }
      } else {
        font("bold", 10, C.navy);
        write(doc.splitTextToSize(pdfSafe(it.val), CW - 8), M + 4, 4.8);
      }
      y += 3.5;
    }
    y += 3;
  }

  /* Pied de page sur chaque page */
  const n = doc.getNumberOfPages(), stamp = new Date().toLocaleDateString("fr-FR");
  for (let p = 1; p <= n; p++) {
    doc.setPage(p);
    doc.setDrawColor(C.line[0], C.line[1], C.line[2]); doc.line(M, 287, W - M, 287);
    font("normal", 8, C.muted);
    doc.text(pdfSafe(`DST TECHNOLOGIE - Questionnaire client - généré le ${stamp}`), M, 292);
    doc.text(`Page ${p} / ${n}`, W - M, 292, { align: "right" });
  }
  return doc;
}

/* Bouton « Télécharger le questionnaire (PDF) » : télécharge le même PDF que celui envoyé par e-mail */
async function downloadPDF() {
  if (!window.jspdf) { window.print(); return; } // secours : impression du navigateur
  try { (await buildPdf()).save(pdfName()); }
  catch (e) { console.error(e); alert("Le PDF n'a pas pu être créé (" + e.message + "). L'impression du navigateur va s'ouvrir à la place."); window.print(); }
}

/* ---------- ENVOI PAR E-MAIL ----------
   Le PDF est envoyé (en base64) au script indiqué dans CONFIG.endpoint (envoyer.php sur votre
   hébergement), qui le joint à un e-mail. Sans endpoint, rien n'est envoyé. */
async function submitQuestionnaire() {
  const payload = buildPayload(), out = $("#submitResult"), a = state.answers;
  const ready = `<div class="ready"><strong>Votre questionnaire est prêt.</strong> DST Technologie pourra analyser vos besoins et préparer votre proposition commerciale.</div>`;
  if (!CONFIG.endpoint) {
    console.log("Données prêtes à envoyer :", payload);
    out.innerHTML = ready + `<p class="notice">Aucun serveur n’est encore configuré : la demande n’a pas été transmise automatiquement. Téléchargez le PDF ci-dessus et envoyez-le à DST Technologie.</p>`;
    return payload;
  }
  const btn = document.querySelector('[data-act="submit"]');
  if (btn) { btn.disabled = true; btn.textContent = "Envoi en cours…"; }
  try {
    const doc = await buildPdf();
    const pdf = doc.output("datauristring").split(",")[1]; // PDF encodé en base64
    // Pas d'en-tête personnalisé : compatible avec envoyer.php et avec les scripts Google (pas de « preflight »).
    const res = await fetch(CONFIG.endpoint, { method: "POST", body: JSON.stringify({
      entreprise: a.nom_entreprise || "", responsable: a.responsable || "", telephone: a.telephone || "",
      budget: a.budget || "", delai: a.delai || "", filename: pdfName(), pdf
    }) });
    if (!res.ok) throw new Error("HTTP " + res.status);
    let r = null; try { r = await res.json(); } catch (e) { /* réponse non JSON */ }
    if (!r || r.ok !== true) throw new Error(r && r.error ? r.error : "réponse inattendue du serveur");
    out.innerHTML = ready + `<p class="notice" style="background:#eaf7f0;border-color:#b6e2c9;color:#145a37">Votre demande a bien été transmise à DST Technologie.</p>`;
    if (btn) btn.textContent = "Demande envoyée ✓";
  } catch (err) {
    if (btn) { btn.disabled = false; btn.textContent = "Envoyer ma demande à DST Technologie"; }
    out.innerHTML = `<p class="notice" style="background:#fdecec;border-color:#f3b7b7;color:#8a1c1c">L’envoi a échoué (${esc(err.message)}). Vos réponses sont conservées : réessayez, ou téléchargez le PDF et envoyez-le à DST Technologie.</p>`;
  }
  return payload;
}

/* ---------- Démarrage ---------- */
// À chaque ouverture de la page, on repart de l'accueil : si des réponses existent,
// le bouton « Continuer mon questionnaire » les restaure à l'étape où le client s'était arrêté.
state.view = "welcome"; state.fromRecap = false;
render(false);
