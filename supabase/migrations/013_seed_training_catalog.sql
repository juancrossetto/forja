-- Optional dev seed: mirrors mock data in src/store/trainingStore.ts (Potencia Estructural).
-- Safe to run once; skips if a phase with this name already exists for program_key default.

DO $$
DECLARE
  v_phase uuid := 'a1000000-0000-4000-8000-000000000001'::uuid;
  w_pecho uuid := 'a2000000-0000-4000-8000-000000000001'::uuid;
  w_brazos uuid := 'a2000000-0000-4000-8000-000000000002'::uuid;
  w_piernas uuid := 'a2000000-0000-4000-8000-000000000003'::uuid;
  w_cardio uuid := 'a2000000-0000-4000-8000-000000000004'::uuid;
  e1 text := 'a3000000-0000-4000-8000-000000000001';
  e2 text := 'a3000000-0000-4000-8000-000000000002';
  e3 text := 'a3000000-0000-4000-8000-000000000003';
  e4 text := 'a3000000-0000-4000-8000-000000000004';
  e5 text := 'a3000000-0000-4000-8000-000000000005';
  e6 text := 'a3000000-0000-4000-8000-000000000006';
  e7 text := 'a3000000-0000-4000-8000-000000000007';
  e8 text := 'a3000000-0000-4000-8000-000000000008';
  e9 text := 'a3000000-0000-4000-8000-000000000009';
  e10 text := 'a3000000-0000-4000-8000-00000000000a';
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.training_phases
    WHERE program_key = 'default' AND name = 'Potencia Estructural'
  ) THEN
    RETURN;
  END IF;

  -- wger PNG thumbnails (GIFs from same catalog are often 0.8–1.5 MB and fail to decode in expo-image on device).
  INSERT INTO public.exercises (id, name, slug, image_url, external_source)
  VALUES
    (e1, 'Press de Banca', 'press-banca', 'https://wger.de/media/exercise-images/192/Bench-press-1.png', 'manual'),
    (e2, 'Vuelos Laterales', 'vuelos-laterales', 'https://wger.de/media/exercise-images/148/lateral-dumbbell-raises-large-1.png', 'manual'),
    (e3, 'Pull-ups (Asistidos)', 'pull-ups-asistidos', 'https://wger.de/media/exercise-images/181/Chin-ups-2.png', 'manual'),
    (e4, 'Remo Horizontal', 'remo-horizontal', 'https://wger.de/media/exercise-images/106/T-bar-row-1.png', 'manual'),
    (e5, 'Curl de Bíceps', 'curl-biceps', 'https://wger.de/media/exercise-images/81/Biceps-curl-1.png', 'manual'),
    (e6, 'Extensiones de Tríceps', 'extensiones-triceps', 'https://wger.de/media/exercise-images/84/Lying-close-grip-triceps-press-to-chin-1.png', 'manual'),
    (e7, 'Sentadillas', 'sentadillas', 'https://wger.de/media/exercise-images/191/Front-squat-1-857x1024.png', 'manual'),
    (e8, 'Prensa de Piernas', 'prensa-piernas', 'https://wger.de/media/exercise-images/130/Narrow-stance-hack-squats-1-1024x721.png', 'manual'),
    (e9, 'Leg Curl Máquina', 'leg-curl-maquina', 'https://wger.de/media/exercise-images/154/lying-leg-curl-machine-large-1.png', 'manual'),
    (e10, 'Elevaciones de Gemelos', 'elevaciones-gemelos', 'https://wger.de/media/exercise-images/125/Leg-raises-1.png', 'manual');

  INSERT INTO public.workouts (id, title, workout_type, duration_min, blocks, calories_est)
  VALUES
    (w_pecho, 'Pecho y Espalda', 'fuerza', 65, 2, 380),
    (w_brazos, 'Brazos y Antebrazos', 'fuerza', 50, 1, 250),
    (w_piernas, 'Piernas', 'fuerza', 75, 2, 450),
    (w_cardio, 'Cardio Moderado', 'cardio', 40, 1, 380);

  INSERT INTO public.workout_exercises (workout_id, exercise_id, sort_order, sets, reps, weight_kg, tempo)
  VALUES
    (w_pecho, e1, 0, 4, '6-8', 80, '3-1-2-0'),
    (w_pecho, e2, 1, 3, '10-12', 20, '2-0-2-0'),
    (w_pecho, e3, 2, 3, '8-10', NULL, '2-0-2-1'),
    (w_pecho, e4, 3, 4, '6-8', 75, '2-1-2-0'),
    (w_brazos, e5, 0, 3, '10-12', 25, '2-0-2-1'),
    (w_brazos, e6, 1, 3, '10-12', 22, '2-0-2-1'),
    (w_piernas, e7, 0, 4, '6-8', 100, '3-1-2-0'),
    (w_piernas, e8, 1, 4, '8-10', 150, '2-1-2-0'),
    (w_piernas, e9, 2, 3, '10-12', 45, '2-0-2-1'),
    (w_piernas, e10, 3, 4, '12-15', 50, '2-1-2-0');

  INSERT INTO public.training_phases (id, program_key, phase_number, name, description, sort_order, is_active)
  VALUES (
    v_phase,
    'default',
    2,
    'Potencia Estructural',
    'Enfoque en desarrollo de fuerza y potencia con movimientos compuestos',
    0,
    true
  );

  INSERT INTO public.training_days (phase_id, day_number, title, day_type, workout_id, sort_order)
  VALUES
    (v_phase, 1, 'Lunes - Pecho y Espalda', 'fuerza', w_pecho, 0),
    (v_phase, 2, 'Martes - Cardio', 'cardio', w_cardio, 1),
    (v_phase, 3, 'Miércoles - Brazos', 'fuerza', w_brazos, 2),
    (v_phase, 4, 'Jueves - Descanso', 'descanso', NULL, 3),
    (v_phase, 5, 'Viernes - Piernas', 'fuerza', w_piernas, 4),
    (v_phase, 6, 'Sábado - Cardio Ligero', 'cardio', w_cardio, 5),
    (v_phase, 7, 'Domingo - Descanso', 'descanso', NULL, 6);
END $$;
