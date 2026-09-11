import express from "express";
import cors from "cors";
import "dotenv/config";

import { checkDatabase } from "./db.js";
import authRoutes from "./routes/auth.js";
import usersRoutes from "./routes/users.js";
import obligationsRoutes from "./routes/obligations.js";
import actionsRoutes from "./routes/actions.js";

const app = express();
const PORT = Number(process.env.PORT || 4000);

const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:3000,http://127.0.0.1:5500")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.disable("x-powered-by");
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes("*") || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Origin not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
}));
app.use(express.json({ limit: "1mb" }));

app.get("/", async (_req, res) => {
  try {
    const dbTime = await checkDatabase();
    res.json({ status: "API JUNERA OK", database: "connected", db_time: dbTime });
  } catch (error) {
    console.error("HEALTHCHECK ERROR:", error.message);
    res.status(503).json({ status: "API JUNERA DEGRADED", database: "unavailable" });
  }
});

app.get("/api/health", async (_req, res) => {
  try {
    const dbTime = await checkDatabase();
    res.json({ ok: true, db_time: dbTime });
  } catch {
    res.status(503).json({ ok: false });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/obligations", obligationsRoutes);
app.use("/api/actions", actionsRoutes);

app.use((req, res) => res.status(404).json({ message: `Route introuvable: ${req.method} ${req.path}` }));

app.use((error, _req, res, _next) => {
  console.error("UNHANDLED ERROR:", error);
  res.status(500).json({ message: "Erreur interne du serveur" });
});

app.listen(PORT, () => {
  console.log(`JUNERA API listening on port ${PORT}`);
});
