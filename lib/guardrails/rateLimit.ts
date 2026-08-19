import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Sized for chat's higher expected message-per-visit volume than reframe's
// single-shot intent submission.
export const BURST_LIMIT = 8;
export const BURST_WINDOW = "1 m";
export const DAILY_LIMIT = 60;
export const DAILY_WINDOW = "1 d";

// Keyed on the client-generated session ID (never conversation storage) so a
// single visit is capped even if the visitor's IP is shared (e.g. behind a
// corporate NAT) with other, unrelated visitors.
export const SESSION_TURN_CAP = 40;
export const SESSION_TURN_WINDOW = "1 d";

export const GLOBAL_DAILY_CAP = 500;
export const GLOBAL_COST_CAP_KEY = "chat:cost-cap:daily";
export const GLOBAL_COST_CAP_TTL_SECONDS = 60 * 60 * 24;

export type GuardrailTripReason =
  | "burst_limit"
  | "daily_limit"
  | "session_turn_cap"
  | "cost_cap";
export type GuardrailResult = { ok: true } | { ok: false; reason: GuardrailTripReason };

let redis: Redis | undefined;
let burstLimiter: Ratelimit | undefined;
let dailyLimiter: Ratelimit | undefined;
let sessionLimiter: Ratelimit | undefined;

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
      prefix: "chat:burst",
    });
  }
  return burstLimiter;
}

function getDailyLimiter(): Ratelimit {
  if (!dailyLimiter) {
    dailyLimiter = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(DAILY_LIMIT, DAILY_WINDOW),
      prefix: "chat:daily",
    });
  }
  return dailyLimiter;
}

function getSessionLimiter(): Ratelimit {
  if (!sessionLimiter) {
    sessionLimiter = new Ratelimit({
      redis: getRedis(),
      limiter: Ratelimit.slidingWindow(SESSION_TURN_CAP, SESSION_TURN_WINDOW),
      prefix: "chat:session",
    });
  }
  return sessionLimiter;
}

// Runs at request admission, before condensation/embedding/generation, so a
// turn that trips a limit here never incurs any of those costs. The global
// cap increments unconditionally for every admitted turn — embed and
// generate are always paired within a turn, so one increment per turn is
// the right unit of cost, not one per model call.
export async function checkRateLimits(
  ip: string,
  sessionId: string,
): Promise<GuardrailResult> {
  const burst = await getBurstLimiter().limit(ip);
  if (!burst.success) {
    return { ok: false, reason: "burst_limit" };
  }

  const daily = await getDailyLimiter().limit(ip);
  if (!daily.success) {
    return { ok: false, reason: "daily_limit" };
  }

  const session = await getSessionLimiter().limit(sessionId);
  if (!session.success) {
    return { ok: false, reason: "session_turn_cap" };
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
