export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://bead-pattern-ai.youyouguoke.workers.dev";

export interface PaletteColor {
  hex: string;
  name: string;
  count: number;
  code: string;
}

export interface Pattern {
  slug: string;
  title: string;
  emoji: string;
  img: string;
  finished: string;
  difficulty: "Easy" | "Medium" | "Hard";
  grid: string;
  colors: number;
  beadCount: number;
  downloads: string;
  palette: PaletteColor[];
  steps: string[];
  related: { title: string; beads: number; difficulty: string }[];
  author?: string;
  description?: string;
  views?: number;
  status?: string;
  gridData?: PatternGrid;
  tags?: { name: string; slug: string }[];
  likes?: number;
  downloadsCount?: number;
  colorPalette?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Collection {
  title: string;
  slug: string;
  emoji: string;
  count: number;
  desc: string;
  color: string;
}

export interface Category {
  name: string;
  slug: string;
  icon: string;
  count: number;
  tag: "New" | "Popular" | "Trending" | "Seasonal";
}

export interface TrendingPattern extends Pattern {
  rank?: number;
}

export type BackendColorItem =
  | string
  | { hex?: string; name?: string; code?: string; count?: number };

export interface BackendPattern extends Record<string, unknown> {
  id: string;
  slug: string;
  title: string;
  description?: string;
  difficulty: string;
  status?: string;
  cover_image?: string | null;
  grid_size?: string;
  grid_data?: PatternGrid | string | string[][];
  created_at?: string;
  updated_at?: string;
  views?: number;
  estimated_beads?: number;
  color_count?: number;
  color_palette?: BackendColorItem[];
  likes?: number;
  downloads?: number;
}

export interface BackendTag {
  id: string;
  name: string;
  slug: string;
  type?: string;
  count?: number;
}

export interface BackendStep {
  step_number: number;
  description: string;
  grid_data?: PatternGrid | string;
  image?: string;
}

export interface BackendPatternDetail {
  pattern: BackendPattern;
  steps?: BackendStep[];
  tags?: { name: string; slug: string }[];
  analytics?: {
    views?: number;
    likes?: number;
    downloads?: number;
    updated_at?: string;
  };
}

export interface BackendListResponse<T> {
  success?: boolean;
  data?: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export type PatternGrid = number[][];

function generateCode(index: number): string {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  if (index < letters.length) return letters[index];
  return `${letters[Math.floor(index / letters.length) - 1] || "A"}${letters[index % letters.length]}`;
}

export function buildPalette(
  palette?: BackendColorItem[] | null
): PaletteColor[] {
  if (!palette || palette.length === 0) {
    return [
      { hex: "#161D1F", name: "Black", count: 1, code: "A" },
      { hex: "#FFFFFF", name: "White", count: 1, code: "B" },
      { hex: "#FF6B6B", name: "Red", count: 1, code: "C" },
    ];
  }
  return palette.map((item, index) => {
    if (typeof item === "string") {
      return {
        hex: item,
        name: `Color ${index + 1}`,
        count: 1,
        code: generateCode(index),
      };
    }
    return {
      hex: item.hex || "#000000",
      name: item.name || `Color ${index + 1}`,
      count: typeof item.count === "number" && item.count > 0 ? item.count : 1,
      code: item.code || generateCode(index),
    };
  });
}

export function capitalizeDifficulty(difficulty?: string): "Easy" | "Medium" | "Hard" {
  if (!difficulty) return "Easy";
  const normalized = difficulty.trim().toLowerCase();
  if (normalized === "hard") return "Hard";
  if (normalized === "medium") return "Medium";
  return "Easy";
}

export function generateEmoji(title: string): string {
  const map: Record<string, string> = {
    frog: "🐸",
    cat: "🐱",
    ghost: "👻",
    panda: "🐼",
    penguin: "🐧",
    bear: "🐻",
    duck: "🦆",
    bunny: "🐰",
    halloween: "🎃",
    sunflower: "🌻",
    shiba: "🐕",
    controller: "🎮",
    pancake: "🥞",
    ocean: "🌊",
    cherry: "🌸",
    robot: "🤖",
    rainbow: "🌈",
    watermelon: "🍉",
    cactus: "🌵",
    moon: "🌙",
    heart: "💖",
    dog: "🐕",
    game: "🎮",
  };
  const lower = title.toLowerCase();
  for (const key of Object.keys(map)) {
    if (lower.includes(key)) return map[key];
  }
  return "✨";
}

export function parseGridCount(grid?: string): number {
  if (!grid) return 0;
  const match = grid.match(/(\d+)\s*x\s*(\d+)/i);
  if (!match) return 0;
  return parseInt(match[1], 10) * parseInt(match[2], 10);
}

export function parseGrid(grid?: string): { width: number; height: number } {
  const count = parseGridCount(grid);
  if (!count) return { width: 24, height: 24 };
  const match = grid!.match(/(\d+)\s*x\s*(\d+)/i);
  return {
    width: parseInt(match![1], 10),
    height: parseInt(match![2], 10),
  };
}

export function normalizeBackendPattern(bp: BackendPattern): Pattern {
  const merged = mergePattern(bp, undefined);
  return merged;
}

export function mergePattern(
  backend: BackendPattern | Pattern,
  mock?: Pattern | undefined
): Pattern {
  const bp = backend as BackendPattern;
  const difficulty = capitalizeDifficulty(bp.difficulty);
  const grid = bp.grid_size || mock?.grid || "24x24";
  const beadCount =
    typeof bp.estimated_beads === "number" && bp.estimated_beads > 0
      ? bp.estimated_beads
      : mock?.beadCount || parseGridCount(grid);
  const downloadsValue =
    typeof bp.downloads === "number" && bp.downloads > 0
      ? bp.downloads
      : mock?.downloads || "0";
  const downloads =
    typeof downloadsValue === "number"
      ? downloadsValue >= 1000
        ? `${(downloadsValue / 1000).toFixed(1)}k`
        : String(downloadsValue)
      : downloadsValue;
  const palette = buildPalette(bp.color_palette as BackendColorItem[] | undefined);
  const steps = mock?.steps || [bp.description || `Build ${bp.title}`];
  return {
    slug: bp.slug,
    title: bp.title,
    emoji: mock?.emoji || generateEmoji(bp.title),
    img: bp.cover_image || mock?.img || "",
    finished: bp.cover_image || mock?.finished || "",
    difficulty,
    grid,
    colors: bp.color_count || palette.length || mock?.colors || 1,
    beadCount,
    downloads,
    palette,
    steps,
    related: mock?.related || [],
    description: bp.description || mock?.description,
    views: bp.views || mock?.views,
    status: bp.status || mock?.status,
    tags: ((bp.tags as { name: string; slug: string }[] | undefined) || mock?.tags),
    colorPalette: bp.color_palette
      ? bp.color_palette.map((c) => (typeof c === "string" ? c : c.hex || "#000000"))
      : mock?.colorPalette,
    createdAt: bp.created_at || mock?.createdAt,
    updatedAt: bp.updated_at || mock?.updatedAt,
  };
}

export function mergeGridFromSteps(steps?: BackendStep[]): PatternGrid | undefined {
  if (!steps || steps.length === 0) return undefined;
  const stepWithGrid =
    [...steps].reverse().find((s) => s.grid_data) ||
    steps.find((s) => s.grid_data);
  if (!stepWithGrid || !stepWithGrid.grid_data) return undefined;
  const raw = stepWithGrid.grid_data;
  if (Array.isArray(raw)) return raw as PatternGrid;
  try {
    const parsed = JSON.parse(raw as string);
    if (Array.isArray(parsed)) return parsed as PatternGrid;
  } catch {
    return undefined;
  }
  return undefined;
}

export function mergePatternDetail(
  detail: BackendPatternDetail,
  mock?: Pattern
): Pattern {
  const pattern = mergePattern(detail.pattern, mock);
  const gridData =
    mergeGridFromSteps(detail.steps) ||
    (detail.pattern.grid_data
      ? Array.isArray(detail.pattern.grid_data)
        ? (detail.pattern.grid_data as PatternGrid)
        : parseJsonGrid(detail.pattern.grid_data as string)
      : undefined);
  const tags = detail.tags || pattern.tags;
  const analytics = detail.analytics || {};
  const likes =
    analytics.likes ||
    detail.pattern.likes ||
    pattern.likes ||
    0;
  const downloadsCount =
    analytics.downloads ||
    detail.pattern.downloads ||
    pattern.downloadsCount ||
    0;
  const views = analytics.views || detail.pattern.views || pattern.views || 0;
  return {
    ...pattern,
    gridData,
    tags,
    likes,
    downloadsCount,
    views,
  };
}

function parseJsonGrid(raw: string): PatternGrid | undefined {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as PatternGrid;
  } catch {
    return undefined;
  }
  return undefined;
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(url, options);
    if (!res.ok) return null;
    const json = await res.json();
    return json as T;
  } catch {
    return null;
  }
}

