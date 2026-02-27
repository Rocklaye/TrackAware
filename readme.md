#  TrackAware 
###### Extension Chrome de transparence et de suivi local - Soyez conscient du tracking de vos données

## 1. Présentation générale

TrackAware est une extension Chrome de prise de notes, conçue pour révéler les mécanismes invisibles de collecte de données utilisés dans de nombreux sites web et applications.

Elle fonctionne en apparence comme une simple extension de prise de notes.  
Cependant, en arrière-plan, TrackAware simule le comportement d’un système de tracking similaire à ceux utilisés dans :

- les bannières de cookies,
- les outils analytiques,
- les pixels de suivi,
- les SDK mobiles.

Elle offre :

- une interface simple pour ajouter, modifier et supprimer des notes,
- une bannière de consentement permettant de choisir quelles données peuvent être collectées,
- un dashboard complet pour visualiser les événements enregistrés, les filtrer, les exporter et les analyser.

🎯 Objectif pédagogique :  
Comprendre concrètement ce qui se passe lorsqu’un utilisateur interagit avec une interface numérique, et comment des données apparemment anodines peuvent être corrélées pour profiler un comportement.

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

Le but TrackAware est de `rendre visibles et compréhensibles des mécanismes de collecte ou d’exploitation de données qui sont habituellement invisibles pour l’utilisateur`.
Il repose sur un mécanisme central :
`l’écoute d’événements du navigateur Chrome, via l’API chrome.`. Ces événements sont captés par le service worker (background.js), qui agit comme un “capteur central” toujours prêt à enregistrer une action utilisateur.

Le projet répond aux exigences suivantes :

 ✔ Interface fonctionnelle  
 ✔ Journalisation claire des événements  
 ✔ Preuves visibles de collecte  
 ✔ Données locales uniquement  

---

## 3. Installation 
### 3.1. Prérequis

Un navigateur basé sur Chromium :
  ✔ Chrome
  ✔ Edge
  ✔ Brave
  ✔ Opera
  ✔ Vivaldi

Firefox et Safari ne sont pas compatibles (Manifest V3 non supporté).

### 3.2. Installation de TrackAware en mode développeur
Télécharger ou cloner le dépôt GitHub : `git clone https://github.com/Rocklaye/TrackAware.git`

- Ouvrir Chrome
- Aller à : chrome://extensions
- Activer Mode développeur (coin supérieur droit)
- Cliquer sur Charger l’extension non empaquetée
- Sélectionner le dossier du projet

TrackAware demarre et apparaît dans la barre d’extension 

---

## 4. Structure de l’extension

