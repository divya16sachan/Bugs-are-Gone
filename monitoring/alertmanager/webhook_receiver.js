const http = require('http');

const PORT = 5001;
const alertsLog = [];

const server = http.createServer((req, res) => {
  if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const timestamp = new Date().toISOString();
        console.log(`\n[ALERT RECEIVED ${timestamp}] Path: ${req.url}`);
        if (payload.alerts) {
          payload.alerts.forEach(a => {
            console.log(` -> Alert: ${a.labels?.alertname} | Status: ${a.status} | Severity: ${a.labels?.severity}`);
            console.log(`    Summary: ${a.annotations?.summary}`);
          });
        }
        alertsLog.push({ timestamp, url: req.url, payload });
      } catch (err) {
        console.error('Failed to parse alert body:', err);
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok' }));
    });
  } else if (req.method === 'GET' && req.url === '/alerts') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(alertsLog));
  } else {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Alertmanager Webhook Receiver is running\n');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Alertmanager Webhook Receiver running on http://0.0.0.0:${PORT}`);
});
