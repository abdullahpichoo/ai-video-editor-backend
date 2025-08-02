import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { BaseController } from "./BaseController";
import { getUsersCollection } from "@/lib/database";
import { generateToken } from "@/lib/jwt";
import type { CreateUserInput, User } from "@/server/models";

export class AuthController extends BaseController {
  async signup(req: Request, res: Response): Promise<void> {
    try {
      const body: CreateUserInput = req.body;
      const { email, password } = body;

      if (!email || !password) {
        this.badRequest(res, "Email and password are required");
        return;
      }

      if (password.length < 6) {
        this.badRequest(res, "Password must be at least 6 characters");
        return;
      }

      const users = await getUsersCollection();
      
      const existingUser = await users.findOne({ email });
      if (existingUser) {
        this.conflict(res, "User already exists");
        return;
      }

      const hashedPassword = await bcrypt.hash(password, 12);

      const newUser: User = {
        email,
        password: hashedPassword,
        ...(body.name && { name: body.name }),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await users.insertOne(newUser);

      const token = generateToken({
        userId: result.insertedId.toString(),
        email: email,
      });

      this.created(res, { 
        message: "User created successfully",
        userId: result.insertedId,
        token,
        user: {
          id: result.insertedId.toString(),
          email: email,
          name: body.name,
        }
      });
    } catch (error) {
      console.error("Signup error:", error);
      this.error(res, "Internal server error");
    }
  }

  async signin(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        this.badRequest(res, "Email and password are required");
        return;
      }

      const users = await getUsersCollection();
      const user = await users.findOne({ email });

      if (!user) {
        this.unauthorized(res, "Invalid credentials");
        return;
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        this.unauthorized(res, "Invalid credentials");
        return;
      }

      const token = generateToken({
        userId: user._id?.toString() || "",
        email: user.email,
      });

      this.success(res, {
        message: "Login successful",
        token,
        user: {
          id: user._id?.toString(),
          email: user.email,
          name: user.name,
        }
      });
    } catch (error) {
      console.error("Signin error:", error);
      this.error(res, "Internal server error");
    }
  }
}
