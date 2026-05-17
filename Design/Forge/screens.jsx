// screens.jsx — Mobile screen mockups in Phone frames.
// All in dark mode (default). Phone = 360x780.

/* ─── Shared chrome ───────────────────────────────────────────────────── */
function ScreenHeader({ title, leading, trailing, subtitle, sticky = true }) {
  return (
    <div style={{
      padding: '4px 20px 12px', position: sticky ? 'sticky' : 'relative', top: 0,
      background: 'rgb(12 10 9)', zIndex: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 36 }}>
        {leading ? leading : <div style={{ width: 36 }} />}
        <div style={{ flex: 1, textAlign: 'center' }} />
        {trailing ? trailing : <div style={{ width: 36 }} />}
      </div>
      <div style={{ marginTop: 6 }}>
        <div className="t-h1" style={{ color: 'var(--text-hi)' }}>{title}</div>
        {subtitle ? <div className="t-body-sm" style={{ color: 'rgb(150 138 125)', marginTop: 2 }}>{subtitle}</div> : null}
      </div>
    </div>
  );
}

function IconButton({ icon, badge, onClick }) {
  return (
    <button onClick={onClick} style={{
      width: 36, height: 36, borderRadius: 9999, border: 'none',
      background: 'rgb(22 19 17)', cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.05)', position: 'relative',
    }}>
      <Icon name={icon} size={18} style={{ color: 'rgb(212 204 194)' }} />
      {badge ? <span style={{
        position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: 9999,
        background: 'rgb(var(--accent-rgb))', boxShadow: '0 0 0 2px rgb(12 10 9)',
      }} /> : null}
    </button>
  );
}

function ScrollArea({ children, paddingBottom = 100 }) {
  return (
    <div style={{
      flex: 1, overflowY: 'auto', padding: `0 20px ${paddingBottom}px`,
      display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      {children}
    </div>
  );
}

function ScreenBody({ children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 44px)' }}>
      {children}
    </div>
  );
}

function FixedBottom({ children, withNav = true }) {
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: withNav ? 72 : 0, padding: '12px 20px' }}>
      {children}
    </div>
  );
}

/* ─── 1 · Profile ─────────────────────────────────────────────────────── */
function ScreenProfile() {
  return (
    <Phone>
      <ScreenBody>
        <ScreenHeader title="Perfil" trailing={<IconButton icon="settings" />} />
        <ScrollArea>
          <Card padding={20}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 56, height: 56, borderRadius: 9999,
                background: 'rgba(var(--accent-rgb),0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: 'inset 0 0 0 1px rgba(var(--accent-rgb),0.3)',
              }}>
                <span className="t-h2" style={{ color: 'var(--accent-text)' }}>M</span>
              </div>
              <div>
                <div className="t-h3" style={{ color: 'var(--text-hi)' }}>Mateo</div>
                <div className="t-body-sm" style={{ color: 'rgb(150 138 125)', fontVariantNumeric: 'tabular-nums' }}>desde feb · 47 sesiones</div>
              </div>
            </div>
          </Card>

          <div>
            <Label>PREFERENCIAS</Label>
            <Card style={{ marginTop: 10 }} padding={0}>
              <RowField label="Nombre" value="Mateo" />
              <RowField label="Unidad" value="kg" trailing={<Chip size="sm">kg</Chip>} />
              <RowField label="Idioma" value="Español" />
              <RowField label="Tema" value="Oscuro" last />
            </Card>
          </div>

          <div>
            <Label>APP</Label>
            <Card style={{ marginTop: 10 }} padding={0}>
              <RowField label="Instalar como app" trailing={<Button variant="accent_soft" size="sm" leadingIcon="install">Instalar</Button>} />
              <RowField label="Notificaciones" trailing={<Chip size="sm" active>Activado</Chip>} />
              <RowField label="Datos · 47 sesiones" trailing={<Button variant="ghost" size="sm" trailingIcon="chevron-right">Exportar</Button>} last />
            </Card>
          </div>

          <div>
            <Label>PELIGROSO</Label>
            <Card style={{ marginTop: 10 }} padding={0}>
              <RowField label="Borrar todos los datos" trailing={<Icon name="chevron-right" size={16} style={{color:'rgb(232 125 125)'}} />} danger last />
            </Card>
          </div>
          <div style={{ textAlign: 'center', marginTop: 8 }}>
            <div className="t-caption" style={{ color: 'rgb(82 74 66)' }}>Forge v0.1 · build 2026.05.16</div>
          </div>
        </ScrollArea>
        <BottomNav active="profile" />
      </ScreenBody>
    </Phone>
  );
}

