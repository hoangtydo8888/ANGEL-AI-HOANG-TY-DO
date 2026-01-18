-- Create enum for reward action types
CREATE TYPE public.reward_action_type AS ENUM (
  'signup',
  'login',
  'connect_wallet',
  'positive_interaction',
  'negative_interaction',
  'referral',
  'daily_bonus'
);

-- Create enum for claim status
CREATE TYPE public.claim_status AS ENUM (
  'pending',
  'approved',
  'rejected',
  'claimed'
);

-- Create user_rewards table to track individual reward actions
CREATE TABLE public.user_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  action_type reward_action_type NOT NULL,
  camly_amount INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create reward_claims table for tracking claim requests
CREATE TABLE public.reward_claims (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  wallet_address TEXT NOT NULL,
  camly_amount INTEGER NOT NULL,
  status claim_status NOT NULL DEFAULT 'pending',
  tx_hash TEXT,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Create daily_reward_limits table for budget control
CREATE TABLE public.daily_reward_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE UNIQUE,
  total_distributed INTEGER NOT NULL DEFAULT 0,
  daily_limit INTEGER NOT NULL DEFAULT 10000000, -- 10M CAMLY daily limit
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_reward_limits ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_rewards
CREATE POLICY "Users can view their own rewards"
ON public.user_rewards
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can insert rewards"
ON public.user_rewards
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for reward_claims
CREATE POLICY "Users can view their own claims"
ON public.reward_claims
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create claims"
ON public.reward_claims
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for daily_reward_limits (read-only for users)
CREATE POLICY "Anyone can view daily limits"
ON public.daily_reward_limits
FOR SELECT
USING (true);

-- Add camly_balance column to profiles
ALTER TABLE public.profiles ADD COLUMN camly_balance INTEGER NOT NULL DEFAULT 0;

-- Function to get user's total unclaimed CAMLY
CREATE OR REPLACE FUNCTION public.get_unclaimed_camly(p_user_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(camly_amount), 0)::INTEGER
  FROM public.user_rewards
  WHERE user_id = p_user_id
  AND id NOT IN (
    SELECT UNNEST(string_to_array(
      (SELECT string_agg(r.id::text, ',') 
       FROM public.reward_claims c
       CROSS JOIN LATERAL UNNEST(ARRAY[c.id]) AS r(id)
       WHERE c.user_id = p_user_id AND c.status IN ('approved', 'claimed')),
      ','
    ))::UUID
  );
$$;

-- Function to add reward
CREATE OR REPLACE FUNCTION public.add_camly_reward(
  p_user_id UUID,
  p_action_type reward_action_type,
  p_amount INTEGER,
  p_description TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reward_id UUID;
BEGIN
  INSERT INTO public.user_rewards (user_id, action_type, camly_amount, description)
  VALUES (p_user_id, p_action_type, p_amount, p_description)
  RETURNING id INTO v_reward_id;
  
  -- Update user's camly_balance
  UPDATE public.profiles
  SET camly_balance = camly_balance + p_amount
  WHERE user_id = p_user_id;
  
  RETURN v_reward_id;
END;
$$;