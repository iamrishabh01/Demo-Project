
import express, { type Router } from "express";
import authController from "../controllers/authController";
import authenticate from "../middleware/authenticate";

const router: Router = express.Router();

router.post("/login", authController.login);
router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);
router.get("/me", authenticate, authController.me);

export default router;
