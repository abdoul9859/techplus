# GEEK TECHNOLOGIE - Gestion de Stock

Application de gestion de stock et facturation développée avec **FastAPI** et **Bootstrap**, reproduisant les fonctionnalités de l'application template Node.js/React.

## 🚀 Fonctionnalités

### ✅ Gestion des Produits
- **Système de variantes** : Produits avec variantes (smartphones, ordinateurs, etc.)
- **Codes-barres intelligents** : Gestion selon la règle métier (produit avec variantes = pas de code-barres produit)
- **IMEI/Numéros de série** : Traçabilité complète des variantes
- **Attributs spécifiques** : Couleur, stockage, etc. par variante
- **Recherche avancée** : Par nom, marque, modèle, codes-barres

### ✅ Gestion des Clients
- Informations complètes (contact, adresse, etc.)
- Recherche et filtres
- Historique des transactions

### ✅ Mouvements de Stock
- **Traçabilité complète** : Entrées, sorties, ventes, retours
- **Audit automatique** : Logs lors des suppressions
- **Statistiques temps réel** : Mouvements du jour, totaux
- **Recherche de variantes** : Par IMEI/numéro de série

### ✅ Facturation
- **Devis** : Création, conversion en factures
- **Factures** : Gestion complète avec paiements
- **Bons de livraison** : Suivi des livraisons
- **Statistiques** : Chiffre d'affaires, impayés

### ✅ Authentification & Sécurité
- **JWT** : Authentification sécurisée
- **Rôles** : Admin, Manager, Utilisateur
- **Permissions** : Contrôle d'accès granulaire

## 🛠️ Technologies

- **Backend** : FastAPI, SQLAlchemy, SQLite
- **Frontend** : Bootstrap 5, JavaScript ES6+
- **Authentification** : JWT avec python-jose
- **Base de données** : SQLite (développement), PostgreSQL (production)

## 📦 Installation

1. **Cloner le projet**
```bash
cd c:\Users\Aziz\Documents\Code\geek-technologie\geek-technologie-fastapi
```

2. **Créer un environnement virtuel**
```bash
python -m venv venv
venv\Scripts\activate  # Windows
# ou
source venv/bin/activate  # Linux/Mac
```

3. **Installer les dépendances**
```bash
pip install -r requirements.txt
```

4. **Configurer l'environnement**
```bash
# Le fichier .env est déjà créé avec les paramètres par défaut
# Modifier si nécessaire
```

5. **Démarrer l'application**
```bash
python start.py
```

L'application sera accessible sur : http://127.0.0.1:8000

## 👤 Comptes par défaut

- **Administrateur** : `admin` / `admin123`
- **Utilisateur** : `user` / `user123`

## 🗄️ Base de données

### Migration depuis PostgreSQL

Pour migrer les données existantes depuis l'application template PostgreSQL :

1. Exporter les données depuis PostgreSQL
2. Utiliser le script de migration (à développer)
3. Importer dans SQLite

### Structure

La base de données SQLite reproduit exactement la structure PostgreSQL :
- `users` : Utilisateurs et authentification
- `clients` : Informations clients
- `products` : Produits principaux
- `product_variants` : Variantes avec IMEI/codes-barres
- `product_variant_attributes` : Attributs des variantes
- `stock_movements` : Mouvements de stock
- `quotations` / `quotation_items` : Devis
- `invoices` / `invoice_items` : Factures
- `invoice_payments` : Paiements
- `delivery_notes` / `delivery_note_items` : Bons de livraison

## 🎯 Règles Métier Implémentées

### Système de Codes-barres (selon mémoires)
- **Produit avec variantes** : Pas de code-barres sur le produit principal
- **Variantes individuelles** : Chaque variante peut avoir son code-barres
- **Produit sans variantes** : Code-barres sur le produit principal
- **Unicité globale** : Codes-barres uniques entre produits ET variantes

### Gestion du Stock
- **Quantité = Nombre de variantes** pour les produits avec variantes
- **Traçabilité complète** : Tous les mouvements sont enregistrés
- **Audit automatique** : Logs lors des suppressions

