import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export const BURST_LIMIT = 5;
export const BURST_WINDOW = "1 m";
export const DAILY_LIMIT = 30;
export const DAILY_WINDOW = "1 d";
export const GLOBAL_DAILY_CAP = 300;
export const GLOBAL_COST_CAP_KEY = "reframe:cost-cap:daily";
export const GLOBAL_COST_CAP_TTL_SECONDS = 60 * 60 * 24;

export type GuardrailTripReason = "burst_limit" | "daily_limit" | "cost_cap";
export type GuardrailResult = { ok: true } | { ok: false; reason: GuardrailTripReason };

let redis: Redis | undefined;
let burstLimiter: Ratelimit | undefined;
let dailyLimiter: Ratelimit | undefined;

function getRedis(): Redis {
  if (!redis) {
    redis = Redis.fromEnv();
  }
  return redis;
}

function getBurstLimiter(): Ratelimit {
  if (!burstLimiter) {
    burstLimiter = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(BURST_LIMIT, BURST_WINDOW),
      prefix: "reframe:burst",
    });
  }
  return burstLimiter;
}

function getDailyLimiter(): Ratelimit {
  if (!dailyLimiter) {
    dailyLimiter = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(DAILY_LIMIT, DAILY_WINDOW),
      prefix: "reframe:daily",
    });
  }
  return dailyLimiter;
}

export async function checkRequestGuardrails(ip: string): Promise<GuardrailResult> {
  const burst = await getBurstLimiter().limit(ip);
  if (!burst.success) {
    return { ok: false, reason: "burst_limit" };
  }

  const daily = await getDailyLimiter().limit(ip);
  if (!daily.success) {
    return { ok: false, reason: "daily_limit" };
  }

  const count = await getRedis().incr(GLOBAL_COST_CAP_KEY);
  if (count === 1) {
    await getRedis().expire(GLOBAL_COST_CAP_KEY, GLOBAL_COST_CAP_TTL_SECONDS);
  }
  if (count > GLOBAL_DAILY_CAP) {
    return { ok: false, reason: "cost_cap" };
  }

  return { ok: true };
}
