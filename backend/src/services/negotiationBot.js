const Negotiation = require('../models/Negotiation');
const Product = require('../models/Product');
const User = require('../models/User');

class NegotiationBot {
  constructor(io) {
    this.io = io;
    this.name = process.env.BOT_NAME || 'TYDA Bot';
    this.responseDelay = parseInt(process.env.BOT_RESPONSE_DELAY) || 2000;
    
    // Patterns de réponse en français (Côte d'Ivoire)
    this.responses = {
      greeting: [
        "Bonjour ! Je suis {botName}, votre assistant négociation. Comment puis-je vous aider ?",
        "Salut ! C'est {botName}. Prêt à négocier le meilleur prix ?",
        "Bonsoir ! {botName} à votre service pour une négociation équitable."
      ],
      priceAccepted: [
        "Excellent ! J'accepte votre proposition de {price}. C'est un bon prix !",
        "Parfait ! {price}, c'est accepté. Vous avez fait une bonne affaire !",
        "Super ! Je valide {price}. Félicitations pour cette négociation !"
      ],
      priceRejected: [
        "Désolé, {price} est trop bas. Le prix minimum que je peux accepter est {minPrice}.",
        "Ah non, {price} ne convient pas. Essayez plutôt aux alentours de {minPrice}.",
        "Ce prix de {price} est insuffisant. Que diriez-vous de {minPrice} ?"
      ],
      counterOffer: [
        "Hmm, {price} est un peu juste. Je vous propose {counterPrice}, qu'en pensez-vous ?",
        "Votre offre de {price} est intéressante, mais je peux descendre à {counterPrice} maximum.",
        "Pour {price}, c'est compliqué. Rencontrons-nous à {counterPrice} ?"
      ],
      finalOffer: [
        "C'est ma dernière offre : {price}. C'est le minimum absolu !",
        "Bon, je fais un effort final : {price}. C'est vraiment le dernier prix !",
        "Exceptionnellement, je descends à {price}. C'est ma limite !"
      ],
      maxAttemptsReached: [
        "Nous avons épuisé nos tentatives de négociation. Le prix reste à {originalPrice} FCFA.",
        "Désolé, nous ne pouvons pas continuer. Le prix final est {originalPrice} FCFA.",
        "Maximum de négociations atteint. Prix maintenu à {originalPrice} FCFA."
      ],
      invalidPrice: [
        "Le prix proposé n'est pas valide. Merci de proposer un montant entre {minPrice} et {maxPrice} FCFA.",
        "Montant incorrect. Veuillez saisir un prix entre {minPrice} et {maxPrice} FCFA.",
        "Prix invalide. La fourchette acceptable est {minPrice} - {maxPrice} FCFA."
      ],
      encouragement: [
        "C'est un début, mais vous pouvez faire une meilleure offre ! 😊",
        "Hmm, c'est encore un peu bas. Vous êtes sûr que c'est votre meilleure proposition ?",
        "On se rapproche, mais il faut encore améliorer un peu. Allez, je sais que vous pouvez faire mieux !",
        "Intéressant... mais je pense que vous pouvez proposer quelque chose de plus proche de la réalité. Essayez encore !",
        "Pas mal, mais on est encore loin du compte. Montrez-moi ce que vous avez vraiment en tête !"
      ]
    };
  }

  /**
   * Point d'entrée principal pour gérer les messages de négociation
   */
  async handleMessage(data) {
    try {
      const { negotiationId, message, proposedPrice, sessionId, userId } = data;
      
      // Récupérer la négociation
      let negotiation = await Negotiation.findById(negotiationId)
        .populate('product')
        .populate('customer')
        .populate('vendor');
      
      if (!negotiation) {
        return this.createErrorResponse('Négociation introuvable');
      }
      
      // Vérifier si la négociation est encore active
      if (!negotiation.isActive) {
        return this.createErrorResponse('Cette négociation n\'est plus active');
      }
      
      // Ajouter le message du client
      await negotiation.addMessage('customer', message, proposedPrice);
      
      // Traiter la proposition de prix
      if (proposedPrice) {
        return await this.processPriceProposal(negotiation, proposedPrice);
      }
      
      // Réponse générale si pas de prix proposé
      return this.createGreetingResponse(negotiation);
      
    } catch (error) {
      console.error('Erreur bot négociation:', error);
      return this.createErrorResponse('Erreur lors du traitement de votre message');
    }
  }

