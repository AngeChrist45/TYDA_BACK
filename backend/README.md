# TYDA Vente - Backend API

## 🇨🇮 Plateforme E-commerce Ivoirienne

Backend de l'application TYDA Vente, une plateforme e-commerce moderne dédiée au marché ivoirien avec système de négociation intelligent intégré.

## 🚀 Fonctionnalités

### 👥 Gestion des Utilisateurs
- **Authentification JWT** sécurisée avec refresh tokens
- **Trois rôles** : Client, Vendeur, Administrateur  
- **Validation vendeurs** par l'équipe administrative
- **Vérification email** obligatoire
- **Sécurité avancée** : limitation tentatives, verrouillage comptes

### 🛍️ Gestion Produits
- **CRUD complet** avec validation administrateur
- **Système de catégories** hiérarchique
- **Gestion d'inventaire** automatique
- **Upload d'images** avec Cloudinary
- **Recherche avancée** avec filtres multiples
- **Produits favoris** par utilisateur

### 🤖 Bot de Négociation Intelligent
- **Négociation automatisée** en temps réel
- **Algorithmes adaptatifs** selon le profil produit
- **Communication WebSocket** pour instantanéité
- **Stratégies multiples** : agressive, standard, conservatrice
- **Réponses en français** adaptées au contexte ivoirien

### 🛒 Système de Commandes
- **Panier persistant** par utilisateur
- **Processus de checkout** complet
- **Intégration Stripe** pour paiements
- **Gestion des stocks** automatique
- **Historique commandes** détaillé

### 📊 Panel Administrateur
- **Dashboard complet** avec statistiques
- **Gestion utilisateurs** et vendeurs
- **Validation produits** avec modération
- **Rapports de ventes** détaillés
- **Gestion des négociations** globales

## 🛠️ Technologies

- **Node.js** 18+ avec Express.js
- **MongoDB** avec Mongoose ODM
- **Socket.IO** pour temps réel
- **JWT** pour authentification
- **Bcrypt** pour hachage mots de passe
- **Joi** pour validation données
- **Cloudinary** pour gestion images
- **Stripe** pour paiements
- **Nodemailer** pour emails

## ⚙️ Installation

### Prérequis
```bash
node --version  # v18.0.0 ou supérieur
npm --version   # v8.0.0 ou supérieur
```

### Configuration
1. **Cloner le projet**
```bash
git clone <url-du-repo>
cd backend
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configurer l'environnement**
```bash
cp .env.example .env
# Éditer .env avec vos vraies valeurs
```

4. **Variables d'environnement obligatoires**
```env
MONGODB_URI=mongodb://localhost:27017/tyda-vente
JWT_SECRET=votre_secret_jwt_tres_securise
PORT=5000
```

### MongoDB
**Local :**
```bash
# Installer MongoDB Community Edition
# Démarrer le service MongoDB
mongod --dbpath /path/to/your/db
```

**Cloud (MongoDB Atlas) :**
1. Créer un cluster sur [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Récupérer l'URI de connexion
3. L'ajouter dans `.env`

## 🚀 Démarrage

### Développement
```bash
npm run dev
```
Serveur disponible sur `http://localhost:5000`

### Production
```bash
npm start
```

### Seeding de la base
```bash
# Peupler avec des données de test
npm run seed

# Nettoyer la base
npm run seed:clean
```

## 📁 Structure du Projet

```
backend/
├── src/
│   ├── models/          # Modèles Mongoose
│   │   ├── User.js      # Utilisateurs & authentification
│   │   ├── Product.js   # Produits & inventaire
│   │   ├── Category.js  # Catégories hiérarchiques
│   │   └── Negotiation.js # Négociations
│   ├── routes/          # Routes API
│   │   ├── auth.js      # Authentification
│   │   ├── products.js  # Gestion produits
│   │   ├── users.js     # Gestion utilisateurs
│   │   ├── admin.js     # Panel administrateur
│   │   ├── negotiations.js # Négociations
│   │   └── orders.js    # Commandes & panier
│   ├── middleware/      # Middlewares Express
│   │   ├── auth.js      # Authentification JWT
│   │   ├── validation.js # Validation Joi
│   │   └── errorHandler.js # Gestion erreurs
│   ├── services/        # Services métier
│   │   └── negotiationBot.js # Bot négociation
│   ├── validations/     # Schémas Joi
│   │   └── authValidation.js
│   ├── scripts/         # Scripts utilitaires
│   │   └── seedDatabase.js # Seeding données
│   └── app.js          # Configuration Express
├── package.json
├── .env.example
└── README.md
```

## 🔧 Scripts NPM

```bash
npm start              # Démarrage production
npm run dev            # Développement avec nodemon
npm run seed           # Peupler base de données
npm run seed:clean     # Nettoyer base de données
npm test               # Tests unitaires (à venir)
npm run lint           # Linting ESLint (à venir)
```

