import { supabase } from '../lib/supabase';
import { exerciseImageUrlForApp } from './exerciseMedia';
import type {
  Exercise,
  Workout,
  TrainingDay,
  TrainingPhase,
  TrainingDayType,
  WorkoutType,
} from '../types';

function mapWorkoutType(t: string): WorkoutType {
  if (t === 'cardio') return 'cardio';
  if (t === 'descanso') return 'descanso';
  return 'fuerza';
}

function mapDayType(t: string): TrainingDayType {
  const map: Record<string, TrainingDayType> = {
    fuerza: 'fuerza',
    cardio: 'cardio',
    descanso: 'descanso',
    tecnica: 'tecnica',
    movilidad: 'tecnica',
  };
  return map[t] ?? 'fuerza';
}

function mapExerciseFromJoin(we: {
  sort_order: number;
  sets: number;
  reps: string;
  weight_kg: number | null;
  tempo: string | null;
  exercises: {
    id: string;
    name: string;
    image_url: string | null;
    metadata: unknown;
  } | null;
}): Exercise | null {
  const ex = we.exercises;
  if (!ex) return null;
  const fallbackImg =
    'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400';
  const resolved =
    exerciseImageUrlForApp({ image_url: ex.image_url, metadata: ex.metadata }) ??
    fallbackImg;
  return {
    id: ex.id,
    name: ex.name,
    sets: we.sets,
    reps: we.reps,
    weight: we.weight_kg != null ? Number(we.weight_kg) : null,
    tempo: we.tempo ?? '2-0-2-0',
    image: resolved,
    order: we.sort_order,
  };
}

function mapWorkoutFromDb(w: {
  id: string;
  title: string;
  workout_type: string;
  duration_min: number | null;
  blocks: number;
  calories_est: number | null;
  workout_exercises: Array<{
    sort_order: number;
    sets: number;
    reps: string;
    weight_kg: number | null;
    tempo: string | null;
    exercises: {
      id: string;
      name: string;
      image_url: string | null;
      metadata: unknown;
    } | null;
  }>;
}): Workout {
  const sorted = [...(w.workout_exercises ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order,
  );
  const exercises: Exercise[] = [];
  for (const we of sorted) {
    const ex = mapExerciseFromJoin(we);
    if (ex) exercises.push(ex);
  }

  return {
    id: w.id,
    title: w.title,
    type: mapWorkoutType(w.workout_type),
    duration: w.duration_min ?? 45,
    blocks: w.blocks ?? 1,
    calories: w.calories_est ?? 300,
    exercises,
  };
}

/**
 * Loads the default active training phase with days, workouts, and exercises from Supabase.
 * Returns null if tables are empty or the query fails (caller shows empty state).
 */
export async function fetchTrainingProgram(
  programKey = 'default',
): Promise<{ phase: TrainingPhase; workouts: Workout[] } | null> {
  const { data: phases, error: phErr } = await supabase
    .from('training_phases')
    .select('id, name, phase_number, description, program_key, sort_order')
    .eq('program_key', programKey)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .limit(1);

  if (phErr || !phases?.length) {
    if (phErr) console.warn('fetchTrainingProgram phases:', phErr.message);
    return null;
  }

  const phaseRow = phases[0];

  const { data: daysRows, error: dErr } = await supabase
    .from('training_days')
    .select(
      `
      id,
      day_number,
      title,
      day_type,
      workout_id,
      workouts (
        id,
        title,
        workout_type,
        duration_min,
        blocks,
        calories_est,
        workout_exercises (
          sort_order,
          sets,
          reps,
          weight_kg,
          tempo,
          rest_seconds,
          exercises (
            id,
            name,
            image_url,
            metadata
          )
        )
      )
    `,
    )
    .eq('phase_id', phaseRow.id)
    .order('day_number', { ascending: true });

  if (dErr || !daysRows?.length) {
    if (dErr) console.warn('fetchTrainingProgram days:', dErr.message);
    return null;
  }

  const workoutsMap = new Map<string, Workout>();
  const days: TrainingDay[] = [];

  for (const row of daysRows) {
    const raw = row.workouts as unknown;
    const w = (
      Array.isArray(raw) ? raw[0] : raw
    ) as Parameters<typeof mapWorkoutFromDb>[0] | null | undefined;

    if (!w || !row.workout_id) {
      days.push({
        dayNumber: row.day_number,
        title: row.title,
        type: mapDayType(row.day_type),
      });
      continue;
    }

    let workout = workoutsMap.get(w.id);
    if (!workout) {
      workout = mapWorkoutFromDb(w);
      workoutsMap.set(w.id, workout);
    }

    days.push({
      dayNumber: row.day_number,
      title: row.title,
      type: mapDayType(row.day_type),
      workout,
    });
  }

  const phase: TrainingPhase = {
    id: phaseRow.id,
    name: phaseRow.name,
    number: phaseRow.phase_number,
    description: phaseRow.description ?? '',
    progress: 0,
    days,
  };

  return { phase, workouts: Array.from(workoutsMap.values()) };
}
