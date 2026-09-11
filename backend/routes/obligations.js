import express from "express";
import { pool } from "../db.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();
router.use(verifyToken);

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT coi.id,
              ot.title AS titre,
              ot.description,
              coi.applicability_status AS statut,
              COALESCE(coi.severity, ot.severity) AS severite,
              coi.due_date,
              coi.comments
       FROM company_obligation_instance coi
       JOIN obligation_template ot ON ot.id = coi.obligation_template_id
       JOIN user_organization uo ON uo.organization_id = coi.organization_id
       WHERE uo.user_id = $1
       ORDER BY coi.due_date NULLS LAST, coi.id DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("GET OBLIGATIONS ERROR:", error);
    res.status(500).json({ message: "Impossible de récupérer les obligations" });
  }
});

router.patch("/:id", async (req, res) => {
  const { statut, due_date: dueDate, comments } = req.body;
  try {
    const result = await pool.query(
      `UPDATE company_obligation_instance coi
       SET applicability_status = COALESCE($1, coi.applicability_status),
           due_date = COALESCE($2, coi.due_date),
           comments = COALESCE($3, coi.comments),
           last_reviewed_at = NOW()
       FROM user_organization uo
       WHERE coi.id = $4
         AND uo.organization_id = coi.organization_id
         AND uo.user_id = $5
       RETURNING coi.*`,
      [statut ?? null, dueDate ?? null, comments ?? null, req.params.id, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ message: "Obligation introuvable" });
    res.json(result.rows[0]);
  } catch (error) {
    console.error("UPDATE OBLIGATION ERROR:", error);
    res.status(500).json({ message: "Modification impossible" });
  }
});

export default router;
