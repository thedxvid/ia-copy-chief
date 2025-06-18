
-- Add first_login column to profiles table to track if user needs to change temporary password
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS first_login BOOLEAN NOT NULL DEFAULT false;
