const nodemailer = require('nodemailer');

class NotificationService {
  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
    
    // Configuration Twilio
    this.twilio = null;
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      try {
        const twilioClient = require('twilio');
        this.twilio = twilioClient(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        console.log('✅ Twilio configuré');
      } catch (error) {
        console.warn('⚠️ Twilio non configuré:', error.message);
      }
    }

    // Configuration Email
    this.emailTransporter = null;
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        this.emailTransporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
          }
        });
        console.log('✅ Email configuré');
      } catch (error) {
        console.warn('⚠️ Email non configuré:', error.message);
      }
    }
  }

  /**
   * Valider un email
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Valider un numéro ivoirien
   */
  isValidIvorianPhone(phone) {
    const phoneRegex = /^\+225[0-9]{8,10}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  }

  /**
   * Envoyer un SMS
   */
  async sendSMS(phone, message) {
    try {
      // Vérifier le format
      if (!this.isValidIvorianPhone(phone)) {
        throw new Error('Format téléphone ivoirien invalide');
      }

      // Mode production avec Twilio
      if (this.isProduction && this.twilio) {
        const result = await this.twilio.messages.create({
          body: message,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: phone
        });
        
        console.log(`📱 SMS envoyé à ${phone}: ${result.sid}`);
        return {
          success: true,
          provider: 'twilio',
          messageId: result.sid
        };
      }

      // Mode développement - Simulation
      console.log(`📱 [SIMULATION] SMS vers ${phone}:`);
      console.log(`   Message: ${message}`);
      
      return {
        success: true,
        provider: 'simulation',
        messageId: `sim_${Date.now()}`
      };

    } catch (error) {
      console.error('❌ Erreur envoi SMS:', error.message);
      throw new Error(`Échec envoi SMS: ${error.message}`);
    }
  }

  /**
   * Envoyer un email
   */
  async sendEmail(to, subject, html, text = null) {
    try {
      // Vérifier le format
      if (!this.isValidEmail(to)) {
        throw new Error('Format email invalide');
      }

      // Mode production avec SMTP
      if (this.isProduction && this.emailTransporter) {
        const result = await this.emailTransporter.sendMail({
          from: `"GOAT Marketplace" <${process.env.EMAIL_USER}>`,
          to,
          subject,
          html,
          text: text || html.replace(/<[^>]*>/g, '') // Fallback texte
        });

        console.log(`📧 Email envoyé à ${to}: ${result.messageId}`);
        return {
          success: true,
          provider: 'smtp',
          messageId: result.messageId
        };
      }

      // Mode développement - Simulation
      console.log(`📧 [SIMULATION] Email vers ${to}:`);
      console.log(`   Sujet: ${subject}`);
      console.log(`   Contenu: ${text || html.replace(/<[^>]*>/g, '')}`);
      
      return {
        success: true,
        provider: 'simulation',
        messageId: `sim_${Date.now()}`
      };

    } catch (error) {
      console.error('❌ Erreur envoi email:', error.message);
      throw new Error(`Échec envoi email: ${error.message}`);
    }
  }

  /**
   * Envoyer un code OTP par SMS
   */
  async sendOTPSMS(phone, code, type = 'login') {
    const typeMessages = {
      login: 'Connexion',
      register: 'Inscription',
      reset: 'Réinitialisation'
    };

    const message = `🔐 GOAT - ${typeMessages[type] || 'Vérification'}\n\nVotre code: ${code}\n\nValide 5 minutes.\nNe le partagez jamais.`;
    
    return await this.sendSMS(phone, message);
  }

  /**
   * Envoyer un code OTP par email
   */
  async sendOTPEmail(email, code, type = 'login') {
    const typeMessages = {
      login: 'Connexion',
      register: 'Inscription',  
      reset: 'Réinitialisation'
    };

    const actionType = typeMessages[type] || 'Vérification';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #FF7F00 0%, #00B04F 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .code { background: #FF7F00; color: white; font-size: 32px; font-weight: bold; text-align: center; padding: 20px; border-radius: 8px; letter-spacing: 8px; margin: 20px 0; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🐐 GOAT Marketplace</h1>
            <h2>Code de ${actionType}</h2>
          </div>
          <div class="content">
            <p>Bonjour,</p>
            <p>Voici votre code de vérification pour votre ${actionType.toLowerCase()} :</p>
            
            <div class="code">${code}</div>
            
            <div class="warning">
              ⚠️ <strong>Important :</strong>
              <ul>
                <li>Ce code expire dans <strong>5 minutes</strong></li>
                <li>Ne le partagez jamais avec personne</li>
                <li>L'équipe GOAT ne vous demandera jamais ce code</li>
              </ul>
            </div>
            
            <p>Si vous n'avez pas demandé ce code, ignorez cet email.</p>
            
            <div class="footer">
              <p>© 2024 GOAT Marketplace - La marketplace #1 en Côte d'Ivoire</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
GOAT Marketplace - Code de ${actionType}

Votre code de vérification: ${code}

⚠️ Important:
- Ce code expire dans 5 minutes
- Ne le partagez jamais
- Nous ne vous demanderons jamais ce code

Si vous n'avez pas demandé ce code, ignorez cet email.
    `;

    return await this.sendEmail(email, `GOAT - Code de ${actionType}`, html, text);
  }

  /**
   * Envoyer une notification de bienvenue
   */
  async sendWelcomeEmail(email, firstName) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #FF7F00 0%, #00B04F 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .cta { background: #FF7F00; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🐐 Bienvenue chez GOAT !</h1>
          </div>
          <div class="content">
            <h2>Salut ${firstName} ! 👋</h2>
            <p>Félicitations ! Votre compte GOAT a été créé avec succès.</p>
            
            <p>🎉 <strong>Vous rejoignez la marketplace #1 en Côte d'Ivoire !</strong></p>
            
            <p>Vous pouvez maintenant :</p>
            <ul>
              <li>🛍️ Découvrir des milliers de produits</li>
              <li>💬 Négocier les prix avec nos vendeurs</li>
              <li>🚚 Profiter de la livraison rapide</li>
              <li>⭐ Noter et commenter vos achats</li>
            </ul>
            
            <p style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" class="cta">
                Commencer à acheter 🛒
              </a>
            </p>
            
            <p>Merci de nous faire confiance !</p>
            <p><strong>L'équipe GOAT</strong> 🐐</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(email, 'Bienvenue chez GOAT ! 🐐', html);
  }
}

module.exports = new NotificationService();