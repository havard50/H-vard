import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import handler from "serve-handler";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
/** Repo root — do not rely on process.cwd() (Railway/Nixpacks can differ). */
const publicDir = path.resolve(__dirname, "..");

const port = parseInt(process.env.PORT || "3333", 10);

const server = createServer((req, res) => {
  const url = req.url || "/";

  if (url === "/health" || url.startsWith("/health?")) {
    res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("ok");
    return;
  }

  return handler(req, res, {
    public: publicDir,
    cleanUrls: false,
    directoryListing: false,
  });
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Static site root: ${publicDir}`);
  console.log(`Listening: http://0.0.0.0:${port}`);
});
