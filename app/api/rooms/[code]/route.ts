import { NextRequest, NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "node:crypto";
import {
  emptyRoom,
  getRoom,
  hasSharedStorage,
  isHost,
  saveHost,
  saveRoom,
} from "@/lib/room-store";

export const dynamic = "force-dynamic";

type ActionBody = {
  action?: "login" | "join" | "answer" | "release" | "reveal" | "show-answer" | "finish" | "remove-player" | "reset-current" | "reset";
  stageId?: number;
  answerIndex?: number;
  password?: string;
  playerId?: string;
  playerName?: string;
};

const MASTER_PASSWORD_HASH =
  "aea49802178d9b2ba8781b03a131b5523c8947200b74f6d28fd84e9ca1bdb379";

const correctAnswers: Record<number, number> = {
  2: 2,
  3: 0,
  4: 0,
  5: 1,
  6: 2,
  7: 2,
  9: 2,
  10: 2,
  11: 0,
  12: 0,
};

function publicRoom<T extends { answers?: unknown }>(room: T) {
  const { answers: _answers, ...safeRoom } = room;
  const roomWithAnswers = room as T & {
    released?: number | null;
    answers?: Record<string, Record<string, number>>;
  };
  const answeredCount = roomWithAnswers.released
    ? Object.keys(roomWithAnswers.answers?.[String(roomWithAnswers.released)] ?? {}).length
    : 0;
  return { ...safeRoom, answeredCount };
}

function response(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code: rawCode } = await params;
  const code = rawCode.toUpperCase();
  const room = await getRoom(code);
  return response({ room: publicRoom(room), shared: hasSharedStorage() });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code: rawCode } = await params;
  const code = rawCode.toUpperCase();
  const body = (await request.json()) as ActionBody;

  if (body.action === "login") {
    const receivedHash = createHash("sha256")
      .update(body.password ?? "")
      .digest("hex");
    const validPassword = timingSafeEqual(
      Buffer.from(receivedHash),
      Buffer.from(MASTER_PASSWORD_HASH),
    );
    if (!validPassword) {
      return response({ error: "Senha do Mestre incorreta." }, 401);
    }
    const hostToken = crypto.randomUUID();
    const room = await getRoom(code);
    await saveHost(code, hostToken);
    return response({
      room: publicRoom(room),
      hostToken,
      shared: hasSharedStorage(),
    });
  }

  if (body.action === "join") {
    const playerId = body.playerId?.trim();
    const playerName = body.playerName?.trim().slice(0, 20);
    if (!playerId || playerId.length > 80 || !playerName) {
      return response({ error: "Informe seu nome para entrar." }, 400);
    }
    const room = await getRoom(code);
    const existing = room.players.find((player) => player.id === playerId);
    room.players = existing
      ? room.players.map((player) =>
          player.id === playerId ? { ...player, name: playerName } : player,
        )
      : [
          ...room.players,
          { id: playerId, name: playerName, score: 0, answered: [] },
        ];
    room.version += 1;
    room.updatedAt = Date.now();
    await saveRoom(room);
    return response({ room: publicRoom(room), shared: hasSharedStorage() });
  }

  if (body.action === "answer") {
    const room = await getRoom(code);
    const player = room.players.find((item) => item.id === body.playerId);
    if (
      !player ||
      !room.released ||
      !room.revealed ||
      room.answerRevealed ||
      body.stageId !== room.released ||
      !Number.isInteger(body.answerIndex)
    ) {
      return response({ error: "Esta pergunta não está aceitando respostas." }, 400);
    }
    const stageKey = String(room.released);
    room.answers[stageKey] = {
      ...(room.answers[stageKey] ?? {}),
      [player.id]: body.answerIndex!,
    };
    room.version += 1;
    room.updatedAt = Date.now();
    await saveRoom(room);
    return response({ room: publicRoom(room), shared: hasSharedStorage() });
  }

  const hostToken = request.headers.get("x-afterglow-host");
  if (!(await isHost(code, hostToken))) {
    return response({ error: "Acesso exclusivo do Mestre." }, 403);
  }

  const current = await getRoom(code);
  let room = { ...current, version: current.version + 1, updatedAt: Date.now() };

  if (body.action === "release") {
    if (!Number.isInteger(body.stageId) || body.stageId! < 1 || body.stageId! > 13) {
      return response({ error: "Etapa inválida." }, 400);
    }
    room = { ...room, released: body.stageId!, revealed: false, answerRevealed: false };
  } else if (body.action === "reveal") {
    room = { ...room, revealed: true };
  } else if (body.action === "show-answer") {
    const stageId = room.released;
    const stageAnswers = stageId ? room.answers[String(stageId)] ?? {} : {};
    const correctAnswer = stageId ? correctAnswers[stageId] : undefined;
    const players = room.players.map((player) => {
      if (!stageId || player.answered.includes(stageId)) return player;
      const answer = stageAnswers[player.id];
      if (answer === undefined) return player;
      return {
        ...player,
        score: player.score + (answer === correctAnswer ? 100 : 0),
        answered: [...player.answered, stageId],
      };
    });
    room = { ...room, players, answerRevealed: true };
  } else if (body.action === "finish") {
    const completed =
      room.released && !room.completed.includes(room.released)
        ? [...room.completed, room.released]
        : room.completed;
    room = { ...room, completed, released: null, revealed: false, answerRevealed: false };
  } else if (body.action === "remove-player") {
    const playerId = body.playerId?.trim();
    if (!playerId || !current.players.some((player) => player.id === playerId)) {
      return response({ error: "Visitante não encontrado." }, 404);
    }
    room = {
      ...room,
      players: current.players.filter((player) => player.id !== playerId),
      answers: Object.fromEntries(
        Object.entries(current.answers).map(([stageId, stageAnswers]) => [
          stageId,
          Object.fromEntries(
            Object.entries(stageAnswers).filter(([answerPlayerId]) => answerPlayerId !== playerId),
          ),
        ]),
      ),
    };
  } else if (body.action === "reset-current") {
    const stageId = current.released;
    if (!stageId) {
      return response({ error: "Não há uma música ativa." }, 400);
    }
    const stageKey = String(stageId);
    const stageAnswers = current.answers[stageKey] ?? {};
    const correctAnswer = correctAnswers[stageId];
    room = {
      ...room,
      revealed: false,
      answerRevealed: false,
      answers: Object.fromEntries(
        Object.entries(current.answers).filter(([key]) => key !== stageKey),
      ),
      players: current.players.map((player) => {
        if (!player.answered.includes(stageId)) return player;
        const earnedPoints = stageAnswers[player.id] === correctAnswer ? 100 : 0;
        return {
          ...player,
          score: Math.max(0, player.score - earnedPoints),
          answered: player.answered.filter((answeredId) => answeredId !== stageId),
        };
      }),
    };
  } else if (body.action === "reset") {
    const freshRoom = emptyRoom(code);
    room = {
      ...freshRoom,
      players: current.players.map((player) => ({
        ...player,
        score: 0,
        answered: [],
      })),
      version: current.version + 1,
    };
  } else {
    return response({ error: "Ação inválida." }, 400);
  }

  await saveRoom(room);
  return response({ room: publicRoom(room), shared: hasSharedStorage() });
}
