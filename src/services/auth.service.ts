import bcrypt from "bcryptjs";
import { getUsersCollection } from "@/lib/database";
import { generateToken } from "@/lib/jwt";
import { User } from "@/models";
import { config } from "@/config";
import { AuthResult, SigninRequest, SignupRequest } from "@/types/auth";

const USER_ALREADY_EXISTS = "User already exists";
const INVALID_CREDENTIALS = "Invalid credentials";
const BCRYPT_SALT_ROUNDS = 12;

export class AuthService {
  async signup(signupData: SignupRequest): Promise<AuthResult> {
    const users = await getUsersCollection();

    const existingUser = await users.findOne({ email: signupData.email });
    if (existingUser) {
      throw new Error(USER_ALREADY_EXISTS);
    }

    const hashedPassword = await bcrypt.hash(signupData.password, BCRYPT_SALT_ROUNDS);

    const newUser: User = {
      email: signupData.email,
      password: hashedPassword,
      ...(signupData.name && { name: signupData.name }),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await users.insertOne(newUser);

    const token = generateToken({
      userId: result.insertedId.toString(),
      email: signupData.email,
    });

    return {
      token,
      user: {
        id: result.insertedId.toString(),
        email: signupData.email,
        ...(signupData.name && { name: signupData.name }),
      },
    };
  }

  async signin(signinData: SigninRequest): Promise<AuthResult> {
    const users = await getUsersCollection();
    const user = await users.findOne({ email: signinData.email });

    if (!user) {
      throw new Error(INVALID_CREDENTIALS);
    }

    const isPasswordValid = await bcrypt.compare(signinData.password, user.password);
    if (!isPasswordValid) {
      throw new Error(INVALID_CREDENTIALS);
    }

    const token = generateToken({
      userId: user._id?.toString() || "",
      email: user.email,
    });

    return {
      token,
      user: {
        id: user._id?.toString() || "",
        email: user.email,
        ...(user.name && { name: user.name }),
      },
    };
  }

  getCookieOptions() {
    const isProduction = config.nodeEnv === "production";

    return {
      httpOnly: true,
      secure: isProduction,
      sameSite: "none" as const,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    };
  }
}
