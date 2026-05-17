// components.jsx — base UI primitives + showcase artboards.
// All shown in dark theme (default). Tailwind class strings are written in
// the spec card next to each so the dev can copy exact classes.

const FORGE_DARK_STYLE = { background: 'rgb(12 10 9)', color: 'rgb(212 204 194)' };

/* ─── Primitives ──────────────────────────────────────────────────────── */

function Button({ variant = 'primary', size = 'md', children, leadingIcon, trailingIcon, full, disabled, style, ...rest }) {
  const heights = { sm: 36, md: 44, lg: 56 };
  const px = { sm: 12, md: 16, lg: 20 };
  const fs = { sm: 13, md: 15, lg: 17 };
  const variants = {
    primary: {
      background: 'rgb(var(--accent-rgb))', color: 'var(--accent-fg)', fontWeight: 600,
      boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.08), inset 0 -1px 0 rgba(0,0,0,.25), 0 1px 0 rgba(0,0,0,.3)',
    },
    secondary: {
      background: 'rgb(31 27 24)', color: 'rgb(234 227 216)', fontWeight: 500,
      boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.08)',
    },
    ghost: {
      background: 'transparent', color: 'rgb(212 204 194)', fontWeight: 500,
    },
    destructive: {
      background: 'rgba(209,69,69,0.12)', color: 'rgb(232 125 125)', fontWeight: 600,
      boxShadow: 'inset 0 0 0 1px rgba(209,69,69,0.3)',
    },
    accent_soft: {
      background: 'rgba(var(--accent-rgb),0.12)', color: 'var(--accent-text)', fontWeight: 600,
      boxShadow: 'inset 0 0 0 1px rgba(var(--accent-rgb),0.25)',
    },
  };
  return (
    <button
      disabled={disabled}
      style={{
        height: heights[size], paddingLeft: px[size], paddingRight: px[size],
        borderRadius: 8, border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        fontSize: fs[size], lineHeight: 1, letterSpacing: '-0.005em', fontFamily: 'inherit',
        whiteSpace: 'nowrap', width: full ? '100%' : undefined,
        opacity: disabled ? 0.45 : 1,
        ...variants[variant], ...style,
      }}
      {...rest}
    >
      {leadingIcon ? <Icon name={leadingIcon} size={size === 'lg' ? 20 : 16} /> : null}
      <span>{children}</span>
      {trailingIcon ? <Icon name={trailingIcon} size={size === 'lg' ? 20 : 16} /> : null}
    </button>
  );
}

function Input({ label, helper, error, prefix, suffix, value, placeholder, type = 'text', size = 'md', tabularNums, style, ...rest }) {
  const h = size === 'lg' ? 56 : size === 'sm' ? 36 : 44;
  const fs = size === 'lg' ? 17 : 15;
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6, ...style }}>
      {label ? <span className="t-caption" style={{ color: 'rgb(184 174 163)' }}>{label}</span> : null}
      <div style={{
        display: 'flex', alignItems: 'center', height: h, borderRadius: 8,
        background: 'rgb(22 19 17)',
        boxShadow: error
          ? 'inset 0 0 0 1px rgba(209,69,69,.5)'
          : 'inset 0 0 0 1px rgb(42 37 34)',
        paddingLeft: prefix ? 12 : 14, paddingRight: suffix ? 12 : 14,
        gap: 8,
      }}>
        {prefix ? <span className="t-body-sm" style={{ color: 'rgb(150 138 125)' }}>{prefix}</span> : null}
        <input
          type={type}
          placeholder={placeholder}
          defaultValue={value}
          style={{
            flex: 1, minWidth: 0, height: '100%', border: 'none', outline: 'none',
            background: 'transparent', color: 'rgb(248 244 236)',
            fontFamily: 'inherit', fontSize: fs,
            fontVariantNumeric: tabularNums ? 'tabular-nums' : 'normal',
            fontFeatureSettings: tabularNums ? '"tnum","ss01"' : 'normal',
          }}
          {...rest}
        />
        {suffix ? <span className="t-body-sm" style={{ color: 'rgb(150 138 125)' }}>{suffix}</span> : null}
      </div>
      {(error || helper) ? (
        <span className="t-body-sm" style={{ color: error ? 'rgb(232 125 125)' : 'rgb(150 138 125)' }}>
          {error || helper}
        </span>
      ) : null}
    </label>
  );
}