export async function fetchWithFallback<T>(
  url: string,
  options?: RequestInit,
  fallback?: T
): Promise<T | undefined> {
  const json = await fetchJson<unknown>(url, options);
  if (!json || typeof json !== "object") return fallback;
  const obj = json as Record<string, unknown>;
  if ("success" in obj && obj.success === true && "data" in obj && obj.data !== undefined) {
    return obj.data as unknown as T;
  }
  if ("data" in obj && obj.data !== undefined) {
    return obj.data as unknown as T;
  }
  return fallback;
}

function isBackendArrayResponse(
  data: BackendPattern[] | { items?: BackendPattern[] }
): data is { items?: BackendPattern[] } {
  return !Array.isArray(data) && typeof data === "object" && data !== null;
}

function extractBackendItems<T>(
  data: T[] | { items?: T[] } | undefined
): T[] | undefined {
  if (!data) return undefined;
  if (Array.isArray(data)) return data;
  if (typeof data === "object" && "items" in data && Array.isArray(data.items)) {
    return data.items;
  }
  return undefined;
}

const basePatterns: Pattern[] = [
  {
    slug: "cute-frog",
    title: "Cute Frog Drinking Bubble Tea",
    emoji: "🐸",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBgxFYJto7lkC9x0ECKVPTXRfngOPqbHLfly2rxIeCkhEo0emZq-kSlicJjBp1J9h0khwEDJ_M-z8I-_irNiWEqH0h6HNMN1GFMq6LppAzHR77WN2bvvXKBmL3rGH8_Yzc9GSOT4jLEW5_iDPOm0QqX4yyegJkMeNngqlvoXAuPNVs4GcevjcBIvmplkV_wPQOxT9ELGaXgOaEDoqj5gc2Rnqf0AIBx8shTmg_ElsvMXwWUguesYf3MHcjOtTl8mEf85wacTr2ZosQ",
    finished: "https://lh3.googleusercontent.com/aida-public/AB6AXuBgxFYJto7lkC9x0ECKVPTXRfngOPqbHLfly2rxIeCkhEo0emZq-kSlicJjBp1J9h0khwEDJ_M-z8I-_irNiWEqH0h6HNMN1GFMq6LppAzHR77WN2bvvXKBmL3rGH8_Yzc9GSOT4jLEW5_iDPOm0QqX4yyegJkMeNngqlvoXAuPNVs4GcevjcBIvmplkV_wPQOxT9ELGaXgOaEDoqj5gc2Rnqf0AIBx8shTmg_ElsvMXwWUguesYf3MHcjOtTl8mEf85wacTr2ZosQ",
    difficulty: "Easy",
    grid: "32x32",
    colors: 12,
    beadCount: 842,
    downloads: "2.4k",
    palette: [
      { hex: "#2D6A4F", name: "Emerald Green", count: 124, code: "A5" },
      { hex: "#40916C", name: "Pond Green", count: 86, code: "B23" },
      { hex: "#52B788", name: "Minty Green", count: 52, code: "C12" },
      { hex: "#74C69D", name: "Pale Green", count: 38, code: "D4" },
      { hex: "#48DBFB", name: "Bubble Blue", count: 24, code: "E18" },
      { hex: "#FFFFFF", name: "White Pearl", count: 18, code: "F01" },
      { hex: "#161D1F", name: "Black", count: 10, code: "G10" },
    ],
    steps: [
      "Start with the outer outline of the frog in Emerald Green.",
      "Fill the body with Pond Green, leaving the belly white.",
      "Add the bubble tea cup with Bubble Blue and a white pearl highlight.",
      "Use Minty Green for shading on the cheeks and limbs.",
      "Finish with the black eyes and a small pink blush if desired.",
    ],
    related: [
      { title: "Kawaii Cat", beads: 320, difficulty: "Easy" },
      { title: "Space Rocket", beads: 410, difficulty: "Medium" },
      { title: "Strawberry Bear", beads: 280, difficulty: "Easy" },
    ],
  },
  {
    slug: "kawaii-cat",
    title: "Kawaii Cat",
    emoji: "🐱",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAoB35YtssNgeEtVQIX9I1WEk90aEVlmll9NmIITg8ow7ynWIsHRD3d9YegPvDM7pOWBEMqszJr4-yqlrTrVVTQjJ9fq8ciKbL4GFeJ_ctUC7IwFbOjt9QWVTltQfpnSKbF3t7h39EHtkmVUdK1mSe5r9OwKpkAJVpohIH3mtlJkA5myETC55EmqPq9otyDhNmETrqi9CqSzxHn7X3eUBytBF8Mkzk_b8vKKrCGJ0tJXaqZFv7-gyNfhcZh5eumAcCIQjoYxaZt1oI",
    finished: "https://lh3.googleusercontent.com/aida-public/AB6AXuAoB35YtssNgeEtVQIX9I1WEk90aEVlmll9NmIITg8ow7ynWIsHRD3d9YegPvDM7pOWBEMqszJr4-yqlrTrVVTQjJ9fq8ciKbL4GFeJ_ctUC7IwFbOjt9QWVTltQfpnSKbF3t7h39EHtkmVUdK1mSe5r9OwKpkAJVpohIH3mtlJkA5myETC55EmqPq9otyDhNmETrqi9CqSzxHn7X3eUBytBF8Mkzk_b8vKKrCGJ0tJXaqZFv7-gyNfhcZh5eumAcCIQjoYxaZt1oI",
    difficulty: "Easy",
    grid: "24x24",
    colors: 8,
    beadCount: 320,
    downloads: "1.8k",
    palette: [
      { hex: "#FFFFFF", name: "White", count: 100, code: "F01" },
      { hex: "#FFB7B2", name: "Pink", count: 45, code: "P12" },
      { hex: "#161D1F", name: "Black", count: 20, code: "G10" },
      { hex: "#F7D794", name: "Yellow", count: 10, code: "Y3" },
    ],
    steps: [
      "Outline the cat head in White.",
      "Fill ears and cheeks with Pink.",
      "Add black eyes and whiskers.",
      "Finish with small yellow nose.",
    ],
    related: [
      { title: "Cute Frog", beads: 352, difficulty: "Easy" },
      { title: "Strawberry Bear", beads: 280, difficulty: "Easy" },
      { title: "Pixel Bunny", beads: 330, difficulty: "Medium" },
    ],
  },
  {
    slug: "ghost-pattern",
    title: "Ghost Pattern",
    emoji: "👻",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDYDWUVX23wd7qczfMHVoYaYLpgsluCvBsSCtsVZn_tSHKgj-P4XJ5OVCX4_UHITeWBFN4Fbd_gi7dOnzt2nGXdQGswbx8JMCGI0qH_3T-vcLHrbCYiiz3ddhrxiPkh2dZPBuef8CFusdS7P6Nosf_mdsNCZa_6J9pQLrNVOex0qsJ2w5leOSowj431dYgVLOAh_RImgO-Qz_Yp_ZbNqH7Ifab9dP79oeMNS6B5ryjb4V9mvKdlb8583TAAkCxZeRrtuL-kDicWCUE",
    finished: "https://lh3.googleusercontent.com/aida-public/AB6AXuDYDWUVX23wd7qczfMHVoYaYLpgsluCvBsSCtsVZn_tSHKgj-P4XJ5OVCX4_UHITeWBFN4Fbd_gi7dOnzt2nGXdQGswbx8JMCGI0qH_3T-vcLHrbCYiiz3ddhrxiPkh2dZPBuef8CFusdS7P6Nosf_mdsNCZa_6J9pQLrNVOex0qsJ2w5leOSowj431dYgVLOAh_RImgO-Qz_Yp_ZbNqH7Ifab9dP79oeMNS6B5ryjb4V9mvKdlb8583TAAkCxZeRrtuL-kDicWCUE",
    difficulty: "Easy",
    grid: "16x16",
    colors: 5,
    beadCount: 198,
    downloads: "3.1k",
    palette: [
      { hex: "#FFFFFF", name: "White", count: 120, code: "F01" },
      { hex: "#161D1F", name: "Black", count: 16, code: "G10" },
      { hex: "#FF6B6B", name: "Red", count: 8, code: "R5" },
    ],
    steps: [
      "Shape the ghost body in White.",
      "Add oval black eyes.",
      "Draw a tiny red mouth.",
    ],
    related: [
      { title: "Halloween", beads: 200, difficulty: "Easy" },
      { title: "Cute Frog", beads: 352, difficulty: "Easy" },
      { title: "Kawaii Cat", beads: 320, difficulty: "Easy" },
    ],
  },
  {
    slug: "panda-ramen",
    title: "Panda Ramen",
    emoji: "🐼",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDnXGzBQmEYyfSXzisPzlkb2KRsYVsjE49rGly67etcruVADdy4SROOCeObMkQXany_LPsJT0bNyyCvIYtub89vwoYX8ZjiUtoA78tVMsH1-l2Fxhbgmk-Zd2NRsw7wPCTj72ik75gNgTF5O9zgOFfcImQGlbRC2RfccAonoE37-7Ns-2qGhhfqGFY0APXYVD_GLmnwMF5-ERR9DWJEospDqI260VF-XON0vYhmR2dKktVGXUDkSKc7kcpcF2UN0e9gs8nm0MEg238",
    finished: "https://lh3.googleusercontent.com/aida-public/AB6AXuDnXGzBQmEYyfSXzisPzlkb2KRsYVsjE49rGly67etcruVADdy4SROOCeObMkQXany_LPsJT0bNyyCvIYtub89vwoYX8ZjiUtoA78tVMsH1-l2Fxhbgmk-Zd2NRsw7wPCTj72ik75gNgTF5O9zgOFfcImQGlbRC2RfccAonoE37-7Ns-2qGhhfqGFY0APXYVD_GLmnwMF5-ERR9DWJEospDqI260VF-XON0vYhmR2dKktVGXUDkSKc7kcpcF2UN0e9gs8nm0MEg238",
    difficulty: "Medium",
    grid: "48x48",
    colors: 18,
    beadCount: 412,
    downloads: "920",
    palette: [
      { hex: "#FFFFFF", name: "White", count: 180, code: "F01" },
      { hex: "#161D1F", name: "Black", count: 90, code: "G10" },
      { hex: "#F4A261", name: "Orange", count: 40, code: "O8" },
      { hex: "#2A9D8F", name: "Teal", count: 30, code: "T6" },
    ],
    steps: [
      "Build the panda face with black ears and eye patches.",
      "Fill the ramen bowl in Orange.",
      "Add teal noodles and chopsticks.",
      "Place the panda leaning over the bowl.",
    ],
    related: [
      { title: "Food", beads: 400, difficulty: "Medium" },
      { title: "Cute Frog", beads: 352, difficulty: "Easy" },
      { title: "Bubble Tea Duck", beads: 290, difficulty: "Easy" },
    ],
  },
  {
    slug: "christmas-penguin",
    title: "Christmas Penguin",
    emoji: "🐧",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDBkHrHyo-iAUDP9j17ESnZwHiue-w3UYSdio8GicjGI6ExmTQWasc2BGXVGrrJfhXNE0LOFx8uo07VJ6Z1zGg0UguT7gpVl4n8kJJJznr0jrPGPeBoe3Q8OjgtGCj-daUM3rmdLOSVEHLlx3xYxt6RQWO3xAV12OUxnVYO0nU_LIdjve6SdrGkVAnPOFgW79aOQV7cbmaUT4LfeToUp4RNIdp1eJvMtB9KnVZsFlujuYoxjkVGLDENjaIk537Z2lNboXGGeeOnPqw",
    finished: "https://lh3.googleusercontent.com/aida-public/AB6AXuDBkHrHyo-iAUDP9j17ESnZwHiue-w3UYSdio8GicjGI6ExmTQWasc2BGXVGrrJfhXNE0LOFx8uo07VJ6Z1zGg0UguT7gpVl4n8kJJJznr0jrPGPeBoe3Q8OjgtGCj-daUM3rmdLOSVEHLlx3xYxt6RQWO3xAV12OUxnVYO0nU_LIdjve6SdrGkVAnPOFgW79aOQV7cbmaUT4LfeToUp4RNIdp1eJvMtB9KnVZsFlujuYoxjkVGLDENjaIk537Z2lNboXGGeeOnPqw",
    difficulty: "Medium",
    grid: "32x32",
    colors: 14,
    beadCount: 650,
    downloads: "1.5k",
    palette: [
      { hex: "#161D1F", name: "Black", count: 110, code: "G10" },
      { hex: "#FFFFFF", name: "White", count: 80, code: "F01" },
      { hex: "#E63946", name: "Red", count: 40, code: "R7" },
      { hex: "#F1FAEE", name: "Ice", count: 20, code: "I2" },
    ],
    steps: [
      "Form the penguin body in Black.",
      "Add white belly and face patches.",
      "Wrap a red scarf around the neck.",
      "Set on an ice base.",
    ],
    related: [
      { title: "Christmas", beads: 350, difficulty: "Easy" },
      { title: "Cute Frog", beads: 352, difficulty: "Easy" },
      { title: "Ghost", beads: 180, difficulty: "Easy" },
    ],
  },
  {
    slug: "strawberry-bear",
    title: "Strawberry Bear",
    emoji: "🐻",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBlponKu8fvQ9RawvPCBHNOC_O6vluHp3x_PgyanO_QfJGmpnJMsHW8n0jFGy-QF1NcZRqv2-S0fKRBC9ZOcntzHEDQhfTJ7Ns8lFxLFOVTl-jkX5f7i6g49aUs0_S9cOx_953VCppCwoNe_z1wOn72pVFApNPA544CAM_opu5eczuADofDRsX-pZSlVtEwDkIBe8TP8LdXeRWk7AkqGcVh7J65PiFKyA2nVyQPcMvvo3nddOihT4LjDJHAhzIX9omrKZP9fYRixbw",
    finished: "https://lh3.googleusercontent.com/aida-public/AB6AXuBlponKu8fvQ9RawvPCBHNOC_O6vluHp3x_PgyanO_QfJGmpnJMsHW8n0jFGy-QF1NcZRqv2-S0fKRBC9ZOcntzHEDQhfTJ7Ns8lFxLFOVTl-jkX5f7i6g49aUs0_S9cOx_953VCppCwoNe_z1wOn72pVFApNPA544CAM_opu5eczuADofDRsX-pZSlVtEwDkIBe8TP8LdXeRWk7AkqGcVh7J65PiFKyA2nVyQPcMvvo3nddOihT4LjDJHAhzIX9omrKZP9fYRixbw",
    difficulty: "Easy",
    grid: "24x24",
    colors: 9,
    beadCount: 380,
    downloads: "2.1k",
    palette: [
      { hex: "#E63946", name: "Strawberry Red", count: 100, code: "R8" },
      { hex: "#FFB7B2", name: "Pink", count: 60, code: "P12" },
      { hex: "#FFFFFF", name: "White", count: 30, code: "F01" },
      { hex: "#2D6A4F", name: "Green", count: 20, code: "A5" },
    ],
    steps: [
      "Shape the strawberry body in Red.",
      "Add a cute bear face with Pink cheeks.",
      "Place white seeds across the body.",
      "Top with green leaves.",
    ],
    related: [
      { title: "Food", beads: 300, difficulty: "Easy" },
      { title: "Kawaii Cat", beads: 320, difficulty: "Easy" },
      { title: "Cute Frog", beads: 352, difficulty: "Easy" },
    ],
  },
  {
    slug: "bubble-tea-duck",
    title: "Bubble Tea Duck",
    emoji: "🦆",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCAMUI6s1zmKtSNZgC241SX4TdAIFcvzAHkAK-6gP7PkDdyw494nlSN3eRumsT4SF_kS1ZsOlpRIA0w9Ivn_axf0GBMpTRky6QZCfed6QPDq1X_fvXnEUkfk-bSAjMp10OtRhircKvvLrMiCqS-xqE7IeuRY4V-UMx5v96cK92SXEQPVyIKYvzaEZvKL9784gZsssKleHkASSGvdS4W3E1fro3WuT3K6-tSt_CT1JTgS8Gxadia-rlnbMJoDKRboM0JBfjwPRN-Mcg",
    finished: "https://lh3.googleusercontent.com/aida-public/AB6AXuCAMUI6s1zmKtSNZgC241SX4TdAIFcvzAHkAK-6gP7PkDdyw494nlSN3eRumsT4SF_kS1ZsOlpRIA0w9Ivn_axf0GBMpTRky6QZCfed6QPDq1X_fvXnEUkfk-bSAjMp10OtRhircKvvLrMiCqS-xqE7IeuRY4V-UMx5v96cK92SXEQPVyIKYvzaEZvKL9784gZsssKleHkASSGvdS4W3E1fro3WuT3K6-tSt_CT1JTgS8Gxadia-rlnbMJoDKRboM0JBfjwPRN-Mcg",
    difficulty: "Easy",
    grid: "24x24",
    colors: 7,
    beadCount: 356,
    downloads: "2.9k",
    palette: [
      { hex: "#F7D794", name: "Yellow", count: 120, code: "Y3" },
      { hex: "#F4A261", name: "Orange", count: 40, code: "O8" },
      { hex: "#48DBFB", name: "Bubble Blue", count: 30, code: "E18" },
      { hex: "#FFFFFF", name: "White", count: 20, code: "F01" },
    ],
    steps: [
      "Shape the duck body in Yellow.",
      "Add an orange beak and feet.",
      "Place a blue bubble tea cup beside it.",
      "Add white highlights.",
    ],
    related: [
      { title: "Food", beads: 250, difficulty: "Easy" },
      { title: "Cute Frog", beads: 352, difficulty: "Easy" },
      { title: "Kawaii Cat", beads: 320, difficulty: "Easy" },
    ],
  },
  {
    slug: "pixel-bunny",
    title: "Pixel Bunny",
    emoji: "🐰",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBxoYk69P9StN6wav9jZOzxbN3tooGoa8NBNY6dVjlSqxymcjfGByFd1U5exFJrBUsibmRYhOr2j102EcgExO0BAFk74xnzhq4XkIEx7KfW3KpoEoG2N7e1JcTql3AMAkKYfXhpmJqFoyvLvA1nlugjqTFoz1OG-IzV7z2ZxhzzzNm9IYeZVpQCvqyhVDmqYMBhuP8EyE7WJ0TZ_pwIIpDA_uZw9ZDyctW69HwQVA_TfkjqIbsHKWKoX6lnbDhykWATqbAoZ_RObWs",
    finished: "https://lh3.googleusercontent.com/aida-public/AB6AXuBxoYk69P9StN6wav9jZOzxbN3tooGoa8NBNY6dVjlSqxymcjfGByFd1U5exFJrBUsibmRYhOr2j102EcgExO0BAFk74xnzhq4XkIEx7KfW3KpoEoG2N7e1JcTql3AMAkKYfXhpmJqFoyvLvA1nlugjqTFoz1OG-IzV7z2ZxhzzzNm9IYeZVpQCvqyhVDmqYMBhuP8EyE7WJ0TZ_pwIIpDA_uZw9ZDyctW69HwQVA_TfkjqIbsHKWKoX6lnbDhykWATqbAoZ_RObWs",
    difficulty: "Medium",
    grid: "32x32",
    colors: 6,
    beadCount: 330,
    downloads: "1.4k",
    palette: [
      { hex: "#FFFFFF", name: "White", count: 140, code: "F01" },
      { hex: "#FFB7B2", name: "Pink", count: 50, code: "P12" },
      { hex: "#161D1F", name: "Black", count: 18, code: "G10" },
    ],
    steps: [
      "Outline the bunny body in White.",
      "Add long ears and pink inner ears.",
      "Draw black eyes and nose.",
    ],
    related: [
      { title: "Animals", beads: 300, difficulty: "Easy" },
      { title: "Cute Frog", beads: 352, difficulty: "Easy" },
      { title: "Kawaii Cat", beads: 320, difficulty: "Easy" },
    ],
  },
  {
    slug: "halloween",
    title: "Halloween",
    emoji: "🎃",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCq5A0OAvFhb371dF5UerEYoZrRWEfRXI7SONqpJ-zlCobtkbC8dUqLbIlzkChbYjkvDBsnUMnhLEUmok0EbpEwUlUN7R1dNnYQYnBctrz6Khii3QTN5sUTuCVDGl7Hr9rRmRrvK1T5ESSVtqX4mbhjbnmn68EC_alysazpGDInbYeifx7YYUoTJ5d8BJLodWET9zsnR9bmncIYZa602IPEi3Dq1xbo_ZrKZFdPXQGlsy2v2MRdfUXlND3xFLF1LTBRKg-6g5_khrg",
    finished: "https://lh3.googleusercontent.com/aida-public/AB6AXuCq5A0OAvFhb371dF5UerEYoZrRWEfRXI7SONqpJ-zlCobtkbC8dUqLbIlzkChbYjkvDBsnUMnhLEUmok0EbpEwUlUN7R1dNnYQYnBctrz6Khii3QTN5sUTuCVDGl7Hr9rRmRrvK1T5ESSVtqX4mbhjbnmn68EC_alysazpGDInbYeifx7YYUoTJ5d8BJLodWET9zsnR9bmncIYZa602IPEi3Dq1xbo_ZrKZFdPXQGlsy2v2MRdfUXlND3xFLF1LTBRKg-6g5_khrg",
    difficulty: "Easy",
    grid: "16x16",
    colors: 6,
    beadCount: 200,
    downloads: "1.2k",
    palette: [
      { hex: "#E63946", name: "Orange", count: 80, code: "O8" },
      { hex: "#161D1F", name: "Black", count: 20, code: "G10" },
      { hex: "#2D6A4F", name: "Green", count: 10, code: "A5" },
    ],
    steps: [
      "Shape a round pumpkin in orange.",
      "Carve triangular black eyes and mouth.",
      "Add a small green stem on top.",
    ],
    related: [
      { title: "Ghost Pattern", beads: 198, difficulty: "Easy" },
      { title: "Cute Frog", beads: 352, difficulty: "Easy" },
      { title: "Kawaii Cat", beads: 320, difficulty: "Easy" },
    ],
  },
  {
    slug: "sunflower-smile",
    title: "Sunflower Smile",
    emoji: "🌻",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCq5A0OAvFhb371dF5UerEYoZrRWEfRXI7SONqpJ-zlCobtkbC8dUqLbIlzkChbYjkvDBsnUMnhLEUmok0EbpEwUlUN7R1dNnYQYnBctrz6Khii3QTN5sUTuCVDGl7Hr9rRmRrvK1T5ESSVtqX4mbhjbnmn68EC_alysazpGDInbYeifx7YYUoTJ5d8BJLodWET9zsnR9bmncIYZa602IPEi3Dq1xbo_ZrKZFdPXQGlsy2v2MRdfUXlND3xFLF1LTBRKg-6g5_khrg",
    finished: "https://lh3.googleusercontent.com/aida-public/AB6AXuCq5A0OAvFhb371dF5UerEYoZrRWEfRXI7SONqpJ-zlCobtkbC8dUqLbIlzkChbYjkvDBsnUMnhLEUmok0EbpEwUlUN7R1dNnYQYnBctrz6Khii3QTN5sUTuCVDGl7Hr9rRmRrvK1T5ESSVtqX4mbhjbnmn68EC_alysazpGDInbYeifx7YYUoTJ5d8BJLodWET9zsnR9bmncIYZa602IPEi3Dq1xbo_ZrKZFdPXQGlsy2v2MRdfUXlND3xFLF1LTBRKg-6g5_khrg",
    difficulty: "Easy",
    grid: "24x24",
    colors: 5,
    beadCount: 340,
    downloads: "980",
    palette: [
      { hex: "#F7D794", name: "Sunny Yellow", count: 140, code: "Y3" },
      { hex: "#A67C52", name: "Seed Brown", count: 40, code: "B9" },
      { hex: "#2D6A4F", name: "Leaf Green", count: 45, code: "A5" },
      { hex: "#161D1F", name: "Black", count: 10, code: "G10" },
      { hex: "#FFFFFF", name: "White", count: 15, code: "F01" },
    ],
    steps: [
      "Outline a large sunflower circle in Sunny Yellow.",
      "Fill the center with Seed Brown and a few black dots.",
      "Add a green stem and two leaves.",
      "Draw a smiling face with white eyes and black pupils.",
    ],
    related: [
      { title: "Cute Frog", beads: 352, difficulty: "Easy" },
      { title: "Kawaii Cat", beads: 320, difficulty: "Easy" },
      { title: "Cherry Blossom", beads: 300, difficulty: "Easy" },
    ],
  },
  {
    slug: "sleepy-shiba",
    title: "Sleepy Shiba",
    emoji: "🐕",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBHAOCdLCFExFcb50kRpOBpSpAhCiXLh5szaJt5crPpk7HbYvUDA98zZdwgLmnFW-VZ-1emAOnHPVhJDQS60erBkN4ytiUKcpX5_QQl2iC6mPTOvCRjSMiL6dEojI_X25m2NnrVyzPB_yyrHyb0bq35Ay98fkUfl1zKifaxDXb9cvlEqx9xaR5WzMH7LNKUE_j4fhOdf5fsvSsjeaQTtoqqmpWtP6v52p-NUPieO5qnin_MsPjJ8KjxRMsdKnA1AGi8swIHPdCI6RE",
    finished: "https://lh3.googleusercontent.com/aida-public/AB6AXuBHAOCdLCFExFcb50kRpOBpSpAhCiXLh5szaJt5crPpk7HbYvUDA98zZdwgLmnFW-VZ-1emAOnHPVhJDQS60erBkN4ytiUKcpX5_QQl2iC6mPTOvCRjSMiL6dEojI_X25m2NnrVyzPB_yyrHyb0bq35Ay98fkUfl1zKifaxDXb9cvlEqx9xaR5WzMH7LNKUE_j4fhOdf5fsvSsjeaQTtoqqmpWtP6v52p-NUPieO5qnin_MsPjJ8KjxRMsdKnA1AGi8swIHPdCI6RE",
    difficulty: "Easy",
    grid: "24x24",
    colors: 4,
    beadCount: 360,
    downloads: "870",
    palette: [
      { hex: "#D4A373", name: "Shiba Tan", count: 150, code: "T4" },
      { hex: "#FFFFFF", name: "White", count: 80, code: "F01" },
      { hex: "#161D1F", name: "Black", count: 12, code: "G10" },
      { hex: "#FFB7B2", name: "Pink", count: 20, code: "P12" },
    ],
    steps: [
      "Shape the shiba head in Shiba Tan.",
      "Add white cheeks and forehead markings.",
      "Draw closed black eyes and a tiny pink tongue.",
      "Finish with two pointed ears.",
    ],
    related: [
      { title: "Kawaii Cat", beads: 320, difficulty: "Easy" },
      { title: "Cute Frog", beads: 352, difficulty: "Easy" },
      { title: "Pixel Bunny", beads: 330, difficulty: "Medium" },
    ],
  },
  {
    slug: "retro-controller",
    title: "Retro Controller",
    emoji: "🎮",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCdfOtAF1zQXzEfrlFnpjZycfVyECcg71sRmNjdIR4udZbcLJemQkkz9KkyFs7jegyCCBziEtdVBhywv5GaDWiqHwN7DtMiVdHLRQGsFO_UfQEPOuuP8eb94oe__SmvPeOE0sMYAvr7jP11f4z-MoyZmaXVRQ8qecLdKb9l_Bann5mIVctQFJrc6WQhic2hDIAnREW66WuYitrn7f1YlCeYFmpM4fRT0E_ycldM6Qa78UJbihKs5zQBpYUHBtBYQdggs8S-v7gPo6o",
    finished: "https://lh3.googleusercontent.com/aida-public/AB6AXuCdfOtAF1zQXzEfrlFnpjZycfVyECcg71sRmNjdIR4udZbcLJemQkkz9KkyFs7jegyCCBziEtdVBhywv5GaDWiqHwN7DtMiVdHLRQGsFO_UfQEPOuuP8eb94oe__SmvPeOE0sMYAvr7jP11f4z-MoyZmaXVRQ8qecLdKb9l_Bann5mIVctQFJrc6WQhic2hDIAnREW66WuYitrn7f1YlCeYFmpM4fRT0E_ycldM6Qa78UJbihKs5zQBpYUHBtBYQdggs8S-v7gPo6o",
    difficulty: "Medium",
    grid: "32x32",
    colors: 5,
    beadCount: 520,
    downloads: "760",
    palette: [
      { hex: "#D9D9D9", name: "Light Gray", count: 220, code: "L2" },
      { hex: "#161D1F", name: "Black", count: 60, code: "G10" },
      { hex: "#E63946", name: "Red", count: 30, code: "R7" },
      { hex: "#48DBFB", name: "Blue", count: 20, code: "E18" },
      { hex: "#F7D794", name: "Yellow", count: 10, code: "Y3" },
    ],
    steps: [
      "Outline the controller body in Light Gray.",
      "Add black directional pad on the left.",
      "Place four colored action buttons on the right.",
      "Add start/select buttons and a black cord.",
    ],
    related: [
      { title: "Gaming", beads: 410, difficulty: "Medium" },
      { title: "Pixel Bunny", beads: 330, difficulty: "Medium" },
      { title: "Cute Frog", beads: 352, difficulty: "Easy" },
    ],
  },
  {
    slug: "pancake-stack",
    title: "Pancake Stack",
    emoji: "🥞",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDLBfgDuArJbv2kH8VsS-OwYal-bGD8D4nFmbCw9Rs3ng_pJ3S4bNVJABadpquNG97uC8LhK2juz8f0HpsO0RBi1SKgwEYKSb5Hq87eA3usRdnIYG8S7w7AKFyxfrFjFf7oSzy4MS2P5TK9z6gjwEFL272q25vdfZHqzuak4UPt6WF35StRwQmVa8nXioOBM_HxL0duJhQZZndnBYjdPoLrjFnbHxgnxWoh569-0-zWvHnsIpUDBwR0fShFBi_4U4XrHNK9ifvD0gc",
    finished: "https://lh3.googleusercontent.com/aida-public/AB6AXuDLBfgDuArJbv2kH8VsS-OwYal-bGD8D4nFmbCw9Rs3ng_pJ3S4bNVJABadpquNG97uC8LhK2juz8f0HpsO0RBi1SKgwEYKSb5Hq87eA3usRdnIYG8S7w7AKFyxfrFjFf7oSzy4MS2P5TK9z6gjwEFL272q25vdfZHqzuak4UPt6WF35StRwQmVa8nXioOBM_HxL0duJhQZZndnBYjdPoLrjFnbHxgnxWoh569-0-zWvHnsIpUDBwR0fShFBi_4U4XrHNK9ifvD0gc",
    difficulty: "Easy",
    grid: "24x24",
    colors: 4,
    beadCount: 310,
    downloads: "640",
    palette: [
      { hex: "#F7D794", name: "Pancake Gold", count: 120, code: "Y3" },
      { hex: "#A67C52", name: "Syrup Brown", count: 60, code: "B9" },
      { hex: "#FFFFFF", name: "Butter White", count: 30, code: "F01" },
      { hex: "#E63946", name: "Strawberry Red", count: 20, code: "R8" },
    ],
    steps: [
      "Stack three golden pancake circles.",
      "Drizzle brown syrup down the sides.",
      "Top with a square of butter.",
      "Add a strawberry on the side.",
    ],
    related: [
      { title: "Food", beads: 300, difficulty: "Easy" },
      { title: "Bubble Tea Duck", beads: 356, difficulty: "Easy" },
      { title: "Cute Frog", beads: 352, difficulty: "Easy" },
    ],
  },
  {
    slug: "ocean-wave",
    title: "Ocean Wave",
    emoji: "🌊",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAJHn3w4sSU2etnKICbDHbnswcP7U70DuR2gYLfHp3a3rl6HHZsFB3I5qEGy2ZowY53EUjvvMqvrJGKTzICBVY6kRMQgJiVA3r5BHhJv1jiwlLyDOyrl0F4tSI-j6EpUgiVjbeVXNe2IohA8rkrgY_nZ1TjqQnd_CeKbwsQtXF6BsO4_uwZcz1-tBU4DFt3JhN3gLFDmmhPQj1cBuI2Fz_qZKI6iosbJyeyi0W0lA58DnfW16UXS13logMCpehLCWddroCPZ3NOfDQ",
    finished: "https://lh3.googleusercontent.com/aida-public/AB6AXuAJHn3w4sSU2etnKICbDHbnswcP7U70DuR2gYLfHp3a3rl6HHZsFB3I5qEGy2ZowY53EUjvvMqvrJGKTzICBVY6kRMQgJiVA3r5BHhJv1jiwlLyDOyrl0F4tSI-j6EpUgiVjbeVXNe2IohA8rkrgY_nZ1TjqQnd_CeKbwsQtXF6BsO4_uwZcz1-tBU4DFt3JhN3gLFDmmhPQj1cBuI2Fz_qZKI6iosbJyeyi0W0lA58DnfW16UXS13logMCpehLCWddroCPZ3NOfDQ",
    difficulty: "Medium",
    grid: "32x32",
    colors: 4,
    beadCount: 480,
    downloads: "540",
    palette: [
      { hex: "#2A9D8F", name: "Teal", count: 120, code: "T6" },
      { hex: "#48DBFB", name: "Sky Blue", count: 100, code: "E18" },
      { hex: "#1D3557", name: "Deep Blue", count: 80, code: "D3" },
      { hex: "#FFFFFF", name: "White Foam", count: 60, code: "F01" },
    ],
    steps: [
      "Start with a deep blue base.",
      "Layer teal and sky blue wave curves.",
      "Add white foam caps on the crests.",
      "Blend colors for a smooth gradient.",
    ],
    related: [
      { title: "Animals", beads: 300, difficulty: "Easy" },
      { title: "Sunflower Smile", beads: 340, difficulty: "Easy" },
      { title: "Cute Frog", beads: 352, difficulty: "Easy" },
    ],
  },
  {
    slug: "cherry-blossom",
    title: "Cherry Blossom",
    emoji: "🌸",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBxZjLeI75gb3SxyR53kHFnmHAmyxWV2TJ9u0L1UnUDpIouhgKYUVgDuYlF8Kuo_nBI1qLoJw-s4wH8bi4iTJ8QOiwgS6nhfX6mS7jy63nyPlj7J8lyNGl4hZudtHKikanxXEtJTXBUK0H1zMKB7i3RQlC3g9reRwdfK_0HNS2ey4bxvq7mgDzqldiIA_LP930mXrGGeAZm6NbayGACon0YDk1GG5MBfxdzYkffbfmXTDHlnUvHl_O1bQvgi9MwuQPP85zzzSen_vE",
    finished: "https://lh3.googleusercontent.com/aida-public/AB6AXuBxZjLeI75gb3SxyR53kHFnmHAmyxWV2TJ9u0L1UnUDpIouhgKYUVgDuYlF8Kuo_nBI1qLoJw-s4wH8bi4iTJ8QOiwgS6nhfX6mS7jy63nyPlj7J8lyNGl4hZudtHKikanxXEtJTXBUK0H1zMKB7i3RQlC3g9reRwdfK_0HNS2ey4bxvq7mgDzqldiIA_LP930mXrGGeAZm6NbayGACon0YDk1GG5MBfxdzYkffbfmXTDHlnUvHl_O1bQvgi9MwuQPP85zzzSen_vE",
    difficulty: "Easy",
    grid: "24x24",
    colors: 4,
    beadCount: 300,
    downloads: "710",
    palette: [
      { hex: "#FFB7B2", name: "Sakura Pink", count: 120, code: "P12" },
      { hex: "#FFFFFF", name: "White", count: 60, code: "F01" },
      { hex: "#5D4037", name: "Branch Brown", count: 40, code: "B7" },
      { hex: "#2D6A4F", name: "Leaf Green", count: 20, code: "A5" },
    ],
    steps: [
      "Draw a curved brown branch.",
      "Add clusters of pink and white petals.",
      "Place small green buds along the branch.",
      "Fill gaps with soft white background petals.",
    ],
    related: [
      { title: "Kawaii", beads: 300, difficulty: "Easy" },
      { title: "Sunflower Smile", beads: 340, difficulty: "Easy" },
      { title: "Cute Frog", beads: 352, difficulty: "Easy" },
    ],
  },
  {
    slug: "heart-eye-robot",
    title: "Heart-Eye Robot",
    emoji: "🤖",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDUlBiQ9EnQHUUF7g2WsrXoVUB7p8Qk80n--4roaKU7Q9EWwfXqaAMV_hau9PbW0RGHwQWkWlxGIykSeCi-Ouu4tIeRNNxIR6wFcR72tfDKcjzSvW467TLvxoIgSCEdXhdOXUoeSqcQVBlNqeLEdYa74NIeEjpnCEWrvmEerZp31Ll9YV4pdYO6tOl0o6WKqn_ksNRXXWy-XcwITkL8Lu8LvUjyRDPdpp8n_281si0KK64DKbrSlk76FttKEFJxvroeVif2RO3h2ic",
    finished: "https://lh3.googleusercontent.com/aida-public/AB6AXuDUlBiQ9EnQHUUF7g2WsrXoVUB7p8Qk80n--4roaKU7Q9EWwfXqaAMV_hau9PbW0RGHwQWkWlxGIykSeCi-Ouu4tIeRNNxIR6wFcR72tfDKcjzSvW467TLvxoIgSCEdXhdOXUoeSqcQVBlNqeLEdYa74NIeEjpnCEWrvmEerZp31Ll9YV4pdYO6tOl0o6WKqn_ksNRXXWy-XcwITkL8Lu8LvUjyRDPdpp8n_281si0KK64DKbrSlk76FttKEFJxvroeVif2RO3h2ic",
    difficulty: "Easy",
    grid: "24x24",
    colors: 5,
    beadCount: 330,
    downloads: "620",
    palette: [
      { hex: "#D9D9D9", name: "Light Gray", count: 140, code: "L2" },
      { hex: "#E63946", name: "Heart Red", count: 30, code: "R7" },
      { hex: "#FFFFFF", name: "White", count: 40, code: "F01" },
      { hex: "#161D1F", name: "Black", count: 20, code: "G10" },
      { hex: "#48DBFB", name: "Glow Blue", count: 10, code: "E18" },
    ],
    steps: [
      "Build a square robot head in Light Gray.",
      "Add two red heart-shaped eyes.",
      "Draw a small white mouth and black antenna.",
      "Add blue glow accents on the chest panel.",
    ],
    related: [
      { title: "Gaming", beads: 410, difficulty: "Medium" },
      { title: "Retro Controller", beads: 520, difficulty: "Medium" },
      { title: "Cute Frog", beads: 352, difficulty: "Easy" },
    ],
  },
  {
    slug: "rainbow-clouds",
    title: "Rainbow Clouds",
    emoji: "🌈",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBQDRENZJ2EEbKo0IRZI8NCZGi44SlTvFWzOvsP_JSBucgmfNKZOrtQpgWkqcNhaFunGfIgobF_BHMfq-lcUFMTciFvZB88txlsTLlz9AP_VaXgdkN7C29FFUQD140cg7iEROmFpzz-8bABE4tda--hAK5lxnOhVdU2dqDUYhyQ4rhX94L3ud1HNtoY9TpsXMkiZfHxOyV2vPs24HwB6ddiukKRHAqdFk5TsPjL-rICKsBqq6PYnxCnnOx_OVQ0tRwq05LkS1dggos",
    finished: "https://lh3.googleusercontent.com/aida-public/AB6AXuBQDRENZJ2EEbKo0IRZI8NCZGi44SlTvFWzOvsP_JSBucgmfNKZOrtQpgWkqcNhaFunGfIgobF_BHMfq-lcUFMTciFvZB88txlsTLlz9AP_VaXgdkN7C29FFUQD140cg7iEROmFpzz-8bABE4tda--hAK5lxnOhVdU2dqDUYhyQ4rhX94L3ud1HNtoY9TpsXMkiZfHxOyV2vPs24HwB6ddiukKRHAqdFk5TsPjL-rICKsBqq6PYnxCnnOx_OVQ0tRwq05LkS1dggos",
    difficulty: "Easy",
    grid: "24x24",
    colors: 7,
    beadCount: 350,
    downloads: "830",
    palette: [
      { hex: "#E63946", name: "Red", count: 30, code: "R7" },
      { hex: "#F4A261", name: "Orange", count: 30, code: "O8" },
      { hex: "#F7D794", name: "Yellow", count: 30, code: "Y3" },
      { hex: "#2D6A4F", name: "Green", count: 30, code: "A5" },
      { hex: "#48DBFB", name: "Blue", count: 30, code: "E18" },
      { hex: "#9B5DE5", name: "Purple", count: 30, code: "P9" },
      { hex: "#FFFFFF", name: "Cloud White", count: 80, code: "F01" },
    ],
    steps: [
      "Place two white cloud shapes on each side.",
      "Draw seven rainbow arcs between them.",
      "Keep each arc one bead wide for clarity.",
      "Add puffy cloud edges around the rainbow ends.",
    ],
    related: [
      { title: "Kawaii", beads: 300, difficulty: "Easy" },
      { title: "Sunflower Smile", beads: 340, difficulty: "Easy" },
      { title: "Cute Frog", beads: 352, difficulty: "Easy" },
    ],
  },
  {
    slug: "watermelon-slice",
    title: "Watermelon Slice",
    emoji: "🍉",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAlIVGECYONoKluZa3_YCn049r1WlcnYP4JTDC7DK72nI_ghZOmMyw_HjvhYGr5DM8P-X18r7f5EKl-OE21YreHSNYNITcSVtn_HyUWJ47S0FZDqabwUbd0KnrfbLE8Eg2yus27Z1rX0bnWRFDNQTM91FyyQaYz9HmzHA-WWfrW1Kw6aRt6Gl69m40LJhdIioESUaafRFIhCL-9FMtW98lo9E-HywojxNRnft_Ftu1Zv3CtkHAqmUyVWE0C78WE12uooYfggujBClc",
    finished: "https://lh3.googleusercontent.com/aida-public/AB6AXuAlIVGECYONoKluZa3_YCn049r1WlcnYP4JTDC7DK72nI_ghZOmMyw_HjvhYGr5DM8P-X18r7f5EKl-OE21YreHSNYNITcSVtn_HyUWJ47S0FZDqabwUbd0KnrfbLE8Eg2yus27Z1rX0bnWRFDNQTM91FyyQaYz9HmzHA-WWfrW1Kw6aRt6Gl69m40LJhdIioESUaafRFIhCL-9FMtW98lo9E-HywojxNRnft_Ftu1Zv3CtkHAqmUyVWE0C78WE12uooYfggujBClc",
    difficulty: "Easy",
    grid: "24x24",
    colors: 4,
    beadCount: 320,
    downloads: "900",
    palette: [
      { hex: "#2D6A4F", name: "Rind Green", count: 60, code: "A5" },
      { hex: "#E63946", name: "Fruit Red", count: 120, code: "R8" },
      { hex: "#FFFFFF", name: "White Rind", count: 40, code: "F01" },
      { hex: "#161D1F", name: "Black Seeds", count: 20, code: "G10" },
    ],
    steps: [
      "Shape a triangle slice with Rind Green outer edge.",
      "Add a thin white rind layer inside.",
      "Fill the fruit area with red.",
      "Scatter black seeds across the red flesh.",
    ],
    related: [
      { title: "Food", beads: 300, difficulty: "Easy" },
      { title: "Pancake Stack", beads: 310, difficulty: "Easy" },
      { title: "Cute Frog", beads: 352, difficulty: "Easy" },
    ],
  },
  {
    slug: "potted-cactus",
    title: "Potted Cactus",
    emoji: "🌵",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAInhFiKNWY9K9bOSoxsChz9Qu4KQDuUpBivudRniQnnjTC4zUTA9fUW_sxSlvq76hAS1ebn9Bqj8T12B6jRahlZrTB11SILwz5NDAgggeyK2M1EeLCWr0BCJK0b_sHZ6ixz8N4h9X3bJCEoQAVOEFmF9UzMkGH4IUBdIVSCkJF8mqwEy_f_nT3fppHNlMw93Nbl89TUrBLJjeI2VZacIhU_rVRl5d06TJHdK9qZzmNBPep68mtiK5RLKzXe_MxDJ9YEi_0MLSsvj0",
    finished: "https://lh3.googleusercontent.com/aida-public/AB6AXuAInhFiKNWY9K9bOSoxsChz9Qu4KQDuUpBivudRniQnnjTC4zUTA9fUW_sxSlvq76hAS1ebn9Bqj8T12B6jRahlZrTB11SILwz5NDAgggeyK2M1EeLCWr0BCJK0b_sHZ6ixz8N4h9X3bJCEoQAVOEFmF9UzMkGH4IUBdIVSCkJF8mqwEy_f_nT3fppHNlMw93Nbl89TUrBLJjeI2VZacIhU_rVRl5d06TJHdK9qZzmNBPep68mtiK5RLKzXe_MxDJ9YEi_0MLSsvj0",
    difficulty: "Easy",
    grid: "24x24",
    colors: 5,
    beadCount: 300,
    downloads: "670",
    palette: [
      { hex: "#2D6A4F", name: "Cactus Green", count: 100, code: "A5" },
      { hex: "#52B788", name: "Light Green", count: 50, code: "C12" },
      { hex: "#A67C52", name: "Pot Brown", count: 40, code: "B9" },
      { hex: "#FFB7B2", name: "Flower Pink", count: 20, code: "P12" },
      { hex: "#F7D794", name: "Flower Yellow", count: 10, code: "Y3" },
    ],
    steps: [
      "Build a tall cactus body in Cactus Green.",
      "Add one arm on each side in Light Green.",
      "Place a brown pot at the base.",
      "Top with small pink and yellow flowers.",
    ],
    related: [
      { title: "Animals", beads: 300, difficulty: "Easy" },
      { title: "Sunflower Smile", beads: 340, difficulty: "Easy" },
      { title: "Cute Frog", beads: 352, difficulty: "Easy" },
    ],
  },
  {
    slug: "moon-stars",
    title: "Moon & Stars",
    emoji: "🌙",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuC8qmnZRIkhL3_wbj0apImFztwqfNE2qo1Ajplf3KwjJJq-DK9tj0AG016zcondXwFLBNgBuJnck0-uDx783F1iZrOf4Lkaxrs8m8j4SHFgpGioDxjHCdYiIZXGCPWpi8H_mVrPIIcuCrKa-vhJw-eObXWbUe25EajWDqJXVaFyqqi3k8X2ldI5rUw7tC8a8AT_PMA8zXpoR-ssCojbidyw7PKpNm1DtMzBmbYxVbnuXOvkJh5PT6EQbAxfcp_gx3OzQv8LrFH2_xU",
    finished: "https://lh3.googleusercontent.com/aida-public/AB6AXuC8qmnZRIkhL3_wbj0apImFztwqfNE2qo1Ajplf3KwjJJq-DK9tj0AG016zcondXwFLBNgBuJnck0-uDx783F1iZrOf4Lkaxrs8m8j4SHFgpGioDxjHCdYiIZXGCPWpi8H_mVrPIIcuCrKa-vhJw-eObXWbUe25EajWDqJXVaFyqqi3k8X2ldI5rUw7tC8a8AT_PMA8zXpoR-ssCojbidyw7PKpNm1DtMzBmbYxVbnuXOvkJh5PT6EQbAxfcp_gx3OzQv8LrFH2_xU",
    difficulty: "Easy",
    grid: "24x24",
    colors: 4,
    beadCount: 280,
    downloads: "720",
    palette: [
      { hex: "#1D3557", name: "Midnight Blue", count: 120, code: "D3" },
      { hex: "#F7D794", name: "Moon Yellow", count: 60, code: "Y3" },
      { hex: "#FFFFFF", name: "Star White", count: 40, code: "F01" },
      { hex: "#9B5DE5", name: "Purple Mist", count: 20, code: "P9" },
    ],
    steps: [
      "Fill the background with Midnight Blue.",
      "Place a crescent moon in Moon Yellow.",
      "Scatter white stars of varying sizes.",
      "Add faint purple mist around the moon.",
    ],
    related: [
      { title: "Halloween", beads: 200, difficulty: "Easy" },
      { title: "Ghost Pattern", beads: 198, difficulty: "Easy" },
      { title: "Cute Frog", beads: 352, difficulty: "Easy" },
    ],
  },
  {
    slug: "heart-locket",
    title: "Heart Locket",
    emoji: "💖",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCFTjPvlpmb_SxGffcCRQZf5nO6ZqoS4BCmSXXOLmQhzLTSe84XY2YW9IjzyJ5hwNQ4PwE3hGyThmrM-tORNHhkL8RM3HmD_MjJw79nRQzCWe4kshXFx3Ey6Ogai-9GTW_zKg4XIzJbzd7wHdcG4Rgfz6BIc1KKlPXhkPSK2Y7Fc4xOIZkrxcUNQtQ42hXJSOIWZILpwsjtUY3C4_JuN1WH92xSQVcefQ5t57an35ULsWGHQzb00DgdVNmfNTfi7M2l0YMxPbjgnZE",
    finished: "https://lh3.googleusercontent.com/aida-public/AB6AXuCFTjPvlpmb_SxGffcCRQZf5nO6ZqoS4BCmSXXOLmQhzLTSe84XY2YW9IjzyJ5hwNQ4PwE3hGyThmrM-tORNHhkL8RM3HmD_MjJw79nRQzCWe4kshXFx3Ey6Ogai-9GTW_zKg4XIzJbzd7wHdcG4Rgfz6BIc1KKlPXhkPSK2Y7Fc4xOIZkrxcUNQtQ42hXJSOIWZILpwsjtUY3C4_JuN1WH92xSQVcefQ5t57an35ULsWGHQzb00DgdVNmfNTfi7M2l0YMxPbjgnZE",
    difficulty: "Easy",
    grid: "24x24",
    colors: 5,
    beadCount: 310,
    downloads: "580",
    palette: [
      { hex: "#E63946", name: "Ruby Red", count: 120, code: "R8" },
      { hex: "#FFB7B2", name: "Soft Pink", count: 60, code: "P12" },
      { hex: "#F7D794", name: "Gold", count: 40, code: "Y3" },
      { hex: "#FFFFFF", name: "White", count: 30, code: "F01" },
      { hex: "#161D1F", name: "Black", count: 10, code: "G10" },
    ],
    steps: [
      "Outline a heart shape in Ruby Red.",
      "Fill the left half with Soft Pink.",
      "Add a gold loop at the top.",
      "Draw a tiny black keyhole in the center.",
    ],
    related: [
      { title: "Kawaii", beads: 300, difficulty: "Easy" },
      { title: "Heart-Eye Robot", beads: 330, difficulty: "Easy" },
      { title: "Cute Frog", beads: 352, difficulty: "Easy" },
    ],
  },
];

