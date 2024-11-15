import { Request, Response, NextFunction } from 'express';
import User from '../models/user.model';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import dotenv from 'dotenv';
import Token from '../models/token.model';
// import sendMail from '../utils/sendEmail'; // Assure-toi que cet import est correct
import mongoose from 'mongoose';
import asyncHandler = require('express-async-handler');
import sendMail from '../utils/sendEmail';
import { CustomRequest } from '../types/CustomRequest';


dotenv.config();

// Modèle d'utilisateur
export interface IUser extends mongoose.Document {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    status: number;
    _id: mongoose.Types.ObjectId;  // Assure-toi que _id est bien typé
}

export interface IToken extends mongoose.Document {
    _id: mongoose.Types.ObjectId;  // Assure-toi que _id est bien typé
}

const generateToken = (id: string): string => {
    return jwt.sign({ id }, process.env.JWT_SECRET as string, { expiresIn: '1d' });
}

export const registerUser = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { firstName, lastName, email, password } = req.body || {};
    console.log('Received body:', req.body);
  
    if (!firstName || !lastName || !email || !password) {
        res.status(400).json({ message: 'Tous les champs sont obligatoires' });
        return;
    }
    
    if (password.length < 7) {
        res.status(400);
        throw new Error('Le mot de passe doit contenir plus de 6 caractères');
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
        res.status(400).json({ message: 'Un utilisateur avec cet email existe déjà.' });
        return;
    }

    const user = await User.create({ firstName, lastName, email, password });
  
    const resetToken = crypto.randomBytes(32).toString('hex') + user._id;
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  
    const token = await new Token({
        userId: user._id,
        token: hashedToken,
        expiresAt: Date.now() + 60 * 60 * 1000, // 1 heure
    }).save();
  
    const resetUrl = `${process.env.FRONTEND_URI}/verification/${resetToken}`;
    
    // Utilisation de la nouvelle fonction `sendMail` avec Handlebars
    try {
        await sendMail(
            'Vérification de compte',             // Sujet
            user.email,                            // Envoyé à
            process.env.EMAIL_USER!,               // Envoyé de
            process.env.EMAIL_USER!,               // Réponse à
            'verification',                        // Template à utiliser (handlebars)
            user.firstName,                        // Prénom de l'utilisateur
            user.lastName,                         // Nom de l'utilisateur (ajouté ici)
            resetUrl                               // Lien de vérification (passé au template)
        );
        console.log('Email de vérification envoyé.');
    } catch (error) {
        console.error('Erreur lors de l\'envoi de l\'email:', error);
        res.status(500).json({ message: 'Erreur lors de l\'envoi de l\'email' });
    }
    

    if (user) {
        res.status(201).json({
            user: { 
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                token,
            },
        });
    } else {
        res.status(400).json({ message: 'Données utilisateur invalides' });
    }
});

// Connexion utilisateur
export const loginUser = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    // Validation des champs
    if (!email || !password) {
        res.status(400).json({ message: "Veuillez renseigner l'email et le mot de passe." });
        return;
    }

    // Vérification de l'existence de l'utilisateur
    const user = await User.findOne({ email });

    if (!user) {
        res.status(400).json({ message: "Utilisateur non trouvé, veuillez vous inscrire." });
        return;
    }

    // Vérification du statut de l'utilisateur
    if (user.status === 0 || !user.status) {
        res.status(400).json({
            message: "Veuillez vérifier votre email en cliquant sur le lien que vous avez reçu lors de l'inscription.",
        });
        return;
    }

    // Comparaison des mots de passe
    const passwordIsCorrect = await bcrypt.compare(password, user.password);

    // Génération du token si le mot de passe est correct
    if (passwordIsCorrect) {
        const token = generateToken((user._id as mongoose.Types.ObjectId).toString());

        res.cookie('token', token, {
            path: '/',
            httpOnly: true,
            expires: new Date(Date.now() + 1000 * 86400), // 1 jour
            sameSite: 'none',
            secure: true,
        });

        // Réponse avec l'utilisateur et le token
        res.status(200).json({ email: user.firstName, token });
    } else {
        res.status(400).json({ message: "Email ou mot de passe invalide." });
    }
});

