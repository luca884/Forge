// foundations.jsx — Color, Type, Spacing, Radius, Elevation, Z-index artboards.
// All artboards are scoped to .forge-dark unless noted; light counterparts shown inline.

const __forgeDark = { background: 'rgb(12 10 9)', color: 'rgb(212 204 194)' };

// ─── Brand/intro artboard ─────────────────────────────────────────────────
function ArtBrand({ activeAccent = 'cobalto' }) {
  const accent = ACCENT_RAMPS[activeAccent] || ACCENT_RAMPS.cobalto;
  return (
    <div className="forge-frame forge-dark" style={{ ...__forgeDark, width: '100%', height: '100%', padding: 56, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(60% 50% at 90% 10%, rgba(var(--accent-rgb),.12), transparent 60%)' }} />
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <ForgeMark size={48} />
          <div>
            <div className="t-micro" style={{ color: 'rgb(150 138 125)' }}>Design system · v0.1 · 2026</div>
            <div className="t-h2" style={{ color: 'var(--text-hi)', marginTop: 2 }}>Forge</div>
          </div>
        </div>

        <div style={{ maxWidth: 720 }}>
          <div className="t-display" style={{ color: 'var(--text-hi)', letterSpacing: '-0.04em' }}>
            Built for the rack,<br/>not the feed.
          </div>
          <div className="t-body-lg" style={{ color: 'rgb(184 174 163)', marginTop: 24, maxWidth: 580 }}>
            A monochrome, mobile-first PWA for logging gym work. Heavy on numerics, light
            on chrome, dark by default. One accent — chosen with intent — earns its color
            by marking only what matters: the next action, an active state. The PR moment
            stays warm always — the only temperature shift in the app.
          </div>
        </div>

        <div style={{ display: 'flex', gap: 32, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          {[
            ['Acento', `${accent.name} · ${accent.hex.toUpperCase()}`],
            ['PR celebration', 'Brasa · #FF6A1F · fixed'],
            ['Fuente', 'Geist + Geist Mono'],
            ['Íconos', 'Lucide · stroke 1.75'],
            ['Tema', 'Dark first'],
          ].map(([k, v]) => (
            <div key={k}>
              <div className="t-micro" style={{ color: 'rgb(150 138 125)' }}>{k}</div>
              <div className="t-body" style={{ color: 'var(--text-strong)', marginTop: 4 }}>{v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ForgeMark({ size = 32, accent = 'rgb(var(--accent-rgb))' }) {
  // Simple geometric mark — anvil silhouette + ember spark.
  // 32x32 viewBox. Mono + accent dot.
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="0.5" y="0.5" width="31" height="31" rx="7.5" fill="rgb(22 19 17)" stroke="rgb(58 52 47)" />
      {/* anvil */}
      <path d="M7 18h18l-2 3H9l-2-3z" fill="rgb(234 227 216)" />
      <path d="M11 13h10v3H11z" fill="rgb(234 227 216)" />
      <path d="M14 21h4v3h-4z" fill="rgb(184 174 163)" />
      {/* ember spark */}
      <circle cx="23" cy="9" r="2" fill={accent} />
    </svg>
  );
}

// ─── Color palette ────────────────────────────────────────────────────────
const NEUTRAL_RAMP = [
  ['50',  '#f8f4ec', 'text·strongest'],
  ['100', '#eae3d8', 'text·heading'],
  ['200', '#d4ccc2', 'text·body'],
  ['300', '#b8aea3', 'text·2'],
  ['400', '#968a7d', 'text·3'],
  ['500', '#74695e', 'dim'],
  ['600', '#524a42', 'muted·icon'],
  ['700', '#3a342f', 'border'],
  ['800', '#2a2522', 'border·subtle'],
  ['850', '#1f1b18', 'surface·2'],
  ['900', '#161311', 'surface'],
  ['925', '#12100e', 'sub·bg'],
  ['950', '#0c0a09', 'bg'],
];

const ACCENT_RAMPS = {
  cobalto:{ hex: '#2a6fdb', name: 'Cobalto', why: 'Frialdad clínica. "La herramienta", no la llama. Linear/Vercel-esca. PR sigue siendo warm para crear contraste de temperatura.', ramp: ['#e9f0fc','#cdddf6','#a3c1ef','#7da4e7','#5089e0','#2a6fdb','#1d56b8','#143f8d'] },
  brasa:  { hex: '#ff6a1f', name: 'Brasa',   why: 'Energía dopaminérgica; lectura inmediata bajo fluorescente. La opción "forja" más obvia.', ramp: ['#fff3e8','#ffe3d0','#ffc8a8','#ffa478','#ff8447','#ff6a1f','#d85a16','#b8430c'] },
  carbon: { hex: '#d14545', name: 'Carbón',  why: 'Sangre + óxido. Más serio, lectura Linear-esca.',                                            ramp: ['#fdecec','#fad1d1','#f1a3a3','#e57777','#d85a5a','#d14545','#b53636','#962525'] },
  hivis:  { hex: '#ffc700', name: 'Hi-vis',  why: 'Amarillo industrial de obra. Bauhaus + warning sign. Alta legibilidad bajo cualquier luz.', ramp: ['#fff8d6','#ffeea1','#ffe066','#ffd530','#ffce0f','#ffc700','#d6a700','#9c7a00'] },
  crema:  { hex: '#f0ebe3', name: 'Crema',   why: 'Sin color. Monocromo total a la Vercel docs. El "acento" es lectura por contraste puro.',   ramp: ['#fcfaf6','#f8f4ec','#f4efe5','#f0ebe3','#d6cfc6','#b8aea3','#8e8472','#67604f'] },
};

function ArtColorPalette({ activeAccent }) {
  const accent = ACCENT_RAMPS[activeAccent] || ACCENT_RAMPS.cobalto;
  return (
    <div className="forge-frame forge-dark" style={{ ...__forgeDark, padding: 40, width: '100%', height: '100%' }}>
      <SectionHeader eyebrow="01 · Color" title="Una neutra, un acento" subtitle="Todo lo demás es ausencia." />

      <div style={{ marginTop: 28 }}>
        <Label>Forge neutrals · warm umber undertone</Label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(13, 1fr)', gap: 6, marginTop: 12 }}>
          {NEUTRAL_RAMP.map(([k, hex, role]) => (
            <Swatch key={k} step={k} hex={hex} role={role} />
          ))}
        </div>
      </div>

      <div style={{ marginTop: 36 }}>
        <Label>Accent · <span style={{ color: 'var(--text-strong)' }}>{accent.name}</span> · cambiá con Tweaks ↗</Label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 6, marginTop: 12 }}>
          {accent.ramp.map((hex, i) => {
            const steps = ['50','100','200','300','400','500','600','700'];
            return <Swatch key={hex} step={steps[i]} hex={hex} role={steps[i] === '500' ? 'DEFAULT' : ''} dark />;
          })}
        </div>
        <div className="t-body-sm" style={{ color: 'rgb(184 174 163)', marginTop: 14, maxWidth: 640 }}>
          <span style={{ color: 'var(--text)' }}>Por qué.</span> {accent.why}
        </div>
      </div>

      <div style={{ marginTop: 36, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
        <UsageCard title="Where the ember goes" items={[
          'Primary CTA (Loguear set, Empezar sesión)',
          'Active tab + active set indicator',
          'PR celebration + new PR badges',
          'Timer · last 5s urgency',
          'Heatmap intensity (alpha 0.10 → 1)',
        ]} />
        <UsageCard title="Where it doesn't go" items={[
          'Body text, icons cosméticos',
          'Borders normales (usar forge-700/800)',
          'Backgrounds full · solo soft tints',
          'Success/info — todo monocromo',
        ]} />
        <UsageCard title="Destructive · sólo aquí" items={[
          '#d14545 — Eliminar rutina/ejercicio',
          'Confirm sheet "¿Borrar sesión?"',
          'Errores de validación inline',
          'Nada más. Un solo segundo color.',
        ]} />
      </div>
    </div>
  );
}

// Light mode preview
function ArtColorLight() {
  const LIGHT_RAMP = [
    ['50','#faf6f0','bg'],['100','#f3eee5','surface·2'],['200','#ebe5d8','border'],['300','#ddd5c5','border·strong'],
    ['400','#c4baa7','dim'],['500','#8e8472','muted·icon'],['600','#67604f','text·3'],['700','#4a4434','text·2'],
    ['800','#2f2b21','text'],['900','#1b1810','text·strong'],['950','#0c0a06','hi'],
  ];
  return (
    <div className="forge-frame forge-light" style={{ background: '#faf6f0', color: '#1b1810', padding: 40, width: '100%', height: '100%' }}>
      <SectionHeader light eyebrow="01b · Color" title="Light mode" subtitle="Secundario. Solo neutrals; el acento usa step 600 para WCAG AA sobre crema." />
      <div style={{ marginTop: 28 }}>
        <Label light>Light neutrals</Label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(11, 1fr)', gap: 6, marginTop: 12 }}>
          {LIGHT_RAMP.map(([k, hex, role]) => (
            <Swatch key={k} step={k} hex={hex} role={role} light />
          ))}
        </div>
      </div>
      <div style={{ marginTop: 36, maxWidth: 640 }}>
        <div className="t-body-sm" style={{ color: '#4a4434' }}>
          <span style={{ color: '#1b1810', fontWeight: 600 }}>WCAG AA.</span> Texto body sobre bg
          tiene contraste 13.4:1 (dark) y 11.2:1 (light). Acento sobre bg: 4.8:1 (dark) y 4.6:1 (light).
          Acento sobre acento-soft (10% alpha): legible solo para texto ≥14px bold — no usar para body.
        </div>
      </div>
    </div>
  );
}

function Swatch({ step, hex, role, light, dark }) {
  return (
    <div>
      <div style={{
        height: 80, borderRadius: 8, background: hex,
        boxShadow: light ? 'inset 0 0 0 1px rgba(0,0,0,.06)' : 'inset 0 0 0 1px rgba(255,255,255,.06)',
      }} />
      <div className="t-mono" style={{ fontSize: 10, color: light ? '#4a4434' : 'rgb(184 174 163)', marginTop: 6 }}>{step}</div>
      <div className="t-mono" style={{ fontSize: 10, color: light ? '#67604f' : 'rgb(150 138 125)' }}>{hex}</div>
      {role ? <div className="t-mono" style={{ fontSize: 9, color: light ? '#8e8472' : 'rgb(116 105 94)', marginTop: 2 }}>{role}</div> : null}
    </div>
  );
}

function SectionHeader({ eyebrow, title, subtitle, light }) {
  return (
    <div>
      <div className="t-micro" style={{ color: light ? '#8e8472' : 'rgb(150 138 125)' }}>{eyebrow}</div>
      <div className="t-h1" style={{ color: light ? '#0c0a06' : 'var(--text-hi)', marginTop: 6 }}>{title}</div>
      {subtitle ? <div className="t-body" style={{ color: light ? '#4a4434' : 'rgb(184 174 163)', marginTop: 6, maxWidth: 720 }}>{subtitle}</div> : null}
    </div>
  );
}
function Label({ children, light }) {
  return <div className="t-micro" style={{ color: light ? '#67604f' : 'rgb(150 138 125)' }}>{children}</div>;
}
function UsageCard({ title, items }) {
  return (
    <div style={{
      background: 'rgb(22 19 17)', borderRadius: 12, padding: 16,
      boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.05)',
    }}>
      <div className="t-caption" style={{ color: 'rgb(150 138 125)', marginBottom: 10 }}>{title}</div>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {items.map(it => (
          <li key={it} className="t-body-sm" style={{ color: 'rgb(212 204 194)', display: 'flex', gap: 8, alignItems: 'baseline' }}>
            <span style={{ width: 4, height: 4, borderRadius: 9999, background: 'rgb(82 74 66)', display: 'inline-block', flexShrink: 0, marginTop: 8 }} />
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Typography artboard ──────────────────────────────────────────────────
function ArtTypography() {
  return (
    <div className="forge-frame forge-dark" style={{ ...__forgeDark, padding: 40, width: '100%', height: '100%', overflow: 'hidden' }}>
      <SectionHeader eyebrow="02 · Type" title="Geist. Una sola fuente." subtitle="Sans neo-grotesque, números tabulares por OpenType (tnum, ss01). Mono para timers crudos." />

      <div style={{ marginTop: 28, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'start' }}>
        <div>
          <Label>Display · numérica</Label>
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 18 }}>
            <TypeRow label="display-xl · 96/96 · -0.04em · 600" sample="142.5" cls="t-display-xl" mono />
            <TypeRow label="display · 64/64 · -0.035em · 600"   sample="01:32"  cls="t-display"     mono />
          </div>
        </div>
        <div>
          <Label>Heading</Label>
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <TypeRow label="h1 · 32/38 · -0.025em · 600" sample="Push · día 1" cls="t-h1" />
            <TypeRow label="h2 · 24/30 · -0.020em · 600" sample="Press de banca" cls="t-h2" />
            <TypeRow label="h3 · 19/26 · -0.015em · 600" sample="Sets de hoy" cls="t-h3" />
          </div>
        </div>
      </div>

      <div style={{ marginTop: 28, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
        <div>
          <Label>Body</Label>
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <TypeRow label="body-lg · 17/24 · 400" sample="3 ejercicios completados de 6." cls="t-body-lg" />
            <TypeRow label="body · 15/22 · 400" sample="Last: 80 kg × 8 · hace 4 días" cls="t-body" />
            <TypeRow label="body-sm · 13/18 · 400" sample="Mantené pulsado para editar el set." cls="t-body-sm" />
          </div>
        </div>
        <div>
          <Label>Meta</Label>
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <TypeRow label="caption · 12/16 · 500" sample="Descanso 1:30" cls="t-caption" />
            <TypeRow label="micro · 11/14 · 0.06em · 600 · uppercase" sample="HOY · LUNES" cls="t-micro" />
          </div>
        </div>
      </div>

      <div style={{ marginTop: 28, padding: 16, background: 'rgb(22 19 17)', borderRadius: 12, boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.05)' }}>
        <Label>Numerals · tabular alignment</Label>
        <div className="t-num" style={{ color: 'var(--text-hi)', fontSize: 28, fontWeight: 600, marginTop: 10, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>
          <div>80.0 kg × 8</div>
          <div>112.5 kg × 4</div>
          <div>  5.0 kg × 12</div>
        </div>
        <div className="t-body-sm" style={{ color: 'rgb(150 138 125)', marginTop: 10 }}>
          tnum garantiza columnas alineadas. Aplicalo siempre que muestres pesos, reps, tiempos, % o conteos.
        </div>
      </div>
    </div>
  );
}

function TypeRow({ label, sample, cls, mono }) {
  return (
    <div>
      <div className="t-mono" style={{ fontSize: 10, color: 'rgb(116 105 94)', letterSpacing: '0.03em' }}>{label}</div>
      <div className={cls} style={{ color: 'var(--text-strong)', marginTop: 4, fontFamily: mono ? 'var(--font-mono)' : 'var(--font-sans)', fontVariantNumeric: 'tabular-nums' }}>{sample}</div>
    </div>
  );
}

// ─── Spacing + Radius + Elevation + Z-index artboard ──────────────────────
function ArtSystem() {
  return (
    <div className="forge-frame forge-dark" style={{ ...__forgeDark, padding: 40, width: '100%', height: '100%', overflow: 'hidden' }}>
      <SectionHeader eyebrow="03 · System" title="Spacing, radius, elevation, z" subtitle="Tailwind defaults extended. No spacing custom — usá 1,2,3,4,5,6,8,10,12,14,16,20 (× 4px)." />

      <div style={{ marginTop: 28, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
        <div>
          <Label>Spacing scale · base 4px</Label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
            {[
              ['1', 4, 'gap pequeño · inline'],
              ['2', 8, 'spacing chip interno'],
              ['3', 12, 'padding-x button-sm'],
              ['4', 16, 'card padding · row gap'],
              ['5', 20, 'sección spacing'],
              ['6', 24, 'card padding lg'],
              ['8', 32, 'screen vertical rhythm'],
              ['10', 40, 'screen padding desktop'],
              ['12', 48, 'hero spacing'],
              ['16', 64, 'screen top hero'],
            ].map(([k, px, role]) => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <span className="t-mono" style={{ width: 28, fontSize: 11, color: 'rgb(184 174 163)' }}>{k}</span>
                <span className="t-mono" style={{ width: 40, fontSize: 11, color: 'rgb(116 105 94)' }}>{px}px</span>
                <div style={{ width: px, height: 12, background: 'rgb(var(--accent-rgb))', borderRadius: 2, opacity: 0.85 }} />
                <span className="t-body-sm" style={{ color: 'rgb(150 138 125)' }}>{role}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <Label>Radius</Label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 12 }}>
            {[
              ['xs', 4, 'chip, tag'],
              ['sm', 6, 'tag de muscle group'],
              ['md', 8, 'inputs, buttons'],
              ['lg', 12, 'cards, set rows'],
              ['xl', 16, 'sheet header'],
              ['2xl', 24, 'modals + celebration'],
            ].map(([k, r, role]) => (
              <div key={k}>
                <div style={{ width: '100%', height: 60, borderRadius: r, background: 'rgb(42 37 34)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.08)' }} />
                <div className="t-mono" style={{ fontSize: 10, color: 'rgb(184 174 163)', marginTop: 6 }}>{k} · {r}px</div>
                <div className="t-mono" style={{ fontSize: 9, color: 'rgb(116 105 94)' }}>{role}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 20 }}>
            <Label>Elevation · dark uses inner ring, not shadow</Label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 12 }}>
              <ElevCard step="1" desc="surfaces flat" shadow="inset 0 0 0 1px rgba(255,255,255,.05)" />
              <ElevCard step="2" desc="card raised"  shadow="inset 0 0 0 1px rgba(255,255,255,.08)" />
              <ElevCard step="3" desc="sheet/modal"  shadow="inset 0 0 0 1px rgba(255,255,255,.10), 0 24px 56px rgba(0,0,0,.5)" />
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 28 }}>
        <Label>Z-index map · concrete values, no z-50 magic</Label>
        <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
          {[
            ['10', 'header'],
            ['20', 'bottom-nav'],
            ['25', 'timer pinned'],
            ['40', 'sheet bg'],
            ['45', 'sheet'],
            ['50', 'modal bg'],
            ['55', 'modal'],
            ['70', 'toast'],
            ['80', 'celebration'],
            ['—', 'tooltip · portal'],
          ].map(([z, name]) => (
            <div key={name} style={{ padding: 10, background: 'rgb(22 19 17)', borderRadius: 8, boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.05)' }}>
              <div className="t-mono" style={{ fontSize: 18, color: 'rgb(var(--accent-rgb))', fontWeight: 600 }}>{z}</div>
              <div className="t-mono" style={{ fontSize: 10, color: 'rgb(184 174 163)', marginTop: 4 }}>{name}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ElevCard({ step, desc, shadow }) {
  return (
    <div>
      <div style={{ height: 60, borderRadius: 12, background: 'rgb(22 19 17)', boxShadow: shadow }} />
      <div className="t-mono" style={{ fontSize: 10, color: 'rgb(184 174 163)', marginTop: 6 }}>elev-{step}</div>
      <div className="t-mono" style={{ fontSize: 9, color: 'rgb(116 105 94)' }}>{desc}</div>
    </div>
  );
}

Object.assign(window, { ArtBrand, ArtColorPalette, ArtColorLight, ArtTypography, ArtSystem, ForgeMark });
