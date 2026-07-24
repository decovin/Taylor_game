import { Redis } from "@upstash/redis";

export type RoomState = {
  code: string;
  released: number | null;
  completed: number[];
  revealed: boolean;
  answerRevealed: boolean;
  version: number;
  updatedAt: number;
};

const globalRooms = globalThis as typeof globalThis & {
  afterglowRooms?: Map<string, RoomState>;
  afterglowHosts?: Map<string, string>;
};

const memoryRooms = globalRooms.afterglowRooms ?? new Map<string, RoomState>();
const memoryHosts = globalRooms.afterglowHosts ?? new Map<string, string>();
globalRooms.afterglowRooms = memoryRooms;
globalRooms.afterglowHosts = memoryHosts;

function redisClient() {
  const url =
    process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;

  return url && token ? new Redis({ url, token }) : null;
}

function roomKey(code: string) {
  return `afterglow:room:${code}`;
}

function hostKey(code: string) {
  return `afterglow:host:${code}`;
}

export function emptyRoom(code: string): RoomState {
  return {
    code,
    released: null,
    completed: [],
    revealed: false,
    answerRevealed: false,
    version: 0,
    updatedAt: Date.now(),
  };
}

export async function getRoom(code: string) {
  const redis = redisClient();
  if (redis) {
    const room = await redis.get<RoomState>(roomKey(code));
    return room ? { ...emptyRoom(code), ...room } : emptyRoom(code);
  }
  const room = memoryRooms.get(code);
  return room ? { ...emptyRoom(code), ...room } : emptyRoom(code);
}

export async function saveRoom(room: RoomState) {
  const redis = redisClient();
  if (redis) {
    await redis.set(roomKey(room.code), room, { ex: 60 * 60 * 12 });
    return;
  }
  memoryRooms.set(room.code, room);
}

export async function saveHost(code: string, token: string) {
  const redis = redisClient();
  if (redis) {
    await redis.set(hostKey(code), token, { ex: 60 * 60 * 12 });
    return;
  }
  memoryHosts.set(code, token);
}

export async function isHost(code: string, token: string | null) {
  if (!token) return false;
  const redis = redisClient();
  const stored = redis
    ? await redis.get<string>(hostKey(code))
    : memoryHosts.get(code);
  return stored === token;
}

export function hasSharedStorage() {
  return Boolean(
    (process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL) &&
      (process.env.UPSTASH_REDIS_REST_TOKEN ??
        process.env.KV_REST_API_TOKEN),
  );
}
