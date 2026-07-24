"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Role = "mestre" | "jogador";
type PlayerState = {
  id: string;
  name: string;
  score: number;
  answered: number[];
};
type Song = {
  id: number;
  title: string;
  visual: string;
  category: "pergunta" | "sem-pergunta";
  instruction: string;
  curiosity: string;
  closing?: string;
  question?: string;
  options?: string[];
  answer?: number;
};

type RoomState = {
  code: string;
  released: number | null;
  completed: number[];
  revealed: boolean;
  answerRevealed: boolean;
  players: PlayerState[];
  answeredCount: number;
  version: number;
  updatedAt: number;
};

const songs: Song[] = [
  {
    id: 1,
    title: "Love Story",
    visual: "💍",
    category: "sem-pergunta",
    instruction: "✨ Antes de começarmos o game, a primeira música é para você entrar no clima do concerto!",
    curiosity: "Essa música foi inspirada em Romeu e Julieta, mas Taylor decidiu dar ao casal um final feliz que Shakespeare nunca escreveu. Rumores dizem que, em seu casamento que aconteceu neste mês, Taylor entrou ao som dessa música instrumental.",
    closing: "🎻 Tente descobrir qual instrumento você acha mais bonito… Perceba como a música faz você se sentir… Feche os olhos em alguns momentos… apenas aproveite!",
  },
  {
    id: 2,
    title: "cardigan",
    visual: "🧶",
    category: "pergunta",
    instruction: "Sinta a música e se prepare para a pergunta.",
    curiosity: "cardigan fala sobre memórias, amadurecimento e nostalgia. O nome faz referência a um casaco antigo, símbolo de algo confortável que continua tendo valor com o passar do tempo.",
    question: "🍃 Se essa música tivesse uma estação do ano, qual seria?",
    options: ["🌸 Primavera", "☀️ Verão", "🍂 Outono", "❄️ Inverno"],
    answer: 2,
  },
  {
    id: 3,
    title: "Blank Space",
    visual: "✒",
    category: "pergunta",
    instruction: "Sinta a música e se prepare para a pergunta.",
    curiosity: "Essa música é uma sátira, onde Taylor exagera a imagem que a mídia criou dela.",
    question: "🎭 Se essa música fosse uma personagem, ela seria…",
    options: ["💪 Confiante e poderosa", "😨 Medrosa e insegura", "😊 Gentil e tranquila"],
    answer: 0,
  },
  {
    id: 4,
    title: "Enchanted",
    visual: "🪄",
    category: "pergunta",
    instruction: "Sinta a música e se prepare para a pergunta.",
    curiosity: "Enchanted faz parte do álbum Speak Now, escrito inteiramente por Taylor Swift sem coautores — algo raro na indústria e motivo de muito orgulho para ela.",
    question: "🎬 Se essa música fosse uma cena de um filme, qual seria?",
    options: ["💕 Um primeiro encontro", "😢 Uma despedida dolorosa", "🏆 Uma grande conquista"],
    answer: 0,
  },
  {
    id: 5,
    title: "Anti-Hero",
    visual: "🎭",
    category: "pergunta",
    instruction: "Sinta a música e se prepare para a pergunta.",
    curiosity: "Anti-Hero é uma das músicas mais pessoais de Taylor Swift. Em vez de esconder suas inseguranças, ela escolheu transformá-las em arte.",
    question: "🪞 Pela sensação que a música passou, como você acha que Taylor expôs suas inseguranças?",
    options: ["🤔 De forma séria e reflexiva", "😅 Com humor e ironia", "💖 De forma leve e inspiradora"],
    answer: 1,
  },
  {
    id: 6,
    title: "Lavender Haze",
    visual: "🪻",
    category: "pergunta",
    instruction: "Sinta a música e se prepare para a pergunta.",
    curiosity: "A expressão “Lavender Haze” era usada nos anos 1950 para descrever o estado de quem está completamente envolvido por uma paixão.",
    question: "🕰️ Com qual momento do dia essa música combina mais?",
    options: ["🌅 Uma manhã tranquila", "☀️ Uma tarde comum", "🌃 Uma noite agitada"],
    answer: 2,
  },
  {
    id: 7,
    title: "Fortnight",
    visual: "▦",
    category: "pergunta",
    instruction: "Sinta a música e se prepare para a pergunta.",
    curiosity: "Fortnight é uma expressão em inglês que significa um período de duas semanas. A música original é uma parceria entre Taylor Swift e Post Malone e fala de uma conexão breve, mas que deixou marcas profundas.",
    question: "🌦️ Se essa música fosse um clima, ela seria…",
    options: ["☀️ Sol", "⛈️ Tempestade", "🌫️ Neblina"],
    answer: 2,
  },
  {
    id: 8,
    title: "All Too Well",
    visual: "🧣",
    category: "sem-pergunta",
    instruction: "✨ Agora, o game pausa para você se entregar e apreciar.",
    curiosity: "All Too Well ocupa um lugar único na carreira da Taylor e é considerada por fãs e críticos como sua obra-prima. A versão original, de cerca de 5 minutos, foi lançada em 2012. Em 2021, Taylor lançou a aguardada versão estendida de 10 minutos, acompanhada de um curta-metragem escrito e dirigido pela própria Taylor.",
    closing: "🎻 Essa música merece ser vivida do início ao fim. Será que, mesmo sem a letra, você consegue sentir toda a profundidade dessa composição?",
  },
  {
    id: 9,
    title: "We Are Never Ever Getting Back Together",
    visual: "💔",
    category: "pergunta",
    instruction: "Sinta a música e se prepare para a pergunta.",
    curiosity: "Essa música é sobre a mesma pessoa de All Too Well (a obra-prima de Taylor). Depois que o ex quis reatar o relacionamento, a resposta de Taylor acabou se tornando um dos refrões mais famosos de sua carreira.",
    question: "💔 Se essa música fosse o fim de um relacionamento, ele terminaria…",
    options: ["💥 Entre brigas e discussões", "🤝 Em comum acordo", "😮‍💨 Como um livramento (ufa!)"],
    answer: 2,
  },
  {
    id: 10,
    title: "Cruel Summer",
    visual: "⚄",
    category: "pergunta",
    instruction: "Sinta a música e se prepare para a pergunta.",
    curiosity: "Apesar do título, Cruel Summer não fala sobre uma estação do ano. A música retrata um período intenso e turbulento, com sentimentos à flor da pele.",
    question: "🌡️ Se essa música tivesse uma temperatura, ela seria…",
    options: ["❄️ Fria", "🌤️ Morna", "🔥 Quente"],
    answer: 2,
  },
  {
    id: 11,
    title: "But Daddy I Love Him",
    visual: "🤲",
    category: "pergunta",
    instruction: "Sinta a música e se prepare para a pergunta.",
    curiosity: "Em But Daddy I Love Him, Taylor explora o conflito entre seguir a própria vontade e lidar com as expectativas e opiniões das pessoas ao redor.",
    question: "🧭 Se essa música fosse uma atitude, ela seria sobre…",
    options: ["❤️ Seguir o próprio coração", "🏳️ Desistir sem se culpar", "😔 A dor de ter que agradar os outros"],
    answer: 0,
  },
  {
    id: 12,
    title: "You Belong With Me",
    visual: "🌼",
    category: "pergunta",
    instruction: "Sinta a música e se prepare para a pergunta.",
    curiosity: "Essa foi uma das músicas que ajudou a transformar Taylor Swift em um fenômeno mundial. O clipe foi gravado em uma escola real, onde o irmão de Taylor estudava. Mesmo com uma produção simples, o vídeo ganhou diversos prêmios, incluindo o MTV Video Music Award de Melhor Vídeo Feminino.",
    question: "💌 Se essa música fosse uma história, ela seria sobre…",
    options: ["✨ Um futuro cheio de possibilidades", "🌫️ Um presente que ainda é incerto", "🕰️ Um passado que deixou boas lembranças"],
    answer: 0,
  },
  {
    id: 13,
    title: "Shake It Off",
    visual: "✦",
    category: "sem-pergunta",
    instruction: "✨ Agora, o game termina para você aproveitar o encerramento sem distrações.",
    curiosity: "Essa música é sobre não se importar com as críticas e seguir em frente com leveza. Shake it off é uma expressão em inglês que significa “não se deixar afetar”. Mas shake também significa sacudir, criando um trocadilho com a ideia da música: sacudir as críticas, e sacudir o corpo (dançar). A música marcou a transição definitiva de Taylor Swift para o pop e se tornou um de seus maiores sucessos.",
    closing: "🎻 Aproveite esse último momento e shake it off!",
  },
];

