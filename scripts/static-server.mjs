import { createServer } from "node:http";
import handler from "serve-handler";

const port = parseInt(process.env.PORT || "3333", 10);
const server = createServer((req, res) =>
  handler(req, res, {
    public: ".",
    cleanUrls: false,
    directoryListing: false,
  })
);

server.listen(port, "0.0.0.0", () => {
  console.log(`Static site: http://0.0.0.0:${port}`);
});
