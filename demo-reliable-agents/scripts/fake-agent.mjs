// Self-test fixture for the aggregator. Stands in for a real headless agent that
// read ticket NOTES-4567 and implemented it correctly: { id, summary }, the house
// { error: { code, message } } 404, read-only, lint-clean. In `mcp` mode it applies
// that patch (the cell "passes"); in any other mode it does nothing (the cell "fails").
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const [dir, mode] = process.argv.slice(2);
if (mode !== "mcp") process.exit(0);

const appPath = join(dir, "src", "app.js");
let app = readFileSync(appPath, "utf8");

app = app.replace(
  'import * as store from "./store.js";',
  'import * as store from "./store.js";\nimport { summarize } from "./summary-client.js";',
);

app = app.replace(
  '      return send(res, 404, { error: "not found" });\n    } catch (err) {',
  `      // GET /notes/:id/summary -> { id, summary }, 404 as the house envelope
      const summaryMatch = path.match(/^\\/notes\\/(\\d+)\\/summary$/);
      if (method === "GET" && summaryMatch) {
        const note = store.get(Number(summaryMatch[1]));
        if (!note) {
          return send(res, 404, {
            error: { code: "NOTE_NOT_FOUND", message: "note " + summaryMatch[1] + " not found" },
          });
        }
        return send(res, 200, { id: note.id, summary: summarize(note.body) });
      }

      return send(res, 404, { error: "not found" });
    } catch (err) {`,
);

writeFileSync(appPath, app);
