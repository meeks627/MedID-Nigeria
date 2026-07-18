import express from "express";

const app = express();
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Express API is working" });
});

export default function handler(req: any, res: any) {
  app(req, res);
}