function Card({ children, padding = 16, raised = true, style }) {
  return (
    <div style={{
      background: 'rgb(22 19 17)', borderRadius: 12, padding,
      boxShadow: raised ? 'inset 0 0 0 1px rgba(255,255,255,.05)' : 'none',
      ...style,
    }}>{children}</div>
  );
}

function Chip({ children, active, size = 'md', leadingIcon, onClick }) {
  const h = size === 'sm' ? 24 : 28;
  const fs = size === 'sm' ? 11 : 12;
  return (
    <span onClick={onClick} style={{
      height: h, display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '0 10px', borderRadius: 9999,
      background: active ? 'rgba(var(--accent-rgb),0.16)' : 'rgb(31 27 24)',
      color: active ? 'var(--accent-text)' : 'rgb(184 174 163)',
      boxShadow: active ? 'inset 0 0 0 1px rgba(var(--accent-rgb),0.3)' : 'inset 0 0 0 1px rgba(255,255,255,.05)',
      fontSize: fs, fontWeight: 600, letterSpacing: '0.02em',
      cursor: onClick ? 'pointer' : 'default',
    }}>
      {leadingIcon ? <Icon name={leadingIcon} size={12} /> : null}
      {children}
    </span>
  );
}

function Skeleton({ width = '100%', height = 12, radius = 6, style }) {
  return (
    <div style={{
      width, height, borderRadius: radius,
      background: 'linear-gradient(90deg, rgb(31 27 24) 0%, rgb(42 37 34) 50%, rgb(31 27 24) 100%)',
      backgroundSize: '200% 100%',
      animation: 'forge-shimmer 1.6s ease-in-out infinite',
      ...style,
    }} />
  );
}

