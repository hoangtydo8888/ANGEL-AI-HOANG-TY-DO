import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const POSITIVE_KEYWORDS = [
  'yêu thương', 'bình an', 'hạnh phúc', 'cảm ơn', 'biết ơn', 
  'ánh sáng', 'chữa lành', 'thức tỉnh', 'tình yêu', 'hy vọng', 
  'niềm tin', 'tha thứ', 'từ bi', 'an lạc', 'phước lành',
  'thiền', 'yoga', 'năng lượng', 'tâm linh', 'giác ngộ',
  'vũ trụ', 'thiên thần', 'divine', 'light', 'love', 'peace',
  'grateful', 'blessing', 'meditation', 'spiritual'
];

const BASE_REWARD = 10;
const BONUS_MULTIPLIER = 2;

export function useLightTokens() {
  const checkPositiveEnergy = useCallback((message: string): { isPositive: boolean; matchCount: number } => {
    const lowerMessage = message.toLowerCase();
    const matchedKeywords = POSITIVE_KEYWORDS.filter(keyword => 
      lowerMessage.includes(keyword.toLowerCase())
    );
    return {
      isPositive: matchedKeywords.length > 0,
      matchCount: matchedKeywords.length,
    };
  }, []);

  const rewardLightTokens = useCallback(async (
    userId: string,
    message: string,
    walletAddress?: string
  ): Promise<{ rewarded: boolean; amount: number }> => {
    const { isPositive, matchCount } = checkPositiveEnergy(message);
    
    if (!isPositive) {
      return { rewarded: false, amount: 0 };
    }

    // Calculate reward based on positive energy
    const bonusTokens = Math.min(matchCount - 1, 3) * BONUS_MULTIPLIER;
    const totalReward = BASE_REWARD + bonusTokens;

    try {
      // Get current token balance
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('light_tokens')
        .eq('user_id', userId)
        .single();

      if (fetchError || !profile) {
        console.error('Error fetching profile:', fetchError);
        return { rewarded: false, amount: 0 };
      }

      // Update user's light tokens
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ light_tokens: profile.light_tokens + totalReward })
        .eq('user_id', userId);

      if (updateError) {
        console.error('Error updating light tokens:', updateError);
        return { rewarded: false, amount: 0 };
      }

      // Record transaction
      await supabase.from('light_token_transactions').insert({
        user_id: userId,
        amount: totalReward,
        reason: 'Năng lượng tích cực trong tin nhắn',
        wallet_address: walletAddress,
      });

      toast.success(`✨ +${totalReward} Light Tokens! Năng lượng ánh sáng của bạn được ghi nhận!`);
      
      return { rewarded: true, amount: totalReward };
    } catch (error) {
      console.error('Error rewarding light tokens:', error);
      return { rewarded: false, amount: 0 };
    }
  }, [checkPositiveEnergy]);

  const getTokenBalance = useCallback(async (userId: string): Promise<number> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('light_tokens')
      .eq('user_id', userId)
      .single();

    if (error || !data) return 0;
    return data.light_tokens;
  }, []);

  const getTransactionHistory = useCallback(async (userId: string, limit = 20) => {
    const { data, error } = await supabase
      .from('light_token_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) return [];
    return data;
  }, []);

  return {
    checkPositiveEnergy,
    rewardLightTokens,
    getTokenBalance,
    getTransactionHistory,
  };
}
