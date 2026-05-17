// domain.jsx — Forge-specific components: SetLogger, RestTimer (3 variants),
// PrCelebration, ExerciseSessionCard, SessionHeatmap, ExerciseHistoryChart.

const F_DARK = { background: 'rgb(12 10 9)', color: 'rgb(212 204 194)' };

/* ─── SetLogger ───────────────────────────────────────────────────────────
   Critical component. Thumb-reachable. Big numeric inputs flanking a big CTA.
   Numeric input → numeric keypad → autoclose on submit.
   ─────────────────────────────────────────────────────────────────────── */
function SetLogger({ weight = 80, reps = 8, target = '80 kg × 8', state = 'idle', lastSet }) {
  // state: idle | logged
  return (
    <div style={{
      background: 'rgb(31 27 24)', borderRadius: 16, padding: 16,
      boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.08)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
        <span className="t-micro" style={{ color: 'rgb(150 138 125)' }}>SET 4 · OBJETIVO</span>
        <span className="t-caption" style={{ color: 'rgb(184 174 163)', fontVariantNumeric: 'tabular-nums' }}>{target}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
        <NumericStepper label="Peso" value={weight} suffix="kg" />
        <NumericStepper label="Reps" value={reps} suffix="reps" />
      </div>

      {lastSet ? (
        <div className="t-body-sm" style={{ color: 'rgb(150 138 125)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon name="history" size={12} />
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>{lastSet}</span>
        </div>
      ) : null}

      {state === 'logged' ? (
        <Button variant="accent_soft" size="lg" full leadingIcon="check">Set logueado · descanso 1:30</Button>
      ) : (
        <Button variant="primary" size="lg" full leadingIcon="check">Loguear set</Button>
      )}
    </div>
  );
}

function NumericStepper({ label, value, suffix }) {
  return (
    <div style={{
      background: 'rgb(22 19 17)', borderRadius: 12, padding: '10px 4px',
      boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.05)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
    }}>
      <span className="t-caption" style={{ color: 'rgb(150 138 125)' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', justifyContent: 'space-between', padding: '0 4px' }}>
        <button style={stepBtn}><Icon name="minus" size={16} style={{ color: 'rgb(184 174 163)' }} /></button>
        <div style={{ textAlign: 'center', flex: 1, minWidth: 0 }}>
          <div className="t-num" style={{
            fontSize: 32, fontWeight: 600, color: 'rgb(248 244 236)', letterSpacing: '-0.025em', lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
          }}>{value}</div>
          <div className="t-caption" style={{ color: 'rgb(116 105 94)', marginTop: 2 }}>{suffix}</div>
        </div>
        <button style={stepBtn}><Icon name="plus" size={16} style={{ color: 'rgb(184 174 163)' }} /></button>
      </div>
    </div>
  );
}

const stepBtn = {
  width: 36, height: 36, borderRadius: 9999, border: 'none',
  background: 'rgb(31 27 24)', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.05)',
};

/* ─── RestTimer · 3 treatments ────────────────────────────────────────── */
function RestTimerPinned({ remaining = '1:18', total = 90, elapsed = 12, accent = 'rgb(var(--accent-rgb))' }) {
  // Variant 1: sticky bar pinned at top — minimal, non-blocking
  const pct = (elapsed / total) * 100;
  return (
    <div style={{
      background: 'rgba(18,16,14,0.92)', backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgb(42 37 34)',
      padding: '10px 16px',
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
        <div style={{ width: 8, height: 8, borderRadius: 9999, background: accent, animation: 'forge-pulse 1.2s ease-in-out infinite' }} />
        <span className="t-caption" style={{ color: 'rgb(150 138 125)' }}>DESCANSO</span>
        <span className="t-num" style={{ fontSize: 22, fontWeight: 600, color: 'var(--text-hi)', letterSpacing: '-0.02em', fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>{remaining}</span>
      </div>
      <button style={{
        height: 32, padding: '0 12px', borderRadius: 8, border: 'none',
        background: 'rgb(31 27 24)', color: 'rgb(184 174 163)',
        fontSize: 12, fontWeight: 600, cursor: 'pointer',
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.05)',
        fontFamily: 'inherit',
      }}>Saltar</button>
      {/* progress bar */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 2, background: 'rgb(42 37 34)' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: accent }} />
      </div>
    </div>
  );
}

function RestTimerFloating({ remaining = '1:18', total = 90, elapsed = 12, accent = 'rgb(var(--accent-rgb))' }) {
  // Variant 2: floating card above BottomNav, swipe-up to expand
  const pct = ((total - elapsed) / total) * 100;
  return (
    <div style={{
      background: 'rgba(31, 27, 24, 0.96)', backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderRadius: 16, padding: '14px 16px',
      boxShadow: 'inset 0 0 0 1px rgba(var(--accent-rgb),0.2), 0 12px 32px rgba(0,0,0,.6)',
      display: 'flex', alignItems: 'center', gap: 14,
    }}>
      {/* Circular progress */}
      <svg width="36" height="36" viewBox="0 0 36 36">
        <circle cx="18" cy="18" r="15" fill="none" stroke="rgb(42 37 34)" strokeWidth="3"/>
        <circle cx="18" cy="18" r="15" fill="none" stroke={accent} strokeWidth="3"
          strokeDasharray={`${(pct/100) * 94.2} 94.2`} strokeLinecap="round"
          transform="rotate(-90 18 18)"/>
      </svg>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span className="t-num" style={{ fontSize: 24, fontWeight: 600, color: 'var(--text-hi)', letterSpacing: '-0.025em', fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>{remaining}</span>
          <span className="t-caption" style={{ color: 'rgb(150 138 125)' }}>descanso</span>
        </div>
        <div className="t-body-sm" style={{ color: 'rgb(184 174 163)', marginTop: 2 }}>Próximo: Press banca · set 5</div>
      </div>
      <button style={{
        width: 40, height: 40, borderRadius: 9999, border: 'none',
        background: 'rgb(42 37 34)', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name="skip" size={16} style={{ color: 'rgb(212 204 194)' }} />
      </button>
    </div>
  );
}

function RestTimerOverlay({ remaining = '1:18', total = 90, elapsed = 12, accent = 'rgb(var(--accent-rgb))' }) {
  // Variant 3: full-screen overlay first 5s, then collapses
  const pct = ((total - elapsed) / total) * 100;
  const circ = 2 * Math.PI * 100;
  return (
    <div style={{
      background: 'rgba(12, 10, 9, 0.94)',
      backdropFilter: 'blur(16px) saturate(1.2)',
      WebkitBackdropFilter: 'blur(16px) saturate(1.2)',
      position: 'absolute', inset: 0, zIndex: 80,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '60px 24px 100px',
    }}>
      <div className="t-micro" style={{ color: 'rgb(150 138 125)', marginBottom: 28 }}>DESCANSO · OBJETIVO 1:30</div>

      <div style={{ position: 'relative', width: 240, height: 240 }}>
        <svg width="240" height="240" viewBox="0 0 240 240">
          <circle cx="120" cy="120" r="100" fill="none" stroke="rgb(42 37 34)" strokeWidth="6"/>
          <circle cx="120" cy="120" r="100" fill="none" stroke={accent} strokeWidth="6"
            strokeDasharray={`${(pct/100) * circ} ${circ}`} strokeLinecap="round"
            transform="rotate(-90 120 120)"
            style={{ filter: `drop-shadow(0 0 8px ${accent})` }}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <div className="t-num" style={{
            fontSize: 72, fontWeight: 600, color: 'var(--text-hi)', letterSpacing: '-0.035em',
            fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', lineHeight: 1,
          }}>{remaining}</div>
          <div className="t-caption" style={{ color: 'rgb(150 138 125)', marginTop: 6 }}>RESTAN</div>
        </div>
      </div>

      <div style={{ marginTop: 36, display: 'flex', gap: 10 }}>
        <Button variant="secondary" size="md" leadingIcon="plus">+15s</Button>
        <Button variant="secondary" size="md" leadingIcon="skip">Saltar</Button>
      </div>

      <div className="t-body-sm" style={{ color: 'rgb(150 138 125)', marginTop: 24, textAlign: 'center', maxWidth: 240 }}>
        Tocá afuera para minimizar.<br/>Notificación push al terminar.
      </div>
    </div>
  );
}

/* ─── PR celebration · medium toast ───────────────────────────────────────
   ALWAYS warm orange — even when the app's accent is cool (cobalto, crema...).
   The whole point: when you hit a PR the app shifts temperature for ONE
   moment. Cold tool → warm flame → cold tool again. Don't ever wire this
   to --accent-rgb. — */
function PrCelebration({ exercise = 'Press de banca', current = '85 kg × 8', delta = '+5 kg', metric = 'peso máximo × 8 reps' }) {
  return (
    <div style={{
      background: 'rgb(31 27 24)', borderRadius: 14,
      padding: 16, position: 'relative', overflow: 'hidden',
      boxShadow: 'inset 0 0 0 1px rgba(var(--pr-warm-rgb),0.4), 0 16px 40px rgba(var(--pr-warm-rgb),0.15)',
      display: 'flex', gap: 14, alignItems: 'center',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(120% 80% at 0% 50%, rgba(var(--pr-warm-rgb),0.2), transparent 65%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        width: 48, height: 48, borderRadius: 12, flexShrink: 0,
        background: 'var(--pr-warm)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 0 24px rgba(var(--pr-warm-rgb),0.45), inset 0 0 0 1px rgba(255,255,255,.2)',
        position: 'relative',
      }}>
        <Icon name="flame" size={26} style={{ color: '#fff' }} fill="rgba(255,255,255,0.2)" />
      </div>
      <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
        <div className="t-micro" style={{ color: 'var(--pr-warm-text)', letterSpacing: '0.08em' }}>NUEVO PR · {delta}</div>
        <div className="t-h3" style={{ color: 'var(--text-hi)', marginTop: 2 }}>{exercise}</div>
        <div className="t-body-sm" style={{ color: 'rgb(212 204 194)', marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
          {current} · {metric}
        </div>
      </div>
      <Icon name="x" size={16} style={{ color: 'rgb(150 138 125)', position: 'relative', cursor: 'pointer' }} />
    </div>
  );
}

/* ─── ExerciseSessionCard · header + sets ─────────────────────────────── */
function ExerciseSessionCard({ name = 'Press de banca', target = '3×8 @70kg', sets = [], expanded = true, isPR }) {
  const done = sets.filter(s => s.done).length;
  const total = sets.length;
  return (
    <div style={{
      background: 'rgb(22 19 17)', borderRadius: 14, overflow: 'hidden',
      boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.06)',
    }}>
      <div style={{ padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="t-h3" style={{ color: 'var(--text-strong)' }}>{name}</span>
            {isPR ? <Chip size="sm" leadingIcon="flame">PR</Chip> : null}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <span className="t-caption" style={{ color: 'rgb(150 138 125)', fontVariantNumeric: 'tabular-nums' }}>{target}</span>
            <span style={{ width: 3, height: 3, borderRadius: 9999, background: 'rgb(82 74 66)' }} />
            <span className="t-caption" style={{ color: done === total ? 'var(--accent-text)' : 'rgb(184 174 163)', fontVariantNumeric: 'tabular-nums' }}>
              {done}/{total} sets
            </span>
          </div>
        </div>
        <Icon name="chevron-down" size={18} style={{ color: 'rgb(116 105 94)', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }} />
      </div>

      {expanded && sets.length > 0 ? (
        <div style={{ borderTop: '1px solid rgb(42 37 34)' }}>
          {sets.map((s, i) => (
            <div key={i} style={{
              padding: '12px 16px',
              borderBottom: i < sets.length - 1 ? '1px solid rgba(42,37,34,0.5)' : 'none',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{
                width: 24, height: 24, borderRadius: 9999,
                background: s.done ? 'rgb(var(--accent-rgb))' : 'rgb(31 27 24)',
                color: s.done ? 'var(--accent-fg)' : 'rgb(116 105 94)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: s.done ? 'none' : 'inset 0 0 0 1px rgba(255,255,255,.08)',
                fontSize: 11, fontWeight: 700, fontVariantNumeric: 'tabular-nums',
              }}>
                {s.done ? <Icon name="check" size={12} /> : i + 1}
              </div>
              <div className="t-num" style={{
                flex: 1, fontSize: 15, fontWeight: 500,
                color: s.done ? 'var(--text)' : 'rgb(116 105 94)',
                fontVariantNumeric: 'tabular-nums',
              }}>
                {s.done ? <>{s.weight} kg × <span style={{ color: 'var(--text-strong)' }}>{s.reps}</span></> : <span style={{ color: 'rgb(116 105 94)' }}>{s.target}</span>}
              </div>
              {s.done ? (
                <span className="t-caption" style={{ color: 'rgb(150 138 125)' }}>{s.time || ''}</span>
              ) : null}
              {s.pr ? <Chip size="sm">PR</Chip> : null}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/* ─── SessionHeatmap · GitHub-style 12w × 7d ─────────────────────────── */
function SessionHeatmap({ data, accent = 'rgb(var(--accent-rgb))' }) {
  // data: 84-length array of set counts 0..N
  const cells = data || generateHeatmapData();
  const max = Math.max(...cells, 1);
  return (
    <div>
      <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end' }}>
        {Array.from({ length: 12 }).map((_, week) => (
          <div key={week} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {Array.from({ length: 7 }).map((_, day) => {
              const idx = week * 7 + day;
              const count = cells[idx] ?? 0;
              const intensity = count / max;
              const bg = count === 0
                ? 'rgb(31 27 24)'
                : `rgba(var(--accent-rgb),${0.18 + intensity * 0.82})`;
              return (
                <div key={day} style={{
                  width: 16, height: 16, borderRadius: 3, background: bg,
                  boxShadow: count === 0 ? 'inset 0 0 0 1px rgba(255,255,255,.04)' : 'none',
                }} title={count > 0 ? `${count} sets` : 'rest'} />
              );
            })}
          </div>
        ))}
      </div>
      <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="t-caption" style={{ color: 'rgb(116 105 94)' }}>hace 12 semanas</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span className="t-caption" style={{ color: 'rgb(116 105 94)' }}>menos</span>
          {[0.15, 0.4, 0.65, 1].map(a => (
            <div key={a} style={{ width: 10, height: 10, borderRadius: 2, background: `rgba(var(--accent-rgb),${a})` }} />
          ))}
          <span className="t-caption" style={{ color: 'rgb(116 105 94)' }}>más</span>
        </div>
        <span className="t-caption" style={{ color: 'rgb(116 105 94)' }}>hoy</span>
      </div>
    </div>
  );
}

function generateHeatmapData() {
  // Realistic-ish 84-day workout data: 4 sessions/week typically
  const data = [];
  const pattern = [0, 1, 0, 1, 1, 0, 1]; // Mon-Sun typical schedule
  for (let i = 0; i < 84; i++) {
    const dayOfWeek = i % 7;
    const base = pattern[dayOfWeek];
    if (base === 0) data.push(0);
    else {
      const variance = Math.sin(i * 0.7) * 0.5 + 0.5;
      data.push(Math.round(12 + variance * 22));
    }
  }
  // Sprinkle some misses
  [3, 17, 24, 41, 58].forEach(i => data[i] = 0);
  return data;
}

/* ─── ExerciseHistoryChart · line ─────────────────────────────────────── */
function ExerciseHistoryChart({ metric = 'peso', accent = 'rgb(var(--accent-rgb))' }) {
  // Hardcoded plot data — 12 sessions
  const points = [
    { x: 30, y: 130 },{ x: 60, y: 125 },{ x: 90, y: 118 },{ x: 120, y: 122 },
    { x: 150, y: 110 },{ x: 180, y: 102 },{ x: 210, y: 105 },{ x: 240, y: 90 },
    { x: 270, y: 82 },{ x: 300, y: 88 },{ x: 330, y: 70 },{ x: 360, y: 64 },
  ];
  const path = points.map((p, i) => `${i ? 'L' : 'M'} ${p.x} ${p.y}`).join(' ');
  const area = `M 30 180 L ${points.map(p => `${p.x} ${p.y}`).join(' L ')} L 360 180 Z`;
  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {['peso', 'reps', 'volumen', '1RM est.'].map(m => (
          <Chip key={m} active={m === metric}>{m}</Chip>
        ))}
      </div>
      <svg width="100%" viewBox="0 0 390 200" preserveAspectRatio="none" style={{ display: 'block' }}>
        <defs>
          <linearGradient id="hist-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accent} stopOpacity="0.25" />
            <stop offset="100%" stopColor={accent} stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* y gridlines */}
        {[40, 80, 120, 160].map(y => (
          <line key={y} x1="20" x2="380" y1={y} y2={y} stroke="rgb(42 37 34)" strokeDasharray="2 4" strokeWidth="1" />
        ))}
        {/* area */}
        <path d={area} fill="url(#hist-grad)" />
        {/* line */}
        <path d={path} fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {/* points */}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={i === points.length - 1 ? 4 : 2.5}
            fill={i === points.length - 1 ? accent : 'rgb(12 10 9)'}
            stroke={accent} strokeWidth="2" />
        ))}
        {/* last value label */}
        <g transform={`translate(${points[points.length-1].x - 36}, ${points[points.length-1].y - 26})`}>
          <rect x="0" y="0" width="44" height="20" rx="4" fill="rgb(31 27 24)" stroke={accent} strokeWidth="1" />
          <text x="22" y="14" textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--accent-text)" fontFamily="var(--font-sans)" style={{fontVariantNumeric:'tabular-nums'}}>105 kg</text>
        </g>
      </svg>

      <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between' }}>
        {['feb', 'mar', 'abr', 'may'].map(m => (
          <span key={m} className="t-caption" style={{ color: 'rgb(116 105 94)' }}>{m}</span>
        ))}
      </div>
    </div>
  );
}

/* ─── Showcase artboard for domain components ─────────────────────────── */
function ArtDomain() {
  return (
    <div className="forge-frame forge-dark" style={{ ...F_DARK, padding: 32, width: '100%', height: '100%' }}>
      <SectionHeader eyebrow="05 · Domain" title="Componentes del dominio" subtitle="Los pesados. Cada uno tiene su propio artboard de detalle abajo." />

      <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: '320px 320px 1fr', gap: 20 }}>
        <div>
          <Label>SetLogger · idle</Label>
          <div style={{ marginTop: 12 }}>
            <SetLogger weight={80.0} reps={8} target="80 kg × 8" lastSet="Last · 77.5 kg × 8" />
          </div>
        </div>
        <div>
          <Label>SetLogger · logged</Label>
          <div style={{ marginTop: 12 }}>
            <SetLogger weight={80.0} reps={8} target="80 kg × 8" state="logged" />
          </div>
        </div>
        <div>
          <Label>ExerciseSessionCard · mid-session</Label>
          <div style={{ marginTop: 12 }}>
            <ExerciseSessionCard
              name="Press de banca"
              target="4×8 @80kg · 90s desc"
              isPR
              sets={[
                { done: true, weight: 80, reps: 8, time: '9:42' },
                { done: true, weight: 80, reps: 8, time: '9:46' },
                { done: true, weight: 80, reps: 8, time: '9:50', pr: true },
                { done: false, target: '— · set 4 de 4' },
              ]}
            />
          </div>
        </div>
      </div>

      <div style={{ marginTop: 28 }}>
        <Label>PR celebration · banner inline (medium tone)</Label>
        <div style={{ marginTop: 12, maxWidth: 560 }}>
          <PrCelebration exercise="Press de banca" current="85 kg × 8" delta="+5 kg" />
        </div>
      </div>

      <div style={{ marginTop: 28, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div>
          <Label>SessionHeatmap · 12w × 7d</Label>
          <Card style={{ marginTop: 12 }}>
            <SessionHeatmap />
          </Card>
        </div>
        <div>
          <Label>ExerciseHistoryChart · line</Label>
          <Card style={{ marginTop: 12 }}>
            <ExerciseHistoryChart />
          </Card>
        </div>
      </div>

      <div style={{ marginTop: 28 }}>
        <Label>RestTimer · 3 tratamientos (cambiá con Tweaks ↗)</Label>
        <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          <RTPreview title="A · Pinned arriba" body="Barra sticky en top, no obstruye. Recomendado.">
            <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.05)' }}>
              <RestTimerPinned />
              <div style={{ background: 'rgb(12 10 9)', padding: 24, minHeight: 120 }}>
                <div className="t-body-sm" style={{ color: 'rgb(116 105 94)' }}>(scroll del ejercicio sigue acá abajo)</div>
              </div>
            </div>
          </RTPreview>
          <RTPreview title="B · Floating sheet" body="Card flotante sobre BottomNav. Expande a sheet completo.">
            <div style={{ borderRadius: 12, overflow: 'hidden', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.05)', position: 'relative', background: 'rgb(12 10 9)', minHeight: 180 }}>
              <div style={{ padding: 16 }}>
                <div className="t-body-sm" style={{ color: 'rgb(116 105 94)' }}>(contenido del ejercicio)</div>
              </div>
              <div style={{ position: 'absolute', left: 12, right: 12, bottom: 12 }}>
                <RestTimerFloating />
              </div>
            </div>
          </RTPreview>
          <RTPreview title="C · Overlay full-screen" body="Primeros 5s · momento de respiro forzado. Se minimiza solo.">
            <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.05)', background: 'rgb(12 10 9)', minHeight: 240 }}>
              <RestTimerOverlay />
            </div>
          </RTPreview>
        </div>
      </div>
    </div>
  );
}

function RTPreview({ title, body, children }) {
  return (
    <div>
      <div className="t-caption" style={{ color: 'rgb(212 204 194)', fontWeight: 600 }}>{title}</div>
      <div className="t-body-sm" style={{ color: 'rgb(150 138 125)', marginTop: 2, marginBottom: 10, minHeight: 36 }}>{body}</div>
      {children}
    </div>
  );
}

Object.assign(window, {
  SetLogger, NumericStepper, RestTimerPinned, RestTimerFloating, RestTimerOverlay,
  PrCelebration, ExerciseSessionCard, SessionHeatmap, ExerciseHistoryChart, ArtDomain, generateHeatmapData,
});