const emptyRoom: RoomState = {
  code: "1989",
  released: null,
  completed: [],
  revealed: false,
  answerRevealed: false,
  players: [],
  answeredCount: 0,
  version: 0,
  updatedAt: 0,
};

export default function Home() {
  const [started, setStarted] = useState(false);
  const [role, setRole] = useState<Role>("mestre");
  const [room, setRoom] = useState<RoomState>(emptyRoom);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [visitorName, setVisitorName] = useState("");
  const [masterPassword, setMasterPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [busy, setBusy] = useState(false);
  const [connectionError, setConnectionError] = useState("");
  const [syncReady, setSyncReady] = useState(false);
  const hostToken = useRef("");
  const playerId = useRef("");

  useEffect(() => {
    const saved = window.localStorage.getItem("afterglow-session");
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      setStarted(Boolean(parsed.started));
      setRole(parsed.role === "jogador" ? "jogador" : "mestre");
      hostToken.current = typeof parsed.hostToken === "string" ? parsed.hostToken : "";
      playerId.current =
        typeof parsed.playerId === "string"
          ? parsed.playerId
          : window.localStorage.getItem("afterglow-player-id") ?? "";
      setVisitorName(typeof parsed.visitorName === "string" ? parsed.visitorName : "");
    } catch {}
  }, []);

  const syncRoom = useCallback(async () => {
    try {
      const response = await fetch("/api/rooms/1989", { cache: "no-store" });
      if (!response.ok) throw new Error();
      const data = await response.json();
      setRoom({ ...emptyRoom, ...data.room });
      setSyncReady(true);
      setConnectionError(data.shared ? "" : "Prévia local · a sincronização entre celulares funciona após conectar o Redis na Vercel.");
    } catch {
      setConnectionError("Conexão instável. Tentando novamente…");
    }
  }, []);

  useEffect(() => {
    if (!started) return;
    void syncRoom();
    const interval = window.setInterval(syncRoom, 700);
    return () => window.clearInterval(interval);
  }, [started, syncRoom]);

  useEffect(() => setSelectedAnswer(null), [room.released, room.revealed]);

  const active = useMemo(
    () => songs.find((song) => song.id === room.released) ?? null,
    [room.released],
  );
  const currentPlayer = useMemo(
    () => room.players.find((player) => player.id === playerId.current),
    [room.players],
  );
  const currentPosition = useMemo(() => {
    if (!currentPlayer) return 0;
    return [...room.players]
      .sort((a, b) => b.score - a.score)
      .findIndex((player) => player.id === currentPlayer.id) + 1;
  }, [currentPlayer, room.players]);

  useEffect(() => {
    if (!syncReady || !started || role !== "jogador" || !playerId.current) return;
    if (room.players.some((player) => player.id === playerId.current)) return;
    window.localStorage.removeItem("afterglow-session");
    playerId.current = "";
    setStarted(false);
    setLoginError("O Mestre removeu você desta sessão.");
  }, [role, room.players, started, syncReady]);

  async function enterAsMaster() {
    if (!masterPassword) {
      setLoginError("Digite a senha do Mestre.");
      return;
    }
    setBusy(true);
    setLoginError("");
    try {
      const response = await fetch("/api/rooms/1989", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", password: masterPassword }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      hostToken.current = data.hostToken;
      setRoom({ ...emptyRoom, ...data.room });
      setRole("mestre");
      setStarted(true);
      setMasterPassword("");
      window.localStorage.setItem("afterglow-session", JSON.stringify({ started: true, role: "mestre", hostToken: data.hostToken }));
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "Não foi possível entrar como Mestre.");
    } finally {
      setBusy(false);
    }
  }

  async function enterAsPlayer() {
    const name = visitorName.trim();
    if (!name) {
      setLoginError("Digite seu nome para entrar.");
      return;
    }
    setBusy(true);
    setLoginError("");
    const id =
      playerId.current ||
      window.localStorage.getItem("afterglow-player-id") ||
      crypto.randomUUID();
    window.localStorage.setItem("afterglow-player-id", id);
    try {
      const response = await fetch("/api/rooms/1989", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "join", playerId: id, playerName: name }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      const persistentPlayerId =
        typeof data.playerId === "string" ? data.playerId : id;
      playerId.current = persistentPlayerId;
      window.localStorage.setItem("afterglow-player-id", persistentPlayerId);
      setRoom({ ...emptyRoom, ...data.room });
      setRole("jogador");
      setStarted(true);
      window.localStorage.setItem("afterglow-session", JSON.stringify({ started: true, role: "jogador", playerId: persistentPlayerId, visitorName: name }));
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "Não foi possível entrar na sala.");
    } finally {
      setBusy(false);
    }
  }

  async function hostAction(action: "release" | "reveal" | "show-answer" | "finish" | "reset-current" | "reset", stageId?: number) {
    setBusy(true);
    try {
      const response = await fetch("/api/rooms/1989", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-afterglow-host": hostToken.current },
        body: JSON.stringify({ action, stageId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error();
      setRoom({ ...emptyRoom, ...data.room });
    } catch {
      setConnectionError("Comando não enviado. Entre novamente como Mestre.");
    } finally {
      setBusy(false);
    }
  }

  async function submitAnswer(index: number) {
    if (!active || !playerId.current || selectedAnswer !== null) return;
    setSelectedAnswer(index);
    try {
      const response = await fetch("/api/rooms/1989", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "answer",
          stageId: active.id,
          answerIndex: index,
          playerId: playerId.current,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setRoom({ ...emptyRoom, ...data.room });
    } catch {
      setSelectedAnswer(null);
      setConnectionError("Sua resposta não foi enviada. Tente novamente.");
    }
  }

  async function removePlayer(playerIdToRemove: string) {
    setBusy(true);
    try {
      const response = await fetch("/api/rooms/1989", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-afterglow-host": hostToken.current },
        body: JSON.stringify({ action: "remove-player", playerId: playerIdToRemove }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error();
      setRoom({ ...emptyRoom, ...data.room });
    } catch {
      setConnectionError("Não foi possível excluir o visitante.");
    } finally {
      setBusy(false);
    }
  }

  if (!started) {
    return (
      <main className="landing">
        <div className="ambient ambient-one" />
        <div className="ambient ambient-two" />
        <section className="welcome">
          <div className="eyebrow"><span className="live-dot" /> Candlelight Taylor Swift</div>
          <div className="brand-mark">A</div>
          <p className="kicker">Uma noite para sentir</p>
          <h1>Candlelight Game</h1>
          <p className="intro">Ouça além da música. Uma experiência entre amigos para descobrir histórias, sensações e novos detalhes em cada arranjo.</p>
          <div className="join-card">
            <div className="room-code"><span>Código da sala</span><strong>1989</strong></div>
            <label className="field-label" htmlFor="visitor-name">Seu nome</label>
            <input id="visitor-name" className="entry-input" value={visitorName} onChange={(event) => setVisitorName(event.target.value)} placeholder="Como podemos te chamar?" maxLength={20} />
            <button className="primary-button" disabled={busy} onClick={() => void enterAsPlayer()}>
              Entrar como visitante <span>→</span>
            </button>
            <div className="entry-divider"><span>ou</span></div>
            <label className="field-label" htmlFor="master-password">Senha do Mestre</label>
            <input id="master-password" className="entry-input" type="password" value={masterPassword} onChange={(event) => setMasterPassword(event.target.value)} onKeyDown={(event) => event.key === "Enter" && void enterAsMaster()} placeholder="Digite a senha" autoComplete="current-password" />
            <button className="secondary-button" disabled={busy} onClick={() => void enterAsMaster()}>
              {busy ? "Entrando…" : "Entrar como Mestre"}
            </button>
          </div>
          {loginError && <p className="login-error">{loginError}</p>}
          {connectionError && <p className="connection-error">{connectionError}</p>}
          <p className="fine-print">13 músicas · você não precisa conhecer Taylor Swift</p>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <button className="mini-brand" onClick={() => setStarted(false)} aria-label="Voltar ao início">A</button>
        <div className="room-info">
          <span>SALA 1989</span>
          <strong>{role === "mestre" ? "Painel do Mestre" : `${currentPlayer?.name ?? visitorName} · ${currentPlayer?.score ?? 0} pts`}</strong>
        </div>
        <span className={`connection-badge ${connectionError ? "offline" : ""}`}>{connectionError ? "Prévia" : "Ao vivo"}</span>
      </header>
      {connectionError && <div className="connection-banner">{connectionError}</div>}
      {room.completed.length === songs.length ? (
        <FinalScreen
          players={room.players}
          isMaster={role === "mestre"}
          busy={busy}
          onReset={() => void hostAction("reset")}
        />
      ) : role === "mestre" ? (
        <HostView
          active={active}
          completed={room.completed}
          revealed={room.revealed}
          answerRevealed={room.answerRevealed}
          busy={busy}
          players={room.players}
          answeredCount={room.answeredCount}
          onRelease={(id) => void hostAction("release", id)}
          onQuestion={() => void hostAction("reveal")}
          onAnswer={() => void hostAction("show-answer")}
          onFinish={() => void hostAction("finish")}
          onResetCurrent={() => void hostAction("reset-current")}
          onReset={() => void hostAction("reset")}
          onRemovePlayer={(id) => void removePlayer(id)}
        />
      ) : (
        <PlayerView
          active={active}
          selectedAnswer={selectedAnswer}
          revealed={room.revealed}
          answerRevealed={room.answerRevealed}
          player={currentPlayer}
          completed={room.completed}
          position={currentPosition}
          onAnswer={(index) => void submitAnswer(index)}
        />
      )}
    </main>
  );
}

function FinalScreen({ players, isMaster, busy, onReset }: {
  players: PlayerState[];
  isMaster: boolean;
  busy: boolean;
  onReset: () => void;
}) {
  const [confirmReset, setConfirmReset] = useState(false);
  const ranking = [...players].sort((a, b) => b.score - a.score);

  return (
    <section className="final-screen">
      <div className="fireworks" aria-hidden="true">
        <div className="firework firework-one">{Array.from({ length: 12 }, (_, index) => <i key={index} />)}</div>
        <div className="firework firework-two">{Array.from({ length: 12 }, (_, index) => <i key={index} />)}</div>
        <div className="firework firework-three">{Array.from({ length: 12 }, (_, index) => <i key={index} />)}</div>
      </div>
      <div className="final-content">
        <span className="final-sparkle">✦</span>
        <p className="kicker">Experiência concluída</p>
        <h1>Que noite!</h1>
        <p className="final-message">Obrigado por viver cada música com atenção, curiosidade e um pouco de magia.</p>
        <div className="final-ranking">
          <div className="final-ranking-title"><span>Placar final</span><strong>{players.length} participantes</strong></div>
          {ranking.length > 0 ? ranking.map((player, index) => (
            <div className={`final-player final-player-${index + 1}`} key={player.id}>
              <span className="final-position">{index + 1}º</span>
              <strong>{player.name}</strong>
              <b>{player.score} pts</b>
            </div>
          )) : <p className="empty-ranking">A experiência terminou sem participantes no placar.</p>}
        </div>
        {isMaster && (
          <div className="final-master-actions">
            {!confirmReset ? (
              <button className="reset-button" onClick={() => setConfirmReset(true)}>Iniciar uma nova experiência</button>
            ) : (
              <div className="reset-confirm">
                <p>Reiniciar o jogo e zerar este placar?</p>
                <div>
                  <button onClick={() => setConfirmReset(false)}>Cancelar</button>
                  <button className="danger" disabled={busy} onClick={onReset}>Sim, reiniciar</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function HostView({ active, completed, revealed, answerRevealed, busy, players, answeredCount, onRelease, onQuestion, onAnswer, onFinish, onResetCurrent, onReset, onRemovePlayer }: {
  active: Song | null;
  completed: number[];
  revealed: boolean;
  answerRevealed: boolean;
  busy: boolean;
  players: PlayerState[];
  answeredCount: number;
  onRelease: (id: number) => void;
  onQuestion: () => void;
  onAnswer: () => void;
  onFinish: () => void;
  onResetCurrent: () => void;
  onReset: () => void;
  onRemovePlayer: (id: string) => void;
}) {
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmCurrentReset, setConfirmCurrentReset] = useState(false);
  const [playerToRemove, setPlayerToRemove] = useState<PlayerState | null>(null);

  if (active) {
    const questionMoment = active.category === "pergunta" && revealed;
    return (
      <section className="stage-screen">
        <div className="status-row">
          <span className={`type-pill ${active.category}`}>{questionMoment ? "Pergunta no ar" : "Música no ar"}</span>
          <span className="broadcasting"><i /> Visitantes sincronizados</span>
        </div>
        {!questionMoment ? (
          <>
            <p className="track-label">Momento de apreciação</p>
            <SongVisual song={active} />
            <h2>{active.title}</h2>
            <p className="instruction-text">{active.instruction}</p>
            <div className="curiosity-card"><span>Você sabia?</span><p>{active.curiosity}</p></div>
            {active.closing && <p className="closing-text">{active.closing}</p>}
          </>
        ) : (
          <>
            <p className="track-label">{active.title}</p>
            <h2 className="question-title">{active.question}</h2>
            <div className="response-progress" aria-live="polite">
              <strong>{answeredCount} de {players.length}</strong> responderam
              <span>{Math.max(0, players.length - answeredCount)} ainda faltam</span>
            </div>
            <div className="answers compact">
              {active.options?.map((option, index) => (
                <div className={`answer-card ${answerRevealed && index === active.answer ? "correct" : ""}`} key={option}>
                  <span>{String.fromCharCode(65 + index)}</span>{option}
                </div>
              ))}
            </div>
            {answerRevealed && <div className="guide-answer">Resposta do guia: <strong>{active.options?.[active.answer!]}</strong></div>}
          </>
        )}
        <div className="host-actions">
          {active.category === "pergunta" && !revealed && <button disabled={busy} className="primary-button" onClick={onQuestion}>Liberar pergunta →</button>}
          {questionMoment && !answerRevealed && <button disabled={busy} className="primary-button" onClick={onAnswer}>Mostrar resposta</button>}
          {(active.category === "sem-pergunta" || answerRevealed) && <button disabled={busy} className="primary-button" onClick={onFinish}>Encerrar música</button>}
          {active.category === "pergunta" && !answerRevealed && <button disabled={busy} className="secondary-button" onClick={onFinish}>Encerrar sem mostrar resposta</button>}
          {!confirmCurrentReset ? (
            <button className="current-reset-button" disabled={busy} onClick={() => setConfirmCurrentReset(true)}>Recomeçar somente esta música</button>
          ) : (
            <div className="current-reset-confirm">
              <p>Apagar respostas e pontos somente desta música?</p>
              <button onClick={() => setConfirmCurrentReset(false)}>Cancelar</button>
              <button className="danger" disabled={busy} onClick={() => { onResetCurrent(); setConfirmCurrentReset(false); }}>Sim, recomeçar</button>
            </div>
          )}
        </div>
        <p className="host-hint">Nada avança sozinho. Você controla cada momento.</p>
      </section>
    );
  }

  return (
    <section className="dashboard">
      <div className="dashboard-head">
        <div>
          <p className="kicker">Setlist flexível</p>
          <h1>Qual é a próxima?</h1>
          <p>Toque na música assim que o quarteto começar.</p>
        </div>
        <div className="master-badge">MESTRE</div>
      </div>
      <div className="progress-wrap">
        <div><span>Experiência da noite</span><strong>{completed.length} de {songs.length}</strong></div>
        <div className="progress-bar"><i style={{ width: `${(completed.length / songs.length) * 100}%` }} /></div>
      </div>
      {players.length > 0 && (
        <div className="live-scoreboard">
          <div className="scoreboard-title"><span>Placar ao vivo</span><small>100 pts por resposta do guia</small></div>
          <div className="scoreboard-list">
            {[...players].sort((a, b) => b.score - a.score).map((player, index) => (
              <div className="scoreboard-player" key={player.id}>
                <span>{index + 1}</span><strong>{player.name}</strong><b>{player.score} pts</b>
                <button type="button" aria-label={`Excluir ${player.name}`} onClick={() => setPlayerToRemove(player)}>Excluir</button>
              </div>
            ))}
          </div>
        </div>
      )}
      {playerToRemove && (
        <div className="remove-player-confirm" role="alertdialog" aria-modal="true">
          <p>Excluir <strong>{playerToRemove.name}</strong> desta sessão?</p>
          <div>
            <button onClick={() => setPlayerToRemove(null)}>Cancelar</button>
            <button className="danger" disabled={busy} onClick={() => { onRemovePlayer(playerToRemove.id); setPlayerToRemove(null); }}>Sim, excluir</button>
          </div>
        </div>
      )}
      <div className="stage-grid">
        {songs.map((song) => {
          const done = completed.includes(song.id);
          return (
            <button className={`stage-card ${done ? "done" : ""}`} key={song.id} onClick={() => !done && onRelease(song.id)} disabled={done}>
              <div className="stage-number">{done ? "✓" : String(song.id).padStart(2, "0")}</div>
              <div>
                <span className={`type-dot ${song.category}`} />
                <small>{song.category === "pergunta" ? "Com pergunta" : "Apreciação"}</small>
                <strong>{song.title}</strong>
              </div>
              <span className="release-icon">{done ? "Feita" : "Liberar →"}</span>
            </button>
          );
        })}
      </div>
      <div className="reset-zone">
        {!confirmReset ? (
          <button className="reset-button" onClick={() => setConfirmReset(true)}>Reiniciar game do zero</button>
        ) : (
          <div className="reset-confirm">
            <p>Isso apaga o progresso e zera os pontos. Os visitantes continuam na sala.</p>
            <div><button onClick={() => setConfirmReset(false)}>Cancelar</button><button className="danger" disabled={busy} onClick={() => { onReset(); setConfirmReset(false); }}>Sim, reiniciar</button></div>
          </div>
        )}
      </div>
    </section>
  );
}

function PlayerView({ active, selectedAnswer, revealed, answerRevealed, player, completed, position, onAnswer }: {
  active: Song | null;
  selectedAnswer: number | null;
  revealed: boolean;
  answerRevealed: boolean;
  player?: PlayerState;
  completed: number[];
  position: number;
  onAnswer: (index: number) => void;
}) {
  if (!active) {
    return (
      <section className="waiting-screen">
        <div className="sound-orbit"><span>♪</span><i /><i /><i /></div>
        <p className="kicker">A experiência continua</p>
        <h1>Viva o concerto.</h1>
        <p>Quando chegar o próximo momento, ele aparecerá aqui — sem você precisar atualizar a tela.</p>
        <div className="waiting-progress">
          <div><span>Experiência da noite</span><strong>{completed.length} de {songs.length}</strong></div>
          <div className="progress-bar"><i style={{ width: `${(completed.length / songs.length) * 100}%` }} /></div>
        </div>
        <div className="waiting-stats">
          <div><span>Sua pontuação</span><strong>{player?.score ?? 0} pts</strong></div>
          <div><span>Colocação atual</span><strong>{position ? `${position}º lugar` : "—"}</strong></div>
        </div>
        <div className="waiting-chip"><span className="live-dot" /> Esperando o Mestre</div>
      </section>
    );
  }

  const questionMoment = active.category === "pergunta" && revealed;
  if (!questionMoment) {
    return (
      <section className="stage-screen player appreciation">
        <div className="status-row">
          <span className={`type-pill ${active.category}`}>{active.category === "pergunta" ? "Prepare os sentidos" : "Só aproveite"}</span>
          <span className="track-label">No ar</span>
        </div>
        <SongVisual song={active} />
        <h2>{active.title}</h2>
        <p className="instruction-text">{active.instruction}</p>
        <div className="curiosity-card"><span>Você sabia?</span><p>{active.curiosity}</p></div>
        {active.closing && <p className="closing-text">{active.closing}</p>}
        {active.category === "pergunta" && <div className="waiting-question"><i /> A pergunta chega quando a música terminar</div>}
      </section>
    );
  }

  return (
    <section className="stage-screen player">
      <div className="status-row">
        <span className="type-pill pergunta">Sua percepção</span>
        <span className="track-label">{active.title}</span>
      </div>
      <h2 className="question-title">{active.question}</h2>
      <div className="answers single-column">
        {active.options?.map((option, index) => {
          const chosen = selectedAnswer === index;
          const correct = answerRevealed && index === active.answer;
          const dimmed = answerRevealed && index !== active.answer;
          return (
            <button
              className={`answer-card ${chosen ? "selected" : ""} ${correct ? "correct" : ""} ${dimmed ? "dimmed" : ""}`}
              onClick={() => selectedAnswer === null && !answerRevealed && onAnswer(index)}
              key={option}
            >
              <span>{String.fromCharCode(65 + index)}</span>{option}
            </button>
          );
        })}
      </div>
      {selectedAnswer !== null && !answerRevealed && <p className="answer-status">Resposta registrada · espere o Mestre</p>}
      {answerRevealed && <div className="result-message"><span>✦</span><p><strong>Resposta do guia</strong>{active.options?.[active.answer!]}</p></div>}
    </section>
  );
}

function SongVisual({ song }: { song: Song }) {
  return (
    <div className={`song-visual song-visual-${song.id}`} aria-hidden="true">
      <span>{song.visual}</span>
      <i />
      <i />
    </div>
  );
}
