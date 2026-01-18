-- Add 'withdrawal' to the reward_action_type enum
ALTER TYPE public.reward_action_type ADD VALUE IF NOT EXISTS 'withdrawal';