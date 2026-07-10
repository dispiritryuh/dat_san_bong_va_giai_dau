import { expressjwt as jwt } from 'express-jwt';
import { Request, Response, NextFunction } from 'express';
import HttpException from '../model/http-exception.model';

const getTokenFromHeaders = (req: Request): string | undefined => {
  const authHeader = req.headers.authorization;
  if (
    authHeader && 
    (authHeader.split(' ')[0] === 'Token' || authHeader.split(' ')[0] === 'Bearer')
  ) {
    return authHeader.split(' ')[1];
  }
  return undefined; 
};

const police = {
  required: jwt({
    secret: process.env.JWT_SECRET || 'superSecret',
    getToken: getTokenFromHeaders,
    algorithms: ['HS256'],
    requestProperty: 'user', 
  }),
  
  optional: jwt({
    secret: process.env.JWT_SECRET || 'superSecret',
    credentialsRequired: false,
    getToken: getTokenFromHeaders,
    algorithms: ['HS256'],
    requestProperty: 'user',
  }),
};

export default police;

export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  const currentUser = (req as any).user;

  if (!currentUser || currentUser.role !== 'ADMIN') {
    return next(new HttpException(403, { error: 'only Admin' }));
  }
  
  next();
};