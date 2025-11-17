# 🇨🇮 TYDA Vente – Architecture Backend# 🇨🇮 TYDA Vente - Architecture Complète



Ce document décrit l’architecture actuelle du backend TYDA Vente (API Node.js / Express / MongoDB). Il couvre les couches principales, les flux entre rôles (Client, Vendeur, Admin) et les points clés de sécurité et d’extensibilité.Documentation technique de la plateforme e-commerce TYDA Vente pour la Côte d'Ivoire.



---## 📋 Vue d'ensemble



## 🧱 Structure généraleTYDA Vente est une plateforme e-commerce complète comprenant :

- **Backend API** (Node.js + Express + MongoDB)

```- **Frontend Web** (React.js + Material-UI)

backend/- **Frontend Mobile** (React Native) - À venir

├── src/- **Système de négociation intelligent** (Socket.IO + IA)

│   ├── app.js                # Configuration express, middlewares globaux, Socket.IO

│   ├── models/               # Schémas Mongoose (User, Product, Order, Cart, Negotiation…)## 🏗️ Architecture technique

│   ├── middleware/           # Auth, validation, erreurs, notFound

│   ├── services/             # OTP, notification, auth, négociation bot, uploads (à venir)### Backend (Node.js)

│   ├── modules/              # Routes regroupées par rôle (client, vendeur, admin)```

│   │   ├── client/backend/

│   │   │   └── routes/       # Ex: products.js, profile.js, (orders.js à migrer)├── src/

│   │   ├── vendor/│   ├── models/              # Modèles MongoDB (Mongoose)

│   │   │   └── routes/       # Ex: products.js, profile.js│   │   ├── User.js          # Utilisateurs (client/vendeur/admin)

│   │   └── admin/│   │   ├── Product.js       # Produits avec variantes

│   │       └── routes/       # admin.js (tableau de bord, validation, stats)│   │   ├── Category.js      # Catégories hiérarchiques

│   ├── routes/               # Routes historiques (auth, orders, negotiations…)│   │   └── Negotiation.js   # Négociations client/vendeur

│   ├── validations/          # Schémas Joi / express-validator│   ├── routes/              # Routes API REST

│   └── scripts/              # Outils CLI pour seeds, vérifications OTP, etc.│   │   ├── auth.js          # Authentification JWT

├── package.json│   │   ├── products.js      # CRUD produits

└── .env.example│   │   ├── users.js         # Gestion utilisateurs

```│   │   ├── categories.js    # Gestion catégories

│   │   ├── negotiations.js  # API négociations

**En cours** : migration des routes `orders.js`, `negotiations.js`, `categories.js` vers `modules/{client,vendor,admin}` pour une séparation stricte des responsabilités.│   │   ├── orders.js        # Gestion commandes

│   │   └── admin.js         # Routes admin

---│   ├── middleware/          # Middlewares Express

│   │   ├── auth.js          # Vérification JWT

## 👥 Rôles & flux principaux│   │   ├── validation.js    # Validation Joi

│   │   ├── errorHandler.js  # Gestion erreurs globale

| Rôle    | Préfixe API     | Sécurité | Capacités clés |│   │   └── notFound.js      # 404 handler

|---------|-----------------|----------|----------------|│   ├── services/            # Services métier

| Client  | `/api/client`   | JWT + rate limit | Catalogue public filtré, panier & checkout, profil, négociation via Socket.IO |│   │   └── negotiationBot.js # IA de négociation

| Vendeur | `/api/vendor`   | JWT + validation admin (`activeVendor`) | CRUD produits, gestion images, profil pro, futur suivi commandes |│   ├── validations/         # Schémas de validation

| Admin   | `/api/admin`    | JWT + rôle `admin` | Dashboard, validation vendeurs/produits, gestion utilisateurs, analytics |│   │   └── authValidation.js

│   └── scripts/             # Scripts utilitaires

Les routes d’authentification (`/api/auth`) sont communes et gèrent l’inscription OTP, le login hybride (mot de passe ou OTP) et la réinitialisation.│       └── seedDatabase.js  # Initialisation BDD

├── package.json             # Dépendances Node.js

---└── app.js                   # Point d'entrée serveur

```