function RowField({ label, value, trailing, last, danger }) {
  return (
    <div style={{
      padding: '14px 16px',
      borderBottom: last ? 'none' : '1px solid rgba(42,37,34,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="t-body" style={{ color: danger ? 'rgb(232 125 125)' : 'var(--text)' }}>{label}</div>
        {value ? <div className="t-body-sm" style={{ color: 'rgb(150 138 125)', marginTop: 2 }}>{value}</div> : null}
      </div>
      {trailing}
    </div>
  );
}

/* ─── 2 · Routines List ───────────────────────────────────────────────── */
function ScreenRoutinesList() {
  const routines = [
    { name: 'Push', days: 2, ex: 6, last: 'Hace 2 días', acc: '#ff6a1f' },
    { name: 'Pull', days: 2, ex: 5, last: 'Hace 4 días', acc: '#ff6a1f' },
    { name: 'Legs', days: 1, ex: 7, last: 'Hace 5 días', acc: '#ff6a1f' },
    { name: 'Sábado · Brazos', days: 1, ex: 4, last: 'Hace 8 días', acc: '#ff6a1f' },
  ];
  return (
    <Phone>
      <ScreenBody>
        <ScreenHeader title="Rutinas" subtitle="4 rutinas · 6 días/semana" trailing={<IconButton icon="plus" />} />
        <ScrollArea>
          {routines.map(r => (
            <Card key={r.name}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="t-h3" style={{ color: 'var(--text-hi)' }}>{r.name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                    <Chip size="sm">{r.days} {r.days === 1 ? 'día' : 'días'}</Chip>
                    <Chip size="sm">{r.ex} ejerc.</Chip>
                    <span className="t-caption" style={{ color: 'rgb(116 105 94)' }}>· {r.last}</span>
                  </div>
                </div>
                <Icon name="chevron-right" size={18} style={{ color: 'rgb(116 105 94)', marginTop: 4 }} />
              </div>
            </Card>
          ))}
        </ScrollArea>
        <BottomNav active="routines" />
      </ScreenBody>
    </Phone>
  );
}

/* ─── 3 · Routine Editor ──────────────────────────────────────────────── */
function ScreenRoutineEditor() {
  return (
    <Phone>
      <ScreenBody>
        <ScreenHeader
          title="Editar · Push"
          leading={<IconButton icon="chevron-left" />}
          trailing={<Button variant="primary" size="sm">Guardar</Button>}
        />
        <ScrollArea>
          <Input label="Nombre" value="Push" />

          <div>
            <Label>DÍAS DE ENTRENAMIENTO</Label>
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <DayCard name="Día A · Pecho dominante" exercises={['Press banca', 'Press inclinado mancuernas', 'Aperturas en polea', 'Press hombros']} active />
              <DayCard name="Día B · Hombros dominantes" exercises={['Press militar', 'Elevaciones laterales', 'Pájaro en máquina', 'Tríceps polea']} />
              <button style={dashedAdd}>
                <Icon name="plus" size={16} />
                <span>Agregar día</span>
              </button>
            </div>
          </div>

          <div>
            <Label>PLANIFICACIÓN SEMANAL</Label>
            <Card style={{ marginTop: 10 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
                {['L','M','M','J','V','S','D'].map((d, i) => {
                  const map = ['A', '', 'B', '', 'A', '', ''];
                  const has = map[i];
                  return (
                    <div key={i} style={{ textAlign: 'center' }}>
                      <div className="t-caption" style={{ color: 'rgb(116 105 94)', marginBottom: 6 }}>{d}</div>
                      <div style={{
                        height: 44, borderRadius: 8,
                        background: has ? 'rgba(var(--accent-rgb),0.16)' : 'rgb(22 19 17)',
                        boxShadow: has ? 'inset 0 0 0 1px rgba(var(--accent-rgb),0.3)' : 'inset 0 0 0 1px rgba(255,255,255,.05)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 14, fontWeight: 700, color: has ? 'var(--accent-text)' : 'rgb(82 74 66)',
                      }}>
                        {has || '—'}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="t-body-sm" style={{ color: 'rgb(150 138 125)', marginTop: 12 }}>
                Tocá un día para asignar. Ejemplo: lun y vie → Día A.
              </div>
            </Card>
          </div>
        </ScrollArea>
      </ScreenBody>
    </Phone>
  );
}

function DayCard({ name, exercises, active }) {
  return (
    <div style={{
      background: 'rgb(22 19 17)', borderRadius: 12, padding: 14,
      boxShadow: `inset 0 0 0 1px ${active ? 'rgba(var(--accent-rgb),0.3)' : 'rgba(255,255,255,.05)'}`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="t-body" style={{ color: 'var(--text-strong)', fontWeight: 600 }}>{name}</div>
        <Icon name="edit" size={14} style={{ color: 'rgb(116 105 94)' }} />
      </div>
      <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {exercises.map(e => (
          <div key={e} className="t-body-sm" style={{ color: 'rgb(184 174 163)', display: 'flex', gap: 6 }}>
            <span style={{ color: 'rgb(82 74 66)' }}>·</span>
            <span>{e}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const dashedAdd = {
  height: 44, borderRadius: 12, border: '1px dashed rgb(58 52 47)',
  background: 'transparent', color: 'rgb(150 138 125)',
  fontSize: 13, fontWeight: 500, fontFamily: 'inherit',
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  cursor: 'pointer',
};

/* ─── 4 · Exercises List ──────────────────────────────────────────────── */
function ScreenExercisesList() {
  const exercises = [
    { name: 'Press de banca', muscle: 'Pecho', tracking: 'peso · reps', mine: false },
    { name: 'Press inclinado mancuernas', muscle: 'Pecho', tracking: 'peso · reps', mine: false },
    { name: 'Press hombros máquina', muscle: 'Hombros', tracking: 'peso · reps', mine: true },
    { name: 'Dominadas', muscle: 'Espalda', tracking: 'bodyweight', mine: false },
    { name: 'Plancha', muscle: 'Core', tracking: 'tiempo', mine: false },
    { name: 'Curl predicador', muscle: 'Bíceps', tracking: 'peso · reps', mine: true },
  ];
  return (
    <Phone>
      <ScreenBody>
        <ScreenHeader title="Ejercicios" subtitle="82 totales · 2 personalizados" trailing={<IconButton icon="plus" />} />
        <div style={{ padding: '0 20px 12px' }}>
          <Input placeholder="Buscar..." prefix="⌕" />
          <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
            <Chip active>Todos</Chip>
            <Chip>Pecho</Chip>
            <Chip>Espalda</Chip>
            <Chip>Piernas</Chip>
            <Chip>Hombros</Chip>
          </div>
        </div>
        <ScrollArea>
          {exercises.map(e => (
            <div key={e.name} style={{
              padding: '14px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              borderBottom: '1px solid rgba(42,37,34,0.6)',
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div className="t-body" style={{ color: 'var(--text-strong)', fontWeight: 500 }}>{e.name}</div>
                  {e.mine ? <span className="t-mono" style={{ fontSize: 9, color: 'var(--accent-text)', letterSpacing: '0.05em' }}>· CUSTOM</span> : null}
                </div>
                <div className="t-body-sm" style={{ color: 'rgb(150 138 125)', marginTop: 2 }}>
                  {e.muscle} · {e.tracking}
                </div>
              </div>
              <Icon name="chevron-right" size={18} style={{ color: 'rgb(82 74 66)' }} />
            </div>
          ))}
        </ScrollArea>
        <BottomNav active="exercises" />
      </ScreenBody>
    </Phone>
  );
}

/* ─── 5 · Exercise Form ───────────────────────────────────────────────── */
function ScreenExerciseForm() {
  return (
    <Phone>
      <ScreenBody>
        <ScreenHeader
          title="Nuevo ejercicio"
          leading={<IconButton icon="x" />}
          trailing={<Button variant="primary" size="sm">Crear</Button>}
        />
        <ScrollArea>
          <Input label="Nombre" placeholder="ej: Press hombros máquina" />

          <div>
            <Label>GRUPO MUSCULAR</Label>
            <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {['Pecho','Espalda','Piernas','Hombros','Bíceps','Tríceps','Core','Glúteo'].map((m, i) => (
                <Chip key={m} active={i === 3}>{m}</Chip>
              ))}
            </div>
          </div>

          <div>
            <Label>TIPO DE TRACKING</Label>
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <RadioCard active title="Peso × Reps" desc="Para la mayoría: banca, sentadilla, remo." />
              <RadioCard title="Bodyweight × Reps" desc="Dominadas, fondos, lagartijas." />
              <RadioCard title="Sólo reps" desc="Reps sin peso ni progresión de carga." />
              <RadioCard title="Tiempo" desc="Plancha, isométricos." />
              <RadioCard title="Distancia + tiempo" desc="Cardio: correr, remo, bici." />
            </div>
          </div>

          <Input label="Notas (opcional)" placeholder="ej: Polea baja, agarre supino." helper="Máx 200 chars" />
        </ScrollArea>
      </ScreenBody>
    </Phone>
  );
}

function RadioCard({ title, desc, active }) {
  return (
    <div style={{
      background: 'rgb(22 19 17)', borderRadius: 10, padding: 12,
      boxShadow: `inset 0 0 0 1px ${active ? 'rgba(var(--accent-rgb),0.4)' : 'rgba(255,255,255,.05)'}`,
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <div style={{
        width: 20, height: 20, borderRadius: 9999,
        background: active ? 'rgb(var(--accent-rgb))' : 'transparent',
        boxShadow: active ? 'inset 0 0 0 4px rgb(22 19 17)' : 'inset 0 0 0 2px rgb(58 52 47)',
        flexShrink: 0,
      }} />
      <div style={{ flex: 1 }}>
        <div className="t-body" style={{ color: 'var(--text-strong)', fontWeight: 500 }}>{title}</div>
        <div className="t-body-sm" style={{ color: 'rgb(150 138 125)', marginTop: 2 }}>{desc}</div>
      </div>
    </div>
  );
}

/* ─── 6 · Training Home ───────────────────────────────────────────────── */
function ScreenTrainingHome() {
  return (
    <Phone>
      <ScreenBody>
        <ScreenHeader title="Entrenar" subtitle="Lunes · 16 mayo" trailing={<IconButton icon="calendar" />} />
        <ScrollArea>
          <Card style={{ position: 'relative', overflow: 'hidden' }} padding={20}>
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(80% 60% at 100% 0%, rgba(var(--accent-rgb),0.15), transparent 60%)' }} />
            <div style={{ position: 'relative' }}>
              <div className="t-micro" style={{ color: 'var(--accent-text)' }}>HOY TOCA</div>
              <div className="t-h1" style={{ color: 'var(--text-hi)', marginTop: 4 }}>Push · Día A</div>
              <div className="t-body" style={{ color: 'rgb(184 174 163)', marginTop: 4 }}>4 ejercicios · ~70 min estimado</div>
              <div style={{ marginTop: 16 }}>
                <Button variant="primary" size="lg" full leadingIcon="zap">Empezar sesión</Button>
              </div>
            </div>
          </Card>

          <div>
            <Label>SEMANA</Label>
            <Card style={{ marginTop: 10 }} padding={14}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
                {[
                  { d:'L', s:'A', done:true },{ d:'M', s:'', done:false },
                  { d:'M', s:'B', done:true },{ d:'J', s:'', done:false },
                  { d:'V', s:'A', done:false, today:true },{ d:'S', s:'', done:false },
                  { d:'D', s:'', done:false },
                ].map((d, i) => (
                  <div key={i} style={{ textAlign: 'center' }}>
                    <div className="t-caption" style={{ color: 'rgb(116 105 94)', marginBottom: 6 }}>{d.d}</div>
                    <div style={{
                      height: 40, borderRadius: 8,
                      background: d.done ? 'rgba(var(--accent-rgb),0.16)' : d.today ? 'rgb(var(--accent-rgb))' : 'rgb(22 19 17)',
                      color: d.done ? 'var(--accent-text)' : d.today ? 'var(--accent-fg)' : 'rgb(116 105 94)',
                      boxShadow: d.done ? 'inset 0 0 0 1px rgba(var(--accent-rgb),0.3)' : 'inset 0 0 0 1px rgba(255,255,255,.05)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 14, fontWeight: 700,
                    }}>
                      {d.done ? <Icon name="check" size={14} /> : d.s || '—'}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div>
            <Label>RUTINA EN CURSO</Label>
            <Card style={{ marginTop: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div className="t-body" style={{ color: 'var(--text-strong)', fontWeight: 600 }}>Bloque 1 · semana 3 de 6</div>
                  <div className="t-body-sm" style={{ color: 'rgb(150 138 125)', marginTop: 4 }}>Push/Pull/Legs · upper progression</div>
                </div>
                <Icon name="chevron-right" size={16} style={{ color: 'rgb(116 105 94)', marginTop: 4 }} />
              </div>
              {/* progress */}
              <div style={{ marginTop: 12, height: 4, borderRadius: 9999, background: 'rgb(42 37 34)', overflow: 'hidden' }}>
                <div style={{ width: '50%', height: '100%', background: 'rgb(var(--accent-rgb))' }} />
              </div>
            </Card>
          </div>
        </ScrollArea>
        <BottomNav active="training" />
      </ScreenBody>
    </Phone>
  );
}

/* ─── 7 · Training Session · 3 states × 3 RestTimer treatments ────────── */
function ScreenTrainingSession({ state = 'empty', restTimerTreatment = 'pinned' }) {
  // state: 'empty' | 'mid' | 'logged'
  // restTimerTreatment: 'pinned' | 'floating' | 'overlay'
  const exercises = {
    empty: [
      { name: 'Press de banca', target: '4×8 @80kg', sets: [
        { done: false, target: '80 · 8' },
        { done: false, target: '80 · 8' },
        { done: false, target: '80 · 8' },
        { done: false, target: '80 · 8' },
      ]},
      { name: 'Press inclinado mancuernas', target: '3×10', collapsed: true },
      { name: 'Aperturas en polea', target: '3×12', collapsed: true },
      { name: 'Press militar', target: '3×8', collapsed: true },
    ],
    mid: [
      { name: 'Press de banca', target: '4×8 @80kg', sets: [
        { done: true, weight: 80, reps: 8, time: '9:42' },
        { done: true, weight: 80, reps: 8, time: '9:46' },
        { done: false, target: '80 · 8 (set 3 de 4)', active: true },
        { done: false, target: '80 · 8' },
      ]},
      { name: 'Press inclinado mancuernas', target: '3×10', collapsed: true },
      { name: 'Aperturas en polea', target: '3×12', collapsed: true },
    ],
    logged: [
      { name: 'Press de banca', target: '4×8 @80kg', isPR: true, sets: [
        { done: true, weight: 80, reps: 8, time: '9:42' },
        { done: true, weight: 80, reps: 8, time: '9:46' },
        { done: true, weight: 80, reps: 8, time: '9:50' },
        { done: true, weight: 85, reps: 8, time: '9:54', pr: true },
      ]},
      { name: 'Press inclinado mancuernas', target: '3×10', collapsed: true },
    ],
  }[state];

  const showOverlay = state === 'logged' && restTimerTreatment === 'overlay';
  const showFloating = state === 'logged' && restTimerTreatment === 'floating';
  const showPinned = state === 'logged' && restTimerTreatment === 'pinned';

  return (
    <Phone>
      <ScreenBody>
        <div style={{
          padding: '4px 20px 12px', position: 'sticky', top: 0, zIndex: 10,
          background: 'rgb(12 10 9)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <IconButton icon="chevron-left" />
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div className="t-caption" style={{ color: 'rgb(150 138 125)' }}>SESIÓN · 00:{state === 'empty' ? '02' : state === 'mid' ? '18' : '32'}:14</div>
              <div className="t-body" style={{ color: 'var(--text-strong)', fontWeight: 600, marginTop: 2 }}>
                Push · Día A · {state === 'empty' ? '0' : state === 'mid' ? '2' : '4'} de 12 sets
              </div>
            </div>
            <IconButton icon="more" />
          </div>
          {/* progress bar */}
          <div style={{ marginTop: 10, height: 3, borderRadius: 9999, background: 'rgb(42 37 34)', overflow: 'hidden' }}>
            <div style={{
              width: state === 'empty' ? '0%' : state === 'mid' ? '17%' : '33%',
              height: '100%', background: 'rgb(var(--accent-rgb))',
              transition: 'width .3s',
            }} />
          </div>
        </div>

        {showPinned ? <RestTimerPinned remaining="1:18" total={90} elapsed={12} /> : null}

        <ScrollArea paddingBottom={showFloating ? 200 : 100}>
          {state === 'logged' ? <PrCelebration exercise="Press de banca" current="85 kg × 8" delta="+5 kg" /> : null}

          {exercises.map((ex, i) => {
            if (ex.collapsed) {
              return (
                <div key={i} style={{
                  padding: '14px 16px', background: 'rgb(22 19 17)', borderRadius: 12,
                  boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.05)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <div>
                    <div className="t-body" style={{ color: 'rgb(184 174 163)' }}>{ex.name}</div>
                    <div className="t-caption" style={{ color: 'rgb(116 105 94)', marginTop: 2 }}>{ex.target}</div>
                  </div>
                  <Icon name="chevron-down" size={16} style={{ color: 'rgb(82 74 66)' }} />
                </div>
              );
            }
            return (
              <ExerciseSessionCard
                key={i}
                name={ex.name}
                target={ex.target}
                isPR={ex.isPR}
                sets={ex.sets}
              />
            );
          })}

          {state === 'empty' ? (
            <div style={{ marginTop: 16 }}>
              <SetLogger weight={80} reps={8} target="80 kg × 8" lastSet="Last · 77.5 kg × 8 · hace 4 días" />
            </div>
          ) : null}

          {state === 'mid' ? (
            <div style={{ marginTop: 16 }}>
              <SetLogger weight={80} reps={8} target="80 kg × 8 (set 3)" lastSet="Last · 77.5 kg × 8" />
            </div>
          ) : null}

          <div style={{ marginTop: 16 }}>
            <Button variant="ghost" size="md" full leadingIcon="check">Terminar sesión</Button>
          </div>
        </ScrollArea>

        {showFloating ? (
          <div style={{ position: 'absolute', left: 12, right: 12, bottom: 12, zIndex: 25 }}>
            <RestTimerFloating remaining="1:18" total={90} elapsed={12} />
          </div>
        ) : null}

        {showOverlay ? <RestTimerOverlay remaining="1:18" total={90} elapsed={12} /> : null}
      </ScreenBody>
    </Phone>
  );
}

/* ─── 8 · Session Summary ─────────────────────────────────────────────── */
function ScreenSessionSummary() {
  return (
    <Phone>
      <ScreenBody>
        <ScreenHeader
          title="Sesión completada"
          subtitle="Push · Día A · 1h 12min"
          leading={<IconButton icon="x" />}
          trailing={<IconButton icon="share" />}
        />
        <ScrollArea>
          <Card padding={20} style={{ position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(80% 60% at 50% 0%, rgba(var(--accent-rgb),0.18), transparent 60%)' }} />
            <div style={{ position: 'relative', textAlign: 'center' }}>
              <div className="t-micro" style={{ color: 'var(--accent-text)' }}>VOLUMEN TOTAL</div>
              <div className="t-display" style={{ color: 'var(--text-hi)', marginTop: 8, fontVariantNumeric: 'tabular-nums' }}>9,840 <span style={{ fontSize: 24, color: 'rgb(184 174 163)' }}>kg</span></div>
              <div className="t-body-sm" style={{ color: 'rgb(150 138 125)', marginTop: 4 }}>+12% vs última sesión Push</div>
            </div>
          </Card>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <StatTile label="Sets" value="12" sub="/ 12" />
            <StatTile label="Reps totales" value="96" />
            <StatTile label="Duración" value="1:12" mono />
            <StatTile label="Descanso prom." value="1:38" mono />
          </div>

          <div>
            <Label>NUEVOS PR</Label>
            <Card style={{ marginTop: 10 }} padding={0}>
              <PRRow exercise="Press de banca" delta="+5 kg" detail="85 kg × 8" />
              <PRRow exercise="Press inclinado mancuernas" delta="+2.5 kg" detail="30 kg × 10" last />
            </Card>
          </div>

          <div>
            <Label>EJERCICIOS</Label>
            <Card style={{ marginTop: 10 }} padding={0}>
              <SummaryExRow name="Press de banca" sets="4 sets · 32 reps" pr />
              <SummaryExRow name="Press inclinado mancuernas" sets="3 sets · 30 reps" pr />
              <SummaryExRow name="Aperturas en polea" sets="3 sets · 36 reps" />
              <SummaryExRow name="Press militar" sets="2 sets · 16 reps" last />
            </Card>
          </div>

          <div style={{ marginTop: 8 }}>
            <Button variant="primary" size="lg" full leadingIcon="check">Guardar y cerrar</Button>
          </div>
        </ScrollArea>
      </ScreenBody>
    </Phone>
  );
}

function StatTile({ label, value, sub, mono }) {
  return (
    <Card padding={16}>
      <div className="t-caption" style={{ color: 'rgb(150 138 125)' }}>{label}</div>
      <div className="t-num" style={{
        fontSize: 28, fontWeight: 600, color: 'var(--text-hi)', letterSpacing: '-0.025em',
        marginTop: 4, fontFamily: mono ? 'var(--font-mono)' : 'var(--font-sans)',
        fontVariantNumeric: 'tabular-nums',
      }}>{value}{sub ? <span style={{ fontSize: 14, color: 'rgb(116 105 94)', fontWeight: 500 }}> {sub}</span> : null}</div>
    </Card>
  );
}

function PRRow({ exercise, delta, detail, last }) {
  return (
    <div style={{
      padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12,
      borderBottom: last ? 'none' : '1px solid rgba(42,37,34,0.5)',
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 8,
        background: 'rgba(var(--accent-rgb),0.12)',
        boxShadow: 'inset 0 0 0 1px rgba(var(--accent-rgb),0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon name="flame" size={14} style={{ color: 'var(--accent-text)' }} />
      </div>
      <div style={{ flex: 1 }}>
        <div className="t-body" style={{ color: 'var(--text-strong)', fontWeight: 500 }}>{exercise}</div>
        <div className="t-body-sm" style={{ color: 'rgb(150 138 125)', marginTop: 1, fontVariantNumeric: 'tabular-nums' }}>{detail}</div>
      </div>
      <div className="t-mono" style={{ fontSize: 12, color: 'var(--accent-text)', fontWeight: 700 }}>{delta}</div>
    </div>
  );
}

function SummaryExRow({ name, sets, pr, last }) {
  return (
    <div style={{
      padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
      borderBottom: last ? 'none' : '1px solid rgba(42,37,34,0.5)',
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="t-body" style={{ color: 'var(--text-strong)' }}>{name}</div>
        <div className="t-body-sm" style={{ color: 'rgb(150 138 125)', marginTop: 1, fontVariantNumeric: 'tabular-nums' }}>{sets}</div>
      </div>
      {pr ? <Chip size="sm" leadingIcon="flame">PR</Chip> : null}
    </div>
  );
}

/* ─── 9 · Progress Home (heatmap) ─────────────────────────────────────── */
function ScreenProgressHome() {
  return (
    <Phone>
      <ScreenBody>
        <ScreenHeader title="Progreso" subtitle="47 sesiones · 12 PR este mes" trailing={<IconButton icon="calendar" />} />
        <ScrollArea>
          <Card padding={16}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
              <div>
                <div className="t-micro" style={{ color: 'rgb(150 138 125)' }}>ÚLTIMAS 12 SEMANAS</div>
                <div className="t-h2" style={{ color: 'var(--text-hi)', marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>52 sesiones</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="t-mono" style={{ fontSize: 11, color: 'var(--accent-text)' }}>+8%</div>
                <div className="t-caption" style={{ color: 'rgb(116 105 94)' }}>vs anterior</div>
              </div>
            </div>
            <SessionHeatmap />
          </Card>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <StatTile label="Vol. del mes" value="180k" sub="kg" />
            <StatTile label="Nuevos PR" value="12" />
            <StatTile label="Racha" value="3" sub="sem" />
            <StatTile label="Promedio" value="4.3" sub="/ sem" />
          </div>

          <div>
            <Label>EJERCICIOS · MÁS PROGRESO</Label>
            <Card style={{ marginTop: 10 }} padding={0}>
              <TrendRow name="Press de banca" delta="+12.5 kg" pct="+18%" trend="up" />
              <TrendRow name="Sentadilla" delta="+15 kg" pct="+12%" trend="up" />
              <TrendRow name="Dominadas" delta="+4 reps" pct="+22%" trend="up" />
              <TrendRow name="Press militar" delta="0 kg" pct="0%" trend="flat" last />
            </Card>
          </div>
        </ScrollArea>
        <BottomNav active="progress" />
      </ScreenBody>
    </Phone>
  );
}

function TrendRow({ name, delta, pct, trend, last }) {
  return (
    <div style={{
      padding: '14px 14px', display: 'flex', alignItems: 'center', gap: 12,
      borderBottom: last ? 'none' : '1px solid rgba(42,37,34,0.5)',
    }}>
      <div style={{ flex: 1 }}>
        <div className="t-body" style={{ color: 'var(--text-strong)', fontWeight: 500 }}>{name}</div>
        <div className="t-body-sm" style={{ color: 'rgb(150 138 125)', marginTop: 1, fontVariantNumeric: 'tabular-nums' }}>{delta} en 12 sem</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <Icon
          name={trend === 'up' ? 'trending' : 'minus'}
          size={14}
          style={{ color: trend === 'up' ? 'var(--accent-text)' : 'rgb(116 105 94)' }}
        />
        <span className="t-mono" style={{
          fontSize: 12, fontWeight: 700,
          color: trend === 'up' ? 'var(--accent-text)' : 'rgb(116 105 94)',
        }}>{pct}</span>
      </div>
    </div>
  );
}

/* ─── 10 · Exercise History ───────────────────────────────────────────── */
function ScreenExerciseHistory() {
  return (
    <Phone>
      <ScreenBody>
        <ScreenHeader
          title="Press de banca"
          subtitle="Pecho · 22 sesiones"
          leading={<IconButton icon="chevron-left" />}
          trailing={<IconButton icon="more" />}
        />
        <ScrollArea>
          <Card padding={16}>
            <ExerciseHistoryChart />
          </Card>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <StatTile label="Mejor" value="105" sub="kg" />
            <StatTile label="Mejor reps" value="12" />
            <StatTile label="1RM est." value="128" sub="kg" />
          </div>

          <div>
            <Label>ÚLTIMOS SETS</Label>
            <Card style={{ marginTop: 10 }} padding={0}>
              {[
                { date: 'Hoy', sets: '85×8, 85×8, 80×8, 80×8', pr: true },
                { date: 'Vie 12', sets: '80×8, 80×8, 80×8, 80×7' },
                { date: 'Lun 9', sets: '80×8, 80×8, 77.5×8' },
                { date: 'Vie 5', sets: '77.5×8, 77.5×8, 77.5×6' },
              ].map((s, i, arr) => (
                <div key={i} style={{
                  padding: '12px 14px',
                  borderBottom: i < arr.length - 1 ? '1px solid rgba(42,37,34,0.5)' : 'none',
                  display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  <div style={{ width: 56, flexShrink: 0 }}>
                    <div className="t-caption" style={{ color: 'rgb(116 105 94)' }}>{s.date}</div>
                  </div>
                  <div className="t-body-sm" style={{ flex: 1, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{s.sets}</div>
                  {s.pr ? <Chip size="sm">PR</Chip> : null}
                </div>
              ))}
            </Card>
          </div>
        </ScrollArea>
      </ScreenBody>
    </Phone>
  );
}

/* ─── 11 · PR List ────────────────────────────────────────────────────── */
function ScreenPrList() {
  const prs = [
    { name: 'Press de banca', muscle: 'Pecho', value: '105 kg × 8', date: 'Hoy', recent: true },
    { name: 'Sentadilla', muscle: 'Cuádriceps', value: '140 kg × 5', date: 'Hace 4 días', recent: true },
    { name: 'Press militar', muscle: 'Hombros', value: '60 kg × 6', date: 'Hace 1 sem', recent: false },
    { name: 'Peso muerto', muscle: 'Espalda', value: '160 kg × 3', date: 'Hace 2 sem', recent: false },
    { name: 'Dominadas', muscle: 'Espalda', value: 'BW × 12', date: 'Hace 2 sem', recent: false },
    { name: 'Curl predicador', muscle: 'Bíceps', value: '22.5 kg × 10', date: 'Hace 3 sem', recent: false },
  ];
  return (
    <Phone>
      <ScreenBody>
        <ScreenHeader title="Records personales" subtitle="38 PR · 2 esta semana" trailing={<IconButton icon="settings" />} />
        <ScrollArea>
          <div style={{ display: 'flex', gap: 6 }}>
            <Chip active>Todos</Chip>
            <Chip>Pecho</Chip>
            <Chip>Espalda</Chip>
            <Chip>Piernas</Chip>
            <Chip>Recientes</Chip>
          </div>

          {prs.map(p => (
            <Card key={p.name} padding={14}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 10,
                  background: p.recent ? 'rgba(var(--accent-rgb),0.14)' : 'rgb(31 27 24)',
                  boxShadow: p.recent ? 'inset 0 0 0 1px rgba(var(--accent-rgb),0.3)' : 'inset 0 0 0 1px rgba(255,255,255,.05)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Icon name={p.recent ? 'flame' : 'trophy'} size={18} style={{ color: p.recent ? 'var(--accent-text)' : 'rgb(150 138 125)' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="t-body" style={{ color: 'var(--text-strong)', fontWeight: 500 }}>{p.name}</div>
                  <div className="t-body-sm" style={{ color: 'rgb(150 138 125)', marginTop: 1 }}>{p.muscle} · {p.date}</div>
                </div>
                <div className="t-num" style={{
                  fontSize: 15, fontWeight: 600, color: 'var(--text-hi)',
                  fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.015em',
                }}>{p.value}</div>
              </div>
            </Card>
          ))}
        </ScrollArea>
      </ScreenBody>
    </Phone>
  );
}

Object.assign(window, {
  ScreenProfile, ScreenRoutinesList, ScreenRoutineEditor,
  ScreenExercisesList, ScreenExerciseForm,
  ScreenTrainingHome, ScreenTrainingSession, ScreenSessionSummary,
  ScreenProgressHome, ScreenExerciseHistory, ScreenPrList,
});
