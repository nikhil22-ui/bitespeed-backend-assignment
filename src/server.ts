import express from "express";
import dotenv from "dotenv";
import identifyRouter from "./routes/identify";
import { initDB } from "./db";

dotenv.config();

const app = express();
app.use(express.json());

app.use("/identify", identifyRouter);

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await initDB();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
  }
};

startServer();