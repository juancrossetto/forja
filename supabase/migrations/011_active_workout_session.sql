-- ============================================
-- Migration 008: Active workout session tracking
-- Adds elapsed_seconds and completed_exercises to workout_logs
-- so in-progress sessions survive app restarts.
-- Run in Supabase Dashboard → SQL Editor
-- ============================================

ALTER TABLE public.workout_logs
  ADD COLUMN IF NOT EXISTS elapsed_seconds   INT  NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS completed_exercises JSONB NOT NULL DEFAULT '[]';

-- Fast lookup of active (incomplete) sessions per user
CREATE INDEX IF NOT EXISTS idx_workout_logs_active
  ON public.workout_logs (user_id, created_at DESC)
  WHERE completed = false;
