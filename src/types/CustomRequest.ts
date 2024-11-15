import { Request } from 'express';
import { IUser } from '../models/user.model';

export interface CustomRequest<T = any> extends Request {
    user?: IUser;
    params: { [key: string]: string }; // Pour capturer les paramètres de route
    body: T;
}

export interface CustomUpdatedRequest<T = any> extends Request {
    user?: IUser;
    params: { [key: string]: string }; // Pour capturer les paramètres de route
    body: T;
}
