import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/user.model';
import { CustomRequest } from '../types/CustomRequest';

export const protect = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  let token;

  if (req.headers?.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };

      // Recherche de l'utilisateur
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        res.status(401).json({ message: 'Utilisateur non trouvé' });
        return;
      }

      req.user = user;
      next();
    } catch (error) {
      res.status(401).json({ message: 'Non autorisé, jeton invalide' });
    }
  } else {
    res.status(401).json({ message: 'Non autorisé, aucun jeton fourni' });
  }
};

export const adminMiddleware = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user as IUser;

    if (!user) {
      res.status(401).json({ message: 'Non autorisé' });
      return;
    }

    if (user.role !== 'admin') {
      res.status(403).json({ message: 'Accès refusé, administrateur uniquement' });
      return;
    }

    next();
  } catch (error) {
    res.status(500).json({ message: 'Erreur interne du serveur' });
  }
};