function mockBySlugRecord(): Record<string, Pattern> {
  return basePatterns.reduce((acc, p) => {
    acc[p.slug] = p;
    return acc;
  }, {} as Record<string, Pattern>);
}

export const mockBySlug: Record<string, Pattern> = mockBySlugRecord();

export const collections: Collection[] = [
  {
    title: "Halloween",
    slug: "halloween",
    emoji: "🎃",
    count: 120,
    desc: "Spooky printable bead patterns for the season",
    color: "bg-secondary-container text-on-secondary-container",
  },
  {
    title: "Cute Animals",
    slug: "cute-animals",
    emoji: "🐱",
    count: 450,
    desc: "Beginner-friendly animal designs everyone loves",
    color: "bg-primary-fixed text-on-primary-fixed-variant",
  },
  {
    title: "Food Series",
    slug: "food",
    emoji: "🍓",
    count: 210,
    desc: "Kawaii food and drink bead art templates",
    color: "bg-tertiary-fixed text-on-tertiary-fixed-variant",
  },
  {
    title: "Beginner Patterns",
    slug: "beginner",
    emoji: "🌱",
    count: 340,
    desc: "Easy grids and simple color palettes to start",
    color: "bg-tertiary-container text-white",
  },
  {
    title: "8-Color Patterns",
    slug: "8-color",
    emoji: "🎨",
    count: 180,
    desc: "Minimal palettes that keep projects simple",
    color: "bg-surface-container-highest text-secondary",
  },
  {
    title: "Pixel Art",
    slug: "pixel-art",
    emoji: "🕹️",
    count: 96,
    desc: "Gaming and retro pixel-perfect designs",
    color: "bg-primary-container text-white",
  },
];

