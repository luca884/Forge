import { Exercise } from '@features/exercises/domain/exercise.entity';
import { ExerciseRepository } from '@features/exercises/domain/exercise.repository';
import { SeedExercisesUseCase } from '@features/exercises/domain/use-cases/seed-exercises.use-case';
import { TestBed } from '@angular/core/testing';
import { RoutineTemplate } from './routine-template';
import { ROUTINE_TEMPLATES, findRoutineTemplate } from './routine-templates';

/** "Press de banca 4×6", or "Plancha 3×45 s" for a timed exercise. */
function describeExercise(exercise: RoutineTemplate['days'][number]['exercises'][number]): string {
  return 'seconds' in exercise
    ? `${exercise.name} ${exercise.sets}×${exercise.seconds} s`
    : `${exercise.name} ${exercise.sets}×${exercise.reps}`;
}

/** One line per day: "Torso A: Press de banca 4×6 · Remo con barra 4×8". */
function describeDays(template: RoutineTemplate): string[] {
  return template.days.map((day) => `${day.name}: ${day.exercises.map(describeExercise).join(' · ')}`);
}

function byName(name: string): RoutineTemplate {
  const template = ROUTINE_TEMPLATES.find((t) => t.name === name);
  if (!template) throw new Error(`Missing template: ${name}`);
  return template;
}

class InMemoryExerciseRepository extends ExerciseRepository {
  readonly rows: Exercise[] = [];
  override async getAll(): Promise<Exercise[]> {
    return [...this.rows];
  }
  override async getById(id: string): Promise<Exercise | null> {
    return this.rows.find((e) => e.id === id) ?? null;
  }
  override async save(exercise: Exercise): Promise<void> {
    this.rows.push(exercise);
  }
  override async count(): Promise<number> {
    return this.rows.length;
  }
  override async delete(id: string): Promise<void> {
    this.rows.splice(0, this.rows.length, ...this.rows.filter((e) => e.id !== id));
  }
}

// crypto.randomUUID is not available in jsdom: the seed use case needs a deterministic one.
let uuidCounter = 0;
beforeEach(() => {
  uuidCounter = 0;
  Object.defineProperty(globalThis, 'crypto', {
    value: { randomUUID: () => `test-uuid-${++uuidCounter}` },
    writable: true,
  });
});

describe('ROUTINE_TEMPLATES', () => {
  it('offers exactly "Torso / Pierna", "Full body" and "Push / Pull / Piernas", in that order, with the canvas subtitles', () => {
    expect(ROUTINE_TEMPLATES.map((t) => [t.name, t.summary])).toEqual([
      ['Torso / Pierna', '4 días · 4 ejercicios por día'],
      ['Full body', '3 días · ideal para empezar'],
      ['Push / Pull / Piernas', '6 días · volumen alto'],
    ]);
  });

  it('defines the days of "Torso / Pierna" as D1 says', () => {
    expect(describeDays(byName('Torso / Pierna'))).toEqual([
      'Torso A: Press de banca 4×6 · Remo con barra 4×8 · Press militar 3×8 · Jalón al pecho 3×10',
      'Pierna A: Sentadilla 4×6 · Peso muerto rumano 3×8 · Prensa de piernas 3×10 · Elevación de gemelos 3×12',
      'Torso B: Press inclinado con barra 3×8 · Dominadas 3×8 · Press de hombros con mancuernas 3×10 · Remo con mancuerna 3×10',
      'Pierna B: Peso muerto 3×5 · Zancadas 3×10 · Curl femoral 3×12 · Hip thrust 3×10',
    ]);
  });

  it('defines the days of "Full body" as D1 says, with Plancha timed', () => {
    expect(describeDays(byName('Full body'))).toEqual([
      'A: Sentadilla 3×8 · Press de banca 3×8 · Remo con barra 3×8 · Plancha 3×45 s',
      'B: Peso muerto 3×5 · Press militar 3×8 · Jalón al pecho 3×10 · Zancadas 3×10',
      'C: Prensa de piernas 3×10 · Press de banca con mancuernas 3×10 · Remo en polea baja 3×10 · Abdominales 3×15',
    ]);
  });

  it('defines the days of "Push / Pull / Piernas" as D1 says', () => {
    expect(describeDays(byName('Push / Pull / Piernas'))).toEqual([
      'Push: Press de banca 4×8 · Press militar 3×8 · Elevaciones laterales 3×12 · Extensión de tríceps en polea 3×12',
      'Pull: Dominadas 3×8 · Remo con barra 4×8 · Face pull 3×15 · Curl de bíceps 3×10',
      'Piernas: Sentadilla 4×6 · Peso muerto rumano 3×8 · Extensión de cuádriceps 3×12 · Elevación de gemelos 3×15',
    ]);
  });

  it('only uses exercises of the seeded library, asking reps of rep-based ones and seconds of timed ones', async () => {
    const repo = new InMemoryExerciseRepository();
    TestBed.configureTestingModule({
      providers: [SeedExercisesUseCase, { provide: ExerciseRepository, useValue: repo }],
    });
    await TestBed.inject(SeedExercisesUseCase).execute();
    const library = new Map(repo.rows.map((e) => [e.name, e]));

    const problems: string[] = [];
    let checked = 0;
    for (const template of ROUTINE_TEMPLATES) {
      for (const day of template.days) {
        for (const exercise of day.exercises) {
          checked += 1;
          const found = library.get(exercise.name);
          if (!found) {
            problems.push(`${template.name}/${day.name}: "${exercise.name}" is not in the library`);
          } else if (found.trackingType === 'time' ? !('seconds' in exercise) : !('reps' in exercise)) {
            problems.push(`${template.name}/${day.name}: "${exercise.name}" is ${found.trackingType}`);
          }
        }
      }
    }
    expect(problems).toEqual([]);
    // 16 + 12 + 12: guards against a catalog that passes by being empty.
    expect(checked).toBe(40);
  });

  it('findRoutineTemplate returns a template by id and undefined for an unknown one', () => {
    const fullBody = byName('Full body');
    expect(findRoutineTemplate(fullBody.id)).toBe(fullBody);
    expect(findRoutineTemplate('no-such-template')).toBeUndefined();
  });
});
