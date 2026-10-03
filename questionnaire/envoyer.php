<?php
/**
 * DST TECHNOLOGIE - Envoi du questionnaire client par e-mail (PDF en pièce jointe)
 *
 * À placer dans le MÊME dossier que index.html, sur votre hébergement.
 * Le formulaire (script.js) envoie ici le PDF ; ce fichier vous l'expédie par e-mail.
 */

// ====== À MODIFIER ======
$DESTINATAIRE = "infos@dsttechnologie.com"; // votre adresse e-mail pro : celle qui REÇOIT les questionnaires
$EXPEDITEUR   = "infos@dsttechnologie.com"; // une adresse de VOTRE nom de domaine (améliore la réception ;
                                            // vous pouvez mettre la même adresse que ci-dessus)
$OBJET        = "Nouveau questionnaire client";
$LIMITE       = 10;                         // nombre maximum d'envois par visiteur toutes les 10 minutes
$MAX_PAR_JOUR = 60;                         // nombre maximum d'envois par jour, tous visiteurs confondus
// ========================

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

function reponse($ok, $message = null, $code = 200) {
    http_response_code($code);
    $r = $ok ? array('ok' => true) : array('ok' => false, 'error' => $message);
    if ($ok && $message) { $r['message'] = $message; }
    echo json_encode($r, JSON_UNESCAPED_UNICODE);
    exit;
}

// Texte sur une seule ligne, sans caractères de contrôle (évite les injections dans les en-têtes)
function propre($s, $max = 200) {
    $s = trim(preg_replace('/[\x00-\x1F\x7F]+/', ' ', (string)$s));
    return function_exists('mb_substr') ? mb_substr($s, 0, $max, 'UTF-8') : substr($s, 0, $max);
}

// Sécurité : tant que l'adresse d'exemple n'est pas remplacée, rien n'est envoyé
if (strpos($DESTINATAIRE, 'votredomaine.com') !== false || !filter_var($DESTINATAIRE, FILTER_VALIDATE_EMAIL)) {
    reponse(false, "envoyer.php n'est pas configuré : remplacez l'adresse e-mail en haut du fichier", 500);
}

// Ouvrir envoyer.php dans un navigateur permet de vérifier que PHP fonctionne
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
if (strlen($brut) > 7000000) { reponse(false, 'Fichier trop volumineux', 413); }
$d = json_decode($brut, true);
if (!is_array($d) || empty($d['pdf']) || empty($d['entreprise'])) { reponse(false, 'Données incomplètes', 400); }

$pdf = base64_decode($d['pdf'], true);
if ($pdf === false || substr($pdf, 0, 5) !== '%PDF-') { reponse(false, 'PDF invalide', 400); }

$nom = preg_replace('/[^A-Za-z0-9._-]+/', '_', propre(isset($d['filename']) ? $d['filename'] : 'questionnaire.pdf', 120));
if (strtolower(substr($nom, -4)) !== '.pdf') { $nom .= '.pdf'; }

// Limite simple anti-abus : $LIMITE envois / 10 min par visiteur
$fichierLimite = sys_get_temp_dir() . '/dst_q_' . md5($_SERVER['REMOTE_ADDR'] ?? 'x');
$anciens = @file($fichierLimite, FILE_IGNORE_NEW_LINES);
$recents = array();
foreach (($anciens ? $anciens : array()) as $t) { if ((int)$t > time() - 600) { $recents[] = (int)$t; } }
if (count($recents) >= $LIMITE) { reponse(false, 'Trop de tentatives, réessayez dans quelques minutes', 429); }
$recents[] = time();
@file_put_contents($fichierLimite, implode("\n", $recents), LOCK_EX);
// Plafond journalier global (évite qu'un robot remplisse votre boîte mail)
$fichierJour = sys_get_temp_dir() . '/dst_q_total_' . date('Ymd');
$total = (int)@file_get_contents($fichierJour);
if ($total >= $MAX_PAR_JOUR) { reponse(false, 'Service momentanément saturé, réessayez demain', 429); }
@file_put_contents($fichierJour, (string)($total + 1), LOCK_EX);

// Construction de l'e-mail (texte + PDF en pièce jointe)
$entreprise = propre($d['entreprise'], 120);
$champ = function ($k) use ($d) { return isset($d[$k]) && $d[$k] !== '' ? propre($d[$k]) : '-'; };
$texte = implode("\r\n", array(
    "Un client vient de remplir le questionnaire.",
    "",
    "Entreprise : " . $entreprise,
    "Responsable : " . $champ('responsable'),
    "Téléphone / WhatsApp : " . $champ('telephone'),
    "Budget : " . $champ('budget'),
    "Délai : " . $champ('delai'),
    "",
    "Le questionnaire complet est en pièce jointe (PDF)."
));

$sujet = $OBJET . ' - ' . $entreprise;
$sujetEnc = function_exists('mb_encode_mimeheader')
    ? mb_encode_mimeheader($sujet, 'UTF-8', 'B', "\r\n")
    : '=?UTF-8?B?' . base64_encode($sujet) . '?=';

$sep = 'dst_' . md5(uniqid('', true));
$entetes = implode("\r\n", array(
    'From: =?UTF-8?B?' . base64_encode('Questionnaire DST Technologie') . '?= <' . propre($EXPEDITEUR) . '>',
    'MIME-Version: 1.0',
    'Content-Type: multipart/mixed; boundary="' . $sep . '"'
));
$corps  = "--$sep\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n"
        . chunk_split(base64_encode($texte)) . "\r\n";
$corps .= "--$sep\r\nContent-Type: application/pdf; name=\"$nom\"\r\nContent-Transfer-Encoding: base64\r\n"
        . "Content-Disposition: attachment; filename=\"$nom\"\r\n\r\n"
        . chunk_split(base64_encode($pdf)) . "\r\n--$sep--";

// Envoi (adresse d'expédition « enveloppe » d'abord, puis sans si l'hébergeur la refuse)
$ok = @mail($DESTINATAIRE, $sujetEnc, $corps, $entetes, '-f' . propre($EXPEDITEUR));
if (!$ok) { $ok = @mail($DESTINATAIRE, $sujetEnc, $corps, $entetes); }

if ($ok) { reponse(true); }
reponse(false, "Le serveur n'a pas pu envoyer l'e-mail", 500);