export const categories: Category[] = [
  { name: "Animals", slug: "animals", icon: "pets", count: 1245, tag: "Popular" },
  { name: "Kawaii", slug: "kawaii", icon: "favorite", count: 892, tag: "Trending" },
  { name: "Halloween", slug: "halloween", icon: "dark_mode", count: 634, tag: "Seasonal" },
  { name: "Christmas", slug: "christmas", icon: "ac_unit", count: 521, tag: "Popular" },
  { name: "Food", slug: "food", icon: "bakery_dining", count: 743, tag: "New" },
  { name: "Gaming", slug: "gaming", icon: "videogame_asset", count: 410, tag: "Trending" },
];

function tagsToCollections(tags: BackendTag[]): Collection[] {
  return tags
    .filter((t) => !t.type || t.type.toLowerCase() !== "difficulty")
    .map((t) => ({
      title: t.name,
      slug: t.slug,
      emoji: generateEmoji(t.name),
      count: t.count || 0,
      desc: `${t.name} bead patterns`,
      color: "bg-primary-container text-white",
    }));
}

function tagsToCategories(tags: BackendTag[]): Category[] {
  return tags
    .filter((t) => !t.type || t.type.toLowerCase() !== "difficulty")
    .map((t) => ({
      name: t.name,
      slug: t.slug,
      icon: "label",
      count: t.count || 0,
      tag: "New" as Category["tag"],
    }));
}