## 🗂️ Modèles de données (vues rapides)

### Frontend Web (React.js)

### User```

- `role`: `client`  `vendeur`  `admin`frontend-web/

- `accountStatus`: `pending_verification`, `active`, `suspended`, `deleted`├── src/

- `vendorInfo.validationStatus`: `pending`, `approved`, `rejected`│   ├── components/          # Composants React

- OTP (`otpCode`, `otpExpires`), verrouillage (`loginAttempts`, `lockUntil`)│   │   ├── common/          # Composants réutilisables

│   │   │   ├── LoadingScreen.js    # Écran de chargement

### Product│   │   │   └── ErrorBoundary.js    # Gestion erreurs React

- Statuts : `en_attente`, `valide`, `refuse`, `suspendu`, `archive`│   │   └── layout/          # Layout principal

- Négociation : `negotiation.enabled`, `secretPercentage`, `minPrice`│   │       ├── Header.js           # Navigation responsive

- Inventaire : `quantity`, `reserved`, `sold`│   │       ├── Footer.js           # Pied de page

- Validation : `validation.validatedBy`, `validatedAt`, `rejectionReason`│   │       └── Layout.js           # Layout complet

│   ├── pages/               # Pages de l'application

### Cart & Order│   │   ├── HomePage.js      # Accueil avec hero et produits

- Cart (unique par utilisateur) : items + prix négociés éventuels.│   │   ├── LoginPage.js     # Connexion multi-méthodes

- Order : `items` (produit, vendeur, quantités), `totals`, `shippingAddress`, `statusHistory`.│   │   └── RegisterPage.js  # Inscription par étapes

- Paiement : champs prévus (`paymentMethod`, `paymentStatus`, `paymentDetails`) pour intégration Stripe.│   ├── store/               # Redux Toolkit

│   │   ├── slices/          # Slices Redux

### Negotiation│   │   │   ├── authSlice.js        # Auth + permissions

- `product`, `customer`, `vendor`│   │   │   ├── productSlice.js     # Catalogue produits

- `status`: `en_cours`, `acceptee`, `refusee`, `expiree`│   │   │   ├── cartSlice.js        # Panier d'achat

- `messages`: conversation bot/client, `finalPrice`│   │   │   ├── uiSlice.js          # État interface

- `strategy` dynamique (conservative, moderate, aggressive).│   │   │   └── negotiationSlice.js # Négociations temps réel

│   │   ├── api/

---│   │   │   └── apiSlice.js  # RTK Query API

│   │   └── store.js         # Configuration store

## 🔒 Sécurité & middlewares│   ├── hooks/               # Hooks personnalisés

│   │   ├── useAuth.js       # Authentification complète

- `auth` : vérifie JWT, attache `req.user` (id, rôle).│   │   └── useNegotiation.js # Socket.IO négociations

- `authorize('role')` : restreint l’accès à certains rôles.│   ├── routes/              # Routage React Router

- `activeVendor` : vérifie que le vendeur est validé (`vendorInfo.validationStatus === 'approved'`).│   │   └── AppRoutes.js     # Routes protégées

- `optionalAuth` : autorise l’accès public tout en attachant l’utilisateur si token présent.│   ├── theme/               # Thème Material-UI

- `rateLimit` global (100 req / 15min) + limites spécifiques (OTP, login).│   │   └── theme.js         # Couleurs Côte d'Ivoire

- `helmet`, `compression`, `morgan` (logging), CORS configuré pour web & mobile.│   └── App.js               # Composant racine

└── package.json             # Dépendances React

