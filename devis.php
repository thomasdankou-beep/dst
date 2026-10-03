<?php
/**
 * DST TECHNOLOGIE - Réception d'une demande de devis envoyée par e-mail depuis le site.
 *  1. vous envoie le récapitulatif (le bouton « Répondre » écrit directement au client s'il a donné son e-mail)
 *  2. (option) envoie une confirmation au client
 *
 * À placer dans le MÊME dossier que index.html, sur un hébergement avec PHP.
 * Sans PHP, le site ouvre à la place l'application e-mail du client avec le message déjà rédigé.
 */

// ====== À MODIFIER ======
$DESTINATAIRE = "infos@dsttechnologie.com"; // l'adresse qui REÇOIT les demandes de devis
$EXPEDITEUR   = "infos@dsttechnologie.com"; // une adresse de VOTRE nom de domaine (peut être la même)
$NOM_ENTREPRISE = "DST TECHNOLOGIE";        // nom affiché dans le message envoyé au client
$COPIE_CLIENT = true;                       // true = le client reçoit une confirmation s'il a donné son e-mail
$COPIE_MAX_PAR_JOUR = 50;                   // plafond de confirmations par jour (protection anti-abus)
$LIMITE = 5;                                // demandes maximum par visiteur toutes les 10 minutes
$MAX_PAR_JOUR = 150;                        // demandes maximum par jour, tous visiteurs confondus (anti-robot)
// ========================

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

function reponse($ok, $message = null, $code = 200, $extra = array()) {
    http_response_code($code);
    $r = $ok ? array('ok' => true) : array('ok' => false, 'error' => $message);
    if ($ok && $message) { $r['message'] = $message; }
    echo json_encode(array_merge($r, $extra), JSON_UNESCAPED_UNICODE);
    exit;
}

// Texte sur une seule ligne, sans caractères de contrôle (évite les injections dans les en-têtes)
function propre($s, $max = 300) {
    $s = trim(preg_replace('/[\x00-\x1F\x7F]+/', ' ', (string)$s));
    return function_exists('mb_substr') ? mb_substr($s, 0, $max, 'UTF-8') : substr($s, 0, $max);
}

// Compteurs simples (fichiers temporaires du serveur) pour limiter les abus
function compter($cle, $max) {
    $f = sys_get_temp_dir() . '/dst_d_' . md5($cle) . '_' . date('Ymd');
    $n = (int)@file_get_contents($f);
    if ($n >= $max) { return false; }
    @file_put_contents($f, (string)($n + 1), LOCK_EX);
    return true;
}

// Envoie un e-mail texte UTF-8
function envoyer_mail($a, $sujet, $texte, $expediteur, $nomExpediteur, $repondreA = '') {
    $sujetEnc = function_exists('mb_encode_mimeheader')
        ? mb_encode_mimeheader($sujet, 'UTF-8', 'B', "\r\n")
        : '=?UTF-8?B?' . base64_encode($sujet) . '?=';
    $h = array(
        'From: =?UTF-8?B?' . base64_encode($nomExpediteur) . '?= <' . propre($expediteur) . '>',
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=UTF-8',
        'Content-Transfer-Encoding: base64'
    );
    if ($repondreA !== '') { $h[] = 'Reply-To: ' . $repondreA; }
    $entetes = implode("\r\n", $h);
    $corps = chunk_split(base64_encode($texte));
    // Adresse d'expédition « enveloppe » d'abord, puis sans si l'hébergeur la refuse
    $ok = @mail($a, $sujetEnc, $corps, $entetes, '-f' . propre($expediteur));
    if (!$ok) { $ok = @mail($a, $sujetEnc, $corps, $entetes); }
    return $ok;
}

// Sécurité : tant que l'adresse d'exemple n'est pas remplacée, rien n'est envoyé
if (strpos($DESTINATAIRE, 'votredomaine.com') !== false || !filter_var($DESTINATAIRE, FILTER_VALIDATE_EMAIL)) {
    reponse(false, "devis.php n'est pas configuré : remplacez l'adresse e-mail en haut du fichier", 500);
}

// Ouvrir devis.php dans un navigateur permet de vérifier que PHP fonctionne
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'GET') { reponse(true, 'Service actif'); }
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') { reponse(false, 'Méthode non autorisée', 405); }

