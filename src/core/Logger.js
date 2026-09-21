const http = require("http")

const stripAnsi = (str) => typeof str === "string" ? str.replace(/\u001b\[[0-9;]*[a-zA-Z]/g, "") : str
const clients = new Set()
const logs = []

function broadcast(text) {
    const clean = stripAnsi(String(text))
    logs.push(clean)
    if (logs.length > 1000) logs.shift()

    const data = `data: ${JSON.stringify(clean)}\n\n`
    for (const res of clients) {
        try { res.write(data) } catch { clients.delete(res) }
    }
}

function clear() {
    logs.length = 0
    for (const res of clients) {
        try { res.write("event: clear\ndata: {}\n\n") } catch { clients.delete(res) }
    }
}

function startServer(port = 3000) {
    http.createServer((req, res) => {
        if (req.url === "/stream") {
            res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", "Connection": "keep-alive" })
            res.write(`data: ${JSON.stringify(logs.join(""))}\n\n`)
            clients.add(res)
            req.on("close", () => clients.delete(res))
            return
        }

        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" })
        res.end(`<!DOCTYPE html><html><head><title>LxBot</title><style>body{background:#0d1117;color:#00ff66;font-family:monospace;margin:0;padding:12px}pre{white-space:pre-wrap;margin:0}</style></head><body><pre id="l"></pre><script>const l=document.getElementById("l");const es=new EventSource("/stream");es.onmessage=e=>{l.textContent+=JSON.parse(e.data);window.scrollTo(0,document.body.scrollHeight)};es.addEventListener("clear",()=>{l.textContent=""});</script></body></html>`)
    }).listen(port, "0.0.0.0", () => {
        console.log(`[Live Terminal] Listening to ${port}`)
    })
}

module.exports = {
    broadcast,
    clear,
    init() {
        const isShard = Boolean(process.env.SHARDS !== undefined)

        if (!isShard) {
            clear()
            broadcast("> lxbot@1.0.0 bot\n> node src/index.js\n\n")
            startServer()
        }

        const out = process.stdout.write.bind(process.stdout)
        const err = process.stderr.write.bind(process.stderr)

        process.stdout.write = function (chunk) {
            if (isShard && process.send) process.send({ type: "LOG", text: chunk })
            else if (!isShard) broadcast(chunk)
            return out.apply(process.stdout, arguments)
        }

        process.stderr.write = function (chunk) {
            if (isShard && process.send) process.send({ type: "LOG", text: chunk })
            else if (!isShard) broadcast(chunk)
            return err.apply(process.stderr, arguments)
        }
    }
}