  /**
   * Traite une proposition de prix
   */
  async processPriceProposal(negotiation, proposedPrice) {
    const product = negotiation.product;
    const originalPrice = negotiation.originalPrice;
    const minPrice = product.minNegotiationPrice;
    
    // Vérifier si le prix est valide (doit être positif)
    if (proposedPrice < 0) {
      return this.createResponse(
        'invalidPrice',
        { minPrice, maxPrice: originalPrice },
        negotiation
      );
    }
    
    // Vérifier le nombre de tentatives
    if (negotiation.attempts >= negotiation.maxAttempts) {
      await negotiation.reject('Nombre maximum de tentatives atteint');
      return this.createResponse('maxAttemptsReached', { originalPrice }, negotiation);
    }
    
    // Calculer la stratégie de réponse
    const strategy = this.calculateStrategy(negotiation, proposedPrice);
    
    switch (strategy.action) {
      case 'accept':
        await negotiation.accept(proposedPrice);
        return this.createAcceptanceResponse(negotiation, proposedPrice);
        
      case 'encourage':
        return this.createEncouragementResponse(negotiation, proposedPrice);
        
      case 'reject':
        return this.createRejectionResponse(negotiation, proposedPrice, minPrice);
        
      default:
        return this.createErrorResponse('Erreur de stratégie');
    }
  }

  /**
   * Calcule la stratégie de négociation basée sur l'algorithme intelligent
   */
  calculateStrategy(negotiation, proposedPrice) {
    const product = negotiation.product;
    const originalPrice = negotiation.originalPrice;
    const minPrice = product.minNegotiationPrice;
    const currentAttempt = negotiation.attempts;
    
    // RÈGLE SIMPLE ET CLAIRE :
    // 1. Prix proposé >= Prix original → Accepter immédiatement
    if (proposedPrice >= originalPrice) {
      return { action: 'accept' };
    }
    
    // 2. Prix minimum <= Prix proposé < Prix original → Accepter
    if (proposedPrice >= minPrice) {
      return { action: 'accept' };
    }
    
    // 3. Prix proposé < Prix minimum → Refuser (avec encouragement les 2 premières fois)
    if (proposedPrice < minPrice) {
      // 1ère et 2ème tentative : Encourager sans donner de prix
      if (currentAttempt <= 2) {
        return { 
          action: 'encourage',
          message: this.getRandomResponse('encouragement')
        };
      }
      // 3ème tentative et plus : Donner une indication de prix
      return { 
        action: 'reject',
        message: this.getRandomResponse('priceRejected', { 
          price: this.formatPrice(proposedPrice), 
          minPrice: this.formatPrice(minPrice) 
        })
      };
    }
    
    // Cas par défaut (ne devrait jamais arriver avec la logique ci-dessus)
    return { action: 'reject' };
  }

  /**
   * Calcule une contre-offre intelligente
   */
  calculateCounterOffer(originalPrice, proposedPrice, minPrice, attemptFactor, popularityFactor) {
    // Base : milieu entre le prix proposé et le prix original
    let counterPrice = proposedPrice + (originalPrice - proposedPrice) * 0.5;
    
    // Ajustement selon le nombre de tentatives (plus flexible avec le temps)
    counterPrice -= (originalPrice - minPrice) * attemptFactor * 0.3;
    
    // Ajustement selon la popularité du produit
    counterPrice += (originalPrice - minPrice) * popularityFactor * 0.1;
    
    // S'assurer que le prix reste dans les limites
    counterPrice = Math.max(minPrice, Math.min(originalPrice - 100, counterPrice));
    
    return Math.round(counterPrice);
  }

  /**
   * Calcule le facteur temps (plus de temps écoulé = plus flexible)
   */
  calculateTimeFactor(negotiation) {
    const timeElapsed = Date.now() - negotiation.createdAt.getTime();
    const maxTime = 24 * 60 * 60 * 1000; // 24 heures
    return Math.min(timeElapsed / maxTime, 1);
  }

  /**
   * Calcule le facteur de popularité du produit
   */
  calculatePopularityFactor(product) {
    const viewsScore = Math.min(product.stats.views / 1000, 1);
    const salesScore = Math.min(product.stats.totalSales / 100, 1);
    return (viewsScore + salesScore) / 2;
  }

