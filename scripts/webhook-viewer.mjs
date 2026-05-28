import { createServer } from "http";

const PORT = 3333;
const events = [];
let clients = [];

const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Webhook Viewer</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #0a0a0a; color: #e0e0e0; font-family: 'SF Mono', 'Fira Code', monospace; padding: 20px; }
  h1 { font-size: 18px; color: #6ee7b7; margin-bottom: 4px; }
  .url { color: #888; font-size: 13px; margin-bottom: 20px; }
  .url code { color: #facc15; background: #1a1a2e; padding: 2px 8px; border-radius: 4px; }
  #events { display: flex; flex-direction: column; gap: 12px; }
  .event { background: #111; border: 1px solid #222; border-radius: 8px; padding: 14px; animation: fadeIn .3s; }
  .event-header { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 12px; color: #888; }
  .method { color: #6ee7b7; font-weight: bold; }
  pre { background: #0d0d0d; padding: 10px; border-radius: 6px; overflow-x: auto; font-size: 13px; color: #c4b5fd; white-space: pre-wrap; word-break: break-all; }
  .empty { color: #555; text-align: center; margin-top: 60px; font-size: 14px; }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
</style>
</head>
<body>
<h1>Webhook Viewer</h1>
<p class="url">POST vers <code>http://localhost:${PORT}/webhook</code></p>
<div id="events"><p class="empty">En attente de webhooks...</p></div>
<script>
const evtSrc = new EventSource("/stream");
const container = document.getElementById("events");
let first = true;
evtSrc.onmessage = (e) => {
  if (first) { container.innerHTML = ""; first = false; }
  const data = JSON.parse(e.data);
  const div = document.createElement("div");
  div.className = "event";
  const time = new Date(data.timestamp).toLocaleTimeString("fr-FR");
  div.innerHTML = \`
    <div class="event-header">
      <span><span class="method">\${data.method}</span> \${data.path}</span>
      <span>\${time}</span>
    </div>
    <pre>\${data.body ? JSON.stringify(JSON.parse(data.body), null, 2) : "(empty body)"}</pre>
  \`;
  container.prepend(div);
};
</script>
</body>
</html>`;

const server = createServer(async (req, res) => {
  // SSE stream
  if (req.url === "/stream") {
    res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive", "Access-Control-Allow-Origin": "*" });
    clients.push(res);
    // Send existing events
    for (const evt of events) res.write(`data: ${JSON.stringify(evt)}\n\n`);
    req.on("close", () => { clients = clients.filter((c) => c !== res); });
    return;
  }

  // Dashboard
  if (req.url === "/" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(html);
    return;
  }

  // Webhook receiver
  if (req.url.startsWith("/webhook")) {
    let body = "";
    for await (const chunk of req) body += chunk;
    const event = { method: req.method, path: req.url, body, headers: req.headers, timestamp: Date.now() };
    events.push(event);
    // Broadcast to all SSE clients
    for (const client of clients) client.write(`data: ${JSON.stringify(event)}\n\n`);
    console.log(`${new Date().toLocaleTimeString("fr-FR")} — ${req.method} ${req.url}`);
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  res.writeHead(404);
  res.end("Not found");
});

server.listen(PORT, () => {
  console.log(`\n  Webhook Viewer`);
  console.log(`  Dashboard : http://localhost:${PORT}`);
  console.log(`  Webhook   : http://localhost:${PORT}/webhook\n`);
});
