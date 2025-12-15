import express from "express";
import bcrypt from "bcryptjs";
import { pool } from "../db.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// Protection JWT
router.use(verifyToken);

// CREATE USER
router.post("/", async (req, res) => {
  try {
    console.log("📥 BODY REÇU :", req.body);

    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Champs manquants" });
    }

    // Email unique
    const existing = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ message: "Email déjà utilisé" });
    }

    // Hash mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("🔐 Password hashé OK");

    // Insert
    const result = await pool.query(
      `INSERT INTO users (name, email, password)
       VALUES ($1, $2, $3)
       RETURNING id, name, email`,
      [name, email, hashedPassword]
    );

    console.log("✅ Utilisateur créé :", result.rows[0]);

    res.status(201).json({
      message: "Utilisateur créé",
      user: result.rows[0],
    });

  } catch (err) {
    console.error("❌ ERREUR CREATE USER :", err.message);
    res.status(500).json({
      message: "Erreur serveur",
      error: err.message,
    });
  }
});

export default router;