// Refuse les requêtes venant d'un autre site
if (!empty($_SERVER['HTTP_ORIGIN'])) {
    $hoteOrigine = parse_url($_SERVER['HTTP_ORIGIN'], PHP_URL_HOST);
    $monHote = preg_replace('/:\d+$/', '', $_SERVER['HTTP_HOST'] ?? '');
    if ($hoteOrigine && strcasecmp($hoteOrigine, $monHote) !== 0) { reponse(false, 'Origine non autorisée', 403); }
}

// Lecture et contrôle des données
$brut = file_get_contents('php://input');
if (strlen($brut) > 50000) { reponse(false, 'Message trop volumineux', 413); }
$d = json_decode($brut, true);
if (!is_array($d) || empty($d['rows']) || !is_array($d['rows'])) { reponse(false, 'Données incomplètes', 400); }

// Anti-robot : champ caché qui doit rester vide, et formulaire rempli en plus de 3 secondes
if (!empty($d['site_web'])) { reponse(true); }               // robot : on fait semblant d'accepter, rien n'est envoyé
if (!isset($d['dt']) || (int)$d['dt'] < 3) { reponse(false, 'Envoi trop rapide, réessayez', 400); }

$nom = propre($d['nom'] ?? '', 120);
$tel = propre($d['telephone'] ?? '', 40);
$email = propre($d['email'] ?? '', 120);
if (strlen($nom) < 2 || strlen(preg_replace('/\D/', '', $tel)) < 8) { reponse(false, 'Nom ou téléphone manquant', 400); }
if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) { $email = ''; }

// Limite simple anti-abus : $LIMITE demandes / 10 min par visiteur
$fichierLimite = sys_get_temp_dir() . '/dst_dq_' . md5($_SERVER['REMOTE_ADDR'] ?? 'x');
$anciens = @file($fichierLimite, FILE_IGNORE_NEW_LINES);
$recents = array();
foreach (($anciens ? $anciens : array()) as $t) { if ((int)$t > time() - 600) { $recents[] = (int)$t; } }
if (count($recents) >= $LIMITE) { reponse(false, 'Trop de tentatives, réessayez dans quelques minutes', 429); }
$recents[] = time();
@file_put_contents($fichierLimite, implode("\n", $recents), LOCK_EX);
if (!compter('total', $MAX_PAR_JOUR)) { reponse(false, 'Service momentanément saturé, contactez-nous sur WhatsApp', 429); }

// Récapitulatif (50 lignes maximum)
$lignes = array();
foreach (array_slice($d['rows'], 0, 50) as $r) {
    if (!is_array($r) || !isset($r['k'], $r['v'])) { continue; }
    $k = propre($r['k'], 60); $v = propre($r['v'], 600);
    if ($k !== '' && $v !== '') { $lignes[] = $k . ' : ' . $v; }
}
if (!$lignes) { reponse(false, 'Données incomplètes', 400); }

// 1) E-mail pour vous
$texte = "Nouvelle demande de devis reçue depuis le site.\r\n\r\n" . implode("\r\n", $lignes) . "\r\n";
$ok = envoyer_mail($DESTINATAIRE, 'Nouvelle demande de devis - ' . $nom, $texte, $EXPEDITEUR, 'Devis ' . $NOM_ENTREPRISE, $email);
if (!$ok) { reponse(false, "Le serveur n'a pas pu envoyer l'e-mail", 500); }

// 2) Confirmation pour le client (limitée : plafond par jour + 2 par adresse et par jour)
$copie = false;
if ($COPIE_CLIENT && $email !== '' && compter('copies', $COPIE_MAX_PAR_JOUR) && compter('dest_' . strtolower($email), 2)) {
    $texteClient = "Bonjour " . $nom . ",\r\n\r\n"
        . "Votre demande de devis a bien été envoyée : nous l'avons bien reçue.\r\n"
        . "Un conseiller va l'étudier et revenir vers vous rapidement avec une proposition adaptée.\r\n\r\n"
        . "Récapitulatif :\r\n" . implode("\r\n", $lignes) . "\r\n\r\n"
        . "Cordialement,\r\n" . $NOM_ENTREPRISE . "\r\n";
    $copie = envoyer_mail($email, 'Votre demande de devis - ' . $NOM_ENTREPRISE, $texteClient, $EXPEDITEUR, $NOM_ENTREPRISE, $DESTINATAIRE);
}

reponse(true, null, 200, array('copie' => (bool)$copie));