  /**
   * Crée une réponse d'acceptation
   */
  createAcceptanceResponse(negotiation, acceptedPrice) {
    const savings = negotiation.originalPrice - acceptedPrice;
    const savingsPercentage = Math.round((savings / negotiation.originalPrice) * 100);
    
    return {
      type: 'acceptance',
      status: 'accepted',
      message: this.getRandomResponse('priceAccepted', { 
        price: this.formatPrice(acceptedPrice) 
      }),
      finalPrice: acceptedPrice,
      savings: savings,
      savingsPercentage: savingsPercentage,
      negotiationId: negotiation._id,
      canAddToCart: true,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Crée une réponse d'encouragement (sans donner de prix)
   */
  createEncouragementResponse(negotiation, proposedPrice) {
    return {
      type: 'encouragement',
      status: 'negotiating',
      message: this.getRandomResponse('encouragement'),
      negotiationId: negotiation._id,
      attemptsLeft: negotiation.maxAttempts - negotiation.attempts,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Crée une réponse de rejet
   */
  createRejectionResponse(negotiation, rejectedPrice, minPrice) {
    return {
      type: 'rejection',
      status: 'rejected',
      message: this.getRandomResponse('priceRejected', {
        price: this.formatPrice(rejectedPrice),
        minPrice: this.formatPrice(minPrice)
      }),
      suggestedPrice: minPrice,
      negotiationId: negotiation._id,
      attemptsLeft: negotiation.maxAttempts - negotiation.attempts,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Crée une réponse de contre-offre
   */
  createCounterOfferResponse(negotiation, proposedPrice, counterPrice) {
    return {
      type: 'counter_offer',
      status: 'negotiating',
      message: this.getRandomResponse('counterOffer', {
        price: this.formatPrice(proposedPrice),
        counterPrice: this.formatPrice(counterPrice)
      }),
      counterPrice: counterPrice,
      originalPrice: negotiation.originalPrice,
      negotiationId: negotiation._id,
      attemptsLeft: negotiation.maxAttempts - negotiation.attempts,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Crée une réponse d'offre finale
   */
  createFinalOfferResponse(negotiation, finalPrice) {
    return {
      type: 'final_offer',
      status: 'final_offer',
      message: this.getRandomResponse('finalOffer', {
        price: this.formatPrice(finalPrice)
      }),
      finalPrice: finalPrice,
      negotiationId: negotiation._id,
      isLastChance: true,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Crée une réponse de salutation
   */
  createGreetingResponse(negotiation) {
    return {
      type: 'greeting',
      status: 'ready',
      message: this.getRandomResponse('greeting', { botName: this.name }),
      originalPrice: negotiation.originalPrice,
      minPrice: negotiation.product.minNegotiationPrice,
      maxAttempts: negotiation.maxAttempts,
      negotiationId: negotiation._id,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Crée une réponse d'erreur
   */
  createErrorResponse(message) {
    return {
      type: 'error',
      status: 'error',
      message: message,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Obtient une réponse aléatoire du pattern donné
   */
  getRandomResponse(pattern, variables = {}) {
    const responses = this.responses[pattern] || ['Réponse non disponible'];
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    
    // Remplacer les variables dans le message
    let message = randomResponse;
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{${key}}`, 'g');
      message = message.replace(regex, variables[key]);
    });
    
    return message;
  }

  /**
   * Formate un prix en FCFA
   */
  formatPrice(price) {
    return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
  }

  /**
   * Démarre une nouvelle négociation
   */
  async startNegotiation(productId, customerId, sessionId) {
    try {
      const product = await Product.findById(productId).populate('vendor');
      
      if (!product) {
        throw new Error('Produit introuvable');
      }
      
      if (!product.isNegotiable) {
        throw new Error('Ce produit n\'est pas négociable');
      }
      
      // Vérifier s'il y a déjà une négociation active
      const existingNegotiation = await Negotiation.findOne({
        product: productId,
        customer: customerId,
        status: 'en_cours'
      });
      
      if (existingNegotiation) {
        return existingNegotiation;
      }
      
      // Créer une nouvelle négociation
      const negotiation = new Negotiation({
        product: productId,
        customer: customerId,
        vendor: product.vendor._id,
        originalPrice: product.price,
        proposedPrice: product.price,
        sessionId: sessionId,
        botData: {
          strategy: 'moderate',
          minAcceptablePrice: product.minNegotiationPrice,
          maxDiscount: product.negotiation.percentage
        }
      });
      
      await negotiation.save();
      
      // Incrémenter le compteur de négociations du produit
      product.stats.negotiationRequests += 1;
      await product.save();
      
      return negotiation;
      
    } catch (error) {
      console.error('Erreur création négociation:', error);
      throw error;
    }
  }

  /**
   * Nettoie les négociations expirées (à exécuter périodiquement)
   */
  async cleanupExpiredNegotiations() {
    try {
      const count = await Negotiation.cleanupExpired();
      console.log(`🧹 ${count} négociations expirées nettoyées`);
      return count;
    } catch (error) {
      console.error('Erreur nettoyage négociations:', error);
      return 0;
    }
  }
}

module.exports = NegotiationBot;