import type { User } from "../modules/user/user.model";
import jwt from "jsonwebtoken";

export const makeGenerateAccessToken = (tokenSecret: string, expiresIn: string) => {
  return (userInfo: User) => generateAccessToken(userInfo, tokenSecret, expiresIn);
};

export const generateAccessToken = (userInfo: User, tokenSecret: string, expiresIn = "100s") =>
  jwt.sign(userInfo, tokenSecret, { expiresIn });

export const makeVerifyJwtToken = <T>(tokenSecret: string) => {
  return (token: string) =>
    new Promise<T>((resolve, reject) => {
      jwt.verify(token, tokenSecret, (err, user) => {
        if (err) reject(err);
        resolve(user as T);
      });
    });
};

export type GenerateAccessToken = typeof generateAccessToken;
export type MakeGenerateAccessToken = ReturnType<typeof makeGenerateAccessToken>;
export type MakeVerifyJwtToken = ReturnType<typeof makeVerifyJwtToken>;
