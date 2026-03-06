interface RateLimitEntry {
  timestamps: number[];
}

const limits: Record<string, { maxRequests: number; windowMs: number }> = {
  openrouter: { maxRequests: 14, windowMs: 60_000 },
  gemini: { maxRequests: 15, windowMs: 60_000 },
  claude: { maxRequests: 40, windowMs: 60_000 },
  grok: { maxRequests: 30, windowMs: 60_000 },
};

const entries = new Map<string, RateLimitEntry>();

export function checkRateLimit(provider: string): boolean {
  const limit = limits[provider];
  if (!limit) return true;

  const now = Date.now();
  const entry = entries.get(provider) || { timestamps: [] };

  // Remove expired timestamps
  entry.timestamps = entry.timestamps.filter((t) => now - t < limit.windowMs);

  if (entry.timestamps.length >= limit.maxRequests) {
    return false;
  }

  entry.timestamps.push(now);
  entries.set(provider, entry);
  return true;
}

export function waitForRateLimit(provider: string): Promise<void> {
  const limit = limits[provider];
  if (!limit) return Promise.resolve();

  const entry = entries.get(provider);
  if (!entry || entry.timestamps.length === 0) return Promise.resolve();

  // Wait until the oldest timestamp expires
  const oldestTimestamp = entry.timestamps[0];
  const waitTime = limit.windowMs - (Date.now() - oldestTimestamp) + 100;

  return new Promise((resolve) => setTimeout(resolve, Math.max(0, waitTime)));
}

export function getProviderStatus(provider: string): {
  available: boolean;
  requestsRemaining: number;
} {
  const limit = limits[provider];
  if (!limit) return { available: true, requestsRemaining: Infinity };

  const now = Date.now();
  const entry = entries.get(provider) || { timestamps: [] };
  const activeTimestamps = entry.timestamps.filter(
    (t) => now - t < limit.windowMs
  );

  return {
    available: activeTimestamps.length < limit.maxRequests,
    requestsRemaining: limit.maxRequests - activeTimestamps.length,
  };
}
