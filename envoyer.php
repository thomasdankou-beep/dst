<?php
/**
 * DST TECHNOLOGIE - Réception du questionnaire client
 *  1. vous envoie le PDF par e-mail
 *  2. envoie une copie (PDF) au client avec un message de confirmation
 *  3. (option) vous prévient sur WhatsApp
 *
 * À placer dans le MÊME dossier que index.html, sur votre hébergement.
 */

// ====== À MODIFIER ======
$DESTINATAIRE = "contact@votredomaine.com"; // votre adresse e-mail pro : celle qui REÇOIT les questionnaires
$EXPEDITEUR   = "contact@votredomaine.com"; // une adresse de VOTRE nom de domaine (peut être la même)
$OBJET        = "Nouveau questionnaire client";
$LIMITE       = 10;                         // envois maximum par visiteur toutes les 10 minutes

// --- Copie envoyée au client ---
$COPIE_CLIENT       = true;                 // true = le client reçoit une confirmation + son PDF
$COPIE_MAX_PAR_JOUR = 50;                   // plafond de copies par jour (protection anti-abus)
$NOM_ENTREPRISE     = "DST TECHNOLOGIE";    // nom affiché dans le message envoyé au client

// --- Alerte WhatsApp (service gratuit CallMeBot, message envoyé à VOTRE numéro) ---
$WHATSAPP_ACTIF  = false;                   // passez à true après avoir obtenu votre clé (voir LISEZ-MOI.txt)
$WHATSAPP_NUMERO = "+2250700000000";        // votre numéro WhatsApp, avec l'indicatif du pays
$WHATSAPP_CLE    = "";                      // la clé (apikey) reçue de CallMeBot
$WHATSAPP_URL    = "https://api.callmebot.com/whatsapp.php";
// ========================

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function reponse($ok, $message = null, $code = 200, $extra = array()) {
    http_response_code($code);
    $r = $ok ? array('ok' => true) : array('ok' => false, 'error' => $message);
    if ($ok && $message) { $r['message'] = $message; }
    echo json_encode(array_merge($r, $extra), JSON_UNESCAPED_UNICODE);
    exit;
}

// Texte sur une seule ligne, sans caractères de contrôle (évite les injections dans les en-têtes)
function propre($s, $max = 200) {
    $s = trim(preg_replace('/[\x00-\x1F\x7F]+/', ' ', (string)$s));
    return function_exists('mb_substr') ? mb_substr($s, 0, $max, 'UTF-8') : substr($s, 0, $max);
}

// Le PDF doit ressembler à celui fabriqué par le formulaire : pas de contenu actif, pas de fichier caché
function pdf_acceptable($pdf) {
    if (strlen($pdf) > 1500000) { return false; }
    $hors = preg_replace('/stream\r?\n.*?endstream/s', '', $pdf); // on ignore les flux binaires
    if ($hors === null) { return false; }
    if (preg_match('/\/(ObjStm|EmbeddedFile|JavaScript|JS|Launch|AA|URI|SubmitForm|GoToR|RichMedia|XFA|Encrypt)(?![A-Za-z0-9])/', $hors)) { return false; }
    if (preg_match('/\/[A-Za-z0-9]*#[0-9A-Fa-f]{2}/', $hors)) { return false; } // noms PDF « camouflés »
    return true;
}

// Envoie un e-mail texte + PDF en pièce jointe
function envoyer_mail($a, $sujet, $texte, $pdf, $nom, $expediteur, $nomExpediteur, $repondreA = '') {
    $sujetEnc = function_exists('mb_encode_mimeheader')
        ? mb_encode_mimeheader($sujet, 'UTF-8', 'B', "\r\n")
        : '=?UTF-8?B?' . base64_encode($sujet) . '?=';
    $sep = 'dst_' . md5(uniqid('', true));
    $h = array(
        'From: =?UTF-8?B?' . base64_encode($nomExpediteur) . '?= <' . propre($expediteur) . '>',
        'MIME-Version: 1.0',
        'Content-Type: multipart/mixed; boundary="' . $sep . '"'
    );
    if ($repondreA !== '') { array_splice($h, 1, 0, 'Reply-To: ' . $repondreA); }
    $entetes = implode("\r\n", $h);
    $corps  = "--$sep\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n"
            . chunk_split(base64_encode($texte)) . "\r\n";
    $corps .= "--$sep\r\nContent-Type: application/pdf; name=\"$nom\"\r\nContent-Transfer-Encoding: base64\r\n"
            . "Content-Disposition: attachment; filename=\"$nom\"\r\n\r\n"
            . chunk_split(base64_encode($pdf)) . "\r\n--$sep--";
    // Adresse d'expédition « enveloppe » d'abord, puis sans si l'hébergeur la refuse
    $ok = @mail($a, $sujetEnc, $corps, $entetes, '-f' . propre($expediteur));
    if (!$ok) { $ok = @mail($a, $sujetEnc, $corps, $entetes); }
    return $ok;
}

