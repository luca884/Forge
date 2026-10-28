import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { RoutineCardComponent } from './routine-card.component';
import { Routine } from '../../domain/routine.entity';
import { TrainingDay } from '../../domain/training-day.entity';
import { DAYS_OF_WEEK } from '../../domain/value-objects/weekly-schedule';

const baseRoutine: Routine = {
  id: 'r-1',
  name: 'Push',
  isActive: false,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

const makeDay = (id: string, name: string, setsPerExercise: readonly number[]): TrainingDay => ({
  id,
  routineId: 'r-1',
  name,
  exercises: setsPerExercise.map((n, i) => ({
    exerciseId: `ex-${id}-${i}`,
    order: i,
    targetSets: Array.from({ length: n }, () => ({ type: 'weight-reps' as const, reps: 8 })),
  })),
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
});

const torsoA = makeDay('d-1', 'Torso A', [4, 4, 3]);
const piernaB = makeDay('d-2', 'Pierna B', [3, 3]);

const activeRoutine: Routine = {
  ...baseRoutine,
  name: 'Torso / Pierna',
  isActive: true,
  schedule: { monday: 'd-1', thursday: 'd-2' },
};

/** Texto de los hijos directos separado por espacios ("LUN TA"). */
function cellText(el: HTMLElement): string {
  return Array.from(el.children)
    .map((c) => c.textContent?.trim() ?? '')
    .filter(Boolean)
    .join(' ');
}

function getText(fixture: ComponentFixture<RoutineCardComponent>): string {
  return (fixture.nativeElement as HTMLElement).textContent ?? '';
}

describe('RoutineCardComponent', () => {
  let fixture: ComponentFixture<RoutineCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoutineCardComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(RoutineCardComponent);
  });

  it('renderiza el name', () => {
    fixture.componentRef.setInput('routine', baseRoutine);
    fixture.detectChanges();
    expect(getText(fixture)).toContain('Push');
  });

  it('muestra "1 día" cuando dayCount = 1 (singular)', () => {
    fixture.componentRef.setInput('routine', baseRoutine);
    fixture.componentRef.setInput('dayCount', 1);
    fixture.detectChanges();
    expect(getText(fixture)).toContain('1 día');
    expect(getText(fixture)).not.toContain('1 días');
  });

  it('muestra "N días" cuando dayCount > 1 (plural)', () => {
    fixture.componentRef.setInput('routine', baseRoutine);
    fixture.componentRef.setInput('dayCount', 3);
    fixture.detectChanges();
    expect(getText(fixture)).toContain('3 días');
  });

  it('muestra chip "Activa" cuando routine.isActive = true', () => {
    fixture.componentRef.setInput('routine', { ...baseRoutine, isActive: true });
    fixture.detectChanges();
    expect(getText(fixture)).toContain('Activa');
  });

  it('NO muestra la etiqueta "Activa" cuando routine.isActive = false', () => {
    fixture.componentRef.setInput('routine', baseRoutine);
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('[data-active-label]'))).toBeNull();
  });

  it('emite cardClick con la routine al hacer click', () => {
    fixture.componentRef.setInput('routine', baseRoutine);
    fixture.detectChanges();
    let emitted: Routine | undefined;
    fixture.componentInstance.cardClick.subscribe((r) => (emitted = r));
    const btn = fixture.debugElement.query(By.css('button[aria-label="Abrir rutina Push"]'));
    (btn.nativeElement as HTMLButtonElement).click();
    expect(emitted).toEqual(baseRoutine);
  });

  describe('rutina que no está activa', () => {
    it('ofrece "Activar" y emite activate con la rutina', () => {
      fixture.componentRef.setInput('routine', baseRoutine);
      fixture.detectChanges();
      let emitted: Routine | undefined;
      fixture.componentInstance.activate.subscribe((r) => (emitted = r));
      const btn = fixture.debugElement.query(By.css('button[aria-label="Activar rutina Push"]'));
      expect((btn.nativeElement as HTMLButtonElement).textContent).toContain('Activar');
      (btn.nativeElement as HTMLButtonElement).click();
      expect(emitted).toEqual(baseRoutine);
    });

    it('no dibuja la semana ni la tabla de días', () => {
      fixture.componentRef.setInput('routine', baseRoutine);
      fixture.componentRef.setInput('days', [torsoA]);
      fixture.detectChanges();
      expect(fixture.debugElement.query(By.css('[data-week-strip]'))).toBeNull();
      expect(fixture.debugElement.query(By.css('[data-day-row]'))).toBeNull();
    });
  });

  describe('rutina activa', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('routine', activeRoutine);
      fixture.componentRef.setInput('dayCount', 2);
      fixture.componentRef.setInput('days', [torsoA, piernaB]);
      fixture.componentRef.setInput('todayDow', 'thursday');
      fixture.detectChanges();
    });

    it('muestra la etiqueta "Activa" y no ofrece "Activar"', () => {
      const label = fixture.debugElement.query(By.css('[data-active-label]'));
      expect((label.nativeElement as HTMLElement).textContent?.trim()).toBe('Activa');
      expect(fixture.debugElement.query(By.css('button[aria-label^="Activar"]'))).toBeNull();
    });

    it('resume días y sesiones por semana según el horario', () => {
      expect(getText(fixture)).toContain('2 días · 2 sesiones por semana');
    });

    it('sin horario, resume solo los días', () => {
      fixture.componentRef.setInput('routine', { ...activeRoutine, schedule: undefined });
      fixture.detectChanges();
      expect(getText(fixture)).toContain('2 días');
      expect(getText(fixture)).not.toContain('por semana');
    });

    it('B5: cuenta solo los días del horario que existen y deja el horario como está', () => {
      // "d-gone" se borró de la rutina, pero su id sigue guardado en el horario.
      const withGone = { monday: 'd-1', wednesday: 'd-gone', thursday: 'd-2' };
      fixture.componentRef.setInput('routine', { ...activeRoutine, schedule: withGone });
      fixture.detectChanges();
      expect(getText(fixture)).toContain('2 días · 2 sesiones por semana');
      const cells = fixture.debugElement.queryAll(By.css('[data-week-strip] [role="listitem"]'));
      expect(cellText(cells[2]!.nativeElement as HTMLElement)).toBe('MIÉ —');

      fixture.componentRef.setInput('routine', {
        ...activeRoutine,
        schedule: { monday: 'd-1', wednesday: 'd-gone' },
      });
      fixture.detectChanges();
      expect(getText(fixture)).toContain('2 días · 1 sesión por semana');

      fixture.componentRef.setInput('routine', { ...activeRoutine, schedule: { wednesday: 'd-gone' } });
      fixture.detectChanges();
      expect(getText(fixture)).toContain('2 días');
      expect(getText(fixture)).not.toContain('por semana');
    });

    it('dibuja los 7 días de la semana con la sigla del día entrenado y "—" en descanso', () => {
      const cells = fixture.debugElement.queryAll(By.css('[data-week-strip] [role="listitem"]'));
      expect(cells).toHaveLength(7);
      const texts = cells.map((c) => cellText(c.nativeElement as HTMLElement));
      expect(texts).toEqual([
        'LUN TA',
        'MAR —',
        'MIÉ —',
        'JUE PB',
        'VIE —',
        'SÁB —',
        'DOM —',
      ]);
    });

    it('marca la celda de hoy', () => {
      const today = fixture.debugElement.queryAll(By.css('[data-week-strip] [data-today]'));
      expect(today).toHaveLength(1);
      expect((today[0]!.nativeElement as HTMLElement).textContent).toContain('JUE');
    });

    it('lista cada día con cantidad de ejercicios y de series', () => {
      const rows = fixture.debugElement.queryAll(By.css('[data-day-row]'));
      expect(rows).toHaveLength(2);
      expect(cellText(rows[0]!.nativeElement as HTMLElement)).toBe('TA Torso A 3 11');
      expect(cellText(rows[1]!.nativeElement as HTMLElement)).toBe('PB Pierna B 2 6');
    });

    it('emite dayClick con el día al tocar su fila', () => {
      let emitted: TrainingDay | undefined;
      fixture.componentInstance.dayClick.subscribe((d) => (emitted = d));
      const row = fixture.debugElement.query(By.css('button[aria-label="Editar día Pierna B"]'));
      (row.nativeElement as HTMLButtonElement).click();
      expect(emitted).toEqual(piernaB);
    });

    it('emite editWeek con la rutina al tocar "Editar semana"', () => {
      let emitted: Routine | undefined;
      fixture.componentInstance.editWeek.subscribe((r) => (emitted = r));
      const btn = fixture.debugElement
        .queryAll(By.css('button'))
        .find((b) => ((b.nativeElement as HTMLElement).textContent ?? '').includes('Editar semana'));
      (btn!.nativeElement as HTMLButtonElement).click();
      expect(emitted).toEqual(activeRoutine);
    });

    it('el encabezado abre la rutina', () => {
      let emitted: Routine | undefined;
      fixture.componentInstance.cardClick.subscribe((r) => (emitted = r));
      const btn = fixture.debugElement.query(By.css('button[aria-label="Abrir rutina Torso / Pierna"]'));
      (btn.nativeElement as HTMLButtonElement).click();
      expect(emitted).toEqual(activeRoutine);
    });
  });

  describe('siglas de los días', () => {
    /** Rutina activa con un día por nombre (de lunes en adelante): siglas de la tira y de la tabla. */
    function renderedCodes(names: readonly string[]): { strip: string[]; table: string[] } {
      const days = names.map((name, i) => makeDay(`d-${i}`, name, []));
      const schedule = Object.fromEntries(DAYS_OF_WEEK.slice(0, days.length).map((dow, i) => [dow, `d-${i}`]));
      const card = TestBed.createComponent(RoutineCardComponent);
      card.componentRef.setInput('routine', { ...activeRoutine, schedule });
      card.componentRef.setInput('dayCount', days.length);
      card.componentRef.setInput('days', days);
      card.detectChanges();

      const strip = card.debugElement
        .queryAll(By.css('[data-week-strip] [role="listitem"]'))
        .map((cell) => (cell.nativeElement as HTMLElement).children[1]?.textContent?.trim() ?? '')
        .filter((code) => code !== '—');
      const table = card.debugElement
        .queryAll(By.css('[data-day-row]'))
        .map((row) => (row.nativeElement as HTMLElement).children[0]?.textContent?.trim() ?? '');
      return { strip, table };
    }

    it('B4: son únicas dentro de la rutina, iguales en la tira y en la tabla', () => {
      const scenarios: readonly { names: string[]; codes: string[] }[] = [
        { names: ['Push', 'Pull'], codes: ['PUS', 'PUL'] },
        { names: ['Pecho y tríceps', 'Piernas y hombros'], codes: ['PYT', 'PYH'] },
        { names: ['Torso A', 'Tren A'], codes: ['TOA', 'TRA'] },
        { names: ['Push', 'Pull', 'Piernas'], codes: ['PUS', 'PUL', 'PI'] },
        { names: ['Día A', 'Día A'], codes: ['DA', 'DA2'] },
        // Nunca pasan de 4 letras (la columna mide 28 px): si las letras no alcanzan, se numera.
        { names: ['Torso/Pierna', 'Torso/Brazo'], codes: ['TO', 'TO2'] },
      ];

      const rendered = scenarios.map(({ names }) => renderedCodes(names));

      expect(rendered.map((r) => r.table)).toEqual(scenarios.map((s) => s.codes));
      expect(rendered.map((r) => r.strip)).toEqual(scenarios.map((s) => s.codes));
    });

    it('B4: la misma lista da siempre las mismas siglas, sin importar el orden de los días', () => {
      expect(renderedCodes(['Push', 'Pull']).table).toEqual(renderedCodes(['Push', 'Pull']).table);
      expect(renderedCodes(['Pull', 'Push']).table).toEqual(['PUL', 'PUS']);
    });
  });
});
