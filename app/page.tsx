"use client";

import { useEffect, useMemo, useState } from "react";

type Role = "mestre" | "jogador";
type StageType = "pergunta" | "missao" | "curiosidade";
type Stage = {
  id: number;
  track: string;
  era: string;
  type: StageType;
  prompt: string;
  options?: string[];
  answer?: number;
};

const stages: Stage[] = [
  { id: 1, track: "Música 01", era: "Era dourada", type: "missao", prompt: "Durante o refrão, repare em como o quarteto transforma a batida em pizzicato." },
  { id: 2, track: "Música 02", era: "Era urbana", type: "pergunta", prompt: "Qual instrumento você percebeu conduzindo a melodia principal?", options: ["Violino", "Viola", "Violoncelo", "Todos juntos"], answer: 3 },
  { id: 3, track: "Música 03", era: "Era noturna", type: "curiosidade", prompt: "Uma mesma canção pode mudar completamente de clima quando perde a letra e ganha um arranjo de cordas." },
  { id: 4, track: "Música 04", era: "Era vermelha", type: "pergunta", prompt: "Que sensação o arranjo desta música passou para você?", options: ["Euforia", "Nostalgia", "Calma", "Suspense"], answer: 1 },
  { id: 5, track: "Música 05", era: "Era acústica", type: "missao", prompt: "Feche os olhos por 20 segundos e tente separar os quatro instrumentos." },
  { id: 6, track: "Música 06", era: "Era delicada", type: "pergunta", prompt: "Quantas mudanças de intensidade você percebeu no último trecho?", options: ["Nenhuma", "Uma", "Duas", "Três ou mais"], answer: 2 },
  { id: 7, track: "Música 07", era: "Era surpresa", type: "curiosidade", prompt: "No quarteto de cordas, os músicos conversam com gestos e respirações — quase sem precisar se olhar." },
  { id: 8, track: "Música 08", era: "Final", type: "missao", prompt: "Escolha uma palavra para resumir a noite e compartilhe com o grupo depois do aplauso." },
];

const players = [
  { name: "Bia", score: 1840, color: "#ff4fa3" },
  { name: "Vini", score: 1560, color: "#6c63ff" },
  { name: "Léo", score: 1320, color: "#ffb21a" },
  { name: "Maju", score: 980, color: "#31caa0" },
];

const typeLabels: Record<StageType, string> = {
  pergunta: "Pergunta",
  missao: "Missão de escuta",
  curiosidade: "Curiosidade",
};

export default function Home() {
  const [started, setStarted] = useState(false);
  const [role, setRole] = useState<Role>("mestre");
  const [released, setReleased] = useState<number | null>(null);
  const [completed, setCompleted] = useState<number[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [showScore, setShowScore] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("afterglow-demo");
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      setStarted(Boolean(parsed.started));
      setRole(parsed.role === "jogador" ? "jogador" : "mestre");
      setReleased(typeof parsed.released === "number" ? parsed.released : null);
      setCompleted(Array.isArray(parsed.completed) ? parsed.completed : []);
    } catch {}
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      "afterglow-demo",
      JSON.stringify({ started, role, released, completed }),
    );
  }, [started, role, released, completed]);

  const active = useMemo(
    () => stages.find((stage) => stage.id === released) ?? null,
    [released],
  );

  function releaseStage(id: number) {
    setReleased(id);
    setSelectedAnswer(null);
    setRevealed(false);
    setShowScore(false);
  }

  function finishStage() {
    if (released && !completed.includes(released)) {
      setCompleted((items) => [...items, released]);
    }
    setReleased(null);
    setSelectedAnswer(null);
    setRevealed(false);
  }

  if (!started) {
    return (
      <main className="landing">
        <div className="ambient ambient-one" />
        <div className="ambient ambient-two" />
        <section className="welcome">
          <div className="eyebrow"><span className="live-dot" /> Edição Candlelight</div>
          <div className="brand-mark">A</div>
          <p className="kicker">Uma noite em quatro atos</p>
          <h1>Afterglow</h1>
          <p className="intro">Ouça além da música. Um jogo rápido para transformar o concerto em uma experiência compartilhada.</p>
          <div className="join-card">
            <div className="room-code">
              <span>Sala da noite</span>
              <strong>1989</strong>
            </div>
            <button className="primary-button" onClick={() => { setRole("mestre"); setStarted(true); }}>
              Criar sala como Mestre <span>→</span>
            </button>
            <button className="secondary-button" onClick={() => { setRole("jogador"); setStarted(true); }}>
              Entrar como Jogador
            </button>
          </div>
          <p className="fine-print">Protótipo da mecânica · conteúdo demonstrativo</p>
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
          <strong>{role === "mestre" ? "Painel do Mestre" : "Você é Vini"}</strong>
        </div>
        <button className="role-switch" onClick={() => setRole(role === "mestre" ? "jogador" : "mestre")}>
          Ver como {role === "mestre" ? "jogador" : "mestre"}
        </button>
      </header>

      {showScore ? (
        <Scoreboard onClose={() => setShowScore(false)} />
      ) : role === "mestre" ? (
        <HostView
          active={active}
          completed={completed}
          revealed={revealed}
          onRelease={releaseStage}
          onReveal={() => setRevealed(true)}
          onFinish={finishStage}
          onScore={() => setShowScore(true)}
        />
      ) : (
        <PlayerView
          active={active}
          selectedAnswer={selectedAnswer}
          revealed={revealed}
          onAnswer={setSelectedAnswer}
          onScore={() => setShowScore(true)}
        />
      )}
    </main>
  );
}

