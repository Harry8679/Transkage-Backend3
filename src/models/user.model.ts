import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone?: string;
    avatar?: string;
    residenceCountry?: string;
    idCardFront?: string;
    idCardBack?: string;
    secondId?: string;
    status: number;
    role: 'user' | 'admin';  // Ajout du rôle avec deux valeurs possibles
    comparePassword: (password: string) => Promise<boolean>;
}

const userSchema: Schema = new Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String },
    avatar: { type: String },
    residenceCountry: { type: String },
    idCardFront: { type: String },
    idCardBack: { type: String },
    secondId: { type: String },
    status: { type: Number, default: 0 },  // Le statut est défini à 0 par défaut
    role: { type: String, enum: ['user', 'admin'], default: 'user' },  // Ajout du champ rôle
});

// Middleware pour hacher le mot de passe avant de sauvegarder
userSchema.pre('save', async function (next) {
    const user = this as unknown as IUser;
  
    if (!user.isModified('password')) {
        return next();
    }
  
    try {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
        next();
    } catch (error) {
        return next(error as Error);
    }
});

// Méthode pour comparer le mot de passe
userSchema.methods.comparePassword = async function (password: string) {
    return await bcrypt.compare(password, this.password);
};

const User = mongoose.model<IUser>('User', userSchema);
export default User;
