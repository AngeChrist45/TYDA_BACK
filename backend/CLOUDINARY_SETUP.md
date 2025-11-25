# Configuration Cloudinary pour TYDA

## Étape 1 : Créer un compte Cloudinary (GRATUIT)

1. Allez sur https://cloudinary.com/
2. Cliquez sur **"Sign Up for Free"**
3. Créez votre compte (email, password)
4. Confirmez votre email

## Étape 2 : Récupérer vos identifiants

1. Une fois connecté, allez sur le **Dashboard**
2. Vous verrez vos identifiants :
   - **Cloud Name** (ex: dxxxx123)
   - **API Key** (ex: 123456789012345)
   - **API Secret** (cliquez sur "Reveal" pour voir)

## Étape 3 : Configurer votre backend

1. Ouvrez le fichier `.env` dans le dossier `backend/`
2. Ajoutez vos identifiants Cloudinary :

```env
CLOUDINARY_CLOUD_NAME=votre_cloud_name
CLOUDINARY_API_KEY=votre_api_key
CLOUDINARY_API_SECRET=votre_api_secret
```

3. Sauvegardez le fichier

## Étape 4 : Redémarrer le serveur

1. Arrêtez le serveur backend (Ctrl+C)
2. Relancez-le : `npm start` ou `node src/app.js`

## Étape 5 : Tester

1. Créez un produit en tant que vendeur
2. Uploadez une ou plusieurs images
3. Les images seront automatiquement uploadées sur Cloudinary
4. Vous verrez les vraies images dans le backoffice !

## Plan GRATUIT Cloudinary

- ✅ 25 crédits gratuits/mois
- ✅ 25 GB de stockage
- ✅ 25 GB de bande passante
- ✅ Transformations automatiques (optimisation, resize)
- ✅ Pas de carte bancaire requise

## Limites actuelles

- **Taille max par image** : 5 MB
- **Nombre max d'images** : 5 par produit
- **Format supportés** : JPG, JPEG, PNG, GIF, WEBP
- **Optimisation auto** : ✅ (quality auto, format auto)

## Dossier de stockage

Toutes les images produits sont stockées dans : `tyda/products/` sur votre Cloudinary

## Support

Si vous avez des questions sur Cloudinary :
- Documentation : https://cloudinary.com/documentation
- Support : https://support.cloudinary.com/
