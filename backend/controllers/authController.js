// controllers/authController.js
const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const USERS_FILE = path.join(__dirname, "../data/users.json");

function readUsers() {
  return JSON.parse(fs.readFileSync(USERS_FILE, "utf-8") || "[]");
}

exports.login = (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "Email et mot de passe requis" });

  const users = readUsers();
  const user = users.find(u => u.email === email);
  if (!user) return res.status(401).json({ error: "Utilisateur non trouvé" });

  const match = bcrypt.compareSync(password, user.password);
  if (!match) return res.status(401).json({ error: "Mot de passe incorrect" });

  const token = jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    process.env.JWT_SECRET || "junera-secret",
    { expiresIn: "7d" }
  );

  // renvoyer user sans password
  const { password: pw, ...safeUser } = user;
  res.json({ token, user: safeUser });
};
