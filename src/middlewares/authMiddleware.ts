import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import "dotenv/config";

const SECRET_KEY = process.env.JWT_SECRET;

export const validateRequest = (
  req: any,
  res: Response,
  next: NextFunction
) => {
  // Implement your request validation logic here
  // This is just a basic example

  const { cookie } = req.headers;
  let token = null;

  const parts = cookie.split("; ");

  parts.forEach((part: any) => {
    if (part.startsWith("token=")) {
      token = part.replace("token=", "");
    }
  });

  if (!token) {
    return res.status(401).json({ message: "Token not found" });
  }

  try {
    const payload = jwt.verify(token, SECRET_KEY);
    // Attach the decoded payload to the request object for further use
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};