## 📡 API Endpoints

### Authentification
```
POST /api/auth/register     # Inscription
POST /api/auth/login        # Connexion  
POST /api/auth/refresh      # Renouveler token
POST /api/auth/logout       # Déconnexion
POST /api/auth/verify-email # Vérifier email
POST /api/auth/forgot-password # Mot de passe oublié
```

### Produits
```
GET    /api/products        # Liste produits (avec filtres)
GET    /api/products/:id    # Détails produit
POST   /api/products        # Créer produit (vendeur)
PUT    /api/products/:id    # Modifier produit (vendeur)
DELETE /api/products/:id    # Supprimer produit (vendeur)
POST   /api/products/:id/favorite # Ajouter aux favoris
```

### Négociations
```
GET    /api/negotiations/:productId # Historique négociation
POST   /api/negotiations/:productId # Démarrer négociation  
POST   /api/negotiations/:id/offer  # Faire une offre
POST   /api/negotiations/:id/accept # Accepter offre
```

### Administration
```
GET    /api/admin/stats           # Statistiques globales
GET    /api/admin/users           # Gestion utilisateurs
POST   /api/admin/users/:id/validate # Valider vendeur
GET    /api/admin/products        # Produits à valider
POST   /api/admin/products/:id/validate # Valider produit
```

### Commandes
```
GET    /api/orders/cart           # Panier actuel
POST   /api/orders/cart           # Ajouter au panier
PUT    /api/orders/cart/:id       # Modifier quantité
DELETE /api/orders/cart/:id       # Retirer du panier
POST   /api/orders/checkout       # Passer commande
GET    /api/orders/history        # Historique commandes
```

## 🤖 Bot de Négociation

Le système de négociation automatisé utilise plusieurs stratégies :

### Stratégies
- **Agressive** : Accepte facilement les offres proches
- **Standard** : Équilibre entre profit et vente
- **Conservatrice** : Maintient des marges élevées

### Paramètres
- **Pourcentage négociation** : 5-20% selon le produit
- **Rounds maximum** : 5 échanges
- **Délai réponse** : 2-5 secondes (configurable)

## 🌍 Données de Test (Seeding)

Après `npm run seed`, vous disposez de :

### Comptes utilisateurs
- **Admin** : admin@tydavente.com / Admin@123456
- **Vendeur 1** : kofi.asante@email.com / Vendeur@123
- **Vendeur 2** : aya.traore@email.com / Vendeur@123  
- **Client 1** : mamadou.coulibaly@email.com / Client@123
- **Client 2** : fatou.diallo@email.com / Client@123

### Données
- 6 utilisateurs avec rôles variés
- 7 catégories avec sous-catégories
- 6 produits (dont négociables)
- Thème couleurs Côte d'Ivoire 🇨🇮

## 🔒 Sécurité

### Authentification
- **JWT** avec expiration courte
- **Refresh tokens** pour renouvellement
- **Hachage bcrypt** avec salt élevé

### Protection
- **Rate limiting** sur routes sensibles
- **Validation** stricte données entrée
- **Verrouillage comptes** après échecs
- **CORS** configuré pour frontends autorisés

### Données
- **Chiffrement** mots de passe
- **Validation** emails obligatoire
- **Nettoyage** données utilisateur (XSS)

## 🐛 Debugging

### Logs
```bash
# Niveau de log dans .env
LOG_LEVEL=debug
```

### Base de données
```bash
# Connexion MongoDB shell
mongo mongodb://localhost:27017/tyda-vente

# Vérifier collections
use tyda-vente
show collections
db.users.find().pretty()
```

### Tests API
```bash
# Utiliser Postman ou curl
curl -X GET http://localhost:5000/api/products
```

## 🚀 Déploiement

### Environnement Production
1. **Variables d'environnement**
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
JWT_SECRET=secret_production_très_sécurisé
```

2. **Optimisations**
- Utiliser PM2 pour gestion processus
- Configurer reverse proxy (Nginx)
- Activer compression gzip
- Configurer HTTPS

### Services Cloud
- **Hébergement** : Heroku, DigitalOcean, AWS
- **Base données** : MongoDB Atlas
- **Images** : Cloudinary
- **Emails** : SendGrid, Mailgun

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/amazing-feature`)
3. Commit changements (`git commit -m 'Add amazing feature'`)
4. Push vers la branche (`git push origin feature/amazing-feature`)
5. Ouvrir une Pull Request

## 📝 License

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🙋‍♂️ Support

Pour toute question ou problème :
- 📧 Email : support@tydavente.com
- 📱 GitHub Issues
- 💬 Discord communautaire

---

**TYDA Vente** - *Révolutionner le e-commerce en Côte d'Ivoire* 🇨🇮