import { NextRequest, NextResponse } from "next/server";
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
  action?: "create" | "release" | "reveal" | "show-answer" | "finish";
  stageId?: number;
};

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
  return response({ room, shared: hasSharedStorage() });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code: rawCode } = await params;
  const code = rawCode.toUpperCase();
  const body = (await request.json()) as ActionBody;

  if (body.action === "create") {
    const hostToken = crypto.randomUUID();
    const room = emptyRoom(code);
    await Promise.all([saveRoom(room), saveHost(code, hostToken)]);
    return response({ room, hostToken, shared: hasSharedStorage() });
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
    room = { ...room, answerRevealed: true };
  } else if (body.action === "finish") {
    const completed =
      room.released && !room.completed.includes(room.released)
        ? [...room.completed, room.released]
        : room.completed;
    room = { ...room, completed, released: null, revealed: false, answerRevealed: false };
  } else {
    return response({ error: "Ação inválida." }, 400);
  }

  await saveRoom(room);
  return response({ room, shared: hasSharedStorage() });
}
