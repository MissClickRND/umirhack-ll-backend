export function parseDurationMs(value: string): number {
  const normalized = value.trim().toLowerCase();

  if (/^\d+$/.test(normalized)) {
    return Number(normalized) * 1000;
  }

  const match = normalized.match(/^(\d+)\s*(ms|s|m|h|d)$/);
  if (!match) {
    throw new Error(`Invalid duration: \"${value}\"`);
  }

  const amount = Number(match[1]);
  const unit = match[2];

  const multiplierByUnit: Record<string, number> = {
    ms: 1,
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return amount * multiplierByUnit[unit];
}
