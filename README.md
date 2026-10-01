# DST Technologie — site vitrine

Site vitrine (accueil, services, réalisations, contact & devis) et questionnaire client.

## Contenu du dossier

| Fichier / dossier | Rôle |
|---|---|
| `index.html` | Le site : styles et contenu (les textes sont dans `<template id="tpl">`). |
| `app.js` | Les données (services, secteurs, budgets…), le formulaire de devis, la démo interactive et le petit moteur qui affiche la page. |
| `assets/logo-dst-technologie.png` | Le logo. |
| `assets/images/` | Les photos du site (auteurs et licences dans `CREDITS.txt`). |
| `questionnaire/` | Le questionnaire client envoyé par e-mail (PHP) — voir `questionnaire/LISEZ-MOI.txt`. |

## Voir le site sur votre ordinateur

```bash
python3 -m http.server 8080
```

Puis ouvrez `http://localhost:8080/index.html`.

## Modifier le site

- **Un texte** : faites Ctrl+F dans `index.html`, puis modifiez-le.
- **Services, secteurs, budgets, délais, questions du devis** : en haut de `app.js`.
- **Prix promotionnel d'un site vitrine** : `PRICE_WEB` en haut de `app.js` (affiché sur la carte du service et sur la page Services).
- **Numéro WhatsApp** : `WA_NUM` en haut de `app.js`, et les liens `wa.me` dans `index.html`.
- **Présentation des services** : `OPTIONS.servicesLayout` dans `app.js` (`'Grille'` = cartes illustrées, `'Onglets'` = liste à onglets).
- **Après avoir modifié `app.js`** : changez le texte qui suit `app.js?v=` dans `index.html` (n'importe quelle nouvelle valeur). Sinon les navigateurs gardent l'ancienne version du script en mémoire et le site se comporte mal.
- **Une photo** : remplacez le fichier dans `assets/images/` en gardant exactement le même nom.

| Fichier | Où il s'affiche |
|---|---|
| `hero-banner.jpg` | Photo de la bannière d'accueil |
| `demo-product.jpg` | Produit dans le téléphone de la démo |
| `real-salon.jpg`, `real-perruques.jpg`, `real-restaurant.jpg`, `real-evenementiel.jpg`, `real-boutique.jpg` | Les réalisations |
| `closing-photo.jpg` | Photo de l'appel à l'action en bas de page |

Formats acceptés : `.jpg`, `.png`, `.webp`. Visez moins de 300 Ko par photo.

## Exemples fictifs

La démo du téléphone, la conversation WhatsApp et les cartes sur les photos des réalisations sont des **exemples illustratifs** : les noms (Awa Hair, Aïcha K.) et les montants sont inventés.

## Mise en ligne

Envoyez tout le dossier sur votre hébergement.

À la fin du formulaire de devis, le client choisit : **WhatsApp**, **e-mail** ou **appel**.

- **E-mail** : `devis.php` (à la racine, à côté de `index.html`) envoie la demande à `infos@dsttechnologie.com` et, si le client a donné son e-mail, une confirmation. Il faut un hébergement avec **PHP** ; l'adresse se change en haut de `devis.php`. Vérification : ouvrez `https://votresite.com/devis.php`, vous devez voir « Service actif ».
- **Sans PHP** (ou si le serveur n'arrive pas à envoyer) : le site propose d'ouvrir l'application e-mail du client avec le message déjà rédigé.
- Le dossier `questionnaire/` a aussi besoin de PHP (voir son `LISEZ-MOI.txt`).
