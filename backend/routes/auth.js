import express from "express";
import crypto from "node:crypto";
import { promisify } from "node:util";
import { pool } from "../db.js";
import { createToken, verifyToken } from "../middleware/auth.js";

const router = express.Router();
const scrypt = promisify(crypto.scrypt);

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = await scrypt(password, salt, 64);
  return `scrypt:${salt}:${Buffer.from(derivedKey).toString("hex")}`;
}

async function verifyPassword(password, storedHash) {
  if (!storedHash?.startsWith("scrypt:")) return false;
  const [, salt, keyHex] = storedHash.split(":");
  const derivedKey = await scrypt(password, salt, 64);
  const expected = Buffer.from(keyHex, "hex");
  const actual = Buffer.from(derivedKey);
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

router.post("/register", async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");

  if (!email || password.length < 8) {
    return res.status(400).json({ message: "E-mail valide et mot de passe de 8 caractères minimum requis" });
  }

  try {
    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.rows.length) return res.status(409).json({ message: "E-mail déjà utilisé" });

    const passwordHash = await hashPassword(password);
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, role)
       VALUES ($1, $2, 'client')
       RETURNING id, email, role, created_at`,
      [email, passwordHash]
    );

    const user = result.rows[0];
    const token = createToken({ id: user.id, email: user.email, role: user.role });
    res.status(201).json({ message: "Compte créé", token, user });
  } catch (error) {
    console.error("REGISTER ERROR:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

router.post("/login", async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");

  if (!email || !password) return res.status(400).json({ message: "E-mail et mot de passe requis" });

  try {
    const result = await pool.query(
      "SELECT id, email, password_hash, role FROM users WHERE email = $1",
      [email]
    );
    if (!result.rows.length) return res.status(401).json({ message: "Identifiants incorrects" });

    const user = result.rows[0];
    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) return res.status(401).json({ message: "Identifiants incorrects" });

    const token = createToken({ id: user.id, email: user.email, role: user.role });
    res.json({
      message: "Connexion réussie",
      token,
      user: { id: user.id, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

router.get("/me", verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, email, role, created_at FROM users WHERE id = $1",
      [req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ message: "Utilisateur introuvable" });
    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error("ME ERROR:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

export default router;
