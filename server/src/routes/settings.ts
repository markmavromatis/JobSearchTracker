import { Router } from "express";
import { getSetting, setSetting } from "../settingsRepo.js";

export const settingsRouter = Router();

settingsRouter.get("/", (_req, res) => {
  res.json({ background: getSetting("background") });
});

settingsRouter.put("/", (req, res) => {
  const { background } = req.body ?? {};
  if (typeof background !== "string") {
    return res.status(400).json({ error: "'background' must be a string." });
  }
  setSetting("background", background);
  res.json({ background });
});