// Compteurs simples (fichiers temporaires du serveur) pour limiter les abus
function compter($cle, $max) {
    $f = sys_get_temp_dir() . '/dst_q_' . md5($cle) . '_' . date('Ymd');
    $n = (int)@file_get_contents($f);
    if ($n >= $max) { return false; }
    @file_put_contents($f, (string)($n + 1), LOCK_EX);
    return true;
}

// Message WhatsApp via CallMeBot (échec silencieux : l'e-mail reste le canal principal)
function notifier_whatsapp($url, $numero, $cle, $texte) {
    $full = $url . '?' . http_build_query(array('phone' => $numero, 'text' => $texte, 'apikey' => $cle), '', '&', PHP_QUERY_RFC3986);
    if (function_exists('curl_init')) {
        $c = curl_init($full);
        curl_setopt_array($c, array(CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 8, CURLOPT_CONNECTTIMEOUT => 5));
        $r = curl_exec($c); $code = (int)curl_getinfo($c, CURLINFO_HTTP_CODE);
        return $r !== false && $code >= 200 && $code < 300;
    }
    if (ini_get('allow_url_fopen')) {
        $ctx = stream_context_create(array('http' => array('timeout' => 8, 'ignore_errors' => true)));
        $r = @file_get_contents($full, false, $ctx);
        return $r !== false && isset($http_response_header[0]) && preg_match('/ 2\d\d /', $http_response_header[0]);
    }
    return false;
}

// Sécurité : tant que l'adresse d'exemple n'est pas remplacée, rien n'est envoyé
if (strpos($DESTINATAIRE, 'votredomaine.com') !== false || !filter_var($DESTINATAIRE, FILTER_VALIDATE_EMAIL)) {
    reponse(false, "envoyer.php n'est pas configuré : remplacez l'adresse e-mail en haut du fichier", 500);
}

$whatsappPret = $WHATSAPP_ACTIF && $WHATSAPP_CLE !== '' && preg_match('/^\+?\d{8,15}$/', $WHATSAPP_NUMERO);

// Ouvrir envoyer.php dans un navigateur permet de vérifier que PHP fonctionne
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'GET') {
    reponse(true, 'Service actif', 200, array('copie_client' => (bool)$COPIE_CLIENT, 'whatsapp' => (bool)$whatsappPret));
}
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') { reponse(false, 'Méthode non autorisée', 405); }

// Refuse les requêtes venant d'un autre site
if (!empty($_SERVER['HTTP_ORIGIN'])) {
    $hoteOrigine = parse_url($_SERVER['HTTP_ORIGIN'], PHP_URL_HOST);
    $monHote = preg_replace('/:\d+$/', '', $_SERVER['HTTP_HOST'] ?? '');
    if ($hoteOrigine && strcasecmp($hoteOrigine, $monHote) !== 0) { reponse(false, 'Origine non autorisée', 403); }
}

// Lecture et contrôle des données
$brut = file_get_contents('php://input');
if (strlen($brut) > 7000000) { reponse(false, 'Fichier trop volumineux', 413); }
$d = json_decode($brut, true);
if (!is_array($d) || empty($d['pdf']) || empty($d['entreprise'])) { reponse(false, 'Données incomplètes', 400); }

$pdf = base64_decode($d['pdf'], true);
if ($pdf === false || substr($pdf, 0, 5) !== '%PDF-') { reponse(false, 'PDF invalide', 400); }
if (!pdf_acceptable($pdf)) { reponse(false, 'PDF non conforme', 400); }

