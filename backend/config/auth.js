import "dotenv/config";

const secret = process.env.JWT_SECRET;
if (typeof secret !== "string" || !secret.trim()) {
  throw new Error("JWT_SECRET must be configured and non-empty.");
}

export const JWT_SECRET = secret;
