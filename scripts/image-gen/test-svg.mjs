import dotenv from 'dotenv';
import fetch from 'node-fetch';
import fs from 'fs';
dotenv.config();
const subject = 'cute panda face';
const prompt = `You are a pixel icon designer. Generate a simple, centered SVG silhouette of a ${subject} in cute kawaii style.

Requirements:
- Front-facing or slightly 3/4 view
- Simple shapes only (circles, rounded rectangles, ellipses, paths)
- Black silhouette on transparent background
- No text, no gradients, no complex strokes
- Optimized for conversion to a small pixel grid (around 29x29 or 57x57)
- Use thick, connected shapes so it will look good when pixelated

Return ONLY the SVG content, starting with <svg and ending with </svg>. No markdown, no explanation.`;

console.log('Sending SVG request...');
const start = Date.now();
const res = await fetch(`${process.env.KIMI_BASE_URL}/chat/completions`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.KIMI_API_KEY}` },
  body: JSON.stringify({ model: process.env.KIMI_MODEL, messages: [{ role: 'user', content: prompt }], temperature: 1 }),
  timeout: 300000,
});
const text = await res.text();
console.log('status', res.status, 'time', Date.now()-start, 'ms');
fs.writeFileSync('/tmp/kimi-svg-response.txt', text);
console.log(text.slice(0, 1000));