$nom = preg_replace('/[^A-Za-z0-9._-]+/', '_', propre(isset($d['filename']) ? $d['filename'] : 'questionnaire.pdf', 120));
if (strtolower(substr($nom, -4)) !== '.pdf') { $nom .= '.pdf'; }

// Limite simple anti-abus : $LIMITE envois / 10 min par visiteur
$fichierLimite = sys_get_temp_dir() . '/dst_q_' . md5($_SERVER['REMOTE_ADDR'] ?? 'x');
$anciens = @file($fichierLimite, FILE_IGNORE_NEW_LINES);
$recents = array();
foreach (($anciens ? $anciens : array()) as $t) { if ((int)$t > time() - 600) { $recents[] = (int)$t; } }
if (count($recents) >= $LIMITE) { reponse(false, 'Trop de tentatives, réessayez dans quelques minutes', 429); }
$recents[] = time();
@file_put_contents($fichierLimite, implode("\n", $recents));

// Informations du client
$champ = function ($k) use ($d) { return isset($d[$k]) && $d[$k] !== '' ? propre($d[$k]) : '-'; };
$entreprise = propre($d['entreprise'], 120);
$emailClient = isset($d['email']) ? propre($d['email'], 120) : '';
if ($emailClient !== '' && !filter_var($emailClient, FILTER_VALIDATE_EMAIL)) { $emailClient = ''; }

// 1) E-mail pour vous (avec « Répondre » qui écrit directement au client)
$texte = implode("\r\n", array(
    "Un client vient de remplir le questionnaire.",
    "",
    "Entreprise : " . $entreprise,
    "Responsable : " . $champ('responsable'),
    "Téléphone / WhatsApp : " . $champ('telephone'),
    "E-mail : " . ($emailClient !== '' ? $emailClient : '-'),
    "Budget : " . $champ('budget'),
    "Délai : " . $champ('delai'),
    "",
    "Le questionnaire complet est en pièce jointe (PDF)."
));
$ok = envoyer_mail($DESTINATAIRE, $OBJET . ' - ' . $entreprise, $texte, $pdf, $nom, $EXPEDITEUR, 'Questionnaire ' . $NOM_ENTREPRISE, $emailClient);
if (!$ok) { reponse(false, "Le serveur n'a pas pu envoyer l'e-mail", 500); }

// 2) Copie pour le client (limitée : plafond par jour + 2 copies max par adresse et par jour)
$copie = false;
if ($COPIE_CLIENT && $emailClient !== '' && compter('copies', $COPIE_MAX_PAR_JOUR) && compter('dest_' . strtolower($emailClient), 2)) {
    $texteClient = implode("\r\n", array(
        "Bonjour,",
        "",
        "Votre message a bien été envoyé : nous avons bien reçu votre questionnaire pour « " . $entreprise . " ».",
        "",
        "Vous trouverez en pièce jointe une copie de vos réponses (PDF).",
        "Notre équipe va l'étudier et reviendra vers vous rapidement avec une proposition adaptée.",
        "",
        "Cordialement,",
        $NOM_ENTREPRISE
    ));
    $copie = envoyer_mail($emailClient, 'Votre questionnaire a bien été envoyé - ' . $NOM_ENTREPRISE, $texteClient, $pdf, $nom, $EXPEDITEUR, $NOM_ENTREPRISE, $DESTINATAIRE);
}

// 3) Alerte WhatsApp pour vous (informations minimales : le détail est dans le PDF)
$whatsapp = null;
if ($whatsappPret) {
    $msg = "🔔 Nouveau questionnaire client\n"
         . "Entreprise : " . $entreprise . "\n"
         . "Responsable : " . $champ('responsable') . "\n"
         . "Tél : " . $champ('telephone') . "\n"
         . "Budget : " . $champ('budget') . "\n\n"
         . "Le PDF complet vient d'arriver par e-mail.";
    $whatsapp = (bool)notifier_whatsapp($WHATSAPP_URL, $WHATSAPP_NUMERO, $WHATSAPP_CLE, $msg);
}

reponse(true, null, 200, array('copie' => (bool)$copie, 'whatsapp' => $whatsapp));
