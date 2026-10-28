
import type { Request, Response, NextFunction } from "express";
import authService from "../services/authService";

const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
    return;
  }

  const token = authorization.slice(7).trim();

  if (!token) {
    res.status(401).json({
      success: false,
      message: "Access token is missing.",
    });
    return;
  }

  try {
    // Verify signature, issuer, audience and expiration.
    const tokenUser = authService.verifyAccessToken(token);

    // Load the current account so disabled accounts and changed roles
    // take effect immediately.
    const currentUser = await authService.getCurrentUser(tokenUser.id);

    req.authUser = {
      id: currentUser.id,
      email: currentUser.email,
      role: currentUser.role,
      employeeId: currentUser.employeeId,
    };

    next();
  } catch {
    res.status(401).json({
      success: false,
      message: "Invalid, expired, or inactive account.",
    });
  }
};

export default authenticate;
