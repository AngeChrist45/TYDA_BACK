# 🏪 Flux Vendeur - TYDA Vente

## Vue d'ensemble

Le système TYDA Vente permet à tout utilisateur **client** de demander à devenir **vendeur**. Cette demande est ensuite examinée par un administrateur qui peut l'approuver ou la rejeter avec un motif.

## 📋 Processus complet

### Étape 1 : Inscription en tant que client

Tous les utilisateurs s'inscrivent d'abord comme **client** via le flux PIN :

```
1. POST /api/auth/register (téléphone + infos)
2. POST /api/auth/verify-otp (code SMS)
3. POST /api/auth/set-pin (PIN 4 chiffres)
→ Utilisateur créé avec role = 'client'
```

📚 Voir [AUTH_PIN.md](./AUTH_PIN.md) pour les détails

---

### Étape 2 : Demande de statut vendeur

Une fois connecté, le client peut demander à devenir vendeur.

**Endpoint :** `POST /api/users/request-vendor-status`  
**Headers :** `Authorization: Bearer <token>`

**Body :**
```json
{
  "businessName": "Boutique Électronique Kouadio",
  "description": "Vente d'équipements électroniques et accessoires informatiques de qualité. Livraison rapide sur Abidjan et ses environs.",
  "category": "electronique"
}
```

**Catégories disponibles :**
- `alimentation` - Produits alimentaires
- `vetements` - Vêtements et accessoires
- `electronique` - Électronique et informatique
- `maison` - Articles pour la maison
- `services` - Services divers
- `autres` - Autres catégories

**Validation :**
- `businessName` : 2-100 caractères (requis)
- `description` : 20-500 caractères (requis)
- `category` : une des valeurs ci-dessus (défaut: `autres`)

**Réponse (succès) :**
```json
{
  "success": true,
  "message": "Votre demande a été envoyée. Un administrateur va l'examiner.",
  "data": {
    "vendorInfo": {
      "businessName": "Boutique Électronique Kouadio",
      "description": "Vente d'équipements...",
      "category": "electronique",
      "validationStatus": "pending",
      "requestedAt": "2025-11-17T10:30:00.000Z"
    }
  }
}
```

**Erreurs possibles :**

| Code | Message | Signification |
|------|---------|---------------|
| `VALIDATION_ERROR` | Erreur de validation | Champs manquants ou invalides |
| `INVALID_ROLE` | Seuls les clients peuvent demander le statut vendeur | L'utilisateur est déjà vendeur ou admin |
| `REQUEST_PENDING` | Une demande est déjà en cours de traitement | Demande précédente non traitée |

---

### Étape 3 : Examen par l'administrateur

L'administrateur voit toutes les demandes en attente dans son tableau de bord.

#### 3a. Voir les demandes en attente

**Endpoint :** `GET /api/admin/dashboard`  
**Access :** Admin uniquement

Les demandes apparaissent dans `pendingApprovals[]`

---

#### 3b. Approuver la demande ✅

**Endpoint :** `PUT /api/admin/vendors/:userId/approve`  
**Access :** Admin uniquement

**Effets :**
1. Le `role` de l'utilisateur passe de `client` à `vendeur`
2. `vendorInfo.validationStatus` = `approved`
3. Une **notification** est créée pour l'utilisateur :

```json
{
  "type": "vendor_approved",
  "title": "🎉 Demande vendeur approuvée",
  "message": "Félicitations ! Votre demande pour devenir vendeur a été approuvée. Vous pouvez maintenant accéder à votre espace vendeur et commencer à ajouter vos produits.",
  "read": false,
  "createdAt": "2025-11-17T11:00:00.000Z",
  "data": {
    "businessName": "Boutique Électronique Kouadio",
    "approvedAt": "2025-11-17T11:00:00.000Z"
  }
}
```

**Réponse :**
```json
{
  "success": true,
  "message": "Vendeur approuvé avec succès",
  "data": {
    "userId": "...",
    "role": "vendeur",
    "validationStatus": "approved",
    "validatedAt": "2025-11-17T11:00:00.000Z"
  }
}
```

---

#### 3c. Rejeter la demande ❌

**Endpoint :** `PUT /api/admin/vendors/:userId/reject`  
**Access :** Admin uniquement

**Body :**
```json
{
  "rejectionReason": "Les informations fournies sont insuffisantes. Veuillez préciser les types de produits que vous souhaitez vendre et fournir plus de détails sur votre activité."
}
```

**Validation :**
- `rejectionReason` : minimum 10 caractères (requis)

**Effets :**
1. L'utilisateur **reste client** (role inchangé)
2. `vendorInfo.validationStatus` = `rejected`
3. `vendorInfo.rejectionReason` = motif fourni
4. Une **notification** est créée avec le motif :

