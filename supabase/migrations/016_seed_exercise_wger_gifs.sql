-- Replace Unsplash placeholders with wger.de PNG thumbnails (large GIFs often fail in expo-image).

UPDATE public.exercises
SET image_url = 'https://wger.de/media/exercise-images/192/Bench-press-1.png',
    updated_at = now()
WHERE slug = 'press-banca';

UPDATE public.exercises
SET image_url = 'https://wger.de/media/exercise-images/148/lateral-dumbbell-raises-large-1.png',
    updated_at = now()
WHERE slug = 'vuelos-laterales';

UPDATE public.exercises
SET image_url = 'https://wger.de/media/exercise-images/181/Chin-ups-2.png',
    updated_at = now()
WHERE slug = 'pull-ups-asistidos';

UPDATE public.exercises
SET image_url = 'https://wger.de/media/exercise-images/106/T-bar-row-1.png',
    updated_at = now()
WHERE slug = 'remo-horizontal';

UPDATE public.exercises
SET image_url = 'https://wger.de/media/exercise-images/81/Biceps-curl-1.png',
    updated_at = now()
WHERE slug = 'curl-biceps';

UPDATE public.exercises
SET image_url = 'https://wger.de/media/exercise-images/84/Lying-close-grip-triceps-press-to-chin-1.png',
    updated_at = now()
WHERE slug = 'extensiones-triceps';

UPDATE public.exercises
SET image_url = 'https://wger.de/media/exercise-images/191/Front-squat-1-857x1024.png',
    updated_at = now()
WHERE slug = 'sentadillas';

UPDATE public.exercises
SET image_url = 'https://wger.de/media/exercise-images/130/Narrow-stance-hack-squats-1-1024x721.png',
    updated_at = now()
WHERE slug = 'prensa-piernas';

UPDATE public.exercises
SET image_url = 'https://wger.de/media/exercise-images/154/lying-leg-curl-machine-large-1.png',
    updated_at = now()
WHERE slug = 'leg-curl-maquina';

UPDATE public.exercises
SET image_url = 'https://wger.de/media/exercise-images/125/Leg-raises-1.png',
    updated_at = now()
WHERE slug = 'elevaciones-gemelos';
