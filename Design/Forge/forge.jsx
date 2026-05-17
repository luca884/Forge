// forge.jsx — Main app. Wires DesignCanvas + Tweaks + all artboards.
// Tweaks: accent color (brasa/carbón/cobre), RestTimer treatment.

const { useState, useEffect } = React;

/* ─── Accent palettes (DARK + LIGHT variants need different fg contrast) ── */
const ACCENT_HEX = {
  cobalto: { 50:'#e9f0fc', 100:'#cdddf6', 200:'#a3c1ef', 300:'#7da4e7', 400:'#5089e0', 500:'#2a6fdb', 600:'#1d56b8', 700:'#143f8d', fg:'#ffffff', text:'#7da4e7' },
  brasa:   { 50:'#fff3e8', 100:'#ffe3d0', 200:'#ffc8a8', 300:'#ffa478', 400:'#ff8447', 500:'#ff6a1f', 600:'#d85a16', 700:'#b8430c', fg:'#ffffff', text:'#ffa478' },
  carbon:  { 50:'#fdecec', 100:'#fad1d1', 200:'#f1a3a3', 300:'#e57777', 400:'#d85a5a', 500:'#d14545', 600:'#b53636', 700:'#962525', fg:'#ffffff', text:'#e57777' },
  hivis:   { 50:'#fff8d6', 100:'#ffeea1', 200:'#ffe066', 300:'#ffd530', 400:'#ffce0f', 500:'#ffc700', 600:'#d6a700', 700:'#9c7a00', fg:'#0c0a09', text:'#ffd530' },
  crema:   { 50:'#fcfaf6', 100:'#f8f4ec', 200:'#f4efe5', 300:'#f0ebe3', 400:'#d6cfc6', 500:'#f0ebe3', 600:'#d4cdc1', 700:'#9c9690', fg:'#0c0a09', text:'#f0ebe3' },
};
const ACCENT_BY_HEX = Object.fromEntries(Object.entries(ACCENT_HEX).map(([k, v]) => [v[500].toLowerCase(), k]));

function applyAccent(name) {
  const ramp = ACCENT_HEX[name] || ACCENT_HEX.cobalto;
  const root = document.documentElement;
  const toRGB = h => {
    const r = parseInt(h.slice(1,3),16), g = parseInt(h.slice(3,5),16), b = parseInt(h.slice(5,7),16);
    return `${r} ${g} ${b}`;
  };
  // Numeric steps for tw bridge
  for (const step of [50,100,200,300,400,500,600,700]) {
    root.style.setProperty(`--accent-${step}`, toRGB(ramp[step]));
  }
  // Semantic vars consumed by inline styles
  root.style.setProperty('--accent-rgb', toRGB(ramp[500]));
  root.style.setProperty('--accent',       ramp[500]);
  root.style.setProperty('--accent-hover', ramp[600]);
  root.style.setProperty('--accent-text',  ramp.text);   // text color on dark bg
  root.style.setProperty('--accent-fg',    ramp.fg);     // text/fg on solid accent
}

