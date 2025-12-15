exports.signup = (req, res) => {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password) return res.status(400).json({ error: "Champs manquants" });
  
    const users = readUsers();
    if (users.find(u => u.email === email)) return res.status(409).json({ error: "Email déjà utilisé" });
  
    const hashed = require("bcryptjs").hashSync(password, 10);
    const newUser = { id: Date.now(), name, email, password: hashed };
    users.push(newUser);
  
    require("fs").writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    res.status(201).json({ message: "Compte créé avec succès" });
  };