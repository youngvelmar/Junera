import express from "express";
import cors from "cors";
import "dotenv/config";
import pkg from "pg";

// Routes
import obligationsRoutes from "./routes/obligations.js";

const { Pool } = pkg;
const app = express();

/* =========================
   MIDDLEWARES
========================= */
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"]
}));
app.use(express.json());

/* =========================
   DATABASE (PostgreSQL)
========================= */
if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL is missing");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production"
    ? { rejectUnauthorized: false }
    : false
});

// Vérification DB au démarrage
pool.query("SELECT 1")
  .then(() => console.log("✅ PostgreSQL connected"))
  .catch(err => {
    console.error("❌ PostgreSQL connection error", err);
    process.exit(1);
  });

/* =========================
   ROUTES
========================= */
app.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({
      status: "API JUNERA OK",
      db_time: result.rows[0].now
    });
  } catch (err) {
    res.status(500).json({ error: "DB connection error" });
  }
});

app.use("/api/obligations", obligationsRoutes);

/* =========================
   SERVER
========================= */
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