function Toast({ title, body, kind = 'info' }) {
  const map = {
    info: { ring: 'rgba(255,255,255,.08)', icon: 'info', tint: 'rgb(184 174 163)' },
    success: { ring: 'rgba(var(--accent-rgb),.32)', icon: 'check-circle', tint: 'var(--accent-text)' },
    error: { ring: 'rgba(209,69,69,.4)', icon: 'info', tint: 'rgb(232 125 125)' },
  };
  const k = map[kind];
  return (
    <div style={{
      background: 'rgb(31 27 24)', borderRadius: 12, padding: '12px 14px',
      boxShadow: `inset 0 0 0 1px ${k.ring}, 0 12px 32px rgba(0,0,0,.5)`,
      display: 'flex', gap: 12, alignItems: 'flex-start', maxWidth: 360,
    }}>
      <Icon name={k.icon} size={18} style={{ color: k.tint, marginTop: 2 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="t-body" style={{ color: 'rgb(234 227 216)', fontWeight: 600 }}>{title}</div>
        {body ? <div className="t-body-sm" style={{ color: 'rgb(184 174 163)', marginTop: 2 }}>{body}</div> : null}
      </div>
      <Icon name="x" size={16} style={{ color: 'rgb(116 105 94)', cursor: 'pointer' }} />
    </div>
  );
}

function EmptyState({ icon = 'dumbbell', title, body, action }) {
  return (
    <div style={{ textAlign: 'center', padding: '40px 24px' }}>
      <div style={{
        width: 56, height: 56, borderRadius: 16, margin: '0 auto 16px',
        background: 'rgb(22 19 17)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'rgb(116 105 94)',
      }}>
        <Icon name={icon} size={24} />
      </div>
      <div className="t-h3" style={{ color: 'rgb(234 227 216)' }}>{title}</div>
      <div className="t-body-sm" style={{ color: 'rgb(150 138 125)', marginTop: 6, maxWidth: 280, margin: '6px auto 0' }}>{body}</div>
      {action ? <div style={{ marginTop: 16 }}>{action}</div> : null}
    </div>
  );
}

/* ─── BottomNav · 5 tabs ──────────────────────────────────────────────── */
const NAV_ITEMS = [
  { id: 'routines',  icon: 'layers',   label: 'Rutinas' },
  { id: 'exercises', icon: 'dumbbell', label: 'Ejercicios' },
  { id: 'training',  icon: 'zap',      label: 'Entrenar' },
  { id: 'progress',  icon: 'trending', label: 'Progreso' },
  { id: 'profile',   icon: 'user',     label: 'Perfil' },
];

function BottomNav({ active = 'training', safeArea = true, compact }) {
  return (
    <div style={{
      background: 'rgba(18,16,14,0.92)',
      backdropFilter: 'blur(20px) saturate(1.1)',
      WebkitBackdropFilter: 'blur(20px) saturate(1.1)',
      borderTop: '1px solid rgb(42 37 34)',
      paddingBottom: safeArea ? 16 : 0,
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', height: 56 }}>
        {NAV_ITEMS.map(it => {
          const isActive = it.id === active;
          const isCTA = it.id === 'training';
          return (
            <div key={it.id} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 2, position: 'relative', cursor: 'pointer',
            }}>
              {isCTA && !isActive ? (
                <div style={{
                  position: 'absolute', top: 4, width: 44, height: 32, borderRadius: 12,
                  background: 'rgba(var(--accent-rgb),0.12)', boxShadow: 'inset 0 0 0 1px rgba(var(--accent-rgb),0.3)',
                }} />
              ) : null}
              <Icon
                name={it.icon}
                size={isCTA ? 22 : 20}
                strokeWidth={isActive ? 2.25 : 1.75}
                style={{
                  color: isActive ? 'rgb(var(--accent-rgb))' : isCTA ? 'var(--accent-text)' : 'rgb(150 138 125)',
                  position: 'relative',
                }}
              />
              {!compact && (
                <span style={{
                  fontSize: 10, fontWeight: isActive ? 600 : 500, letterSpacing: '0.02em',
                  color: isActive ? 'var(--accent-text)' : 'rgb(116 105 94)',
                  position: 'relative',
                }}>{it.label}</span>
              )}
              {isActive ? (
                <div style={{
                  position: 'absolute', top: 0, width: 28, height: 2, borderRadius: 9999,
                  background: 'rgb(var(--accent-rgb))',
                  boxShadow: '0 0 12px rgba(var(--accent-rgb),0.5)',
                }} />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Status bar (iOS-style) for screen mockups ──────────────────────── */
function StatusBar({ light }) {
  const color = light ? '#1b1810' : 'rgb(234 227 216)';
  return (
    <div style={{
      height: 44, padding: '0 24px',
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
      paddingBottom: 8,
      fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600, color,
    }}>
      <span style={{ fontVariantNumeric: 'tabular-nums' }}>9:41</span>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <svg width="16" height="11" viewBox="0 0 16 11" fill="none">
          <path d="M1 9l1.5-1.5M5 6l1.5-1.5M9 3l1.5-1.5" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
          <circle cx="13" cy="2" r="1.5" fill={color}/>
        </svg>
        <svg width="18" height="11" viewBox="0 0 18 11" fill="none">
          <rect x="0.5" y="0.5" width="14" height="10" rx="2" stroke={color} fill="none"/>
          <rect x="2" y="2" width="11" height="7" rx="1" fill={color}/>
          <rect x="15" y="3.5" width="1.5" height="4" rx="0.5" fill={color}/>
        </svg>
      </div>
    </div>
  );
}

/* ─── Phone frame for mockups ─────────────────────────────────────────── */
function Phone({ children, light, style, padded = true }) {
  return (
    <div className={light ? 'forge-frame forge-light' : 'forge-frame forge-dark'} style={{
      width: 360, height: 780, background: light ? '#faf6f0' : 'rgb(12 10 9)',
      color: light ? '#1b1810' : 'rgb(212 204 194)',
      borderRadius: 28,
      overflow: 'hidden', position: 'relative',
      boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.06)',
      ...style,
    }}>
      <StatusBar light={light} />
      <div style={{ position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)', width: 100, height: 28, background: '#000', borderRadius: 9999, zIndex: 5 }} />
      {children}
    </div>
  );
}

/* ─── Showcase artboards ──────────────────────────────────────────────── */

function ArtButtons() {
  return (
    <div className="forge-frame forge-dark" style={{ ...FORGE_DARK_STYLE, padding: 32, width: '100%', height: '100%' }}>
      <SectionHeader eyebrow="04 · Components" title="Buttons" subtitle="Mín 44px alto en md y lg (Apple HIG). sm sólo para meta-acciones donde el contexto del card sirve de hit target." />

      <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 24 }}>
        {['primary','secondary','ghost','destructive'].map(v => (
          <div key={v}>
            <Label>{v}</Label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12, alignItems: 'flex-start' }}>
              <Button variant={v} size="lg" leadingIcon={v==='primary' ? 'check' : v==='destructive' ? 'trash' : undefined}>
                {v === 'primary' ? 'Loguear set' : v === 'destructive' ? 'Eliminar' : 'Acción'}
              </Button>
              <Button variant={v} size="md">Acción</Button>
              <Button variant={v} size="sm">Cancelar</Button>
              <Button variant={v} size="md" disabled>Disabled</Button>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 32 }}>
        <Label>Spec</Label>
        <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          <SpecRow tw='primary · h-11 px-4 rounded-[8px] bg-ember-500 text-white font-semibold hover:bg-ember-600 active:bg-ember-700' />
          <SpecRow tw='secondary · h-11 px-4 rounded-[8px] bg-forge-850 text-forge-100 ring-1 ring-inset ring-white/8 hover:bg-forge-800' />
          <SpecRow tw='lg · h-14 text-[17px] · sm · h-9 text-[13px]' />
        </div>
      </div>
    </div>
  );
}

function ArtInputs() {
  return (
    <div className="forge-frame forge-dark" style={{ ...FORGE_DARK_STYLE, padding: 32, width: '100%', height: '100%' }}>
      <SectionHeader eyebrow="04b · Components" title="Inputs · numeric & text" subtitle="Numéricos siempre con tabular-nums, inputmode='decimal' en celular, sufijos kg/reps tipográficamente integrados al final del campo." />

      <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input label="Nombre" value="Mateo" />
          <Input label="Peso" value="80.0" type="text" suffix="kg" tabularNums size="lg" />
          <Input label="Reps" value="8" type="text" suffix="reps" tabularNums size="lg" />
          <Input label="RPE (opcional)" placeholder="—" helper="Escala 6–10, 0.5 step" tabularNums />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input label="Email · disabled" value="—" disabled />
          <Input label="Buscar ejercicio" placeholder="ej: Press banca" prefix="⌕" />
          <Input label="Peso (con error)" value="-12" suffix="kg" tabularNums error="El peso no puede ser negativo." />
          <Input label="Notas del set" placeholder="Sentí la izquierda flojita" helper="Opcional, máx 200 chars" />
        </div>
      </div>
    </div>
  );
}

function ArtCardsBottomNav() {
  return (
    <div className="forge-frame forge-dark" style={{ ...FORGE_DARK_STYLE, padding: 32, width: '100%', height: '100%' }}>
      <SectionHeader eyebrow="04c · Components" title="Cards, chips, nav" subtitle="Cards siempre con ring de 1px en dark (no shadow). Chips para grupos musculares, sets pendientes/hechos." />

      <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div>
          <Label>Card · default</Label>
          <Card style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div className="t-h3" style={{ color: 'var(--text-strong)' }}>Press de banca</div>
                <div className="t-body-sm" style={{ color: 'rgb(150 138 125)', marginTop: 4 }}>3 sets · 80 kg × 8</div>
              </div>
              <Icon name="more" size={18} style={{ color: 'rgb(116 105 94)' }} />
            </div>
          </Card>

          <Label style={{ marginTop: 20, display: 'block' }}>Chips</Label>
          <div style={{ marginTop: 12, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <Chip active>Pecho</Chip>
            <Chip>Espalda</Chip>
            <Chip>Tríceps</Chip>
            <Chip>Hombros</Chip>
            <Chip size="sm" leadingIcon="check">3 / 5</Chip>
            <Chip size="sm">PR</Chip>
          </div>

          <Label style={{ marginTop: 20, display: 'block' }}>Skeleton</Label>
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Skeleton width="60%" height={16} />
            <Skeleton width="40%" height={12} />
            <Skeleton width="100%" height={64} radius={12} />
          </div>
        </div>

        <div>
          <Label>BottomNav · iOS safe-area · 56px + 16px inset</Label>
          <div style={{ marginTop: 12, borderRadius: 16, overflow: 'hidden', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.05)' }}>
            <div style={{ background: 'rgb(12 10 9)', padding: 80, paddingTop: 24 }}>
              <Card padding={24}>
                <div className="t-body-sm" style={{ color: 'rgb(150 138 125)' }}>Contenido scrolleable</div>
                <div className="t-h2" style={{ color: 'var(--text-strong)', marginTop: 4 }}>Entrenar</div>
              </Card>
            </div>
            <BottomNav active="training" />
          </div>

          <Label style={{ marginTop: 20, display: 'block' }}>Toast / banner</Label>
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Toast kind="success" title="Set guardado" body="Press banca · 80 kg × 8 · descanso arranca" />
            <Toast kind="error" title="Sin conexión" body="Tranqui, todo se guarda local." />
          </div>
        </div>
      </div>

      <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div>
          <Label>Empty state</Label>
          <Card style={{ marginTop: 12 }}>
            <EmptyState icon="layers" title="Sin rutinas aún" body="Creá tu primera rutina para arrancar a entrenar." action={<Button variant="accent_soft" leadingIcon="plus">Crear rutina</Button>} />
          </Card>
        </div>
        <div>
          <Label>Bottom sheet · drag handle 36×4px</Label>
          <div style={{ marginTop: 12, borderRadius: 16, overflow: 'hidden', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.05)' }}>
            <div style={{ background: 'rgb(12 10 9)', height: 80 }} />
            <div style={{
              background: 'rgb(31 27 24)', padding: '12px 20px 24px',
              borderTopLeftRadius: 20, borderTopRightRadius: 20,
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,.06)',
            }}>
              <div style={{ width: 36, height: 4, borderRadius: 9999, background: 'rgb(82 74 66)', margin: '0 auto 16px' }} />
              <div className="t-h3" style={{ color: 'var(--text-strong)' }}>¿Borrar sesión actual?</div>
              <div className="t-body-sm" style={{ color: 'rgb(150 138 125)', marginTop: 4 }}>Vas a perder 3 sets logueados. No se puede deshacer.</div>
              <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <Button variant="secondary">Cancelar</Button>
                <Button variant="destructive">Borrar</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SpecRow({ tw }) {
  return (
    <div style={{ background: 'rgb(22 19 17)', borderRadius: 8, padding: '10px 12px', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.05)' }}>
      <code className="t-mono" style={{ fontSize: 11, color: 'rgb(184 174 163)', lineHeight: 1.5 }}>{tw}</code>
    </div>
  );
}

Object.assign(window, { Button, Input, Card, Chip, Skeleton, Toast, EmptyState, BottomNav, Phone, StatusBar, NAV_ITEMS, ArtButtons, ArtInputs, ArtCardsBottomNav, SpecRow });

// shimmer keyframes (injected once)
if (typeof document !== 'undefined' && !document.getElementById('forge-anim')) {
  const s = document.createElement('style');
  s.id = 'forge-anim';
  s.textContent = `
    @keyframes forge-shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
    @keyframes forge-pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.55; }
    }
  `;
  document.head.appendChild(s);
}
