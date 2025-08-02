import { Router } from "express";
import { AuthController } from "@/server/controllers/AuthController";
import { validate } from "@/middleware/validation";
import { signupSchema, signinSchema } from "@/server/validation/schemas";

const router = Router();
const authController = new AuthController();

router.post("/signup", validate(signupSchema), authController.signup.bind(authController));
router.post("/signin", validate(signinSchema), authController.signin.bind(authController));

export { router as authRoutes };
