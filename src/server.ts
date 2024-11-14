import express, { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
// import userRoutes from './routes/user.route';
// import contactRoutes from './routes/contact.route';
// import orderRoutes from './routes/order.route';
// import tripRoutes from './routes/trip.route'; // Importer le fichier des routes
// import stripePaymentRoutes from './routes/stripePayment.route';
import cors from 'cors';

dotenv.config();

const app = express();
app.use(express.json());

// Chargement du middleware CORS avant les routes
app.use(cors({
  origin: 'http://localhost:3010', // L'URL de votre frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Autoriser ces méthodes HTTP
  credentials: true, // Si vous utilisez des cookies ou d'autres méthodes d'authentification
}));

// Utilisez le routeur pour les utilisateurs
// app.use('/api/v1/users', userRoutes);
// app.use('/api/v1/contact', contactRoutes);
// app.use('/api/v1/orders', orderRoutes);
// app.use('/api/v1/stripe', stripePaymentRoutes);
// Utiliser les routes des trajets
// app.use('/api/v1/trips', tripRoutes);

// Middleware de gestion d'erreurs
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message });
});

const PORT = process.env.PORT || 8800;

// Connexion à MongoDB et démarrage du serveur
mongoose.connect(process.env.MONGO_URI!)
  .then(() => {
    console.log('MongoDB connecté');
    app.listen(PORT, () => console.log(`Serveur démarré sur le port ${PORT}`));
  })
  .catch((error) => {
    console.error('Erreur de connexion à MongoDB :', error);
  });


// import express, { Request, Response } from 'express';
// import dotenv from 'dotenv';
// dotenv.config();

// const app = express();
// const PORT = process.env.PORT || 8900;

// app.get('/', (req: Request, res: Response) => {
//   res.send('Hello, World!');
// });

// app.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}`);
// });
