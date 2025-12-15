const path = require("path");
const { readJson, writeJson, nextId } = require("./utilsFile");
const DATA = path.join(__dirname, "../data/actions.json");

exports.getActions = (req, res) => {
  const items = readJson(DATA);
  res.json(items);
};

exports.createAction = (req, res) => {
  const payload = req.body || {};
  if (!payload.action) return res.status(400).json({ error: "action requis" });

  const items = readJson(DATA);
  const id = nextId(items);
  const newItem = {
    id,
    action: payload.action,
    details: payload.details || "",
    statut: payload.statut || "À faire",
    createdAt: new Date().toISOString()
  };
  items.push(newItem);
  writeJson(DATA, items);
  res.status(201).json(newItem);
};

exports.updateAction = (req, res) => {
  const id = Number(req.params.id);
  const payload = req.body || {};
  const items = readJson(DATA);
  const idx = items.findIndex(i => Number(i.id) === id);
  if (idx === -1) return res.status(404).json({ error: "Introuvable" });

  const updated = { ...items[idx], ...payload, id: items[idx].id };
  items[idx] = updated;
  writeJson(DATA, items);
  res.json(updated);
};

exports.deleteAction = (req, res) => {
  const id = Number(req.params.id);
  const items = readJson(DATA);
  const idx = items.findIndex(i => Number(i.id) === id);
  if (idx === -1) return res.status(404).json({ error: "Introuvable" });

  const removed = items.splice(idx, 1)[0];
  writeJson(DATA, items);
  res.json({ success: true, removed });
};
