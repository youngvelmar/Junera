import express from "express";

export default function obligationsRoutes(pool) {
  const router = express.Router();

  router.get("/", async (req, res) => {
    try {
      const result = await pool.query("SELECT * FROM obligations ORDER BY id DESC");
      res.json(result.rows);
    } catch {
      res.status(500).json({ error: "Impossible de récupérer les obligations" });
    }
  });

  router.post("/", async (req, res) => {
    const { titre, description, statut } = req.body;
    if (!titre) return res.status(400).json({ error: "Le titre est obligatoire" });

    try {
      const result = await pool.query(
        "INSERT INTO obligations (titre, description, statut) VALUES ($1,$2,$3) RETURNING *",
        [titre, description || "", statut || "À faire"]
      );
      res.status(201).json(result.rows[0]);
    } catch {
      res.status(500).json({ error: "Création impossible" });
    }
  });

  return router;
}
