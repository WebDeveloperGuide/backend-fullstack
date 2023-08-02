import { Router } from "express";
import {
  register,
  login,
  getUserProfile,
  getAllUsers,
  refreshTokenGenerate,
  logOut,
} from "../controllers/authController";
import { validateRequest } from "../middlewares/authMiddleware";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/logout", logOut);
router.get("/profile/:userId", validateRequest, getUserProfile);
router.get("/users", validateRequest, getAllUsers);
router.get("/refresh-token", refreshTokenGenerate);
export default router;
