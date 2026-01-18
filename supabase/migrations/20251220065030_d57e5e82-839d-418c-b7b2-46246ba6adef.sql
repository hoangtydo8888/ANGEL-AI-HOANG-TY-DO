-- Update handle_new_user function to award signup bonus
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile with initial CAMLY bonus
  INSERT INTO public.profiles (user_id, display_name, light_tokens, camly_balance)
  VALUES (new.id, new.raw_user_meta_data ->> 'full_name', 100, 50000);
  
  -- Record signup reward
  INSERT INTO public.user_rewards (user_id, action_type, camly_amount, description)
  VALUES (new.id, 'signup', 50000, 'Phần thưởng đăng ký tài khoản - Chào mừng đến với ANGEL AI!');
  
  RETURN new;
END;
$$;