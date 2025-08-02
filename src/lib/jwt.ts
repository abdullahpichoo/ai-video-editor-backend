import jwt, { SignOptions, JwtPayload as BaseJwtPayload } from "jsonwebtoken";
import { config } from "@/config";

export interface JwtPayload extends BaseJwtPayload {
  userId: string;
  email: string;
}

export const generateToken = (
  payload: Omit<JwtPayload, "iat" | "exp">
): string => {
  const options: SignOptions = {
    expiresIn: "24h",
  };
  return jwt.sign(payload, config.jwt.secret, options);
};

export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, config.jwt.secret) as JwtPayload;
};

export const decodeToken = (token: string): JwtPayload | null => {
  try {
    return jwt.decode(token) as JwtPayload;
  } catch {
    return null;
  }
};