function normalizeBackendOrMock(input: unknown): Pattern {
  if (!input || typeof input !== "object") {
    return basePatterns[0];
  }
  const bp = input as BackendPattern;
  if (bp.id && bp.slug && bp.title) {
    return normalizeBackendPattern(bp);
  }
  return input as Pattern;
}

export async function getAllPatterns(): Promise<Pattern[]> {
  const fallback = basePatterns.map((p) => ({ ...p, id: p.slug } as unknown as BackendPattern));
  const data = await fetchWithFallback<BackendPattern[] | { items: BackendPattern[] }>(
    `${API_BASE}/api/patterns`,
    {},
    fallback as unknown as BackendPattern[]
  );
  const items = extractBackendItems(data);
  if (!items || items.length === 0) return basePatterns;
  return items.map((bp) => {
    const mock = mockBySlug[bp.slug];
    return mock ? mergePattern(bp as unknown as Pattern, mock) : normalizeBackendPattern(bp);
  });
}

export async function getPattern(slug: string): Promise<Pattern | null> {
  const detail = await fetchWithFallback<BackendPatternDetail>(
    `${API_BASE}/api/patterns/${slug}`,
    {},
    undefined
  );
  if (!detail) {
    return mockBySlug[slug] || null;
  }
  const mock = mockBySlug[slug];
  return mergePatternDetail(detail, mock);
}

