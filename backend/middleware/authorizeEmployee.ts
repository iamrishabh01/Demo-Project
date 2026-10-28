
import type { Request, Response, NextFunction } from "express";

const authorizeEmployee = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authUser = req.authUser;
  const requestedEmployeeId = req.userId;

  if (!authUser) {
    res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
    return;
  }

  if (authUser.role === "Admin") {
    next();
    return;
  }

  if (
    authUser.role === "Employee" &&
    authUser.employeeId !== null &&
    authUser.employeeId === requestedEmployeeId
  ) {
    next();
    return;
  }

  res.status(403).json({
    success: false,
    message: "You are not allowed to access this employee record.",
  });
};

export default authorizeEmployee;
