require('dotenv').config();
const fetch = require('node-fetch');
async function main() {
  const start = Date.now();
  const res = await fetch(`${process.env.KIMI_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.KIMI_API_KEY}` },
    body: JSON.stringify({ model: process.env.KIMI_MODEL, messages: [{ role: 'user', content: 'Say hello in one word' }], temperature: 1 }),
    timeout: 300000,
  });
  const text = await res.text();
  console.log('status', res.status, 'time', Date.now()-start, 'ms');
  console.log(text.slice(0, 500));
}
main().catch(e => { console.error(e); process.exit(1); });