## 🔧 API Endpoints

### Authentification
- `POST /api/auth/login` : Connexion
- `GET /api/auth/verify` : Vérification token
- `POST /api/auth/logout` : Déconnexion

### Produits
- `GET /api/products` : Liste des produits
- `POST /api/products` : Créer un produit
- `GET /api/products/{id}` : Détails d'un produit
- `PUT /api/products/{id}` : Modifier un produit
- `DELETE /api/products/{id}` : Supprimer un produit
- `GET /api/products/scan/{barcode}` : Scanner un code-barres

### Clients
- `GET /api/clients` : Liste des clients
- `POST /api/clients` : Créer un client
- `PUT /api/clients/{id}` : Modifier un client
- `DELETE /api/clients/{id}` : Supprimer un client

### Mouvements de Stock
- `GET /api/stock-movements` : Liste des mouvements
- `POST /api/stock-movements` : Créer un mouvement
- `GET /api/stock-movements/stats` : Statistiques

### Factures
- `GET /api/invoices` : Liste des factures
- `POST /api/invoices` : Créer une facture
- `PUT /api/invoices/{id}/status` : Modifier le statut
- `POST /api/invoices/{id}/payments` : Ajouter un paiement

## 🎨 Interface Utilisateur

### Design
- **Bootstrap 5** : Interface moderne et responsive
- **Bootstrap Icons** : Icônes cohérentes
- **Thème personnalisé** : Couleurs GEEK TECHNOLOGIE
- **Animations CSS** : Transitions fluides

### Pages
- **Dashboard** : Vue d'ensemble avec statistiques
- **Produits** : Gestion complète avec système de variantes
- **Clients** : Carnet d'adresses
- **Stock** : Mouvements et traçabilité
- **Devis** : Création et gestion
- **Factures** : Facturation et paiements
- **Scanner** : Scan de codes-barres

## 🔒 Sécurité

- **Authentification JWT** : Tokens sécurisés
- **Validation des données** : Pydantic schemas
- **Contrôle d'accès** : Rôles et permissions
- **Protection CSRF** : Headers sécurisés
- **Validation côté serveur** : Toutes les entrées validées

## 📱 Responsive Design

L'interface s'adapte automatiquement :
- **Desktop** : Interface complète
- **Tablet** : Navigation optimisée
- **Mobile** : Menu hamburger, cartes empilées

## 🚀 Déploiement

### Développement
```bash
python start.py
```

### Docker (app + PostgreSQL)
```bash
# 1) Démarrer les services
docker compose up -d --build

# 2) URL de l'app
# http://localhost:8000

# 3) Voir les logs
docker compose logs -f app

# 4) Arrêter
docker compose down
```

La configuration Docker lance deux conteneurs:
- `db` (PostgreSQL 15): volume persistant `db_data`
- `app` (FastAPI): lit `DATABASE_URL=postgresql://postgres:123@db:5432/geektechnologie_db`

Variables utiles (peuvent être adaptées dans `docker-compose.yml`):
- `INIT_DB_ON_STARTUP=true` et `SEED_DEFAULT_DATA=true` pour créer les tables et insérer les données par défaut au premier démarrage.
- `DB_SSLMODE=disable` pour le réseau local Docker.

### Production
```bash
# Modifier .env pour la production
# Utiliser PostgreSQL au lieu de SQLite
# Configurer un serveur web (nginx + gunicorn)
```

## 📝 Notes de Migration

Cette application reproduit fidèlement les fonctionnalités de l'application template Node.js/React :

1. **Architecture** : FastAPI remplace Express.js
2. **Interface** : Bootstrap remplace React
3. **Base de données** : SQLite (dev) / PostgreSQL (prod)
4. **Authentification** : JWT maintenu
5. **Fonctionnalités** : Toutes reproduites à l'identique

## 🤝 Support

Pour toute question ou problème :
1. Vérifier les logs de l'application
2. Consulter la documentation FastAPI
3. Vérifier la configuration de la base de données

## 📄 Licence

Application développée pour GEEK TECHNOLOGIE - Tous droits réservés.
