import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

const SALT_ROUNDS = 12;

export async function hashPassword(password) {
  const peppered = `${password}${env.passwordPepper}`;
  return bcrypt.hash(peppered, SALT_ROUNDS);
}

export async function verifyPassword(password, hash) {
  const peppered = `${password}${env.passwordPepper}`;
  return bcrypt.compare(peppered, hash);
}

export function signToken(payload) {
  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn
  });
}

export function verifyToken(token) {
  return jwt.verify(token, env.jwtSecret);
}
