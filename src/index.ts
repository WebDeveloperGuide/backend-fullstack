import express from "express";
import cors from "cors";
import "dotenv/config";
import authRoutes from "./routes/authRoutes";
import { myDataSource } from "./config/dbConfig";
import cookieParser from "cookie-parser";

// Initialize Express
const app = express();

// parse requests of content-type - application/json, Read JSON data from request
app.use(express.json());

//middleware for cookies
app.use(cookieParser());

//Allow to call from different source
app.use(cors({ credentials: true, origin: "http://localhost:3000" }));

app.get("/api", (req, res) => {
  res.status(200).send({ message: "API path222" });
});

app.use("/api/auth", authRoutes);

//Read PORT from .env file OR Default set 5002
const API_PORT = process.env.API_PORT || 5001;

// Database Connection established
myDataSource
  .initialize()
  .then(() => {
    console.log("Data Source has been initialized!");

    app.listen(API_PORT, () => {
      console.log(`Backend Server is running on port ${API_PORT}`);
    });
  })
  .catch((err) => {
    console.error("Error during Data Source initialization", err);
  });
