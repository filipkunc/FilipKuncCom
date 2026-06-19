import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import http from "node:http";
import { randomUUID } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

// Credentials live here, in the MCP server's environment only. With the HTTP
// transport this server runs in its OWN process/container, so an agent on the
// other side of the network never has filesystem or env access to these.
const TICKET_API_TOKEN = process.env.TICKET_API_TOKEN ?? "";
const SUMMARY_API_KEY = process.env.SUMMARY_API_KEY ?? "";

// Private tickets. Readable only with an authorized token, and only through this
// server. The acceptance criteria live in these files, not in the prompt and not
// in the agent's code. Tickets are markdown, one file per id, like a real tracker.
// #region tickets
const TICKETS_DIR = join(import.meta.dirname, "tickets");
const TICKETS = Object.fromEntries(
  readdirSync(TICKETS_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => [f.replace(/\.md$/, ""), readFileSync(join(TICKETS_DIR, f), "utf8").trim()]),
);
// #endregion

function summarizeText(text) {
  return (text.split(/(?<=[.!?])\s/)[0] ?? text).slice(0, 140).trim();
}

function buildServer() {
  const server = new McpServer({ name: "notes-spec", version: "1.0.0" });

  // #region get-ticket-tool
  server.registerTool(
    "get_ticket",
    {
      title: "Read a ticket",
      description:
        "Fetch a ticket from the issue tracker by id (e.g. NOTES-1234), including its acceptance criteria. Requires authorization, which this server holds.",
      inputSchema: { id: z.string().describe('e.g. "NOTES-1234"') },
    },
    async ({ id }) => {
      if (!TICKET_API_TOKEN) {
        return { content: [{ type: "text", text: "error: ticket system not authorized" }], isError: true };
      }
      const ticket = TICKETS[id];
      const text = ticket ?? `No ticket found for "${id}". Known: ${Object.keys(TICKETS).join(", ")}`;
      return { content: [{ type: "text", text }] };
    },
  );
  // #endregion

  server.registerTool(
    "summarize",
    {
      title: "Summarize text (authenticated upstream)",
      description:
        "Preview the summarizer output for a piece of text. The API key is held by this server; callers never receive it.",
      inputSchema: { text: z.string() },
    },
    async ({ text }) => {
      if (!SUMMARY_API_KEY) {
        return { content: [{ type: "text", text: "error: summarizer not configured" }], isError: true };
      }
      return { content: [{ type: "text", text: JSON.stringify({ summary: summarizeText(text) }) }] };
    },
  );

  return server;
}

const port = Number(process.env.MCP_HTTP_PORT ?? 0);

if (!port) {
  // Local default: stdio, spawned by the agent's runtime.
  await buildServer().connect(new StdioServerTransport());
} else {
  // Sidecar: HTTP transport, so the secret stays in this process and the agent
  // reaches the tools over the network without ever holding a credential.
  const transports = {};

  async function readBody(req) {
    let raw = "";
    for await (const chunk of req) raw += chunk;
    try { return raw ? JSON.parse(raw) : undefined; } catch { return undefined; }
  }

  const httpServer = http.createServer(async (req, res) => {
    if (!req.url || !req.url.startsWith("/mcp")) { res.writeHead(404).end(); return; }
    const sessionId = req.headers["mcp-session-id"];
    let transport = typeof sessionId === "string" ? transports[sessionId] : undefined;

    if (req.method === "POST") {
      const body = await readBody(req);
      if (!transport) {
        if (!isInitializeRequest(body)) {
          res.writeHead(400, { "content-type": "application/json" });
          res.end(JSON.stringify({ jsonrpc: "2.0", error: { code: -32000, message: "no session" }, id: null }));
          return;
        }
        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          onsessioninitialized: (sid) => { transports[sid] = transport; },
        });
        transport.onclose = () => {
          if (transport.sessionId) delete transports[transport.sessionId];
        };
        await buildServer().connect(transport);
      }
      await transport.handleRequest(req, res, body);
    } else if ((req.method === "GET" || req.method === "DELETE") && transport) {
      await transport.handleRequest(req, res);
    } else {
      res.writeHead(400).end();
    }
  });

  httpServer.listen(port, () => console.error(`notes-spec MCP (http) listening on :${port}/mcp`));
}
