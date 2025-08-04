import { Router } from "express";
import { AuthController } from "@/controllers/auth.controller";
import { validate } from "@/middleware/validation";
import { signupSchema, signinSchema } from "@/routes/payload-validation/auth.validation";
import { authenticate } from "@/middleware/auth";

const router = Router();
const authController = new AuthController();

router.post("/auth/signup", validate(signupSchema), authController.signup.bind(authController));
router.post("/auth/signin", validate(signinSchema), authController.signin.bind(authController));
router.post("/auth/logout", authController.logout.bind(authController));
router.get("/auth/validate", authenticate, authController.validate.bind(authController));

export { router as authRoutes };
