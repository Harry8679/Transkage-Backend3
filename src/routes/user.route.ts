import express, { Request, Response, NextFunction } from 'express';
import { changePassword, getUserProfile, loginUser, logoutUser, registerUser, updateUserProfile, verifyUser } from '../controllers/user.controller';
import { protect } from '../middlewares/auth.middleware';

const router = express.Router();

// Route d'inscription
router.post('/register', registerUser);

// Route de connexion
router.post('/login', loginUser);

// Route de vérification
router.get('/verification/:token', verifyUser);

// Ajouter la route de déconnexion
router.post('/logout', logoutUser);

// Route pour la modification du mot de passe
router.put('/change-password', protect, changePassword);

// Route pour obtenir le profil utilisateur (nécessite une authentification)
router.get('/profile', protect, getUserProfile);

// Route pour modifier le profil utilisateur (nécessite une authentification)
router.put('/update-profile', protect, updateUserProfile);

export default router;
