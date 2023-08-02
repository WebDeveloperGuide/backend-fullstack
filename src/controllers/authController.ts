import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { myDataSource } from "../config/dbConfig";
import { User } from "../model/User";
import "dotenv/config";

const SECRET_KEY = process.env.JWT_SECRET;
const userRepository = myDataSource.getRepository(User);

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, first_name, last_name } = req.body;

    // Check if the user already exists
    const existingUser = await userRepository.findOneBy({ email });

    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const user = new User();
    user.firstName = first_name;
    user.lastName = last_name;
    user.password = hashedPassword;
    user.email = email;
    await userRepository.save(user);

    return res.json({ message: "Registration successful" });
  } catch (error) {
    console.error("Error during registration:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Check if the user already exists
    // const existingUser = await userRepository.findOneBy({ email });
    const existingUser = await userRepository
      .createQueryBuilder("user")
      .addSelect("user.password")
      .where("user.email = :email", { email })
      .getOne();

    if (!existingUser) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Compare the hashed password with the provided password
    const isPasswordValid = await bcrypt.compare(
      password,
      existingUser.password
    );
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Generate a JWT token
    const token = jwt.sign({ email }, SECRET_KEY, { expiresIn: "120s" });
    delete existingUser["password"];

    const refreshToken = jwt.sign(
      {
        email: existingUser.email,
      },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "1h" }
    );

    await userRepository
      .createQueryBuilder()
      .update(User)
      .set({ refreshToken })
      .where("id = :id", { id: existingUser["id"] })
      .execute();

    // Assigning refresh token in http-only cookie
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "none",
      secure: true,
      maxAge: 60 * 60 * 1000,
    });

    // Assigning refresh token in http-only cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "none",
      secure: true,
      maxAge: 60 * 60 * 1000,
    });

    res.json({
      token,
      userDetail: existingUser,
      message: "Login Successfully",
    });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const logOut = async (req: Request, res: Response) => {
  try {
    // Assigning refresh token in http-only cookie
    res.cookie("token", "", {
      maxAge: -1,
    });

    // Assigning refresh token in http-only cookie
    res.cookie("refreshToken", "", {
      maxAge: -1,
    });

    res.json({
      message: "Logout Successfully",
    });
  } catch (error) {
    console.error("Error during logout:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const existingUser = await userRepository.findOneBy({
      id: parseInt(userId),
    });

    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    delete existingUser["password"];
    delete existingUser["refreshToken"];

    res.json(existingUser);
  } catch (error) {
    console.error("Error retrieving user by email:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const existingUsers = await userRepository.find({});

    if (!existingUsers) {
      return res.status(404).json({ message: "No record Found" });
    }

    res.json(existingUsers);
  } catch (error) {
    console.error("Error retrieving user by email:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const refreshTokenGenerate = async (req: Request, res: Response) => {
  try {
    const cookies = req.cookies;
    if (!cookies?.refreshToken) {
      return res.sendStatus(401);
    }
    const refreshToken = cookies.refreshToken;

    const foundUser = await userRepository
      .createQueryBuilder("user")
      .addSelect("user.password")
      .where("user.refreshToken = :refreshToken", { refreshToken })
      .getOne();

    if (!foundUser) {
      return res.sendStatus(403); //Forbidden
    }

    // evaluate jwt
    jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET,
      (err, decoded) => {
        if (err || foundUser.email !== decoded.email) {
          return res.sendStatus(403);
        }

        const accessToken = jwt.sign({ email: decoded.email }, SECRET_KEY, {
          expiresIn: "120s",
        });

        // Assigning refresh token in http-only cookie
        res.cookie("token", accessToken, {
          httpOnly: true,
          sameSite: "none",
          secure: true,
          maxAge: 60 * 60 * 1000,
        });

        res.json({ accessToken });
      }
    );
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
