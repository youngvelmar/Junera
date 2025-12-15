import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

/* =========================
   GET ALL OBLIGATIONS
========================= */
export const getObligations = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM obligations ORDER BY id ASC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Impossible de récupérer les obligations" });
  }
};

/* =========================
   CREATE OBLIGATION
========================= */
export const createObligation = async (req, res) => {
  const { titre, description, statut } = req.body;

  if (!titre) {
    return res.status(400).json({ error: "Le titre est obligatoire" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO obligations (titre, description, statut)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [titre, description || "", statut || "À faire"]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Impossible de créer l'obligation" });
  }
};

/* =========================
   UPDATE OBLIGATION
========================= */
export const updateObligation = async (req, res) => {
  const { id } = req.params;
  const { titre, description, statut } = req.body;

  try {
    const result = await pool.query(
      `UPDATE obligations
       SET titre = $1,
           description = $2,
           statut = $3
       WHERE id = $4
       RETURNING *`,
      [titre, description, statut, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Obligation introuvable" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Impossible de modifier l'obligation" });
  }
};

/* =========================
   DELETE OBLIGATION
========================= */
export const deleteObligation = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "DELETE FROM obligations WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Obligation introuvable" });
    }

    res.json({ message: "Obligation supprimée" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Impossible de supprimer l'obligation" });
  }
};
