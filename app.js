import cors from "cors";
import express from "express";
import authRoutes from "./routes/authRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import activityRoutes from "./routes/activityRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import mlRoutes from "./routes/mlRoutes.js";
import dlRoutes from "./routes/dlRoutes.js";

export function createServer() {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "2mb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, service: "pulsepath-api", time: Date.now() });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/dashboard", dashboardRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/activity", activityRoutes);
  app.use("/api/reports", reportRoutes);
  app.use("/api/ml", mlRoutes);
  app.use("/api/dl", dlRoutes);

  app.use((error, _req, res, _next) => {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  });

  return app;
}
