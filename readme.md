#  TrackAware - Extension Chrome de transparence et de suivi local

##  Présentation générale

TrackAware est une extension Chrome pédagogique conçue pour rendre visibles des mécanismes de collecte de données habituellement invisibles pour l’utilisateur.

Elle fonctionne comme une simple extension de prise de notes.  
Cependant, en arrière-plan, elle simule le comportement d’un système de tracking similaire à ceux utilisés dans :

- les bannières de cookies,
- les outils analytiques,
- les pixels de suivi,
- les SDK mobiles.

L’objectif n’est pas de surveiller l’utilisateur, mais de démontrer concrètement :

- quelles données peuvent être collectées,
- à quel moment elles le sont,
- comment elles sont structurées,
- et ce qu’elles permettent d’inférer.

Toutes les données sont stockées localement.  
Aucune information n’est envoyée vers un serveur externe.

---

#  1. Objectif du projet

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

Le projet répond aux exigences suivantes :

✔ Interface fonctionnelle  
✔ Journalisation claire des événements  
✔ Preuves visibles de collecte  
✔ Données locales uniquement  
✔ Code original  

---

# 4.1 Démonstration fonctionnelle

L’application permet d’observer :

- une interface utilisateur (popup + dashboard),
- des logs structurés et horodatés,
- des identifiants générés,
- l’état du consentement,
- des événements de navigation,
- des événements d’activité,
- des événements liés à l’extension.

Chaque événement contient :

- un type normalisé (ex : DOMAIN_VISIT, TAB_SWITCH),
- un timestamp clair,
- des métadonnées associées,
- un stockage local persistant.

Les logs sont lisibles et organisés (pas de JSON brut illisible).

---

#  2. Mécanisme étudié

TrackAware simule un système de consentement et un mécanisme de suivi local inspiré des trackers réels.

Le modèle repose sur :

1. Génération d’identifiants persistants
2. Journalisation des interactions
3. Corrélation temporelle
4. Stockage local durable

Ce fonctionnement reproduit les principes fondamentaux du tracking comportemental.

---

#  3. Fonctionnement général

## 🔹 Consentement

- Acceptation / refus
- Activation / désactivation des préférences
- Génération de visitor_id
- Création de session_id

Différence observable entre scénario accepté et refusé.

---

## 🔹 Navigation

- Domaine visité
- Protocole
- Chemin
- Changement d’onglet
- Nombre total d’onglets ouverts

Types d’événements :
- DOMAIN_VISIT
- TAB_SWITCH
- TAB_COUNT

---

## 🔹 Activité utilisateur

- USER_BECAME_IDLE
- USER_RETURNED_ACTIVE
- Détection d’inactivité

---

## 🔹 Extension

- EXTENSION_OPEN
- EXTENSION_CLOSE
- NOTE_ADD
- NOTE_DELETE

---

#  4. Données collectées

## Données enregistrées

| Catégorie | Exemple |
|------------|----------|
| Identifiants | visitor_id, session_id |
| Navigation | domaine, protocole, chemin |
| Onglets | tab_id, window_id, nombre |
| Activité | état, durée |
| Extension | ouverture, fermeture |
| Notes | ajout, suppression |

Toutes les données sont :

- locales,
- non sensibles,
- consultables via le dashboard.

---

## Données non collectées

- Aucun mot de passe
- Aucune donnée personnelle
- Aucun cookie tiers
- Aucun transfert réseau
- Aucun fingerprinting avancé

---

#  5. Implications et risques

TrackAware démontre qu’il n’est pas nécessaire de collecter des données sensibles pour profiler un utilisateur.

À partir des logs, il est possible de :

- identifier des habitudes horaires,
- détecter des sites récurrents,
- mesurer une fréquence d’utilisation,
- reconstruire des séquences de navigation,
- établir un profil comportemental.

Même sans données personnelles explicites, la corrélation temporelle permet :

- surveillance passive,
- analyse comportementale,
- inférence d’habitudes.

C’est le principe fondamental des systèmes de tracking modernes.

---

#  6. Limites de la démonstration

Cette démonstration simplifie volontairement :

- Aucun serveur distant
- Pas de cookies tiers
- Pas de tracking inter-sites réel
- Pas de fingerprinting
- Pas de corrélation multi-appareils
- Pas d’analyse statistique avancée
- Module de durée par domaine désactivé

L’objectif est pédagogique et analytique.

---

#  7. Scénarios reproductibles

## 🔸 Scénario 1 — Consentement

1. Installer l’extension  
2. Cliquer sur « Refuser »  
3. Observer les logs  
4. Cliquer sur « Accepter »  
5. Comparer les événements générés  

Résultat : différence claire et observable.

---

## 🔸 Scénario 2 — Navigation

1. Ouvrir plusieurs sites  
2. Changer d’onglets  
3. Ouvrir le dashboard  

Observer :
- DOMAIN_VISIT
- TAB_SWITCH
- TAB_COUNT

---

## 🔸 Scénario 3 — Activité

1. Rester inactif 1 minute  
2. Revenir  
3. Observer les événements  

Résultat :
- USER_BECAME_IDLE
- USER_RETURNED_ACTIVE

---

## 🔸 Scénario 4 — Extension

1. Ouvrir l’extension  
2. Ajouter une note  
3. Supprimer une note  
4. Fermer l’extension  
5. Observer les logs  

---

#  8. Installation

1. Télécharger le projet  
2. Aller sur `chrome://extensions`  
3. Activer le mode développeur  
4. Charger l’extension non empaquetée  
5. Sélectionner le dossier  

---

#  9. Dashboard 

Le dashboard permet la visualisation des logs, il affiche :

- les logs bruts
- les événements filtrés
- les identifiants actifs
- l’état du consentement
- les données persistantes

Les logs sont :

- normalisés
- lisibles
- horodatés
- comparables

---

#  Conclusion

TrackAware démontre que :

- le suivi utilisateur est techniquement simple,
- des données non sensibles suffisent à profiler,
- la corrélation temporelle est puissante,
- le consentement modifie le comportement de collecte.

Comprendre ces mécanismes est essentiel pour analyser et encadrer les systèmes de tracking modernes.
