# Frontend Angular - Drive Application

Cette partie du projet correspond au **Frontend** de l'application Google Drive Clone. Elle a été générée avec [Angular CLI](https://github.com/angular/angular-cli) version 19.0.6.

> ℹ️ **Note :** Veuillez consulter le fichier **`README.md` principal à la racine du projet** pour une vue d'ensemble détaillée incluant les instructions du backend (Spring Boot), la configuration de la base de données et l'aspect Sécurité/JWT.

## 🚀 Fonctionnalités Implémentées

- Authentification des utilisateurs (Login, Redirection OAuth2 Google).
- Upload, visualisation, et gestion des fichiers.
- Gestion des permissions sur les fichiers privés (Demande / Autorisation d'accès).
- Interfaces Material Design fluides et responsives.

## ⚙️ Serveur de développement

Pour lancer ce projet en local :
1. Assurez-vous d'avoir exécuté `npm install` au préalable.
2. Exécutez `npm start` ou `ng serve` pour lancer le serveur local.
3. Accédez à `http://localhost:4200/`.

L'application va se recharger automatiquement si vous modifiez l'un des fichiers sources.

## 🏗️ Build

Exécutez `npm run build` ou `ng build` pour compiler le projet pour la production. Les différentes ressources de base (HTML/CSS/JS) seront alors générées dans le dossier `dist/`.

## 🧪 Tests Unitaires et E2E

Exécutez `ng test` pour lancer les tests unitaires vis-à-vis du code Karma/Jasmine.
Pour des tests de bout en bout (e2e), vous pouvez configurer Cypress ou Playwright via Angular CLI.

## 🤝 Lien avec l'API Backend

Les appels XHR (Ajax) sont effectués par le module `HttpClient` natif d'Angular vers le serveur backend Spring Boot par défaut sur le port 8080 : `http://localhost:8080`.
Il y a un système d'intercepteurs (`Interceptor`) qui attache le token JWT automatiquement dans l'entête `Authorization` pour garantir la sécurité.
