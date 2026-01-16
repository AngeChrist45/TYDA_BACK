# 🔐 Authentification par Code PIN - TYDA Vente

## Vue d'ensemble

TYDA Vente utilise un système d'authentification **simplifié comme Wave** basé sur :
- ✅ Numéro de téléphone (identifiant unique)
- ✅ Code PIN à 4 chiffres (au lieu d'un mot de passe complexe)
- ✅ Vérification SMS obligatoire lors de l'inscription

## 📱 Flux d'inscription (3 étapes)

### Étape 1 : Enregistrement initial
**Endpoint :** `POST /api/auth/register`

```json
{
  "firstName": "Kouadio",
  "lastName": "Jean",
  "phone": "+2250707123456",
  "role": "client",
  "email": "jean@example.com" 
}
```

**Réponse :**
```json
{
  "success": true,
  "message": "Code de vérification envoyé par SMS",
  "data": {
    "userId": "...",
    "phone": "+2250707123456",
    "nextStep": "verify_otp"
  }
}
```

👉 Un code OTP à 6 chiffres est envoyé par SMS au numéro fourni.

---

### Étape 2 : Vérification du téléphone
**Endpoint :** `POST /api/auth/verify-otp`

```json
{
  "phone": "+2250707123456",
  "otpCode": "123456"
}
```

**Réponse :**
```json
{
  "success": true,
  "message": "Numéro de téléphone vérifié avec succès",
  "data": {
    "userId": "...",
    "phone": "+2250707123456",
    "nextStep": "set_pin"
  }
}
```

---

### Étape 3 : Définir le code PIN
**Endpoint :** `POST /api/auth/set-pin`

```json
{
  "phone": "+2250707123456",
  "pin": "1234",
  "confirmPin": "1234"
}
```

**Réponse :**
```json
{
  "success": true,
  "message": "Inscription terminée avec succès",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "...",
      "firstName": "Kouadio",
      "lastName": "Jean",
      "phone": "+2250707123456",
      "role": "client",
      "accountStatus": "active"
    }
  }
}
```

✅ **L'utilisateur est maintenant inscrit et connecté !**

---

## 🔓 Connexion

**Endpoint :** `POST /api/auth/login`

```json
{
  "phone": "+2250707123456",
  "pin": "1234"
}
```

**Réponse (succès) :**
```json
{
  "success": true,
  "message": "Connexion réussie",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "...",
      "firstName": "Kouadio",
      "lastName": "Jean",
      "phone": "+2250707123456",
      "role": "client",
      "lastLogin": "2025-11-17T..."
    }
  }
}
```

---

## 🔒 Sécurité

### Protection anti-brute force
- **5 tentatives** maximum avant verrouillage
- **Verrouillage de 15 minutes** après 5 échecs
- Compteur d'essais restants dans la réponse

**Exemple de réponse après échec :**
```json
{
  "success": false,
  "error": "Numéro de téléphone ou PIN incorrect",
  "code": "INVALID_CREDENTIALS",
  "attemptsLeft": 3
}
```

**Après 5 échecs :**
```json
{
  "success": false,
  "error": "Compte verrouillé. Réessayez dans 14 minute(s)",
  "code": "ACCOUNT_LOCKED",
  "lockTimeRemaining": 14
}
```

### Hachage du PIN
- Le PIN est **hashé avec bcrypt** (12 rounds)
- Jamais stocké en clair dans la base de données
- Même sécurité qu'un mot de passe

---

## 🔄 Réinitialisation du PIN (PIN oublié)

### Étape 1 : Demander un code OTP
**Endpoint :** `POST /api/auth/request-otp`

```json
{
  "phone": "+2250707123456"
}
```

**Réponse :**
```json
{
  "success": true,
  "message": "Code OTP envoyé par SMS",
  "data": {
    "phone": "+2250707123456"
  }
}
```

---

### Étape 2 : Vérifier l'OTP
Utiliser le même endpoint que l'inscription : `POST /api/auth/verify-otp`

---

### Étape 3 : Définir un nouveau PIN
**Endpoint :** `POST /api/auth/reset-pin`

```json
{
  "phone": "+2250707123456",
  "pin": "5678",
  "confirmPin": "5678"
}
```

---

## 🔄 Changement de PIN (utilisateur connecté)

**Endpoint :** `POST /api/auth/change-pin`  
**Headers :** `Authorization: Bearer <token>`

```json
{
  "currentPin": "1234",
  "newPin": "5678",
  "confirmNewPin": "5678"
}
```

---

## 📊 Format du numéro de téléphone

**Format accepté :** `+225XXXXXXXX` (8 à 10 chiffres après +225)

**Exemples valides :**
- `+2250707123456` ✅
- `+22507123456` ✅

**Exemples invalides :**
- `0707123456` ❌ (manque +225)
- `+225123` ❌ (trop court)

---

## 🧪 Comptes de test

### Admin par défaut
```
Téléphone: +2250700000000
PIN: 0000
Rôle: admin
```

### Vendeur de test
```
Téléphone: +2250123456789
PIN: 1234
Rôle: vendeur
```

**Créer les comptes :**
```bash
# Admin
node backend/src/scripts/createAdmin.js

# Vendeur
node backend/src/scripts/createTestVendor.js
```

---

## 🛡️ Rate Limiting

| Endpoint | Limite | Fenêtre |
|----------|--------|---------|
| `/register` | 3 requêtes | 15 minutes |
| `/request-otp` | 5 requêtes | 5 minutes |
| `/login` | 10 requêtes | 15 minutes |

---

## 💡 Avantages du système PIN

✅ **Simplicité** : Plus facile à retenir qu'un mot de passe complexe  
✅ **Rapidité** : Connexion en 2 secondes (téléphone + 4 chiffres)  
✅ **Sécurité** : Verrouillage après 5 tentatives + SMS OTP obligatoire  
✅ **Pas d'email requis** : Authentification uniquement par téléphone  
✅ **Adoption mobile** : Correspond aux habitudes des utilisateurs ivoiriens (Wave, Orange Money, etc.)

---

## 🔑 Modèle de données

### Champs du modèle User
```javascript
{
  phone: String,          // Unique, requis, format +225XXXXXXXX
  pin: String,            // Hashé avec bcrypt (4 chiffres)
  pinAttempts: Number,    // Compteur d'échecs (max 5)
  pinLockedUntil: Date,   // Date de déverrouillage
  
  isPhoneVerified: Boolean,
  accountStatus: String,  // pending_verification | active | suspended
  
  otpCode: String,        // Code OTP temporaire
  otpExpires: Date,       // Expiration OTP (10 minutes)
  otpAttempts: Number,    // Tentatives OTP
  lastOTPRequest: Date    // Dernier envoi OTP (rate limiting)
}
```

---

## 🚀 Migration depuis l'ancien système

L'ancien système utilisait email + password. Tous les fichiers ont été adaptés :

### ✅ Fichiers modifiés
- `src/models/User.js` : Remplacement password → pin
- `src/routes/auth.js` : Nouveaux endpoints (register, verify-otp, set-pin, login)
- `src/validations/authValidation.js` : Schémas Joi pour PIN
- `src/scripts/createAdmin.js` : PIN au lieu de password
- `src/scripts/createTestVendor.js` : PIN au lieu de password

### ⚠️ Breaking Changes
- L'email n'est plus obligatoire (optionnel)
- Le champ `password` n'existe plus (remplacé par `pin`)
- Les champs `loginAttempts` et `lockUntil` sont renommés en `pinAttempts` et `pinLockedUntil`
- Méthodes du modèle : `comparePassword()` → `comparePin()`, `isLocked()` → `isPinLocked()`

---

## 📝 TODO

- [ ] Implémenter la liste noire de tokens JWT (logout réel)
- [ ] Ajouter logs d'audit pour les tentatives de connexion
- [ ] Notification push lors de connexion sur nouveau device
- [ ] Limite de devices connectés par compte
- [ ] Backup OTP par appel vocal si SMS échoue
