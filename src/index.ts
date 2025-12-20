import cors from "cors";
import "dotenv/config";
import express from "express";
import energyGenerationRecordRouter from "./api/energy-generation-record";
import { globalErrorHandler } from "./api/middlewares/global-error-handling-middleware";
import { loggerMiddleware } from "./api/middlewares/logger-middleware";
import { connectDB } from "./infrastructure/db";

const server = express();
server.use(cors({ origin: true })); // Allow all origins for production

server.use(loggerMiddleware);

server.use(express.json());

server.use("/api/energy-generation-records", energyGenerationRecordRouter);

server.use(globalErrorHandler);

connectDB();

const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
