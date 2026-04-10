import { supabase } from '../lib/supabase';

export interface CatalogExercise {
  id: string;
  name: string;
  body_part: string | null;
  body_parts: string[] | null;
  equipment: string[] | null;
  target_muscles: string[] | null;
  secondary_muscles: string[] | null;
  image_url: string | null;
  metadata: unknown;
  instructions: string[] | null;
  exercise_type: string | null;
}

/** Fetch exercises filtered by body_part (e.g. 'chest', 'back', 'upper legs') */
export async function fetchExercisesByBodyPart(
  bodyPart: string,
  limit = 30,
): Promise<CatalogExercise[]> {
  const { data, error } = await supabase
    .from('exercises')
    .select('id, name, body_part, body_parts, equipment, target_muscles, secondary_muscles, image_url, metadata, instructions, exercise_type')
    .ilike('body_part', bodyPart)
    .limit(limit);

  if (error) {
    console.error('exerciseService.fetchExercisesByBodyPart error:', error.message);
    return [];
  }
  return (data ?? []) as CatalogExercise[];
}

/** Fetch exercises for multiple body parts and merge results */
export async function fetchExercisesByBodyParts(
  bodyParts: string[],
  limitPerPart = 20,
): Promise<CatalogExercise[]> {
  const results = await Promise.all(
    bodyParts.map((bp) => fetchExercisesByBodyPart(bp, limitPerPart)),
  );
  return results.flat();
}

/** Fetch a single exercise by ID */
export async function fetchExerciseById(id: string): Promise<CatalogExercise | null> {
  const { data, error } = await supabase
    .from('exercises')
    .select('id, name, body_part, body_parts, equipment, target_muscles, secondary_muscles, image_url, metadata, instructions, exercise_type')
    .eq('id', id)
    .single();

  if (error) return null;
  return data as CatalogExercise;
}

/** Search exercises by name */
export async function searchExercises(
  query: string,
  limit = 20,
): Promise<CatalogExercise[]> {
  const { data, error } = await supabase
    .from('exercises')
    .select('id, name, body_part, body_parts, equipment, target_muscles, secondary_muscles, image_url, metadata, instructions, exercise_type')
    .ilike('name', `%${query}%`)
    .limit(limit);

  if (error) {
    console.error('exerciseService.searchExercises error:', error.message);
    return [];
  }
  return (data ?? []) as CatalogExercise[];
}
