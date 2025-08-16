import express from "express";
import fs from "fs";
import path from "path";
import cors from "cors";

const app = express();
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://valodash.vercel.app",
    "https://valodash-jonie-n.vercel.app",
  ],
  credentials: false
}));
app.use(express.json());

app.get("/", (_req, res) => res.send("OK"));
app.get("/health", (_req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3001;

const DATA_DIR = path.join(__dirname, "data");

const agents = [
  "Brimstone", "Phoenix", "Sage", "Sova", "Viper", "Cypher", "Reyna", "Killjoy", "Breach",
  "Omen", "Jett", "Raze", "Skye", "Yoru", "Astra", "Kay/o", "Chamber", "Neon", "Fade",
  "Harbor", "Gekko", "Deadlock", "Iso", "Clove", "Vyse", "Tejo", "Waylay"
];

const maps = [
  "Abyss", "Sunset", "Lotus", "Pearl", "Fracture", "Breeze", "Icebox", "Ascent",
  "Haven", "Bind", "Split", "Corrode"
];

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function fileFor(uid: string) {
  return path.join(DATA_DIR, `${uid}.json`);
}

function generateHeadshotRate(): number {
  const base = Math.random();
  if (base < 0.1) return parseFloat((5 + Math.random() * 5).toFixed(1));
  if (base < 0.4) return parseFloat((10 + Math.random() * 10).toFixed(1));
  if (base < 0.9) return parseFloat((15 + Math.random() * 10).toFixed(1));
  return parseFloat((25 + Math.random() * 15).toFixed(1));
}

function generateMockMatches(uid: string) {
  return Array.from({ length: 10 }, (_, i) => ({
    matchId: `${uid}-match-${i + 1}`,
    agent: agents[Math.floor(Math.random() * agents.length)],
    map: maps[Math.floor(Math.random() * maps.length)],
    kills: Math.floor(Math.random() * 25),
    deaths: Math.floor(Math.random() * 20),
    assists: Math.floor(Math.random() * 15),
    win: Math.random() > 0.5,
    date: new Date(Date.now() - i * 86400000).toISOString(),
    headshotPercentage: generateHeadshotRate(),
  }));
}

function seedIfMissing(uid: string) {
  ensureDataDir();
  const filePath = fileFor(uid);
  if (!fs.existsSync(filePath)) {
    const matches = generateMockMatches(uid);
    const payload = { uid, matches };
    fs.writeFileSync(filePath, JSON.stringify(payload, null, 2));
    console.log("WROTE:", filePath);
    return payload;
  }
  return null;
}

app.post("/seed", (req, res) => {
  const { uid } = req.body;
  if (!uid) return res.status(400).json({ error: "Missing uid" });

  ensureDataDir();
  const filePath = fileFor(uid);

  if (fs.existsSync(filePath)) {
    const existing = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    console.log("SEED: returning existing:", filePath);
    return res.json(existing);
  }

  const matches = generateMockMatches(uid);
  const payload = { uid, matches };
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2));
  console.log("SEED: wrote:", filePath);
  return res.json(payload);
});

app.get("/matches/:uid", (req, res) => {
  const { uid } = req.params;
  ensureDataDir();
  const filePath = fileFor(uid);

  if (!fs.existsSync(filePath)) {
    console.log("READ: missing, auto-seeding:", filePath);
    const payload = seedIfMissing(uid);
    return res.json(payload);
  }

  console.log("READ:", filePath, "exists:", true);
  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  return res.json(data);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
