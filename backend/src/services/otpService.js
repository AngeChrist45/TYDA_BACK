const crypto = require('crypto');

class OTPService {
  constructor() {
    this.otpStorage = new Map(); // En production, utiliser Redis
    this.OTP_EXPIRY = 5 * 60 * 1000; // 5 minutes
    this.MAX_ATTEMPTS = 3;
  }

  // Générer un code OTP à 6 chiffres
  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Créer une session OTP
  createOTPSession(identifier, type = 'login') {
    const otp = this.generateOTP();
    const sessionId = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + this.OTP_EXPIRY;

    const otpData = {
      otp,
      identifier, // email ou téléphone
      type, // 'login', 'register', 'reset'
      expiresAt,
      attempts: 0,
      verified: false,
      createdAt: Date.now()
    };

    this.otpStorage.set(sessionId, otpData);

    // Auto-cleanup après expiration
    setTimeout(() => {
      this.otpStorage.delete(sessionId);
    }, this.OTP_EXPIRY);

    return {
      sessionId,
      otp,
      expiresAt,
      expiresIn: this.OTP_EXPIRY
    };
  }

  // Vérifier un code OTP
  verifyOTP(sessionId, inputOtp) {
    const otpData = this.otpStorage.get(sessionId);

    if (!otpData) {
      return {
        success: false,
        error: 'Session OTP introuvable ou expirée',
        code: 'SESSION_NOT_FOUND'
      };
    }

    if (Date.now() > otpData.expiresAt) {
      this.otpStorage.delete(sessionId);
      return {
        success: false,
        error: 'Code OTP expiré',
        code: 'OTP_EXPIRED'
      };
    }

    if (otpData.attempts >= this.MAX_ATTEMPTS) {
      this.otpStorage.delete(sessionId);
      return {
        success: false,
        error: 'Trop de tentatives. Demandez un nouveau code.',
        code: 'MAX_ATTEMPTS_REACHED'
      };
    }

    otpData.attempts++;

    if (otpData.otp !== inputOtp) {
      this.otpStorage.set(sessionId, otpData);
      return {
        success: false,
        error: 'Code OTP incorrect',
        code: 'INVALID_OTP',
        attemptsLeft: this.MAX_ATTEMPTS - otpData.attempts
      };
    }

    // OTP valide
    otpData.verified = true;
    this.otpStorage.set(sessionId, otpData);

    return {
      success: true,
      identifier: otpData.identifier,
      type: otpData.type,
      verifiedAt: Date.now()
    };
  }

  // Vérifier si une session OTP est vérifiée
  isSessionVerified(sessionId) {
    const otpData = this.otpStorage.get(sessionId);
    return otpData && otpData.verified && Date.now() <= otpData.expiresAt;
  }

  // Nettoyer une session OTP
  cleanupSession(sessionId) {
    this.otpStorage.delete(sessionId);
  }

  // Envoyer l'OTP (SMS en production, console en dev)
  async sendOTP(phone, otpCode, method = 'sms') {
    // En développement, afficher dans la console
    if (process.env.NODE_ENV === 'development') {
      console.log('\n🔐 ========================================');
      console.log('📱 CODE OTP GÉNÉRÉ');
      console.log('========================================');
      console.log(`Téléphone: ${phone}`);
      console.log(`Code OTP: ${otpCode}`);
      console.log(`Méthode: ${method}`);
      console.log(`Expire dans: 5 minutes`);
      console.log('========================================\n');
      return { success: true };
    }

    // En production, intégrer un service SMS (Twilio, Orange SMS API, etc.)
    // TODO: Implémenter l'envoi SMS réel
    console.log(`[OTP] SMS à envoyer à ${phone}: ${otpCode}`);
    return { success: true };
  }

  // Obtenir les statistiques
  getStats() {
    const now = Date.now();
    const sessions = Array.from(this.otpStorage.values());
    
    return {
      totalSessions: sessions.length,
      activeSessions: sessions.filter(s => now <= s.expiresAt).length,
      expiredSessions: sessions.filter(s => now > s.expiresAt).length,
      verifiedSessions: sessions.filter(s => s.verified).length
    };
  }
}

module.exports = new OTPService();