import { Router } from "express";
import { all } from "../db.js";

const router = Router();

router.get("/", (req, res) => {
  res.json(all("SELECT name, isActive, closesAt FROM stages ORDER BY name"));
});

export default router;
