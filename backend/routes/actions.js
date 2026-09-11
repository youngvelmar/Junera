import express from "express";
import { pool } from "../db.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();
router.use(verifyToken);

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ai.id,
              ai.title AS action,
              ai.description,
              ai.priority AS priorite,
              ai.status AS statut,
              ai.due_date,
              ai.risk_if_not_done
       FROM action_item ai
       JOIN company_obligation_instance coi ON coi.id = ai.company_obligation_instance_id
       JOIN user_organization uo ON uo.organization_id = coi.organization_id
       WHERE uo.user_id = $1
       ORDER BY ai.due_date NULLS LAST, ai.id DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("GET ACTIONS ERROR:", error);
    res.status(500).json({ message: "Impossible de récupérer les actions" });
  }
});

router.patch("/:id", async (req, res) => {
  const { action, description, priorite, statut, due_date: dueDate } = req.body;
  try {
    const result = await pool.query(
      `UPDATE action_item ai
       SET title = COALESCE($1, ai.title),
           description = COALESCE($2, ai.description),
           priority = COALESCE($3, ai.priority),
           status = COALESCE($4, ai.status),
           due_date = COALESCE($5, ai.due_date),
           completed_at = CASE WHEN $4 = 'completed' THEN COALESCE(ai.completed_at, NOW()) ELSE ai.completed_at END,
           completed_by = CASE WHEN $4 = 'completed' THEN $6 ELSE ai.completed_by END
       FROM company_obligation_instance coi, user_organization uo
       WHERE ai.id = $7
         AND coi.id = ai.company_obligation_instance_id
         AND uo.organization_id = coi.organization_id
         AND uo.user_id = $6
       RETURNING ai.*`,
      [action ?? null, description ?? null, priorite ?? null, statut ?? null, dueDate ?? null, req.user.id, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ message: "Action introuvable" });
    res.json(result.rows[0]);
  } catch (error) {
    console.error("UPDATE ACTION ERROR:", error);
    res.status(500).json({ message: "Modification impossible" });
  }
});

export default router;