function HostView({ active, completed, revealed, onRelease, onReveal, onFinish, onScore }: {
  active: Stage | null; completed: number[]; revealed: boolean;
  onRelease: (id: number) => void; onReveal: () => void; onFinish: () => void; onScore: () => void;
}) {
  if (active) {
    return (
      <section className="stage-screen">
        <div className="status-row">
          <span className={`type-pill ${active.type}`}>{typeLabels[active.type]}</span>
          <span className="broadcasting"><i /> No ar para 4 jogadores</span>
        </div>
        <p className="track-label">{active.track} · {active.era}</p>
        <h2>{active.prompt}</h2>
        {active.options && (
          <div className="answers compact">
            {active.options.map((option, index) => (
              <div className={`answer-card ${revealed && index === active.answer ? "correct" : ""}`} key={option}>
                <span>{String.fromCharCode(65 + index)}</span>{option}
              </div>
            ))}
          </div>
        )}
        <div className="host-actions">
          {active.type === "pergunta" && !revealed && <button className="primary-button" onClick={onReveal}>Revelar resposta</button>}
          <button className={revealed || active.type !== "pergunta" ? "primary-button" : "secondary-button"} onClick={onFinish}>
            Encerrar etapa
          </button>
        </div>
        <p className="host-hint">Você controla o ritmo. Nada avança sozinho.</p>
      </section>
    );
  }

  return (
    <section className="dashboard">
      <div className="dashboard-head">
        <div>
          <p className="kicker">Setlist flexível</p>
          <h1>Qual é a próxima?</h1>
          <p>Libere qualquer etapa quando reconhecer a música.</p>
        </div>
        <button className="score-button" onClick={onScore}>⌁ Placar</button>
      </div>
      <div className="progress-wrap">
        <div><span>Experiência</span><strong>{completed.length} de {stages.length}</strong></div>
        <div className="progress-bar"><i style={{ width: `${(completed.length / stages.length) * 100}%` }} /></div>
      </div>
      <div className="stage-grid">
        {stages.map((stage) => {
          const done = completed.includes(stage.id);
          return (
            <button className={`stage-card ${done ? "done" : ""}`} key={stage.id} onClick={() => !done && onRelease(stage.id)} disabled={done}>
              <div className="stage-number">{done ? "✓" : String(stage.id).padStart(2, "0")}</div>
              <div>
                <span className={`type-dot ${stage.type}`} />
                <small>{typeLabels[stage.type]}</small>
                <strong>{stage.track}</strong>
                <p>{stage.era}</p>
              </div>
              <span className="release-icon">{done ? "Feita" : "Liberar →"}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function PlayerView({ active, selectedAnswer, revealed, onAnswer, onScore }: {
  active: Stage | null; selectedAnswer: number | null; revealed: boolean;
  onAnswer: (index: number) => void; onScore: () => void;
}) {
  if (!active) {
    return (
      <section className="waiting-screen">
        <div className="sound-orbit"><span>♪</span><i /><i /><i /></div>
        <p className="kicker">O concerto está acontecendo</p>
        <h1>Escute o momento.</h1>
        <p>O Mestre vai liberar a próxima experiência assim que a música começar.</p>
        <div className="player-strip">
          {players.map((player) => <span key={player.name} style={{ background: player.color }}>{player.name[0]}</span>)}
          <strong>4 conectados</strong>
        </div>
        <button className="score-button" onClick={onScore}>Ver placar parcial</button>
      </section>
    );
  }

  return (
    <section className="stage-screen player">
      <div className="timer-line"><i /></div>
      <div className="status-row">
        <span className={`type-pill ${active.type}`}>{typeLabels[active.type]}</span>
        <span className="track-label">{active.track}</span>
      </div>
      <h2>{active.prompt}</h2>
      {active.options ? (
        <div className="answers">
          {active.options.map((option, index) => {
            const chosen = selectedAnswer === index;
            const correct = revealed && index === active.answer;
            return (
              <button
                className={`answer-card ${chosen ? "selected" : ""} ${correct ? "correct" : ""}`}
                onClick={() => selectedAnswer === null && onAnswer(index)}
                key={option}
              >
                <span>{String.fromCharCode(65 + index)}</span>{option}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="mission-card">
          <span>{active.type === "missao" ? "◎" : "✦"}</span>
          <p>{active.type === "missao" ? "Faça no seu tempo — não precisa tocar na tela." : "Guarde essa ideia para conversar depois do show."}</p>
        </div>
      )}
      {selectedAnswer !== null && !revealed && <p className="answer-status">Resposta enviada · esperando o Mestre</p>}
    </section>
  );
}

function Scoreboard({ onClose }: { onClose: () => void }) {
  return (
    <section className="score-screen">
      <button className="back-button" onClick={onClose}>← Voltar</button>
      <p className="kicker">Placar da noite</p>
      <h1>O quarteto está afinado</h1>
      <div className="podium">
        {players.map((player, index) => (
          <div className="score-row" key={player.name}>
            <span className="rank">{index + 1}</span>
            <i style={{ background: player.color }}>{player.name[0]}</i>
            <strong>{player.name}</strong>
            <b>{player.score.toLocaleString("pt-BR")}</b>
          </div>
        ))}
      </div>
      <div className="group-insight"><span>✦</span><p><strong>Momento do grupo</strong>3 de 4 pessoas escolheram “nostalgia” na última música.</p></div>
    </section>
  );
}