export async function getTrendingPatterns(): Promise<Pattern[]> {
  const fallback = basePatterns.slice(0, 8).map((p) => ({ ...p, id: p.slug } as unknown as BackendPattern));
  const data = await fetchWithFallback<BackendPattern[] | { items: BackendPattern[]; meta?: unknown }>(
    `${API_BASE}/api/patterns?sort=popular&limit=8`,
    {},
    fallback as unknown as BackendPattern[]
  );
  const items = extractBackendItems(data);
  if (!items || items.length === 0) return basePatterns.slice(0, 8);
  return items.map((bp) => {
    const mock = mockBySlug[bp.slug];
    return mock ? mergePattern(bp as unknown as Pattern, mock) : normalizeBackendPattern(bp);
  }).slice(0, 8);
}

function extractTags(
  data: BackendTag[] | { items?: BackendTag[] } | undefined
): BackendTag[] | undefined {
  if (!data) return undefined;
  if (Array.isArray(data)) return data;
  if (typeof data === "object" && "items" in data && Array.isArray(data.items)) {
    return data.items;
  }
  return undefined;
}

export async function getCollections(): Promise<Collection[]> {
  const data = await fetchWithFallback<BackendTag[] | { items?: BackendTag[] }>(
    `${API_BASE}/api/tags`,
    {},
    undefined
  );
  const tags = extractTags(data);
  if (!tags || tags.length === 0) return collections;
  return tagsToCollections(tags).length > 0 ? tagsToCollections(tags) : collections;
}

