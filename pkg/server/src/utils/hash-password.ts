import crypto from "node:crypto";

export type HashPassword = typeof hashPassword;

const SHA = "sha512";

export function hashPassword(email: string, password: string, secret: string) {
  return crypto.createHmac(SHA, secret).update(email).update(password).digest("hex");
}

