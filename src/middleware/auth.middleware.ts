import jwt, { type JwtPayload } from "jsonwebtoken";
import type { RequestHandler } from "express";
import { env } from "../config/env.js";
import type { AuthenticatedUser } from "../types/domain.js";

const isAuthenticatedUser = (payload: string | JwtPayload): payload is AuthenticatedUser => {
  return (
    typeof payload !== "string" &&
    typeof payload.userId === "number" &&
    typeof payload.email === "string"
  );
};

const authenticate: RequestHandler = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token ?? "", env.jwtSecret);

    if (!isAuthenticatedUser(payload)) {
      throw new Error("Invalid token payload");
    }

    req.user = payload;
    next();
  } catch (_error: unknown) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

export default authenticate;
