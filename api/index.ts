export default function handler(req: any, res: any) {
  res.json({ status: "ok", path: req.url, method: req.method });
}