**Socket.IO** : middleware JWT sur handshake (token obligatoire), attache `socket.user`, vérifie `accountStatus === 'active'`.```



---## 🔐 Système d'authentification



## 🔁 Workflow principal### Flux d'authentification

1. **Inscription/Connexion** → JWT access + refresh tokens

### 1. Inscription & activation (OTP)2. **Vérification automatique** → Hook useAuth vérifie les tokens

1. POST `/api/auth/register` → crée l’utilisateur (status `pending_verification`).3. **Refresh automatique** → Token refresh transparent

2. POST `/api/auth/request-verification` → envoi OTP (email/SMS).4. **Gestion des rôles** → client/vendeur/admin avec permissions

3. POST `/api/auth/verify` → active le compte (`accountStatus = 'active'`).

4. Les vendeurs restent en attente d’approbation (admin).### Sécurité implémentée

- **Mots de passe** → Hashage bcryptjs (salt rounds: 12)

### 2. Ajout de produit (vendeur)- **JWT tokens** → Access (15min) + Refresh (7 jours)

1. POST `/api/vendor/products` (auth + activeVendor).- **Rate limiting** → Protection anti-brute force

2. Produit créé en statut `en_attente`, images placeholders.- **Validation** → Joi côté backend + Yup côté frontend

3. Admin valide via `/api/admin/products/:id/validate` (action `approve`/`reject`).- **Sanitization** → Protection XSS et injection

4. Si `approve`, peut définir `negotiationPercentage` (secret) → bot actif.

## 🛒 Système de négociation intelligent

### 3. Négociation (client)

1. Client visite `/api/client/products/:id` → voit si négociable.### Bot de négociation

2. Socket.IO : `join-negotiation`, `negotiate-message`.```javascript

3. Bot répond selon stratégie + historique.// Stratégies de négociation automatique

4. En cas d’accord : `Negotiation.finalPrice`, client peut ajouter produit au panier avec prix négocié.strategies: {

  conservative: {

### 4. Panier & commande    minDiscount: 0.05,    // 5% minimum

1. Panier : `/api/orders/cart` (GET, POST add, PUT update, DELETE clear).    maxDiscount: 0.15,    // 15% maximum

2. Checkout : `/api/orders/checkout` → crée `Order`, réserve stock (`inventory.reserved`).    rounds: 3             // 3 tours max

3. Paiement : intégration Stripe prévue via `Order.paymentDetails`.  },

4. Vendeurs verront leurs commandes (routes à migrer dans module `vendor`).  moderate: {

    minDiscount: 0.10,    // 10% minimum  

### 5. Back-office admin    maxDiscount: 0.25,    // 25% maximum

- Dashboard `/api/admin/dashboard`: stats users, produits, négociations.    rounds: 5             // 5 tours max

- Validation vendeurs (`/vendors/pending`, `/vendors/:id/validate`).  },

- Validation produits (`/products/pending`, `/products/:id/validate`).  aggressive: {

- Gestion utilisateurs (`/users`, `/users/:id/status`, `/users/:id`).    minDiscount: 0.15,    // 15% minimum

- Analytics agrégées (`/analytics`), maintenance (`/system/cleanup`).    maxDiscount: 0.40,    // 40% maximum

    rounds: 7             // 7 tours max

---  }

}

## ⚙️ Services et extensibilité```



### AuthService### Communication temps réel

- `registerUser`, `requestVerificationOTP`, `verifyOTP`, `loginWithPassword`, `loginWithOTP`, `requestLoginOTP`, `resetPassword`.- **Socket.IO** → Négociations live client ↔ vendeur

- Verrouillage après 5 tentatives (2h), stockage OTP en base.- **Events personnalisés** → offer, counter-offer, accept, reject

- **Persistance** → Toutes les négociations sauvées en BDD

### NotificationService- **Notifications** → Alertes temps réel pour toutes les parties

- `sendEmail`, `sendSMS` avec support Twilio / nodemailer.

- Templates OTP, bienvenue, validation.## 📊 Gestion d'état (Redux)

- Fallback console si credentials absents.

### Structure du store

### NegotiationBot```javascript

