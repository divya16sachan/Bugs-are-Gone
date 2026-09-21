const http = require('http');
const https = require('https');
const { URL } = require('url');

const PORT = process.env.PORT || 5001;
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;
const alertsLog = [];

function forwardToSlack(payload) {
  if (!SLACK_WEBHOOK_URL) return;
  try {
    const slackUrl = new URL(SLACK_WEBHOOK_URL);
    const alerts = payload.alerts || [];
    for (const a of alerts) {
      const isFiring = a.status === 'firing';
      const emoji = isFiring ? (a.labels?.severity === 'critical' ? '🚨' : '⚠️') : '✅';
      const color = isFiring ? (a.labels?.severity === 'critical' ? '#E01E5A' : '#ECB22E') : '#2EB886';

      const slackMessage = {
        attachments: [
          {
            color: color,
            blocks: [
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: `${emoji} *[${(a.status || 'firing').toUpperCase()}] ${a.labels?.alertname || 'Alert'}* (Severity: \`${a.labels?.severity || 'unknown'}\`)\n` +
                        `*Service:* \`${a.labels?.service || 'platform'}\`\n` +
                        `*Summary:* ${a.annotations?.summary || 'No summary provided'}\n` +
                        (a.annotations?.description ? `*Description:* ${a.annotations?.description}\n` : '') +
                        (a.annotations?.runbook_url ? `*Runbook:* <${a.annotations?.runbook_url}|View Incident Runbook>` : '')
                }
              }
            ]
          }
        ]
      };

      const data = JSON.stringify(slackMessage);
      const options = {
        hostname: slackUrl.hostname,
        port: slackUrl.port || 443,
        path: slackUrl.pathname + slackUrl.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data)
        }
      };

      const req = https.request(options, (res) => {
        console.log(`[SLACK FORWARD] Sent alert ${a.labels?.alertname} - Response status: ${res.statusCode}`);
      });
      req.on('error', (e) => {
        console.error(`[SLACK FORWARD ERROR] Failed to send to Slack:`, e.message);
      });
      req.write(data);
      req.end();
    }
  } catch (err) {
    console.error('[SLACK FORWARD ERROR]', err.message);
  }
}

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
        forwardToSlack(payload);
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
  if (SLACK_WEBHOOK_URL) {
    console.log(`Slack forwarding enabled to: ${SLACK_WEBHOOK_URL.replace(/(\/services\/[^\/]+\/[^\/]+\/).+/, '$1***')}`);
  } else {
    console.log(`Slack forwarding: disabled (set SLACK_WEBHOOK_URL env var to enable)`);
  }
});

