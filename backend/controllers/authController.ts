
import type { Request, Response, NextFunction } from "express";
import authService from "../services/authService";
import { authConfig } from "../config/auth";

const REFRESH_COOKIE = "refreshToken";

const cookieOptions = () => ({
  httpOnly: true,
  secure: authConfig.isProduction,
  sameSite: "strict" as const,
  path: "/auth",
  maxAge: authConfig.refreshDays * 24 * 60 * 60 * 1000,
});

const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body ?? {};

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
      return;
    }

    const result = await authService.login(email, password);

    res.cookie(REFRESH_COOKIE, result.refreshToken, cookieOptions());

    res.status(200).json({
      success: true,
      message: "Login successful.",
      accessToken: result.accessToken,
      user: result.user,
    });
  } catch (error) {
    next(error);
  }
};

const refresh = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.cookies?.[REFRESH_COOKIE];

    if (typeof token !== "string" || !token) {
      res.status(401).json({
        success: false,
        message: "Refresh session is missing.",
      });
      return;
    }

    const result = await authService.refreshSession(token);

    res.cookie(REFRESH_COOKIE, result.refreshToken, cookieOptions());

    res.status(200).json({
      success: true,
      accessToken: result.accessToken,
      user: result.user,
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.cookies?.[REFRESH_COOKIE];

    if (typeof token === "string" && token) {
      await authService.logout(token);
    }

    res.clearCookie(REFRESH_COOKIE, {
      ...cookieOptions(),
      maxAge: undefined,
    });

    res.status(200).json({
      success: true,
      message: "Logged out successfully.",
    });
  } catch (error) {
    next(error);
  }
};

const me = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authUser = req.authUser;

    if (!authUser) {
      res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
      return;
    }

    const user = await authService.getCurrentUser(authUser.id);

    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

const authController = { login, refresh, logout, me };

export default authController;
