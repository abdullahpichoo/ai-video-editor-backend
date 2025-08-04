import { Request, Response } from "express";
import { BaseController } from "./base.controller";
import { AuthService } from "@/services/auth.service";
import { signupSchema, signinSchema } from "@/routes/payload-validation/auth.validation";
import { AuthenticatedRequest } from "@/types/api-response";
import { SigninRequest, SignupRequest } from "@/types/auth";

export class AuthController extends BaseController {
  private authService = new AuthService();

  async signup(req: Request, res: Response): Promise<void> {
    try {
      const validationResult = signupSchema.safeParse(req.body);
      if (!validationResult.success) {
        this.badRequest(res, "Invalid signup data", validationResult.error.issues);
        return;
      }

      const signupData = validationResult.data as SignupRequest;
      const authResult = await this.authService.signup(signupData);

      res.cookie("authToken", authResult.token, this.authService.getCookieOptions());

      this.created(res, {
        message: "User created successfully",
        user: authResult.user,
      });
    } catch (error) {
      console.error("Signup error:", error);

      const isUserExists = error instanceof Error && error.message.includes("already exists");
      if (isUserExists) {
        this.conflict(res, error.message);
        return;
      }

      this.error(res, "Failed to create user");
    }
  }

  async signin(req: Request, res: Response): Promise<void> {
    try {
      const validationResult = signinSchema.safeParse(req.body);
      if (!validationResult.success) {
        this.badRequest(res, "Invalid signin data", validationResult.error.issues);
        return;
      }

      const signinData = validationResult.data as SigninRequest;
      const authResult = await this.authService.signin(signinData);

      res.cookie("authToken", authResult.token, this.authService.getCookieOptions());

      this.success(res, {
        message: "Login successful",
        user: authResult.user,
      });
    } catch (error) {
      console.error("Signin error:", error);

      const isInvalidCredentials = error instanceof Error && error.message.includes("Invalid credentials");
      if (isInvalidCredentials) {
        this.unauthorized(res, error.message);
        return;
      }

      this.error(res, "Failed to sign in");
    }
  }

  async logout(req: Request, res: Response): Promise<void> {
    res.clearCookie("authToken", this.authService.getCookieOptions());
    this.success(res, { message: "Logout successful" });
  }

  async validate(req: Request, res: Response): Promise<void> {
    const authReq = req as AuthenticatedRequest;

    if (!authReq.userId) {
      this.unauthorized(res, "User not authenticated");
      return;
    }

    this.success(res, {
      message: "User is authenticated",
      user: {
        id: authReq.userId,
        email: authReq.user?.email,
        name: authReq.user?.name,
      },
    });
  }
}
