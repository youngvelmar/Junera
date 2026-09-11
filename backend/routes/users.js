import express from "express";
import { pool } from "../db.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();
router.use(verifyToken);

router.get("/me", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, email, role, created_at, updated_at FROM users WHERE id = $1",
      [req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ message: "Utilisateur introuvable" });
    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error("USER ME ERROR:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

export default router;
