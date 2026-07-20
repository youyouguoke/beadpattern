import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const KIMI_BASE_URL = process.env.KIMI_BASE_URL || 'https://api.moonshot.cn/v1';
const KIMI_API_KEY = process.env.KIMI_API_KEY || '';
const KIMI_MODEL = process.env.KIMI_MODEL || 'kimi-latest';

interface KimiResponse {
  choices: { message: { content: string } }[];
}

export interface Shape {
  type: 'ellipse' | 'circle';
  x: number;
  y: number;
  rx?: number;
  ry?: number;
  r?: number;
  color: string;
}

export interface ShapeDescription {
  subject: string;
  grid_size: number;
  background: string;
  shapes: Shape[];
}

export class KimiShapeGenerator {
  async generateShapeDescription(subject: string, gridSize: number): Promise<ShapeDescription> {
    if (!KIMI_API_KEY) {
      throw new Error('KIMI_API_KEY not set');
    }

    const prompt = `You are a fuse bead pattern designer. Design a ${subject} as a simple, cute, vertically symmetric bead pattern on a ${gridSize}x${gridSize} grid.

Output ONLY a JSON object with no markdown, no code fences, no explanation.

JSON structure:
{
  "subject": "${subject}",
  "grid_size": ${gridSize},
  "background": "#ffffff",
  "shapes": [
    { "type": "ellipse", "x": 14, "y": 14, "rx": 10, "ry": 9, "color": "#f5f5f5" },
    { "type": "circle", "x": 14, "y": 16, "r": 2, "color": "#f06292" },
    ...
  ]
}

Rules for shapes:
- Use only "ellipse" and "circle".
- All coordinates are integers from 0 to ${gridSize - 1}.
- x=0 is left, y=0 is top.
- Keep the design vertically symmetric around x = ${Math.floor(gridSize / 2)}.
- Use a small palette of 3-5 colors suitable for fuse beads (e.g., #1a1a1a black, #f5f5f5 white, #f06292 pink, #2e7d32 green, #fbc02d gold).
- Shapes listed from back to front (later shapes draw on top of earlier ones).
- The design should be cute, centered, and recognizable.
- Do not add any text or explanation outside the JSON.`;

    const res = await fetch(`${KIMI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${KIMI_API_KEY}`,
      },
      body: JSON.stringify({
        model: KIMI_MODEL,
        messages: [
          { role: 'system', content: 'You are a fuse bead pattern designer. You only output valid JSON shape descriptions.' },
          { role: 'user', content: prompt },
        ],
        temperature: 1,
      }),
    } as any);

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Kimi API error: ${res.status} ${text}`);
    }

    const data = (await res.json()) as KimiResponse;
    const content = data.choices?.[0]?.message?.content || '';

    // Clean up possible markdown fences
    const clean = content.replace(/```json/g, '').replace(/```/g, '').trim();

    try {
      return JSON.parse(clean) as ShapeDescription;
    } catch (e) {
      console.error('Failed to parse Kimi response:', clean);
      throw new Error(`Invalid JSON from Kimi: ${content}`);
    }
  }
}
