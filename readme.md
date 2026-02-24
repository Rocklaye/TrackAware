#  TrackAware - Extension Chrome de transparence et de suivi local

## 1. Présentation générale

TrackAware est une extension Chrome de prise de notes, conçue pour révéler les mécanismes invisibles de collecte de données utilisés dans de nombreux sites web et applications.

Elle fonctionne en apparence comme une simple extension de prise de notes.  
Cependant, en arrière-plan, elle simule le comportement d’un système de tracking similaire à ceux utilisés dans :

- les bannières de cookies,
- les outils analytiques,
- les pixels de suivi,
- les SDK mobiles.

Elle offre :

- une interface simple pour ajouter, modifier et supprimer des notes,
- une bannière de consentement permettant de choisir quelles données peuvent être collectées,
- un dashboard complet pour visualiser les événements enregistrés, les filtrer, les exporter et les analyser.

🎯 Objectif pédagogique :  
Montrer concrètement ce qui se passe lorsqu’un utilisateur interagit avec une interface numérique, et comment des données apparemment anodines peuvent être collectées, corrélées et persistées.

L’objectif n’est pas de surveiller l’utilisateur, mais de démontrer concrètement :

- quelles données peuvent être collectées,
- à quel moment elles le sont,
- comment elles sont structurées,
- et ce qu’elles permettent d’inférer.

🔒 Aucune donnée n’est envoyée vers un serveur externe.  
Tout est stocké localement dans votre navigateur.
---

## 2. Objectif du projet

Le web moderne déclenche des mécanismes de suivi à partir d’actions simples :

- accepter ou refuser un consentement,
- charger une page,
- changer d’onglet,
- rester inactif,
- ouvrir ou fermer une extension.

TrackAware expose ces événements en les rendant :

- visibles,
- horodatés,
- catégorisés,
- comparables.

L’extension permet de répondre à la question centrale du projet :
 `« Qu’est‑ce qui se passe exactement quand une action a lieu ? »`

Le projet répond aux exigences suivantes :

✔ Interface fonctionnelle  
✔ Journalisation claire des événements  
✔ Preuves visibles de collecte  
✔ Données locales uniquement  

---

## 3. Installation (détaillée)
### 3.1. Prérequis

Un navigateur basé sur Chromium :
✔ Chrome
✔ Edge
✔ Brave
✔ Opera
✔ Vivaldi

Firefox et Safari ne sont pas compatibles (Manifest V3 non supporté).

### 3.2. Installation en mode développeur
Télécharger ou cloner le dépôt GitHub :

`git clone https://github.com/Rocklaye/TrackAware.git`

- Ouvrir Chrome
- Aller à : chrome://extensions
- Activer Mode développeur (coin supérieur droit)
- Cliquer sur Charger l’extension non empaquetée
- Sélectionner le dossier du projet

TrackAware demarre et apparaît dans la barre d’extension 