- Analyse messages, calcule contre-offres selon `secretPercentage`.store: {

- Prend en compte `NegociationBot.strategies`, historique, temps écoulé.  auth: {

- Réponses localisées (français ivoirien), gère expiration / tentatives max.    user: null,           // Données utilisateur

    token: null,          // JWT access token

### otpService    isAuthenticated: false,

- Génération OTP 6 chiffres, vérification, historique, stats (à brancher Redis pour prod).    loading: false,

    error: null

### À venir  },

- `mediaService` (Cloudinary) pour upload / suppression.  products: {

- `paymentService` (Stripe) pour PaymentIntents, webhooks.    items: [],           // Liste produits

- `orderService` pour partager logique entre modules client/vendeur/admin.    featured: [],        // Produits mis en avant

    categories: [],      // Catégories

---    favorites: [],       // Favoris utilisateur

    loading: false,

## 📈 Observabilité & erreurs    error: null

  },

- `errorHandler` centralise les réponses (validation Mongoose, JWT, Multer, Mongo network…).  cart: {

- Logs enrichis (message, stack, URL, IP, user agent, user id).    items: [],           // Articles dans le panier

- Gestion `unhandledRejection` & `uncaughtException` (log + exit en prod).    total: 0,           // Total calculé

- À intégrer : Sentry / Winston pour logs structurés et monitoring distant.    shipping: 0,        // Frais de livraison

    discount: 0         // Réductions appliquées

---  },

  negotiations: {

## 🛣️ Roadmap d’architecture    active: [],         // Négociations en cours

    history: [],        // Historique négociations

- [ ] **Modularisation complète** : migrer `orders.js`, `negotiations.js`, `categories.js` vers `modules/` + services partagés.    socket: null        // Instance Socket.IO

- [ ] **Cloudinary** : stockage images, suppression, nettoyage orphelins.  },

- [ ] **Stripe** : paiement sécurisé (PaymentIntents + webhooks).  ui: {

- [ ] **Validation** : harmoniser sur Joi (remplacer express-validator).    theme: 'light',     // Thème interface

- [ ] **Format erreurs** : structure homogène `{ success:false, error:{ code, message, details } }`.    notifications: [],  // Notifications actives

- [ ] **Testing** : tests unitaires + d’intégration pour OTP, négociation, flux commandes.    modals: {},        // États des modales

- [ ] **Documentation** : OpenAPI / Swagger, diagrammes séquence (inscription, négociation, commande).    sidebar: false     // État sidebar mobile

- [ ] **Monitoring** : connecter Sentry + logs Winston en JSON.  }

}

---```



## 🔐 Sécurité (rappels)## 🎨 Design System - Côte d'Ivoire



- JWT access (`Authorization: Bearer`), expiration configurable (`JWT_EXPIRES_IN`).### Palette de couleurs

- Verrouillage compte sur 5 tentatives (déverrouillage auto après `lockUntil`).```javascript

- Limiteur OTP (1 requête / 60s, 3 tentatives avant blocage).colors: {

- Produits visibles uniquement si `status === 'valide'` côté client.  primary: '#FF7F00',    // Orange drapeau 🇨🇮

- Vendeur ne peut modifier un produit validé (sauf admin) → repasse en `en_attente`.  secondary: '#00B04F',  // Vert drapeau 🇨🇮

- Vendor routes protégées par `activeVendor` (compte validé et actif).  background: '#FFFFFF', // Blanc drapeau 🇨🇮

- Socket.IO : token obligatoire, sessions non authentifiées rejetées.  text: '#2C2C2C',      // Texte principal

  textSecondary: '#666666', // Texte secondaire

---  error: '#F44336',      // Erreurs

  warning: '#FF9800',    // Avertissements

## 🔧 Environnements  success: '#00B04F'     // Succès (même que secondary)

}

- `.env.example` documente toutes les variables nécessaires (Mongo, JWT, OTP, Twilio, email, Stripe, Cloudinary, CORS).```

- `setup.js` (script interactif) : génère `.env`, secrets JWT, propose d’entrer les clés externes.

- Modes : `NODE_ENV=development` (stack trace complète) / `production` (messages génériques).### Composants Material-UI

- **Cards** → Border radius 12px, shadows subtiles

---- **Buttons** → No text transform, font weight 600

- **Typography** → Font family Inter, weights optimisés

## 📚 Références complémentaires- **Layout** → Responsive breakpoints mobile-first



- `README.md` : instructions d’installation et usage.## 🌐 API REST Structure

- `COMPLETION_REPORT.md` : récapitulatif des tâches réalisées.

- `src/scripts/` : scripts CLI (seed, check users, debug OTP, etc.).### Endpoints principaux

```

---POST   /api/auth/register     # Inscription

POST   /api/auth/login        # Connexion

_Backend conçu pour évoluer : séparation des rôles, services dédiés, négociation temps réel et intégrations à venir (paiements, média)._POST   /api/auth/refresh      # Refresh token

POST   /api/auth/logout       # Déconnexion

GET    /api/products          # Liste produits (filtres, pagination)
GET    /api/products/:id      # Détail produit
POST   /api/products          # Créer produit (vendeur/admin)
PUT    /api/products/:id      # Modifier produit
DELETE /api/products/:id      # Supprimer produit

GET    /api/categories        # Liste catégories
POST   /api/categories        # Créer catégorie (admin)

GET    /api/negotiations      # Négociations utilisateur
POST   /api/negotiations      # Démarrer négociation
PUT    /api/negotiations/:id  # Répondre à négociation

GET    /api/orders           # Commandes utilisateur
POST   /api/orders           # Créer commande
GET    /api/orders/:id       # Détail commande

GET    /api/users/profile    # Profil utilisateur
PUT    /api/users/profile    # Modifier profil
```

### Réponses API standardisées
```javascript
// Succès
{
  success: true,
  data: { ... },
  message: "Opération réussie"
}

// Erreur
{
  success: false,
  error: "Message d'erreur",
  details: { ... }  // Optionnel
}
```

## 🔄 Workflow de développement

### 1. Backend First
- ✅ **Modèles** → Structures de données MongoDB
- ✅ **Routes** → API REST complète
- ✅ **Validation** → Joi schemas pour toutes les entrées
- ✅ **Auth** → JWT + middleware complet
- ✅ **Socket.IO** → Négociations temps réel
- ✅ **Seeds** → Données de test

### 2. Frontend Architecture
- ✅ **Store Redux** → Slices + RTK Query
- ✅ **Hooks** → useAuth, useNegotiation
- ✅ **Components** → Layout, common components
- ✅ **Pages** → Home, Login, Register
- ✅ **Routing** → Protected routes
- ✅ **Theme** → Material-UI Côte d'Ivoire

### 3. Prochaines étapes
- 🚧 **Pages produits** → Catalogue, détail, recherche
- 🚧 **Panier & Checkout** → Flow complet d'achat
- 🚧 **Interface vendeur** → Dashboard, gestion produits
- 🚧 **Interface admin** → Modération, analytics
- 📋 **Mobile app** → React Native
- 📋 **Tests** → Jest + Testing Library
- 📋 **Déploiement** → Docker + CI/CD

## 📱 Responsive Design

### Breakpoints Material-UI
- **xs**: 0px+ (mobile portrait)
- **sm**: 600px+ (mobile landscape)  
- **md**: 960px+ (tablet)
- **lg**: 1280px+ (desktop)
- **xl**: 1920px+ (large desktop)

### Mobile First
- Interface optimisée pour mobile en priorité
- Header avec menu hamburger sur mobile
- Cards et layout responsive
- Touch-friendly buttons et interactions

## 🚀 Performance

### Optimisations implémentées
- **Code splitting** → React.lazy pour les pages
- **Memoization** → React.memo pour components lourds
- **Redux state normalization** → Éviter les duplications
- **Image optimization** → WebP + lazy loading
- **Bundle analysis** → webpack-bundle-analyzer

### Métriques cibles
- **First Contentful Paint** < 1.5s
- **Largest Contentful Paint** < 2.5s
- **Time to Interactive** < 3.5s
- **Cumulative Layout Shift** < 0.1

## 📈 Monitoring & Analytics

### Logging backend
- **Winston** → Logs structurés JSON
- **Morgan** → Logs HTTP requests
- **Error tracking** → Capture stack traces complètes

### Analytics frontend  
- **Google Analytics** → Tracking utilisateurs
- **Sentry** → Error monitoring React
- **Performance API** → Métriques Core Web Vitals

## 🔒 Sécurité

### Backend
- **Helmet** → Headers de sécurité HTTP
- **CORS** → Configuration domaines autorisés  
- **Rate limiting** → express-rate-limit
- **Input validation** → Joi + sanitization
- **SQL injection** → Mongoose protection native

### Frontend
- **CSP** → Content Security Policy
- **XSS protection** → Sanitization des inputs
- **Token storage** → httpOnly cookies recommandés
- **HTTPS only** → Production SSL/TLS

---

🇨🇮 **Architecture conçue pour la croissance en Côte d'Ivoire** 🇨🇮