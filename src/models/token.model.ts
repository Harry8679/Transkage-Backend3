import mongoose, { Schema, Document } from 'mongoose';

export interface IToken extends Document {
  userId: mongoose.Schema.Types.ObjectId;
  token: string;
  createdAt: Date;
  expiresAt: Date;
}

const tokenSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
  token: { type: String, required: true },
  createdAt: { type: Date, required: true, default: Date.now },
  expiresAt: { type: Date, required: true }
});

const Token = mongoose.model<IToken>('Token', tokenSchema);
export default Token;
