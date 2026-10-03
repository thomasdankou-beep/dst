# DST Technologie — site vitrine

Site vitrine (accueil, services, réalisations, contact & devis) et questionnaire client.

## Contenu du dossier

| Fichier / dossier | Rôle |
|---|---|
| `index.html` | Le site : styles et contenu (les textes sont dans `<template id="tpl">`). |
| `app.js` | Les données (services, secteurs, budgets…), le formulaire de devis, la démo interactive et le petit moteur qui affiche la page. |
| `assets/logo-dst-technologie.png` | Le logo. |
| `assets/images/` | Les photos du site (auteurs et licences dans `CREDITS.txt`). |
| `demos/` | Les 4 démos interactives (`salon.html`, `boutique.html`, `restaurant.html`, `gestion.html` = stock, rendez-vous, caisse et admin), liées depuis la page Réalisations. Styles communs : `demo.css`, `demo.js`. Tout y est fictif. |
| `demos/location/` | Démo complète d'une agence de location de véhicules : recherche par dates, prix calculé (remises, chauffeur, options, caution), fiche véhicule avec calendrier, réservation, WhatsApp et espace gérant (tableau de bord, planning, réservations, flotte, clients, tarifs). L'espace gérant est à `#/admin`. |
| `demos/perruques/` | Démo complète d'une boutique de perruques (accueil, boutique, filtres, fiche produit, panier, commande, WhatsApp, rendez-vous, espace admin). Ouvrir `demos/perruques/index.html` ; l'admin est à `#/admin`. Données fictives conservées dans le navigateur (bouton « Réinitialiser » dans Admin > Paramètres). |
| `.htaccess` | Réglages du serveur : en-têtes de sécurité, blocage des fichiers internes (README, .git…), page 404, cache et compression. |
| `404.html` | Page affichée quand une adresse n'existe pas. |
| `robots.txt`, `sitemap.xml` | Indications pour Google. |
| `questionnaire/` | Le questionnaire client envoyé par e-mail (PHP) — voir `questionnaire/LISEZ-MOI.txt`. |

## Voir le site sur votre ordinateur

```bash
python3 -m http.server 8080
```

Puis ouvrez `http://localhost:8080/index.html`.

## Modifier le site

- **Un texte** : faites Ctrl+F dans `index.html`, puis modifiez-le.
- **Services, secteurs, budgets, délais, questions du devis** : en haut de `app.js`.
- **Prix promotionnel d'un site vitrine** : `PRICE_WEB` et sa date de fin `PRICE_WEB_UNTIL` en haut de `app.js` (affiché sur la carte du service et sur la page Services).
- **Numéro WhatsApp** : `WA_NUM` en haut de `app.js`, et les liens `wa.me` dans `index.html`.
- **Présentation des services** : `OPTIONS.servicesLayout` dans `app.js` (`'Grille'` = cartes illustrées, `'Onglets'` = liste à onglets).
- **Après avoir modifié `app.js`** : changez le texte qui suit `app.js?v=` dans `index.html` (n'importe quelle nouvelle valeur). Sinon les navigateurs gardent l'ancienne version du script en mémoire et le site se comporte mal.
- **Une photo** : remplacez le fichier dans `assets/images/` en gardant exactement le même nom, puis augmentez `IMG_V` en haut de `app.js` (et le même numéro dans la ligne `preload` de `index.html`).
- **Les démos présentées sur l'accueil** : liste `DEMOS` en haut de `app.js`.
- **La page Confidentialité** : texte dans `index.html` (cherchez « Confidentialité »). Vérifiez qu'il correspond à votre façon de travailler.

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

## Sécurité

- `.htaccess` ajoute les protections courantes (anti-clic piégé, anti-reniflage de type, politique de sécurité du contenu, HTTPS strict) et bloque l'accès aux fichiers internes comme `README.md` ou `LISEZ-MOI.txt`. Si votre hébergement avait déjà un `.htaccess`, gardez aussi ses lignes.
- `devis.php` refuse les envois venant d'un autre site, les envois trop rapides (robots), applique une limite par visiteur et un plafond par jour.
- `questionnaire/envoyer.php` applique aussi une limite par visiteur et un plafond par jour.
