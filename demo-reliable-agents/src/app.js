import http from "node:http";
import * as store from "./store.js";

// #region send
function send(res, status, body) {
  const json = JSON.stringify(body);
  res.writeHead(status, { "content-type": "application/json" });
  res.end(json);
}
// #endregion

async function readJson(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  if (chunks.length === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

// Every endpoint follows the same shape: match method + path, validate, respond.
// New endpoints should imitate this pattern exactly.
export function createApp() {
  return http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, "http://localhost");
      const path = url.pathname;
      const method = req.method;

      // GET /notes -> list all notes
      if (method === "GET" && path === "/notes") {
        return send(res, 200, store.list());
      }

      // POST /notes -> create a note (title and body required)
      if (method === "POST" && path === "/notes") {
        const body = await readJson(req);
        if (typeof body.title !== "string" || typeof body.body !== "string") {
          return send(res, 400, { error: "title and body are required strings" });
        }
        return send(res, 201, store.create({ title: body.title, body: body.body }));
      }

      // #region existing-404
      // GET /notes/:id -> one note, or 404
      const byId = path.match(/^\/notes\/(\d+)$/);
      if (method === "GET" && byId) {
        const note = store.get(Number(byId[1]));
        if (!note) return send(res, 404, { error: "not found" });
        return send(res, 200, note);
      }
      // #endregion

      return send(res, 404, { error: "not found" });
    } catch (err) {
      return send(res, 500, { error: String((err && err.message) || err) });
    }
  });
}