export async function getCategories(): Promise<Category[]> {
  const data = await fetchWithFallback<BackendTag[] | { items?: BackendTag[] }>(
    `${API_BASE}/api/tags`,
    {},
    undefined
  );
  const tags = extractTags(data);
  if (!tags || tags.length === 0) return categories;
  const cats = tagsToCategories(tags);
  return cats.length > 0 ? cats : categories;
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const data = await fetchWithFallback<BackendTag[] | { items?: BackendTag[] }>(
    `${API_BASE}/api/tags`,
    {},
    undefined
  );
  const tags = extractTags(data);
  const list = tags && tags.length > 0 ? tagsToCategories(tags) : categories;
  return list.find((c) => c.slug === slug) || null;
}

export async function getRelatedPatterns(
  slug: string,
  limit = 4
): Promise<Pattern[]> {
  const fallback = basePatterns
    .filter((p) => p.slug !== slug)
    .slice(0, limit)
    .map((p) => ({ ...p, id: p.slug } as unknown as BackendPattern));
  const data = await fetchWithFallback<BackendPattern[]>(
    `${API_BASE}/api/recommend?slug=${encodeURIComponent(slug)}&limit=${limit}`,
    {},
    fallback
  );
  if (!data || data.length === 0) {
    return basePatterns.filter((p) => p.slug !== slug).slice(0, limit);
  }
  return data.map((bp) => {
    const mock = mockBySlug[bp.slug];
    return mock ? mergePattern(bp as unknown as Pattern, mock) : normalizeBackendPattern(bp);
  });
}