```json
{
  "type": "vendor_rejected",
  "title": "❌ Demande vendeur rejetée",
  "message": "Votre demande pour devenir vendeur a été rejetée. Motif : Les informations fournies sont insuffisantes...",
  "read": false,
  "createdAt": "2025-11-17T11:00:00.000Z",
  "data": {
    "businessName": "Boutique Électronique Kouadio",
    "rejectionReason": "Les informations fournies sont insuffisantes...",
    "rejectedAt": "2025-11-17T11:00:00.000Z"
  }
}
```

---

### Étape 4 : Consulter les notifications

**Endpoint :** `GET /api/users/notifications`  
**Headers :** `Authorization: Bearer <token>`

**Query params :**
- `unreadOnly=true` - Filtrer uniquement les non-lues

**Réponse :**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "_id": "...",
        "type": "vendor_approved",
        "title": "🎉 Demande vendeur approuvée",
        "message": "Félicitations ! Votre demande...",
        "read": false,
        "createdAt": "2025-11-17T11:00:00.000Z",
        "data": { ... }
      }
    ],
    "unreadCount": 1
  }
}
```

---

### Étape 5 : Marquer une notification comme lue

**Endpoint :** `PUT /api/users/notifications/:notificationId/read`  
**Headers :** `Authorization: Bearer <token>`

**Réponse :**
```json
{
  "success": true,
  "message": "Notification marquée comme lue"
}
```

---

### Étape 6 : Accéder à l'espace vendeur

Une fois **approuvé**, l'utilisateur a accès aux routes vendeur :

```
GET    /api/vendor/products/mine        # Mes produits
POST   /api/vendor/products             # Créer un produit
PUT    /api/vendor/products/:id         # Modifier mon produit
DELETE /api/vendor/products/:id         # Supprimer mon produit
GET    /api/vendor/profile              # Mon profil vendeur
PUT    /api/vendor/profile              # Mettre à jour mon profil
```

---

## 🔐 Permissions

| Action | Client | Vendeur (pending) | Vendeur (approved) | Admin |
|--------|--------|-------------------|-------------------|-------|
| Demander statut vendeur | ✅ | ❌ | ❌ | ❌ |
| Voir ses notifications | ✅ | ✅ | ✅ | ✅ |
| Créer des produits | ❌ | ❌ | ✅ | ✅ |
| Approuver/rejeter demandes | ❌ | ❌ | ❌ | ✅ |

---

## 📊 États de validation

```
client (role=client, vendorInfo=null)
    ↓ [POST /request-vendor-status]
client en attente (role=client, validationStatus=pending)
    ↓
    ├─ [APPROVE] → vendeur (role=vendeur, validationStatus=approved) ✅
    └─ [REJECT]  → client (role=client, validationStatus=rejected) ❌
```

---

## 🧪 Tester le flux

### 1. S'inscrire comme client
```bash
# Inscription
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Jean",
    "lastName": "Kouadio",
    "phone": "+2250707123456"
  }'

# Vérifier OTP (code reçu par SMS)
curl -X POST http://localhost:5000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+2250707123456",
    "otpCode": "123456"
  }'

# Définir PIN
curl -X POST http://localhost:5000/api/auth/set-pin \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+2250707123456",
    "pin": "1234",
    "confirmPin": "1234"
  }'
# → Récupérer le token JWT
```

### 2. Demander le statut vendeur
```bash
curl -X POST http://localhost:5000/api/users/request-vendor-status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "businessName": "Ma Boutique Test",
    "description": "Vente de produits électroniques et accessoires informatiques de qualité",
    "category": "electronique"
  }'
```

### 3. Approuver (en tant qu'admin)
```bash
curl -X PUT http://localhost:5000/api/admin/vendors/<USER_ID>/approve \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

### 4. Voir les notifications
```bash
curl -X GET http://localhost:5000/api/users/notifications \
  -H "Authorization: Bearer <TOKEN>"
```

---

## 💡 Bonnes pratiques

### Pour les utilisateurs
1. **Fournir des infos détaillées** : Plus votre description est précise, plus vite vous serez approuvé
2. **Choisir la bonne catégorie** : Facilite l'organisation des produits
3. **Vérifier les notifications** : Ne manquez pas la réponse de l'admin

### Pour les administrateurs
1. **Motif de rejet clair** : Expliquez précisément ce qui manque (min 10 caractères)
2. **Traiter rapidement** : Les utilisateurs attendent une réponse
3. **Vérifier la cohérence** : businessName et description doivent correspondre

---

## 🚀 Prochaines améliorations

- [ ] Email de notification en plus du système interne
- [ ] Documents justificatifs (registre de commerce, etc.)
- [ ] Score de confiance vendeur
- [ ] Possibilité de redemander après rejet
- [ ] Historique des demandes vendeur