## 4. Structure de l’extension
![1](https://github.com/Rocklaye/TrackAware/images/TrackAware.png)
TrackAware est composée de trois vues principales :

### 4.1. Vue Popup - Prise de notes
Accessible en cliquant sur l’icône de l’extension.

Fonctionnalités :
- Ajouter une note
- Modifier une note
- Supprimer une note
- Stockage local automatique

Cette vue simule une application “normale” que l’utilisateur pourrait utiliser au quotidien.

### 4.2. Vue Consentement — Préférences de confidentialité
Lors de la première installation, l’utilisateur doit choisir :

- Accepter
- Refuser
- Personnaliser les préférences

Par défaut : Refusé
L’extension ne collecte que le strict minimum pour fonctionner :
Donnée	Description
visitor_id	Identifiant unique généré une fois
session_id	Identifiant de session
timestamp	Horodatage des événements

Aucun tracking n’est actif tant que l’utilisateur n’a pas donné son consentement.


Préférence	Ce qui est collecté	Exemple d’événement
URL	Domaine, protocole, chemin	DOMAIN_VISIT
Onglet	Changement d’onglet	TAB_SWITCH
Nb Onglets	Nombre total d’onglets	TAB_COUNT
Activité	Idle / Active / Locked	USER_BECAME_IDLE
Période	Ouverture/fermeture extension	EXTENSION_OPEN
Notes	Ajout/suppression note	NOTE_ADD / NOTE_DELETE
Temps (désactivé)	Durée passée par domaine	TIME_SPENT

Chaque case cochée active un module dans le service worker.

### 4.3. Vue Dashboard — Visualisation des données
Le dashboard contient deux onglets principaux :

#### 🔹 1. Logs détaillés
- Liste complète des événements
- Filtrage par catégorie
- Recherche
- Affichage des détails (device info, horodatage, identifiants)
- Effacement des logs
- Exportation en JSON

#### 🔹 2. Diagrammes
Visualisations générées avec Chart.js :

- Histogrammes
- Graphiques circulaires
- Graphiques temporels
- Répartition des événements

Les graphiques s’adaptent aux préférences activées.

## 5. Données collectées (tableau complet)


Catégorie	Exemple	Description
Identifiants	visitor_id, session_id	Permettent de distinguer sessions et visiteurs
Navigation (URL)	domaine, protocole, chemin	Détecte les pages visitées
Onglets	tab_id, window_id	Identifie les changements d’onglet
Nb Onglets	nombre total	Permet de suivre l’activité multi‑onglets
Activité	active / idle / locked	Détecte l’inactivité ou le retour
Période (Extension)	ouverture, fermeture	Mesure l’usage de l’extension
Notes	ajout, suppression	Actions dans la popup
Temps (désactivé)	durée par domaine	Temps passé sur un site

Toutes les données sont :

- locales,
- consultables via le dashboard.

## 6. Implications et risques
Même sans données sensibles, il est possible de :

- Reconstituer des habitudes horaires
- Identifier des domaines récurrents
- Mesurer la fréquence d’utilisation
- Corréler navigation et activité
- Déduire des comportements récurrents

Cela démontre que le profilage repose principalement sur la corrélation temporelle.

TrackAware montre comment :

- un identifiant persistant,
- des logs d’activité,
- des événements de navigation,

peuvent suffire à déduire des comportements réels.

## 7. Limites de la démonstration
- Limite au navigateur de type chromium
- Pas de serveur distant
- Pas de cookies tiers
- Pas de fingerprinting
- Pas de corrélation multi‑appareils
- Pas d’analyse statistique avancée

L’objectif est pédagogique, pas industriel.

## Données non collectées

- Aucun mot de passe
- Aucune donnée personnelle
- Aucun cookie tiers
- Aucun transfert réseau
- Aucun fingerprinting avancé

---

#  8. Scénarios reproductibles

## 🔸 Scénario 1 - Consentement

1. Installer l’extension  
2. Cliquer sur « Refuser »  
3. Observer les logs  
4. Cliquer sur « Accepter »  
5. Comparer les événements générés  

Résultat : différence claire et observable.

---

## 🔸 Scénario 2 - Navigation

1. Cocher `Domaines visités` dans les preferences de confidentialite
2. Ouvrir plusieurs sites  
3. Changer d’onglets  
4. Ouvrir le dashboard  
5. Observer les logs `DOMAIN_VISIT` , `TAB_SWITCH` , `TAB_COUNT`  dans le dashboard

## 🔸 Scénario 3 - Extension

1. Cocher `Ouverture / fermeture de l’extension` et `Ajout / suppression de notes` dans les preferences de confidentialite
2. Ouvrir l’extension  
3. Ajouter une note  
3. Supprimer une note  
4. Fermer l’extension  
5. Observer les logs dans le dashboard  `PERIODE - EXTENSION_OPEN` , `AJOUT_SUPP - NOTE_ADD` , `AJOUT_SUPP - NOTE_DELETE`

---

## 🔸 Scénario 4 - Activité

1. Cocher `Activité / inactivité utilisateur` et `Domaines visités` dans les preferences de confidentialite
2. Ouvrir l’extension  
3. Ouvrir un site  
4. Rester inactif 1 minute dans le meme site 
5. Revenir  
6. Observer les événements  

Résultat :
- `DOMAIN_VISIT`
- `USER_BECAME_IDLE`
- `USER_RETURNED_ACTIVE`

---
# 11. Conclusion

TrackAware démontre que :

- le suivi utilisateur est techniquement simple,
- peu de données suffisent pour profiler,
- le stockage local peut devenir un mécanisme persistant,
- le consentement modifie la logique de collecte.
Comprendre ces mécanismes est essentiel pour mieux protéger la vie privée.
