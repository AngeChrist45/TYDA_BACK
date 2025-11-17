const jwt = require('jsonwebtoken');
const User = require('../models/User');
const otpService = require('./otpService');
const notificationService = require('./notificationService');

class AuthService {
  // Générer un token JWT
  generateToken(userId, role) {
    return jwt.sign(
      { userId, role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
  }

  // Vérifier un token JWT
  verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      throw new Error('Token invalide');
    }
  }

  // 📝 INSCRIPTION AVEC OTP OBLIGATOIRE
  async registerUser(userData) {
    const { firstName, lastName, email, phone, password, role = 'client', address, vendorInfo } = userData;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({
      $or: [{ email }, { phone }]
    });

    if (existingUser) {
      throw new Error('Un utilisateur avec cet email ou téléphone existe déjà');
    }

    // Créer l'utilisateur (statut pending_verification par défaut)
    const newUser = new User({
      firstName,
      lastName,
      email,
      phone,
      password,
      role,
      address,
      vendorInfo: role === 'vendeur' ? vendorInfo : undefined
    });

    await newUser.save();

    return {
      user: newUser,
      message: 'Compte créé. Vérification OTP requise pour l\'activer.'
    };
  }

  // 📱 DEMANDER UN CODE OTP POUR VÉRIFICATION
  async requestVerificationOTP(identifier, method = 'email') {
    // Trouver l'utilisateur par email ou téléphone
    const user = await User.findOne({
      $or: [{ email: identifier }, { phone: identifier }]
    });

    if (!user) {
      throw new Error('Utilisateur introuvable');
    }

    if (user.accountStatus !== 'pending_verification') {
      throw new Error('Ce compte est déjà vérifié ou suspendu');
    }

    // Vérifier la limite de temps entre les demandes
    if (user.lastOTPRequest && Date.now() - user.lastOTPRequest < 60000) {
      throw new Error('Veuillez attendre avant de demander un nouveau code');
    }

    // Générer le code OTP
    const otpCode = otpService.generateOTP();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Sauvegarder l'OTP
    user.otpCode = otpCode;
    user.otpExpires = otpExpires;
    user.otpAttempts = 0;
    user.lastOTPRequest = new Date();
    await user.save();

    // Envoyer l'OTP selon la méthode choisie
    const sentVia = [];
    
    if (method === 'email' || method === 'both') {
      try {
        await notificationService.sendEmail(
          user.email,
          'Code de vérification GOAT',
          `Votre code de vérification est : ${otpCode}`,
          `
          <h2>Code de vérification GOAT</h2>
          <p>Bonjour ${user.firstName},</p>
          <p>Votre code de vérification est :</p>
          <h1 style="color: #FF7F00; font-size: 32px; text-align: center;">${otpCode}</h1>
          <p>Ce code expire dans 5 minutes.</p>
          `
        );
        sentVia.push('email');
      } catch (error) {
        console.error('Erreur envoi email:', error);
      }
    }

    if (method === 'sms' || method === 'both') {
      try {
        await notificationService.sendSMS(
          user.phone,
          `GOAT: Votre code de vérification est ${otpCode}. Valide 5 minutes.`
        );
        sentVia.push('SMS');
      } catch (error) {
        console.error('Erreur envoi SMS:', error);
      }
    }

    if (sentVia.length === 0) {
      throw new Error('Impossible d\'envoyer le code de vérification');
    }

    return {
      message: `Code de vérification envoyé via ${sentVia.join(' et ')}`,
      expiresIn: 5 * 60 * 1000,
      sentVia
    };
  }

  // ✅ VÉRIFIER LE CODE OTP ET ACTIVER LE COMPTE
  async verifyOTP(identifier, otpCode) {
    // Trouver l'utilisateur
    const user = await User.findOne({
      $or: [{ email: identifier }, { phone: identifier }]
    });

    if (!user) {
      throw new Error('Utilisateur introuvable');
    }

    // Vérifier si l'OTP existe et n'est pas expiré
    if (!user.otpCode || !user.otpExpires || user.otpExpires < new Date()) {
      throw new Error('Code expiré ou invalide');
    }

    // Vérifier le nombre d'tentatives
    if (user.otpAttempts >= 3) {
      throw new Error('Trop de tentatives. Demandez un nouveau code.');
    }

    // Vérifier le code
    if (user.otpCode !== otpCode.trim()) {
      user.otpAttempts += 1;
      await user.save();
      throw new Error(`Code incorrect. ${3 - user.otpAttempts} tentatives restantes.`);
    }

    // Code correct ! Activer le compte
    user.accountStatus = 'active';
    user.isEmailVerified = true;
    user.isPhoneVerified = true;
    user.otpCode = undefined;
    user.otpExpires = undefined;
    user.otpAttempts = 0;
    user.lastLogin = new Date();
    await user.save();

    // Générer le token
    const token = this.generateToken(user._id, user.role);

    return {
      token,
      user,
      message: 'Compte vérifié et activé avec succès !'
    };
  }

  // 🔐 CONNEXION AVEC MOT DE PASSE
  async loginWithPassword(identifier, password) {
    // Trouver l'utilisateur
    const user = await User.findOne({
      $or: [{ email: identifier }, { phone: identifier }]
    });

    if (!user) {
      throw new Error('Identifiants incorrects');
    }

    // Vérifier si le compte est verrouillé
    if (user.isLocked()) {
      throw new Error('Compte temporairement verrouillé. Réessayez plus tard.');
    }

    // Vérifier si le compte est actif
    if (user.accountStatus !== 'active') {
      throw new Error('Compte non vérifié ou suspendu');
    }

    // Vérifier le mot de passe
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      await user.incLoginAttempts();
      throw new Error('Identifiants incorrects');
    }

