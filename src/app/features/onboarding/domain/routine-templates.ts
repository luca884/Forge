import { RoutineTemplate, TemplateExercise } from './routine-template';

/** An exercise logged by reps: `reps('Press de banca', 4, 6)` is 4 sets of 6. */
function reps(name: string, sets: number, repsPerSet: number): TemplateExercise {
  return { name, sets, reps: repsPerSet };
}

/** An exercise logged by time: `hold('Plancha', 3, 45)` is 3 sets of 45 seconds. */
function hold(name: string, sets: number, seconds: number): TemplateExercise {
  return { name, sets, seconds };
}

/**
 * The three starter routines of the first-use screen (decision D1). Exercise names are the
 * library's seed names; the summary lines come from the C-Welcome board.
 */
export const ROUTINE_TEMPLATES: readonly RoutineTemplate[] = [
  {
    id: 'torso-pierna',
    name: 'Torso / Pierna',
    summary: '4 días · 4 ejercicios por día',
    days: [
      {
        name: 'Torso A',
        exercises: [
          reps('Press de banca', 4, 6),
          reps('Remo con barra', 4, 8),
          reps('Press militar', 3, 8),
          reps('Jalón al pecho', 3, 10),
        ],
      },
      {
        name: 'Pierna A',
        exercises: [
          reps('Sentadilla', 4, 6),
          reps('Peso muerto rumano', 3, 8),
          reps('Prensa de piernas', 3, 10),
          reps('Elevación de gemelos', 3, 12),
        ],
      },
      {
        name: 'Torso B',
        exercises: [
          reps('Press inclinado con barra', 3, 8),
          reps('Dominadas', 3, 8),
          reps('Press de hombros con mancuernas', 3, 10),
          reps('Remo con mancuerna', 3, 10),
        ],
      },
      {
        name: 'Pierna B',
        exercises: [
          reps('Peso muerto', 3, 5),
          reps('Zancadas', 3, 10),
          reps('Curl femoral', 3, 12),
          reps('Hip thrust', 3, 10),
        ],
      },
    ],
  },
  {
    id: 'full-body',
    name: 'Full body',
    summary: '3 días · ideal para empezar',
    days: [
      {
        name: 'A',
        exercises: [
          reps('Sentadilla', 3, 8),
          reps('Press de banca', 3, 8),
          reps('Remo con barra', 3, 8),
          hold('Plancha', 3, 45),
        ],
      },
      {
        name: 'B',
        exercises: [
          reps('Peso muerto', 3, 5),
          reps('Press militar', 3, 8),
          reps('Jalón al pecho', 3, 10),
          reps('Zancadas', 3, 10),
        ],
      },
      {
        name: 'C',
        exercises: [
          reps('Prensa de piernas', 3, 10),
          reps('Press de banca con mancuernas', 3, 10),
          reps('Remo en polea baja', 3, 10),
          reps('Abdominales', 3, 15),
        ],
      },
    ],
  },
  {
    id: 'push-pull-piernas',
    name: 'Push / Pull / Piernas',
    summary: '6 días · volumen alto',
    days: [
      {
        name: 'Push',
        exercises: [
          reps('Press de banca', 4, 8),
          reps('Press militar', 3, 8),
          reps('Elevaciones laterales', 3, 12),
          reps('Extensión de tríceps en polea', 3, 12),
        ],
      },
      {
        name: 'Pull',
        exercises: [
          reps('Dominadas', 3, 8),
          reps('Remo con barra', 4, 8),
          reps('Face pull', 3, 15),
          reps('Curl de bíceps', 3, 10),
        ],
      },
      {
        name: 'Piernas',
        exercises: [
          reps('Sentadilla', 4, 6),
          reps('Peso muerto rumano', 3, 8),
          reps('Extensión de cuádriceps', 3, 12),
          reps('Elevación de gemelos', 3, 15),
        ],
      },
    ],
  },
];

export function findRoutineTemplate(id: string): RoutineTemplate | undefined {
  return ROUTINE_TEMPLATES.find((template) => template.id === id);
}
