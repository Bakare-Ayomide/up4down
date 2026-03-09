const LEGACY_ICON_MAP: Record<string, string> = {
  gamepad: "🎮",
  "game-pad-2": "🕹️",
  smartphone: "📱",
  monitor: "🖥️",
  laptop: "💻",
  shield: "🛡️",
  sword: "⚔️",
  target: "🎯",
  music: "🎵",
  film: "🎬",
  image: "📸",
  folder: "📁",
  package: "📦",
  settings: "⚙️",
  plug: "🔌",
  globe: "🌐",
  bot: "🤖",
  rocket: "🚀",
  lightbulb: "💡",
  palette: "🎨",
  key: "🔑",
  database: "💾",
  shopping_cart: "🛒",
  trophy: "🏆",
  star: "⭐",
  heart: "❤️",
  flame: "🔥",
  zap: "⚡",
  gem: "💎",
  puzzle: "🧩",
  gift: "🎁",
  home: "🏠",
  graduation_cap: "🎓",
  wrench: "🔧",
  sparkles: "🪄",
};

const isEmoji = (value: string) => /\p{Extended_Pictographic}/u.test(value);

export const normalizeIcon = (value: string | null): string | null => {
  if (!value) return null;
  const trimmed = value.trim();
  const normalizedKey = trimmed.toLowerCase().replace(/\s+/g, "_");
  if (LEGACY_ICON_MAP[normalizedKey]) return LEGACY_ICON_MAP[normalizedKey];
  return isEmoji(trimmed) ? trimmed : null;
};