    // Réinitialiser les tentatives de connexion
    await user.resetLoginAttempts();
    
    // Mettre à jour la dernière connexion
    user.lastLogin = new Date();
    await user.save();

    // Générer le token
    const token = this.generateToken(user._id, user.role);

    return {
      token,
      user,
      message: 'Connexion réussie'
    };
  }

  // 📱 DEMANDER UN CODE OTP POUR CONNEXION
  async requestLoginOTP(identifier) {
    // Trouver l'utilisateur
    const user = await User.findOne({
      $or: [{ email: identifier }, { phone: identifier }]
    });

    if (!user) {
      throw new Error('Utilisateur introuvable');
    }

    if (user.accountStatus !== 'active') {
      throw new Error('Compte non vérifié ou suspendu');
    }

    // Vérifier la limite de temps entre les demandes
    if (user.lastOTPRequest && Date.now() - user.lastOTPRequest < 60000) {
      throw new Error('Veuillez attendre avant de demander un nouveau code');
    }

    // Générer le code OTP
    const otpCode = otpService.generateOTP();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000);

    // Sauvegarder l'OTP
    user.otpCode = otpCode;
    user.otpExpires = otpExpires;
    user.otpAttempts = 0;
    user.lastOTPRequest = new Date();
    await user.save();

    // Envoyer par email ET SMS pour la connexion
    const sentVia = [];
    
    try {
      await notificationService.sendEmail(
        user.email,
        'Code de connexion GOAT',
        `Votre code de connexion est : ${otpCode}`,
        `
        <h2>Code de connexion GOAT</h2>
        <p>Bonjour ${user.firstName},</p>
        <p>Votre code de connexion est :</p>
        <h1 style="color: #FF7F00; font-size: 32px; text-align: center;">${otpCode}</h1>
        <p>Ce code expire dans 5 minutes.</p>
        `
      );
      sentVia.push('email');
    } catch (error) {
      console.error('Erreur envoi email:', error);
    }

    try {
      await notificationService.sendSMS(
        user.phone,
        `GOAT: Votre code de connexion est ${otpCode}. Valide 5 minutes.`
      );
      sentVia.push('SMS');
    } catch (error) {
      console.error('Erreur envoi SMS:', error);
    }

    return {
      message: `Code de connexion envoyé via ${sentVia.join(' et ')}`,
      expiresIn: 5 * 60 * 1000,
      sentVia
    };
  }

  // ✅ CONNEXION AVEC OTP
  async loginWithOTP(identifier, otpCode) {
    // Trouver l'utilisateur
    const user = await User.findOne({
      $or: [{ email: identifier }, { phone: identifier }]
    });

    if (!user) {
      throw new Error('Utilisateur introuvable');
    }

    if (user.accountStatus !== 'active') {
      throw new Error('Compte non vérifié ou suspendu');
    }

    // Vérifier l'OTP
    if (!user.otpCode || !user.otpExpires || user.otpExpires < new Date()) {
      throw new Error('Code expiré ou invalide');
    }

    if (user.otpAttempts >= 3) {
      throw new Error('Trop de tentatives. Demandez un nouveau code.');
    }

    if (user.otpCode !== otpCode.trim()) {
      user.otpAttempts += 1;
      await user.save();
      throw new Error(`Code incorrect. ${3 - user.otpAttempts} tentatives restantes.`);
    }

    // Code correct !
    user.otpCode = undefined;
    user.otpExpires = undefined;
    user.otpAttempts = 0;
    user.lastLogin = new Date();
    await user.save();

    // Générer le token
    const token = this.generateToken(user._id, user.role);

    return {
      token,
      user,
      message: 'Connexion réussie'
    };
  }

  // 🔄 RÉINITIALISATION DE MOT DE PASSE
  async requestPasswordReset(identifier) {
    const user = await User.findOne({
      $or: [{ email: identifier }, { phone: identifier }]
    });

    if (!user) {
      throw new Error('Utilisateur introuvable');
    }

    if (user.accountStatus !== 'active') {
      throw new Error('Compte non vérifié ou suspendu');
    }

    // Même logique que requestLoginOTP
    return await this.requestLoginOTP(identifier);
  }

  // ✅ RÉINITIALISER LE MOT DE PASSE AVEC OTP
  async resetPasswordWithOTP(identifier, otpCode, newPassword) {
    // Vérifier l'OTP
    const user = await User.findOne({
      $or: [{ email: identifier }, { phone: identifier }]
    });

    if (!user) {
      throw new Error('Utilisateur introuvable');
    }

    // Vérifier l'OTP comme pour la connexion
    if (!user.otpCode || !user.otpExpires || user.otpExpires < new Date()) {
      throw new Error('Code expiré ou invalide');
    }

    if (user.otpAttempts >= 3) {
      throw new Error('Trop de tentatives. Demandez un nouveau code.');
    }

    if (user.otpCode !== otpCode.trim()) {
      user.otpAttempts += 1;
      await user.save();
      throw new Error(`Code incorrect. ${3 - user.otpAttempts} tentatives restantes.`);
    }

    // Changer le mot de passe
    user.password = newPassword; // Le middleware va le hasher automatiquement
    user.otpCode = undefined;
    user.otpExpires = undefined;
    user.otpAttempts = 0;
    await user.resetLoginAttempts(); // Réinitialiser les tentatives de connexion
    await user.save();

    return {
      message: 'Mot de passe réinitialisé avec succès'
    };
  }

  // 👤 OBTENIR LES INFOS UTILISATEUR
  async getUserById(userId) {
    const user = await User.findById(userId).select('-password');
    if (!user) {
      throw new Error('Utilisateur introuvable');
    }
    return user;
  }
}

module.exports = new AuthService();