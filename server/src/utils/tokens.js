import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

const jwtBaseOptions = {
  issuer: 'maths-tabel-api',
  audience: 'maths-tabel-client',
};

export const signAuthToken = ({ userId, role, sessionId }, expiresIn) =>
  jwt.sign(
    {
      sub: userId,
      role,
      sid: sessionId,
    },
    env.JWT_SECRET,
    { ...jwtBaseOptions, expiresIn },
  );

export const verifyAuthToken = (token) => jwt.verify(token, env.JWT_SECRET, jwtBaseOptions);

export const decodeAuthToken = (token) => jwt.decode(token);
