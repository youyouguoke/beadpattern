import dotenv from 'dotenv';
import fetch from 'node-fetch';
import fs from 'fs';
dotenv.config();
const subject = 'cute panda face';
const prompt = `You are a fuse bead pattern designer. Create a 29x29 bead grid for a ${subject}.

Rules:
- Use exactly these characters:
  . = empty background
  W = white bead (face/body)
  B = black bead (outline, eyes, ears, paws)
  P = pink bead (nose/cheeks)
- Output only a 29x29 grid of characters, one row per line.
- The design should be centered and vertically symmetric.
- Do not include any explanation or markdown code fences.

Generate the grid now.`;

console.log('Sending grid request...');
const start = Date.now();
const res = await fetch(`${process.env.KIMI_BASE_URL}/chat/completions`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.KIMI_API_KEY}` },
  body: JSON.stringify({ model: process.env.KIMI_MODEL, messages: [{ role: 'user', content: prompt }], temperature: 1 }),
  timeout: 300000,
});
const text = await res.text();
console.log('status', res.status, 'time', Date.now()-start, 'ms');
fs.writeFileSync('/tmp/kimi-grid-response.txt', text);
console.log(text.slice(0, 1500));
