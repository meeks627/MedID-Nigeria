import { testMessage } from "../src/test";
import express from "express";

const app = express();
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", module: testMessage });
});

export default function handler(req: any, res: any) {
  app(req, res);
}