Voici un aperçu de l’interface TrackAware :
   
   ![Images](https://github.com/Rocklaye/TrackAware/blob/main/images/TrackAware.png)

TrackAware est composée de trois vues principales :

### 4.1. Vue Popup - Prise de notes
Accessible en cliquant sur l’icône de l’extension.

Fonctionnalités :
- Ajouter une note
- Modifier une note
- Supprimer une note
- Stockage local automatique

Cette vue simule une application `normale` que l’utilisateur pourrait utiliser au quotidien.


### 4.2. Vue Consentement - Préférences de confidentialité
Lors de la première installation, l’utilisateur doit choisir :

- Accepter
- Refuser
- Personnaliser les préférences

Par défaut : `Refusé`
L’extension ne collecte que le strict minimum pour fonctionner :
 
 | Donnée	     |    Description                        |
 |---------------|---------------------------------------|
 |` visitor_id ` |	Identifiant unique généré une fois   |
 |` session_id`  |	Identifiant de session               |
 |` timestamp  ` |	Horodatage des événements            | 

Aucun tracking n’est actif tant que l’utilisateur n’a pas donné son consentement.
L'utilisateur peut modifier ces préférences en cliquant sur le bouton `Confidentialité` dans le popup de l'extension.

### 🔸Préférences de confidentialité

| Préférence     | Ce qui est collecté                      | Exemple d’événement     |
|----------------|------------------------------------------|-------------------------|
| URL            | Domaine, protocole, chemin               | `DOMAIN_VISIT`          |
| Onglet         | Changement d’onglet                      | `TAB_SWITCH`            |
| Nb Onglets     | Nombre total d’onglets                   | `TAB_COUNT`             |
| Activité       | Idle / Active / Locked                   | `USER_BECAME_IDLE`      |
| Période        | Ouverture / fermeture extension          | `EXTENSION_OPEN`        |
| Notes          | Ajout / suppression de note              | `NOTE_ADD`              |
| Temps          | Durée passée par domaine                 | `TIME_SPENT`            |


Chaque case cochée active un module dans le service worker.

### 4.3. Vue Dashboard - Visualisation des données
Le dashboard contient deux onglets principaux :

#### 1. Logs détaillés
- Liste complète des événements
- Filtrage par catégorie
- Recherche
- Affichage des détails (device info, horodatage, identifiants)
- Effacement des logs
- Exportation en JSON

#### 2. Diagrammes
Visualisations générées avec Chart.js :

- Histogrammes
- Graphiques circulaires
- Graphiques temporels
- Répartition des événements

Les graphiques s’adaptent aux préférences activées.

---
## 5. Types de diagrammes disponibles

Le dashboard propose quatre visualisations principales, générées avec Chart.js.  
Elles permettent d’analyser les logs sous différents angles et de comprendre comment les actions de l’utilisateur influencent la collecte locale.

### 📊 1. Histogramme - Répartition des événements
Affiche le `nombre d’événements par catégorie` (`DOMAIN_VISIT`, `TAB_SWITCH`, `NOTE_ADD`, etc.).  
Permet d’identifier quels modules génèrent le plus de logs et d’observer l’impact des préférences de confidentialité.

### 🥧 2. Diagramme circulaire - Proportions des événements
Montre la `proportion de chaque type d’événement` dans l’ensemble des logs.  
Idéal pour visualiser la distribution globale et repérer les catégories dominantes.

### 📈 3. Courbe temporelle - Évolution dans le temps
Affiche les événements dans `l’ordre chronologique`.  
Permet d’observer les périodes d’activité, les séquences d’actions et les comportements dans le temps.

### 🗂️ 4. Diagramme par domaine - Regroupement par site
Regroupe les événements par `domaine` (ex : youtube.com, wikipedia.org).  
Utile pour analyser les sites les plus visités ou les plus actifs.

### 🌡️ 5. Heatmap - Intensité d’activité dans le temps 
Affiche une `carte de chaleur` représentant l’intensité des événements en fonction du temps (par exemple par heure et par jour). Permet de visualiser rapidement les périodes les plus actives et de repérer des patterns d’usage (heures de pointe, moments d’inactivité, etc.).

#### 🔄 Rafraîchissement du Dashboard
Le dashboard se met automatiquement à jour toutes les **10 secondes**.  
Pour forcer une actualisation immédiate (par exemple après avoir modifié les préférences), il suffit de **rafraîchir la page du dashboard**.

---

## 6. Données collectées


| Catégorie      | Exemple                           | Description                                      |
|----------------|-----------------------------------|--------------------------------------------------|
| Identifiants   | `visitor_id`, `session_id`        | Identifiants persistants générés localement      |
| Navigation     | `domaine`, `url` , `protocole`,   | Détection des pages visitées                     |
| Onglets        | `tab_id`, `window_id`, `nombre`   | Suivi des changements d’onglets                  |
| Activité       | `active` / `idle` / `locked`      | Détection de l’inactivité                        |
| Période        | `ouverture`, `fermeture extension`| Usage de l’extension                             |
| Notes          | `ajout`, `suppression`            | Actions dans la popup                            |
| Temps          | `durée par domaine `              | Temps effectue dans une pages                    |

Toutes les données sont :

- locales,
- consultables via le dashboard.

---

## 7. Implications et risques
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

---

## 8. Limites de la démonstration
- Limite aux navigateurs de type chromium
- Pas de serveur distant
- Pas de cookies tiers
- Pas de fingerprinting
- Pas de corrélation multi‑appareils
- Pas d’analyse statistique avancée
- 

L’objectif étant pédagogique, nous avons mis en évidence le menu Dashboard afin de faciliter la visualisation des logs et des données collectées.
Dans un environnement réel, ces informations ne sont pas visibles par l’utilisateur.

### 🔸Données non collectées

- Aucun mot de passe
- Aucune donnée personnelle
- Aucun cookie tiers
- Aucun transfert réseau
- Aucun fingerprinting avancé

---

## 9. Correction / Atténuation proposée contre le système de tracking
TrackAware met en évidence la quantité d’informations comportementales qu’une extension navigateur peut collecter via ses API internes. Pour réduire les risques de profilage, de surveillance ou d’abus, plusieurs mesures techniques peuvent être envisagées au niveau du navigateur ou du système d’extensions.

- Réduire la précision des données exposées : arrondir les timestamps, anonymiser les domaines, donner des plages d’onglets plutôt que des valeurs exactes.

- Ajouter un mode “vie privée renforcée” : désactiver automatiquement les API sensibles (changement d’onglet, activité, URL, comptage des onglets).

- Exiger un consentement explicite pour chaque API sensible : demander des permissions claires avant d’autoriser l’accès aux événements du navigateur.

- Limiter la corrélation entre plusieurs sources de données : empêcher une extension de combiner URL + activité + temps + onglets pour reconstruire un profil complet.

- Anonymiser automatiquement certaines données : hash des domaines, suppression des identifiants uniques, arrondi des durées.

- Détecter les extensions “trop curieuses” : analyser leur comportement et avertir l’utilisateur si elles collectent trop d’événements sensibles.

---

##  10. Scénarios reproductibles

### 🔸 Scénario 1 - Consentement

1. Installer l’extension  
2. Cliquer sur  `Refuser` 
3. Observer les logs  
4. Activer une ou plusieurs préférences cliquer sur  `Accepter` 
5. Comparer les événements

---

### 🔸 Scénario 2 - Navigation

1. Activer `Domaines visités` dans le menu de Confidentialité
2. Ouvrir plusieurs sites  
3. Changer d’onglets  
4. Ouvrir le dashboard  
5. Observer les logs `DOMAIN_VISIT` , `TAB_SWITCH` , `TAB_COUNT`

--- 

### 🔸 Scénario 3 - Notes

1. Cocher `Ouverture / fermeture de l’extension` et `Ajout / suppression de notes` dans les preferences de Confidentialité
2. Ouvrir l’extension  
3. Ajouter une note  
3. Supprimer une note  
4. Fermer l’extension  
5. Observer les logs dans le dashboard  `PERIODE - EXTENSION_OPEN` , `AJOUT_SUPP - NOTE_ADD` , `AJOUT_SUPP - NOTE_DELETE`

---
### 🔸 Scénario 4 - Tout accepter

1. Cocher toutes les case dans la page de preferences de Confidentialité
2. Ouvrir l’extension  
3. Naviguer sur internet (ouvrez plusieurs pages web)
4. Ajouter / Supprimer une note
6. Generer un maximum de logs
7. Observer l'ensemble des événements
8. Utiliser les filtres et diagrammes du dashboard

---

### 🔸 Scénario 5 - Activité

1. Cocher `Activité / inactivité utilisateur` et `Domaines visités` dans les preferences de Confidentialité
2. Ouvrir l’extension  
3. Ouvrir un site  
4. Rester inactif 1 minute dans le même site 
5. Revenir  
6. Observer les événements  

Résultat :
- `DOMAIN_VISIT`
- `USER_BECAME_IDLE`
- `USER_RETURNED_ACTIVE`

---
##   Conclusion

TrackAware démontre que :

- le suivi utilisateur est techniquement simple,
- peu de données suffisent pour profiler,
- le stockage local peut devenir un mécanisme persistant,
- le consentement modifie la logique de collecte.
Comprendre ces mécanismes est essentiel pour mieux protéger la vie privée.

###### TrackAware - Soyez conscient du tracking de vos données
