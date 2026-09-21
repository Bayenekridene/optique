require('dotenv').config();

const dns = require('dns');

// Utiliser Google DNS pour résoudre MongoDB Atlas
dns.setServers(['8.8.8.8', '8.8.4.4']);

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const User = require('../models/User');

const createAdmin = async () => {
  try {
    // ======================================================
    // VÉRIFIER LES VARIABLES
    // ======================================================

    if (!process.env.MONGODB_URI) {
      throw new Error(
        'MONGODB_URI est absent du fichier .env'
      );
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      throw new Error(
        'ADMIN_EMAIL ou ADMIN_PASSWORD est absent du fichier .env'
      );
    }

    if (adminPassword.length < 8) {
      throw new Error(
        'Le mot de passe administrateur doit contenir au moins 8 caractères.'
      );
    }

    const normalizedEmail = adminEmail
      .trim()
      .toLowerCase();

    // ======================================================
    // CONNEXION MONGODB
    // ======================================================

    console.log('Connexion à MongoDB...');

    await mongoose.connect(process.env.MONGODB_URI);

    console.log('MongoDB connecté.');

    // ======================================================
    // VÉRIFIER SI L'EMAIL EXISTE
    // ======================================================

    const existingUser = await User.findOne({
      email: normalizedEmail
    });

    // ======================================================
    // SI L'UTILISATEUR EXISTE DÉJÀ
    // ======================================================

    if (existingUser) {

      console.log(
        `Un utilisateur existe déjà avec l'email : ${normalizedEmail}`
      );

      // Si c'est déjà un admin
      if (existingUser.role === 'admin') {

        console.log(
          'Cet utilisateur est déjà administrateur.'
        );

        await mongoose.disconnect();
        process.exit(0);
      }

      // Transformer le compte existant en admin
      console.log(
        'Transformation de cet utilisateur en administrateur...'
      );

      existingUser.nom =
        existingUser.nom || 'Administrateur';

      existingUser.email = normalizedEmail;

      existingUser.password =
        await bcrypt.hash(adminPassword, 12);

      existingUser.role = 'admin';

      existingUser.isApproved = true;

      await existingUser.save();

      console.log('======================================');
      console.log(' ADMIN CRÉÉ AVEC SUCCÈS');
      console.log('======================================');
      console.log(`Email : ${normalizedEmail}`);
      console.log('Mot de passe : enregistré de manière sécurisée');
      console.log('Rôle : admin');
      console.log('Approuvé : oui');
      console.log('======================================');

      await mongoose.disconnect();

      process.exit(0);
    }

    // ======================================================
    // HASH DU MOT DE PASSE
    // ======================================================

    const hashedPassword = await bcrypt.hash(
      adminPassword,
      12
    );

    // ======================================================
    // CRÉER LE COMPTE ADMIN
    // ======================================================

    const adminUser = new User({
      nom: 'Administrateur',
      email: normalizedEmail,
      password: hashedPassword,
      role: 'admin',
      isApproved: true
    });

    await adminUser.save();

    // ======================================================
    // SUCCÈS
    // ======================================================

    console.log('======================================');
    console.log(' ADMIN CRÉÉ AVEC SUCCÈS');
    console.log('======================================');
    console.log(`Email : ${normalizedEmail}`);
    console.log('Mot de passe : enregistré de manière sécurisée');
    console.log('Rôle : admin');
    console.log('Approuvé : oui');
    console.log('======================================');

    await mongoose.disconnect();

    process.exit(0);

  } catch (error) {

    console.error('======================================');
    console.error(' ERREUR CRÉATION ADMIN');
    console.error('======================================');

    console.error(error.message);

    await mongoose.disconnect().catch(() => {});

    process.exit(1);
  }
};

createAdmin();