/* ─── Spec artboards (font, icons, a11y, anti-patterns) ───────────────── */
function ArtFontSpec() {
  return (
    <div className="forge-frame forge-dark" style={{ background:'rgb(12 10 9)', padding: 36, width:'100%', height:'100%', overflow: 'hidden' }}>
      <SectionHeader eyebrow="06a · Spec" title="Tipografía · qué bajar y por qué" />
      <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div>
          <Label>Geist · sans variable</Label>
          <div className="t-h1" style={{ color: 'var(--text-hi)', marginTop: 10, fontFamily: 'Geist' }}>AaBb 123 · 80 kg × 8</div>
          <div className="t-body-sm" style={{ color: 'rgb(184 174 163)', marginTop: 12, lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--text)' }}>Por qué Geist:</strong> neo-grotesque diseñada para UI densa. Buena
            lectura en tamaños chicos, números con ajuste de ancho excelente (tnum, ss01). Variable font único archivo,
            corta el bundle en 4× vs cargar 5 weights estáticos.
          </div>
          <div style={{ marginTop: 16 }}>
            <SpecRow tw="// public/fonts/geist-variable.woff2 · ~110 KB" />
            <SpecRow tw="@font-face { font-family:'Geist'; src:url(/fonts/geist.woff2) format('woff2 supports variations'); font-weight:100 900; font-display:swap; }" />
          </div>
          <div className="t-body-sm" style={{ color: 'rgb(184 174 163)', marginTop: 14 }}>
            <strong style={{ color: 'var(--text)' }}>Bajar de:</strong>{' '}
            <a href="https://github.com/vercel/geist-font/tree/main/packages/next/dist/fonts" style={{ color: 'var(--accent-text)', textDecoration: 'underline' }}>
              github.com/vercel/geist-font
            </a>
            {' · '}MIT.{' '}
            <strong style={{ color: 'var(--text)' }}>Pesos:</strong> usá 400 / 500 / 600 (variable = 1 archivo cubre todo).
          </div>
        </div>

        <div>
          <Label>Geist Mono · sólo para timers crudos</Label>
          <div style={{ marginTop: 10, fontFamily: 'Geist Mono', color: 'var(--text-hi)', fontSize: 48, fontWeight: 600, letterSpacing: '-0.025em', fontVariantNumeric: 'tabular-nums' }}>01:32</div>
          <div className="t-body-sm" style={{ color: 'rgb(184 174 163)', marginTop: 12, lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--text)' }}>Cuándo:</strong> únicamente para timers cuya lectura cambia caracter
            por caracter (RestTimer, duración de sesión). Pesos y reps usan Geist Sans con tnum — sans tiene mejor
            lectura para datos compuestos (80 kg × 8).
          </div>
          <div style={{ marginTop: 12 }}>
            <SpecRow tw="font-feature-settings:'tnum','ss01'  /* aplica a todo .t-num */" />
            <SpecRow tw="font-variant-numeric: tabular-nums   /* fallback CSS-nativo */" />
          </div>
          <div className="t-body-sm" style={{ color: 'rgb(184 174 163)', marginTop: 14 }}>
            <strong style={{ color: 'var(--text)' }}>Fallback stack:</strong>{' '}
            <code className="t-mono" style={{ color: 'var(--accent-text)', fontSize: 12 }}>'Geist', -apple-system, BlinkMacSystemFont, system-ui, sans-serif</code>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 28, padding: 18, background: 'rgb(22 19 17)', borderRadius: 12, boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.05)' }}>
        <Label>Por qué NO Inter</Label>
        <div className="t-body-sm" style={{ color: 'rgb(184 174 163)', marginTop: 8, lineHeight: 1.6, maxWidth: 720 }}>
          Inter es la default y por eso pasa desapercibida — la app va a parecer "esa fitness app más". Geist tiene
          personalidad sutil (terminaciones más rectas, contrastes más marcados, números algo más anchos) que se siente
          intencional sin ser ruidosa. Ambas tienen tabular nums correctos; preferimos personalidad.
        </div>
      </div>
    </div>
  );
}

function ArtIconSpec() {
  const sample = ['layers','dumbbell','zap','trending','user','plus','check','x','timer','flame','trophy','calendar','history','more','edit','trash','search','settings','bell','share','chevron-left','chevron-right','target','play','pause','skip','minus','install'];
  return (
    <div className="forge-frame forge-dark" style={{ background:'rgb(12 10 9)', padding: 36, width:'100%', height:'100%', overflow: 'hidden' }}>
      <SectionHeader eyebrow="06b · Spec" title="Iconografía · Lucide" subtitle="~1500 íconos, MIT, tree-shakeable, peso real ~1.5KB/ícono. Stroke editable." />

      <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
        <div>
          <Label>Set usado en Forge · stroke 1.75</Label>
          <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
            {sample.map(n => (
              <div key={n} style={{
                aspectRatio: '1', borderRadius: 8, background: 'rgb(22 19 17)',
                boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.05)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
                padding: 6,
              }}>
                <Icon name={n} size={18} style={{ color: 'rgb(212 204 194)' }} />
                <span className="t-mono" style={{ fontSize: 8, color: 'rgb(116 105 94)' }}>{n}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <Label>Integración Angular standalone</Label>
          <div style={{ marginTop: 12 }}>
            <SpecRow tw="npm i lucide-angular" />
          </div>
          <pre style={{
            marginTop: 12, padding: 14, background: 'rgb(22 19 17)', borderRadius: 8,
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.05)',
            color: 'rgb(212 204 194)', fontFamily: 'var(--font-mono)', fontSize: 11, lineHeight: 1.5,
            overflow: 'auto', margin: '12px 0 0',
          }}>{`// app.component.ts
import { LucideAngularModule, Zap, Flame } from 'lucide-angular';

@Component({
  standalone: true,
  imports: [LucideAngularModule],
  template: \`
    <lucide-icon [img]="Zap" [size]="20" strokeWidth="1.75" />
  \`,
})
export class TimerComponent {
  readonly Zap = Zap;
  readonly Flame = Flame;
}`}</pre>
          <div className="t-body-sm" style={{ color: 'rgb(184 174 163)', marginTop: 14, lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--text)' }}>Por qué tree-shake importa:</strong> el bundle final sólo
            incluye los íconos que importás explícitamente. Con 25-30 íconos en la app, sumás ~45 KB. Comparado
            con cargar un sprite SVG completo (~200 KB), es 4× más liviano.
          </div>

          <Label style={{ marginTop: 20, display: 'block' }}>Por qué Lucide y no Phosphor/Heroicons</Label>
          <ul style={{ paddingLeft: 18, margin: '10px 0 0', color: 'rgb(184 174 163)' }}>
            <li className="t-body-sm" style={{ marginBottom: 4 }}><strong style={{ color: 'var(--text)' }}>Heroicons:</strong> 2 tamaños rígidos, set pequeño, falta dumbbell, flame y target — vas a tener que dibujar tres.</li>
            <li className="t-body-sm" style={{ marginBottom: 4 }}><strong style={{ color: 'var(--text)' }}>Phosphor:</strong> precioso pero 6 weights × ~1300 íconos = bundle hostil si no configurás bien el side-effects flag.</li>
            <li className="t-body-sm"><strong style={{ color: 'var(--text)' }}>Lucide:</strong> 1 weight, stroke parametrizable, fork mantenido de Feather, set más grande de los tres.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function ArtA11y() {
  return (
    <div className="forge-frame forge-dark" style={{ background:'rgb(12 10 9)', padding: 36, width:'100%', height:'100%', overflow: 'hidden' }}>
      <SectionHeader eyebrow="07 · A11y" title="Accesibilidad · checklist no negociable" />

      <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div>
          <Label>Contraste · WCAG AA</Label>
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <ContrastRow fg="#d4ccc2" bg="#0c0a09" name="text body / bg" ratio="13.4:1" pass />
            <ContrastRow fg="#b8aea3" bg="#0c0a09" name="text-2 / bg" ratio="9.1:1" pass />
            <ContrastRow fg="#968a7d" bg="#0c0a09" name="text-3 / bg (caption mínimo)" ratio="5.6:1" pass />
            <ContrastRow fg="#74695e" bg="#0c0a09" name="muted-icon" ratio="3.5:1" passLarge note="solo 14px+ bold o íconos no críticos" />
            <ContrastRow fg="#ff6a1f" bg="#0c0a09" name="accent / bg" ratio="4.8:1" pass />
            <ContrastRow fg="#ff6a1f" bg="#161311" name="accent / surface" ratio="4.4:1" passLarge note="texto secundario solo 14px+" />
            <ContrastRow fg="#ffffff" bg="#ff6a1f" name="white / accent (CTA)" ratio="3.1:1" passLarge note="OK para 14px+ bold (es el caso)" />
          </div>
        </div>

        <div>
          <Label>Tap targets · Apple HIG ≥ 44px</Label>
          <Card style={{ marginTop: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                ['Primary button md/lg', '44 / 56', true],
                ['Secondary button', '44', true],
                ['BottomNav tab', '56', true],
                ['IconButton header', '36', false],
                ['Chip', '28', false],
                ['Stepper +/−', '36', false],
              ].map(([n, h, ok]) => (
                <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Icon name={ok ? 'check-circle' : 'info'} size={14} style={{ color: ok ? 'var(--accent-text)' : 'rgb(232 125 125)' }} />
                  <span className="t-body-sm" style={{ color: 'var(--text)' }}>{n}</span>
                  <span className="t-mono" style={{ fontSize: 11, color: 'rgb(116 105 94)', marginLeft: 'auto' }}>{h}px</span>
                </div>
              ))}
            </div>
            <div className="t-body-sm" style={{ color: 'rgb(150 138 125)', marginTop: 14, lineHeight: 1.6 }}>
              Los items con ⚠ no cumplen estrictamente — están dentro de zonas grandes (header bar, card row entero clickable, set row). Cada uno tiene un padding-area de 44+ que es el hit target real.
            </div>
          </Card>

          <Label style={{ marginTop: 20, display: 'block' }}>Focus + Aria</Label>
          <ul style={{ paddingLeft: 18, margin: '10px 0 0', color: 'rgb(184 174 163)' }}>
            <li className="t-body-sm" style={{ marginBottom: 4 }}>Anillo de foco: <code className="t-mono" style={{ color: 'var(--accent-text)', fontSize: 11 }}>:focus-visible</code> · 2px solid rgba(accent, .55) · offset 2px.</li>
            <li className="t-body-sm" style={{ marginBottom: 4 }}>IconButton sin texto: <code className="t-mono" style={{ color: 'var(--accent-text)', fontSize: 11 }}>aria-label="Configuración"</code> obligatorio.</li>
            <li className="t-body-sm" style={{ marginBottom: 4 }}>RestTimer: <code className="t-mono" style={{ color: 'var(--accent-text)', fontSize: 11 }}>role="timer" aria-live="polite"</code>; anuncia al llegar 0.</li>
            <li className="t-body-sm" style={{ marginBottom: 4 }}>SetLogger numérico: <code className="t-mono" style={{ color: 'var(--accent-text)', fontSize: 11 }}>inputmode="decimal"</code> para teclado correcto.</li>
            <li className="t-body-sm">Prefers-reduced-motion: <code className="t-mono" style={{ color: 'var(--accent-text)', fontSize: 11 }}>@media</code> que desactiva pulse del timer + shimmer del skeleton.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function ContrastRow({ fg, bg, name, ratio, pass, passLarge, note }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
      background: 'rgb(22 19 17)', borderRadius: 8,
      boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.05)',
    }}>
      <div style={{
        background: bg, color: fg, padding: '6px 10px', borderRadius: 4,
        fontSize: 13, fontWeight: 600, minWidth: 56, textAlign: 'center',
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.04)',
      }}>Aa</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="t-body-sm" style={{ color: 'var(--text)' }}>{name}</div>
        {note ? <div className="t-caption" style={{ color: 'rgb(116 105 94)', marginTop: 1 }}>{note}</div> : null}
      </div>
      <span className="t-mono" style={{ fontSize: 11, color: 'rgb(184 174 163)' }}>{ratio}</span>
      <span className="t-mono" style={{
        fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
        color: pass ? 'var(--accent-text)' : 'rgb(232 184 90)',
        background: pass ? 'rgba(var(--accent-rgb),.12)' : 'rgba(232,184,90,.12)',
      }}>{pass ? 'AA' : 'AA LG'}</span>
    </div>
  );
}

function ArtAntipatterns() {
  return (
    <div className="forge-frame forge-dark" style={{ background:'rgb(12 10 9)', padding: 36, width:'100%', height:'100%' }}>
      <SectionHeader eyebrow="08 · No-go" title="Lo que evitar · líneas rojas" />

      <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <BadCard title="Gradients en backgrounds" why="Visualmente ruidoso. Los radiales sutiles del CTA y Heatmap están permitidos como acentos puntuales (alpha <0.2). No usar nunca como bg de card o pantalla." />
        <BadCard title="Glassmorphism / backdrop-blur masivo" why="Performance hostil en celular y se ve a 2026. Usamos blur sólo en BottomNav y RestTimer overlay donde la traslucidez aporta jerarquía real." />
        <BadCard title="Animaciones spring · parallax · scroll-jacking" why="Sos vos en el gym, no en una landing. CSS transitions <200ms para estados y nada más. No instalar Framer/Motion." />
        <BadCard title="Emojis en UI" why="Inconsistencia entre OS (Apple/Google/Windows) + lectura imprecisa. Usar siempre Lucide. Ni 🔥 para PR — usamos el ícono flame." />
        <BadCard title="Más de 1 acento de color" why="Mono + brasa. Punto. Si necesitás 'estado positivo', es ausencia de problema (texto normal). Si necesitás warning amarillo, repensá la UI." />
        <BadCard title="Iconos cosméticos al lado de cada label" why="Cada ícono debe agregar info, no decorar. Si la palabra 'Rutinas' es suficiente, no le pongas 🏋. Está la barra superior y la tab — eso alcanza." />
        <BadCard title="Bordes >12px en cards" why="Las cards usan 12px (lg). Mayor que eso parece app de juguete. Sólo modals (24px) y chips/avatares (full) van más altos." />
        <BadCard title="Sombras pronunciadas en dark" why="En dark las sombras se pierden. Usamos inset ring 1px de blanco con baja alpha. Los floating elements (sheets, modals, toasts) pueden usar shadow + ring combinados." />
      </div>
    </div>
  );
}

function BadCard({ title, why }) {
  return (
    <div style={{
      background: 'rgba(209,69,69,0.06)', borderRadius: 12, padding: 16,
      boxShadow: 'inset 0 0 0 1px rgba(209,69,69,0.2)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <Icon name="x" size={14} style={{ color: 'rgb(232 125 125)' }} />
        <div className="t-body" style={{ color: 'rgb(232 125 125)', fontWeight: 600 }}>{title}</div>
      </div>
      <div className="t-body-sm" style={{ color: 'rgb(184 174 163)', lineHeight: 1.55 }}>{why}</div>
    </div>
  );
}

/* ─── Interaction patterns artboard ──────────────────────────────────── */
function ArtInteractions() {
  return (
    <div className="forge-frame forge-dark" style={{ background:'rgb(12 10 9)', padding: 36, width:'100%', height:'100%' }}>
      <SectionHeader eyebrow="09 · Patterns" title="Microinteracciones · cómo se siente" subtitle="Resumen ejecutivo. La app debe sentirse rápida y precisa, no juguetona." />

      <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <PatternCard title="Loguear un set">
          <ol style={listStyle}>
            <li>Tap en CTA primary "Loguear set" (h-56, full-width)</li>
            <li>Inputs hacen flash de check 200ms (border accent → fade)</li>
            <li>Haptic feedback <code className="t-mono" style={inlineCode}>navigator.vibrate(8)</code> en Android</li>
            <li>Set se "consolida" en lista (sin animación de altura — pop instantáneo)</li>
            <li>RestTimer arranca · audio beep corto si volumen activo</li>
            <li>Si es PR: PrCelebration banner se desliza desde arriba (200ms · ease-out)</li>
          </ol>
        </PatternCard>

        <PatternCard title="Teclado en SetLogger">
          <ol style={listStyle}>
            <li><code className="t-mono" style={inlineCode}>inputmode="decimal"</code> para peso (teclado numérico con punto)</li>
            <li><code className="t-mono" style={inlineCode}>inputmode="numeric"</code> para reps (sin punto)</li>
            <li>Steppers +/− alteran value en pasos de 2.5 kg (peso) o 1 (reps)</li>
            <li>Long-press en steppers: acelera (después de 400ms, repite cada 80ms)</li>
            <li>Submit cierra teclado con <code className="t-mono" style={inlineCode}>input.blur()</code></li>
            <li>Tabular nums siempre, nunca dejá que un "1" sea más angosto que un "8"</li>
          </ol>
        </PatternCard>

        <PatternCard title="RestTimer mientras corre">
          <ol style={listStyle}>
            <li>Default · pinned arriba: barra sticky 44px alto · no obstruye scroll del ejercicio</li>
            <li>Los últimos 5 segundos: number pulsa (opacity 1 → 0.6 → 1, 1s)</li>
            <li>Al llegar a 0: notificación push del SO + beep + vibración 200ms</li>
            <li>Botones +15s y Saltar siempre visibles (no escondidos en menú)</li>
            <li>Scroll del usuario no afecta el timer · 100% independiente</li>
            <li>Si bloquean pantalla: Service Worker sigue contando + push al llegar a 0</li>
          </ol>
        </PatternCard>

        <PatternCard title="Scroll con 8 ejercicios + timer activo">
          <ol style={listStyle}>
            <li>Ejercicio actual: card expandida full · auto-scroll cuando empezás un set</li>
            <li>Anteriores ya completados: card colapsada · solo nombre + sets done</li>
            <li>Siguientes pendientes: card colapsada · nombre + target</li>
            <li>Tap en card colapsada la expande · no impacta scroll del timer</li>
            <li>Bottom bar siempre tiene CTA primario contextual ("Loguear set" / "Siguiente ejercicio")</li>
            <li>safe-area-inset-bottom para gesture bar de iOS</li>
          </ol>
        </PatternCard>
      </div>
    </div>
  );
}

const listStyle = { margin: 0, paddingLeft: 20, color: 'rgb(184 174 163)', display: 'flex', flexDirection: 'column', gap: 6 };
const inlineCode = { color: 'var(--accent-text)', fontSize: 11, background: 'rgba(var(--accent-rgb),.1)', padding: '1px 5px', borderRadius: 4, fontFamily: 'var(--font-mono)' };

function PatternCard({ title, children }) {
  return (
    <div style={{
      background: 'rgb(22 19 17)', borderRadius: 12, padding: 16,
      boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.05)',
    }}>
      <div className="t-h3" style={{ color: 'var(--text-strong)', marginBottom: 10 }}>{title}</div>
      <div className="t-body-sm" style={{ lineHeight: 1.55 }}>{children}</div>
    </div>
  );
}

/* ─── App with Tweaks ─────────────────────────────────────────────────── */
function App() {
  const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
    "accent": "cobalto",
    "restTimer": "pinned",
    "theme": "dark"
  }/*EDITMODE-END*/;

  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  useEffect(() => { applyAccent(t.accent); }, [t.accent]);

  return (
    <>
      <DesignCanvas>
        <DCSection id="intro" title="Forge" subtitle="PWA single-user de gym · sistema visual completo">
          <DCArtboard id="brand" label="Brand statement" width={960} height={620}>
            <ArtBrand activeAccent={t.accent} />
          </DCArtboard>
        </DCSection>

        <DCSection id="foundations" title="Foundations" subtitle="Tokens · color, type, spacing, radius, elevation, z">
          <DCArtboard id="color" label="01 · Color · neutrals + accent" width={1000} height={780}>
            <ArtColorPalette activeAccent={t.accent} />
          </DCArtboard>
          <DCArtboard id="color-light" label="01b · Light mode" width={1000} height={500}>
            <ArtColorLight />
          </DCArtboard>
          <DCArtboard id="type" label="02 · Type · Geist" width={1000} height={780}>
            <ArtTypography />
          </DCArtboard>
          <DCArtboard id="system" label="03 · Spacing · radius · elevation · z" width={1000} height={780}>
            <ArtSystem />
          </DCArtboard>
        </DCSection>

        <DCSection id="components" title="Base components" subtitle="Tailwind-friendly primitives">
          <DCArtboard id="buttons" label="Buttons" width={1000} height={540}>
            <ArtButtons />
          </DCArtboard>
          <DCArtboard id="inputs" label="Inputs" width={1000} height={520}>
            <ArtInputs />
          </DCArtboard>
          <DCArtboard id="cards-nav" label="Cards · chips · BottomNav · sheet · toast · empty" width={1000} height={780}>
            <ArtCardsBottomNav />
          </DCArtboard>
        </DCSection>

        <DCSection id="domain" title="Domain components" subtitle="SetLogger · RestTimer · PR · Heatmap · Chart">
          <DCArtboard id="domain-all" label="Domain · overview" width={1100} height={1240}>
            <ArtDomain />
          </DCArtboard>
        </DCSection>

        <DCSection id="screens-flow1" title="Screens · Training" subtitle="La crítica · 3 estados × tratamiento de RestTimer (cambialo en Tweaks)">
          <DCArtboard id="training-home" label="Training · home" width={360} height={780}>
            <ScreenTrainingHome />
          </DCArtboard>
          <DCArtboard id="training-empty" label="Session · empty (recién empezó)" width={360} height={780}>
            <ScreenTrainingSession state="empty" restTimerTreatment={t.restTimer} />
          </DCArtboard>
          <DCArtboard id="training-mid" label="Session · mid-session (set 3 de 4)" width={360} height={780}>
            <ScreenTrainingSession state="mid" restTimerTreatment={t.restTimer} />
          </DCArtboard>
          <DCArtboard id="training-logged" label="Session · set just logged (con PR + Rest)" width={360} height={780}>
            <ScreenTrainingSession state="logged" restTimerTreatment={t.restTimer} />
          </DCArtboard>
          <DCArtboard id="session-summary" label="Session · summary" width={360} height={780}>
            <ScreenSessionSummary />
          </DCArtboard>
        </DCSection>

        <DCSection id="screens-flow2" title="Screens · Routines · Exercises">
          <DCArtboard id="routines-list" label="Rutinas · lista" width={360} height={780}>
            <ScreenRoutinesList />
          </DCArtboard>
          <DCArtboard id="routine-editor" label="Rutina · editor" width={360} height={780}>
            <ScreenRoutineEditor />
          </DCArtboard>
          <DCArtboard id="exercises-list" label="Ejercicios · lista" width={360} height={780}>
            <ScreenExercisesList />
          </DCArtboard>
          <DCArtboard id="exercise-form" label="Ejercicio · form" width={360} height={780}>
            <ScreenExerciseForm />
          </DCArtboard>
        </DCSection>

        <DCSection id="screens-flow3" title="Screens · Progress · Profile">
          <DCArtboard id="progress-home" label="Progreso · heatmap" width={360} height={780}>
            <ScreenProgressHome />
          </DCArtboard>
          <DCArtboard id="exercise-history" label="Progreso · history chart" width={360} height={780}>
            <ScreenExerciseHistory />
          </DCArtboard>
          <DCArtboard id="pr-list" label="Progreso · PR list" width={360} height={780}>
            <ScreenPrList />
          </DCArtboard>
          <DCArtboard id="profile" label="Perfil" width={360} height={780}>
            <ScreenProfile />
          </DCArtboard>
        </DCSection>

        <DCSection id="spec" title="Spec · recommendations" subtitle="Font, icons, a11y, anti-patterns, micro-interactions">
          <DCArtboard id="font" label="06a · Font · Geist" width={1000} height={680}>
            <ArtFontSpec />
          </DCArtboard>
          <DCArtboard id="icons" label="06b · Icons · Lucide" width={1000} height={680}>
            <ArtIconSpec />
          </DCArtboard>
          <DCArtboard id="a11y" label="07 · A11y" width={1000} height={680}>
            <ArtA11y />
          </DCArtboard>
          <DCArtboard id="interactions" label="09 · Microinteracciones" width={1100} height={680}>
            <ArtInteractions />
          </DCArtboard>
          <DCArtboard id="antipatterns" label="08 · No-go" width={1100} height={720}>
            <ArtAntipatterns />
          </DCArtboard>
        </DCSection>
      </DesignCanvas>

      <TweaksPanel title="Tweaks">
        <TweakSection label="Color de acento">
          <TweakColor
            label="Acento"
            value={ACCENT_HEX[t.accent]?.[500] || '#2a6fdb'}
            onChange={hex => setTweak('accent', ACCENT_BY_HEX[hex.toLowerCase()] || 'cobalto')}
            options={['#2a6fdb', '#ff6a1f', '#d14545', '#ffc700', '#f0ebe3']}
          />
          <div style={{ fontSize: 11, color: '#888', marginTop: 4, lineHeight: 1.4 }}>
            Cobalto · Brasa · Carbón · Hi-vis · Crema.<br/>
            Default: <strong>Cobalto</strong>. El warm naranja se conserva exclusivamente para PR celebration (mirá la pantalla Training · logged).
          </div>
        </TweakSection>

        <TweakSection label="RestTimer · tratamiento">
          <TweakRadio
            label="Treatment"
            value={t.restTimer}
            onChange={v => setTweak('restTimer', v)}
            options={[
              { value: 'pinned',   label: 'Pinned' },
              { value: 'floating', label: 'Float' },
              { value: 'overlay',  label: 'Overlay' },
            ]}
          />
          <div style={{ fontSize: 11, color: '#888', marginTop: 4, lineHeight: 1.4 }}>
            Mirá los 3 artboards de Training · Session para comparar.
          </div>
        </TweakSection>
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
