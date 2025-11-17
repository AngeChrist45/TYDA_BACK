#!/usr/bin/env node

/**
 * Script de configuration rapide pour TYDA Vente Backend
 * Usage: node setup.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✅${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}❌${colors.reset} ${msg}`),
  title: (msg) => console.log(`\n${colors.cyan}${msg}${colors.reset}\n`),
};

// Configuration par défaut
const defaultConfig = {
  NODE_ENV: 'development',
  PORT: '5000',
  MONGODB_URI: 'mongodb://localhost:27017/tyda-vente',
  JWT_SECRET: '',
  EMAIL_FROM: 'noreply@tydavente.com',
  FRONTEND_WEB_URL: 'http://localhost:3000',
  LOG_LEVEL: 'info',
  MAX_LOGIN_ATTEMPTS: '5',
  LOCK_TIME: '30',
  SEED_DATABASE: 'false',
  ENABLE_CORS: 'true',
  MAX_FILE_SIZE: '5000000',
  BOT_RESPONSE_DELAY: '2000',
  BOT_MAX_ROUNDS: '5'
};

// Générer un secret JWT aléatoire
function generateJWTSecret() {
  const crypto = require('crypto');
  return crypto.randomBytes(64).toString('hex');
}

// Vérifier si Node.js est installé avec la bonne version
function checkNodeVersion() {
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.substring(1).split('.')[0]);
  
  if (majorVersion < 16) {
    log.error(`Node.js version ${nodeVersion} détectée. Version 16+ requise.`);
    process.exit(1);
  }
  
  log.success(`Node.js ${nodeVersion} ✓`);
}

// Vérifier si MongoDB est accessible
async function checkMongoDB(uri) {
  try {
    if (uri.includes('localhost') || uri.includes('127.0.0.1')) {
      // Vérifier si MongoDB local est démarré
      const { exec } = require('child_process');
      return new Promise((resolve) => {
        exec('mongo --eval "db.runCommand({ping:1})"', (error) => {
          if (error) {
            log.warning('MongoDB local non accessible. Assurez-vous qu\'il est démarré.');
            resolve(false);
          } else {
            log.success('MongoDB local accessible ✓');
            resolve(true);
          }
        });
      });
    } else {
      log.info('URI MongoDB distant configuré. Vérification au démarrage.');
      return true;
    }
  } catch (error) {
    log.warning('Impossible de vérifier MongoDB. Vérification au démarrage.');
    return true;
  }
}

// Créer le fichier .env
function createEnvFile(config) {
  const envContent = Object.entries(config)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  
  fs.writeFileSync('.env', envContent);
  log.success('Fichier .env créé');
}

// Questions de configuration interactive
async function askQuestion(question, defaultValue = '') {
  return new Promise((resolve) => {
    const prompt = defaultValue 
      ? `${question} (${defaultValue}): `
      : `${question}: `;
    
    rl.question(prompt, (answer) => {
      resolve(answer.trim() || defaultValue);
    });
  });
}

// Configuration interactive
async function interactiveSetup() {
  log.title('🚀 Configuration TYDA Vente Backend');
  
  const config = { ...defaultConfig };
  
  // JWT Secret
  config.JWT_SECRET = generateJWTSecret();
  log.success('Secret JWT généré automatiquement');
  
  // Port
  const port = await askQuestion('Port du serveur', defaultConfig.PORT);
  config.PORT = port;
  
  // MongoDB
  log.info('\n📊 Configuration Base de données:');
  const useLocal = await askQuestion('Utiliser MongoDB local? (y/n)', 'y');
  
  if (useLocal.toLowerCase() === 'y') {
    config.MONGODB_URI = `mongodb://localhost:27017/tyda-vente`;
  } else {
    const mongoUri = await askQuestion('URI MongoDB (Atlas ou autre)');
    if (mongoUri) {
      config.MONGODB_URI = mongoUri;
    }
  }
  
  // Frontend URL
  const frontendUrl = await askQuestion('URL Frontend Web', defaultConfig.FRONTEND_WEB_URL);
  config.FRONTEND_WEB_URL = frontendUrl;
  
  // Seeding
  const seedData = await askQuestion('Peupler avec des données de test? (y/n)', 'y');
  config.SEED_DATABASE = seedData.toLowerCase() === 'y' ? 'true' : 'false';
  
  // Services optionnels
  log.info('\n⚙️ Services optionnels (laisser vide pour ignorer):');
  
  const emailUser = await askQuestion('Email SMTP utilisateur (Gmail, etc.)');
  if (emailUser) {
    config.EMAIL_USER = emailUser;
    const emailPass = await askQuestion('Mot de passe email/App Password');
    config.EMAIL_PASS = emailPass;
  }
  
  const cloudinaryName = await askQuestion('Cloudinary Cloud Name');
  if (cloudinaryName) {
    config.CLOUDINARY_CLOUD_NAME = cloudinaryName;
    config.CLOUDINARY_API_KEY = await askQuestion('Cloudinary API Key');
    config.CLOUDINARY_API_SECRET = await askQuestion('Cloudinary API Secret');
  }
  
  const stripeSecret = await askQuestion('Stripe Secret Key (sk_test_...)');
  if (stripeSecret) {
    config.STRIPE_SECRET_KEY = stripeSecret;
    config.STRIPE_PUBLISHABLE_KEY = await askQuestion('Stripe Publishable Key (pk_test_...)');
  }
  
  return config;
}

// Installation des dépendances
function installDependencies() {
  log.info('📦 Installation des dépendances...');
  try {
    execSync('npm install', { stdio: 'inherit' });
    log.success('Dépendances installées');
  } catch (error) {
    log.error('Erreur lors de l\'installation des dépendances');
    throw error;
  }
}

// Vérification de l'installation
function verifyInstallation() {
  log.info('🔍 Vérification de l\'installation...');
  
  // Vérifier package.json
  if (!fs.existsSync('package.json')) {
    log.error('package.json non trouvé');
    return false;
  }
  
  // Vérifier node_modules
  if (!fs.existsSync('node_modules')) {
    log.error('node_modules non trouvé. Exécutez npm install');
    return false;
  }
  
  // Vérifier fichiers principaux
  const requiredFiles = [
    'src/app.js',
    'src/models/User.js',
    'src/routes/auth.js'
  ];
  
  for (const file of requiredFiles) {
    if (!fs.existsSync(file)) {
      log.error(`Fichier manquant: ${file}`);
      return false;
    }
  }
  
  log.success('Installation vérifiée');
  return true;
}

// Fonction principale
async function main() {
  try {
    console.log(`
${colors.cyan}
╔══════════════════════════════════════════════════════════════╗
║                    TYDA Vente Backend Setup                  ║
║                  Plateforme E-commerce 🇨🇮                   ║
╚══════════════════════════════════════════════════════════════╝
${colors.reset}
    `);
    
    // Vérifications préliminaires
    log.title('🔍 Vérifications système');
    checkNodeVersion();
    
    // Vérifier si .env existe déjà
    if (fs.existsSync('.env')) {
      const overwrite = await askQuestion('.env existe déjà. Le remplacer? (y/n)', 'n');
      if (overwrite.toLowerCase() !== 'y') {
        log.info('Configuration annulée. Fichier .env conservé.');
        rl.close();
        return;
      }
    }
    
    // Configuration interactive
    const config = await interactiveSetup();
    
    // Créer le fichier .env
    createEnvFile(config);
    
    // Vérifier MongoDB
    await checkMongoDB(config.MONGODB_URI);
    
    // Installer les dépendances si nécessaire
    if (!fs.existsSync('node_modules')) {
      installDependencies();
    }
    
    // Vérifier l'installation
    if (!verifyInstallation()) {
      log.error('Vérification échouée');
      rl.close();
      return;
    }
    
    // Seeding optionnel
    if (config.SEED_DATABASE === 'true') {
      log.info('🌱 Peuplement de la base de données...');
      try {
        execSync('node src/scripts/seedDatabase.js', { stdio: 'inherit' });
        log.success('Base de données peuplée avec succès');
      } catch (error) {
        log.warning('Erreur lors du seeding. Vous pouvez le faire plus tard avec: npm run seed');
      }
    }
    
    // Instructions finales
    log.title('🎉 Configuration terminée avec succès !');
    console.log(`
${colors.green}Prochaines étapes:${colors.reset}

1. ${colors.yellow}Démarrer le serveur de développement:${colors.reset}
   npm run dev

2. ${colors.yellow}Tester l'API:${colors.reset}
   curl http://localhost:${config.PORT}/api/auth/test

3. ${colors.yellow}Accéder à la documentation:${colors.reset}
   http://localhost:${config.PORT}/api/docs (à venir)

4. ${colors.yellow}Comptes de test (si seeding activé):${colors.reset}
   Admin: admin@tydavente.com / Admin@123456
   Vendeur: kofi.asante@email.com / Vendeur@123
   Client: mamadou.coulibaly@email.com / Client@123

${colors.cyan}Configuration sauvegardée dans .env${colors.reset}
${colors.cyan}Consultez README.md pour plus d'informations${colors.reset}
    `);
    
  } catch (error) {
    log.error(`Erreur de configuration: ${error.message}`);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Gestion des erreurs globales
process.on('uncaughtException', (error) => {
  log.error(`Erreur non gérée: ${error.message}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  log.error(`Promise rejetée: ${reason}`);
  process.exit(1);
});

// Exécuter si appelé directement
if (require.main === module) {
  main();
}

module.exports = { main };