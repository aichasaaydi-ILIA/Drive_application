# Drive Application Clone

Une application full-stack web inspirée de Google Drive, permettant la gestion de fichiers (upload, téléchargement, partage), avec des fonctionnalités de sécurité avancées, un système d'authentification robuste (JWT + OAuth2) et une gestion des accès aux fichiers (publics / privés).

Ce projet se divise en deux parties principales :
- Un backend développé en **Spring Boot**
- Un frontend développé en **Angular 19**

## 🚀 Fonctionnalités Principales

- **Authentification & Autorisation** : 
  - Connexion classique (Email / Mot de passe) avec JWT.
  - Connexion via Google OAuth2.
  - Gestion des rôles (Utilisateurs et Administrateurs potentiellement).
- **Gestion de fichiers** : 
  - Uploader des fichiers de différents types.
  - Télécharger des fichiers stockés.
  - Accéder à la liste des fichiers.
- **Sécurité et Confidentialité (Fichiers privés)** :
  - Définir des fichiers comme "privés".
  - Demander l'accès à un fichier privé (`AccessRequest`).
  - Validation/Rejet des demandes d'accès par les propriétaires.

---

## 🛠️ Technologies Utilisées

### 🏗️ Backend (Spring Boot 3)
- **Framework** : Spring Boot
- **Langage** : Java 17
- **Base de données** : MySQL
- **Sécurité** : Spring Security, JWT (JSON Web Tokens), OAuth2 Client
- **ORM** : Spring Data JPA / Hibernate
- **Autres** : Lombok (réduction du code boilerplate), Validation

### 🎨 Frontend (Angular 19)
- **Framework** : Angular 19 (Server-Side Rendering activé)
- **Langage** : TypeScript
- **UI/Composants** : Angular Material
- **Gestion des requêtes** : HttpClient, Intercepteurs JWT
- **Routage** : Angular Router avec Guards (protection des routes privées)

---

## ⚙️ Prérequis

Avant de lancer le projet, assurez-vous d'avoir installé :
- **Java 17** (ou plus)
- **Node.js** (v18+ recommandé pour Angular 19) & **npm**
- **MySQL** (serveur en cours d'exécution)
- **Git**

---

## 🚀 Installation & Démarrage

### 1. Cloner le repository

```bash
git clone <url-du-repo>
cd springProjet-drive
```

### 2. Configuration et Lancement du Backend (Spring Boot)

1. Naviguez dans le dossier backend :
   ```bash
   cd ApplicationGoogleDrive
   ```
2. Créez une base de données MySQL nommée `drive1_db` :
   ```sql
   CREATE DATABASE drive1_db;
   ```
3. Configurez les variables d'environnement (dans le fichier `src/main/resources/application.properties` ou via des variables système) :
   - Assurez-vous des identifiants de la base de données (`spring.datasource.username`, `spring.datasource.password`).
   - Configurez les clés Google OAuth2 (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`) si vous souhaitez utiliser l'authentification Google.
4. Lancez l'application avec Maven :
   ```bash
   # Sur Windows
   .\mvnw spring-boot:run
   
   # Sur Linux/Mac
   ./mvnw spring-boot:run
   ```
   *L'API backend tournera sur `http://localhost:8080`.*

### 3. Configuration et Lancement du Frontend (Angular)

1. Ouvrez un nouveau terminal et naviguez dans le dossier frontend :
   ```bash
   cd frontend
   ```
2. Installez les dépendances :
   ```bash
   npm install
   ```
3. Lancez le serveur de développement :
   ```bash
   npm start
   ```
   *L'application frontend sera accessible sur `http://localhost:4200`.*

---

## 📂 Structure du Projet

```bash
springProjet-drive/
│
├── ApplicationGoogleDrive/       # Code source du backend (Spring Boot)
│   ├── src/main/java/com/ApplicationGoogleDrive/
│   │   ├── controller/           # Endpoints de l'API REST (Auth, Fichiers, Accès)
│   │   ├── model/                # Entités de la Base de Données (User, File, AccessRequest, Role)
│   │   ├── repository/           # Interfaces Spring Data JPA
│   │   ├── security/             # Configuration Spring Security & Filtres JWT
│   │   └── service/              # Logique métier de l'application
│   └── src/main/resources/       # Fichiers de configuration (application.properties)
│
├── frontend/                     # Code source du frontend (Angular)
│   ├── src/app/
│   │   ├── components/           # Composants UI (Upload, Liste fichiers, Login, etc.)
│   │   ├── services/             # Services d'appel API
│   │   ├── models/               # Interfaces TypeScript pour le typage
│   │   ├── guards/               # Protection des routes (AuthGuard)
│   │   └── interceptors/         # Intercepteurs HTTP (ex: ajout du token JWT)
│   └── angular.json              # Configuration du projet Angular
│
└── uploads/                      # Dossier contenant (potentiellement) les fichiers uploadés (si stockés en local)
```

## 🔒 Sécurité

L'application utilise un système hybride d'authentification :
- **Token JWT** : Lors d'une connexion classique (email et mot de passe), le backend génère un JWT valide et signé (HMAC-SHA256 ou supérieur). Le frontend le stocke (localStorage ou sessionStorage) et l'envoie dans les Header d'Authorisation (`Bearer ...`) lors des requêtes HTTP aux routes protégées.
- **Oauth2 Google** : Permet aux utilisateurs de se connecter d'un clic via leur compte Google de manière sécurisée.

## 👥 Auteur
*Projet réalisé dans le cadre de ma formation/mon portfolio.*