// Vérifier le compte via le lien d'email
export const verifyUser = asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.params;

    console.log('Token reçu:', token);

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const tokenRecord = await Token.findOne({ token: hashedToken });

    console.log('Token haché:', hashedToken);  // Log du token haché

    if (!tokenRecord) {
        console.log('Aucun token trouvé ou expiré.');
        res.status(400).json({ message: 'Jeton invalide ou expiré.' });
        return; // Utilisation de `return` ici pour arrêter l'exécution de la fonction après l'envoi de la réponse
    }

    console.log('Enregistrement de token trouvé:', tokenRecord);

    const user = await User.findById(tokenRecord.userId);

    if (!user) {
        console.log('Utilisateur non trouvé.');
        res.status(400).json({ message: 'Utilisateur non trouvé.' });
        return;
    }

    if (user.status === 1) {
        console.log('Compte déjà vérifié.');
        res.status(400).json({ message: 'Compte déjà vérifié.' });
        return;
    }

    console.log('Statut utilisateur avant:', user.status);
    user.status = 1; // Passer le statut à 1 (compte validé)
    await user.save();
    console.log('Statut utilisateur après:', user.status);

    // Redirige vers le front-end avec un paramètre pour afficher le popup
    return res.redirect(`${process.env.FRONTEND_URI}/?verified=true`);

    // res.status(200).json({ message: 'Utilisateur vérifié.' });
});

// Ajouter la route logout
export const logoutUser = async (req: Request, res: Response) => {
    res.cookie('token', '', {
        path: '/',
        httpOnly: true,
        expires: new Date(0), // Expiration immédiate du cookie
        sameSite: 'none',
        secure: true, // Seulement en HTTPS
    });

    res.status(200).json({ message: 'Déconnexion réussie.' });
};

// Fonction pour modifier le mot de passe
export const changePassword = asyncHandler(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { oldPassword, newPassword } = req.body;

    // Vérifier si l'utilisateur est authentifié
    const user = await User.findById(req.user?._id);

    if (!user) {
        res.status(404).json({ message: "Utilisateur non trouvé." });
        return; // Stopper l'exécution après avoir envoyé la réponse
    }

    // Comparer l'ancien mot de passe avec celui stocké
    const passwordIsCorrect = await user.comparePassword(oldPassword);

    if (!passwordIsCorrect) {
        res.status(400).json({ message: "Ancien mot de passe incorrect." });
        return; // Stopper l'exécution après avoir envoyé la réponse
    }

    // Attribuer le nouveau mot de passe (le middleware se chargera de le hacher)
    user.password = newPassword;
    await user.save(); // Sauvegarder l'utilisateur avec le nouveau mot de passe (qui sera haché automatiquement par le middleware)

    // Répondre avec succès
    res.status(200).json({ message: "Mot de passe modifié avec succès." });
});

// Fonction pour obtenir les informations du profil utilisateur
export const getUserProfile = asyncHandler(async (req: CustomRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ message: 'Non autorisé, utilisateur non connecté' });
      return;
    }
  
    const user = await User.findById(req.user._id).select('-password');
  
    if (!user) {
      res.status(404).json({ message: 'Utilisateur non trouvé' });
      return;
    }
  
    // Retourner les champs, même s'ils sont vides ou null
    res.status(200).json({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone || '', // Retourner une chaîne vide si la valeur est undefined ou null
      avatar: user.avatar || '', // Idem
      residenceCountry: user.residenceCountry || '', // Idem
    });
});

// Fonction pour modifier le profil utilisateur
export const updateUserProfile = asyncHandler(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { firstName, lastName, email, phone, residenceCountry, avatar } = req.body;
  
    // Trouver l'utilisateur connecté
    const user = await User.findById(req.user?._id);
  
    if (!user) {
      res.status(404).json({ message: 'Utilisateur non trouvé.' });
      return;
    }
  
    // Mettre à jour uniquement les champs modifiés
    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.email = email || user.email;
    user.phone = phone || user.phone;
    user.residenceCountry = residenceCountry || user.residenceCountry;
    user.avatar = avatar || user.avatar;
  
    // Sauvegarder les modifications
    const updatedUser = await user.save();
  
    res.status(200).json({
      message: 'Profil mis à jour avec succès',
      user: {
        _id: updatedUser._id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        phone: updatedUser.phone,
        residenceCountry: updatedUser.residenceCountry,
        avatar: updatedUser.avatar,
      },
    });
});