export async function createPattern(body: unknown): Promise<{ id: string; slug: string } | null> {
  const res = await fetchWithFallback<{ pattern: { id: string; slug: string } }>(
    `${API_BASE}/api/patterns`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
    undefined
  );
  if (!res || !res.pattern) return null;
  return res.pattern;
}

export async function searchPatterns(query: string): Promise<Pattern[]> {
  const q = query.trim().toLowerCase();
  if (!q) return getAllPatterns();
  const fallback = basePatterns
    .filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        p.emoji.includes(q)
    )
    .map((p) => ({ ...p, id: p.slug } as unknown as BackendPattern));
  const data = await fetchWithFallback<BackendPattern[] | { items: BackendPattern[]; meta?: unknown }>(
    `${API_BASE}/api/patterns?q=${encodeURIComponent(q)}`,
    {},
    fallback as unknown as BackendPattern[]
  );
  if (!data || (Array.isArray(data) && data.length === 0)) {
    return basePatterns.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        p.emoji.includes(q)
    );
  }
  const items: BackendPattern[] = Array.isArray(data) ? data : (data as { items: BackendPattern[] }).items;
  return items.map((bp) => {
    const mock = mockBySlug[bp.slug];
    return mock ? mergePattern(bp, mock) : normalizeBackendPattern(bp);
  });
}

export async function getPatternImageData(
  pattern: Pattern
): Promise<{ type: "image" | "svg"; src: string; svg?: string }> {
  const data = await fetchWithFallback<{ image?: string; svg?: string }>(
    `${API_BASE}/api/patterns/${pattern.slug}/image`,
    { method: "POST" },
    undefined
  );
  if (data && data.image) {
    return { type: "image", src: data.image };
  }
  if (data && data.svg) {
    return { type: "svg", src: data.svg, svg: data.svg };
  }
  return { type: "image", src: pattern.finished || pattern.img };
}
