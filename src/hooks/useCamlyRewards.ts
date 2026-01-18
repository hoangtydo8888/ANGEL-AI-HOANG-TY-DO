import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Reward amounts in CAMLY
const REWARD_AMOUNTS = {
  signup: 50000,
  login: 50000,
  connect_wallet: 50000,
  positive_interaction: 10000,
  negative_interaction: -5000,
  referral: 100000,
  daily_bonus: 25000,
} as const;

// Keywords for detecting positive/negative energy
const POSITIVE_KEYWORDS = [
  'yêu thương', 'bình an', 'hạnh phúc', 'cảm ơn', 'biết ơn',
  'ánh sáng', 'chữa lành', 'thức tỉnh', 'tình yêu', 'hy vọng',
  'niềm tin', 'tha thứ', 'từ bi', 'an lạc', 'phước lành',
  'thiền', 'yoga', 'năng lượng', 'tâm linh', 'giác ngộ',
  'vũ trụ', 'thiên thần', 'divine', 'light', 'love', 'peace',
  'grateful', 'blessing', 'meditation', 'spiritual', 'rich'
];

const NEGATIVE_KEYWORDS = [
  'ghét', 'tức giận', 'buồn', 'chán', 'sợ', 'lo lắng',
  'hate', 'angry', 'sad', 'fear', 'worry', 'stupid', 'dumb'
];

type RewardActionType = 'signup' | 'login' | 'connect_wallet' | 'positive_interaction' | 'negative_interaction' | 'referral' | 'daily_bonus';

interface RewardResult {
  success: boolean;
  amount: number;
  message?: string;
}

interface UserReward {
  id: string;
  action_type: string;
  camly_amount: number;
  description: string | null;
  created_at: string;
}

interface RewardClaim {
  id: string;
  wallet_address: string;
  camly_amount: number;
  status: string;
  tx_hash: string | null;
  created_at: string;
  processed_at: string | null;
}

export function useCamlyRewards() {
  // Analyze message for positive/negative energy
  const analyzeMessageEnergy = useCallback((message: string): 'positive' | 'negative' | 'neutral' => {
    const lowerMessage = message.toLowerCase();
    
    const positiveCount = POSITIVE_KEYWORDS.filter(k => lowerMessage.includes(k)).length;
    const negativeCount = NEGATIVE_KEYWORDS.filter(k => lowerMessage.includes(k)).length;
    
    if (positiveCount > negativeCount && positiveCount >= 2) return 'positive';
    if (negativeCount > positiveCount && negativeCount >= 2) return 'negative';
    return 'neutral';
  }, []);

  // Award CAMLY for an action
  const awardCamly = useCallback(async (
    userId: string,
    actionType: RewardActionType,
    description?: string
  ): Promise<RewardResult> => {
    const amount = REWARD_AMOUNTS[actionType];
    
    try {
      const { error } = await supabase
        .from('user_rewards')
        .insert({
          user_id: userId,
          action_type: actionType,
          camly_amount: amount,
          description: description || `Phần thưởng cho ${actionType}`,
        });

      if (error) {
        console.error('Error awarding CAMLY:', error);
        return { success: false, amount: 0 };
      }

      // Update profile balance
      const { data: profile } = await supabase
        .from('profiles')
        .select('camly_balance')
        .eq('user_id', userId)
        .maybeSingle();

      if (profile) {
        await supabase
          .from('profiles')
          .update({ camly_balance: (profile.camly_balance || 0) + amount })
          .eq('user_id', userId);
      }

      if (amount > 0) {
        toast.success(`🪙 +${amount.toLocaleString()} CAMLY! Rich Rich Rich ♡`);
      }

      return { success: true, amount };
    } catch (error) {
      console.error('Error awarding CAMLY:', error);
      return { success: false, amount: 0 };
    }
  }, []);

  // Reward based on message content
  const rewardForMessage = useCallback(async (
    userId: string,
    message: string
  ): Promise<RewardResult> => {
    const energy = analyzeMessageEnergy(message);
    
    if (energy === 'positive') {
      return awardCamly(userId, 'positive_interaction', 'Năng lượng tích cực từ tin nhắn ánh sáng');
    } else if (energy === 'negative') {
      return awardCamly(userId, 'negative_interaction', 'Năng lượng cần được chuyển hóa');
    }
    
    return { success: false, amount: 0, message: 'neutral' };
  }, [analyzeMessageEnergy, awardCamly]);

  // Get user's CAMLY balance
  const getCamlyBalance = useCallback(async (userId: string): Promise<number> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('camly_balance')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) return 0;
    return data.camly_balance || 0;
  }, []);

  // Get user's reward history
  const getRewardHistory = useCallback(async (userId: string, limit = 50): Promise<UserReward[]> => {
    const { data, error } = await supabase
      .from('user_rewards')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) return [];
    return data as UserReward[];
  }, []);

  // Get user's claim history
  const getClaimHistory = useCallback(async (userId: string): Promise<RewardClaim[]> => {
    const { data, error } = await supabase
      .from('reward_claims')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) return [];
    return data as RewardClaim[];
  }, []);

  // Submit a claim request
  const submitClaimRequest = useCallback(async (
    userId: string,
    walletAddress: string,
    amount: number
  ): Promise<{ success: boolean; claimId?: string }> => {
    try {
      const { data, error } = await supabase
        .from('reward_claims')
        .insert({
          user_id: userId,
          wallet_address: walletAddress,
          camly_amount: amount,
          status: 'pending',
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error submitting claim:', error);
        toast.error('Không thể gửi yêu cầu claim. Vui lòng thử lại!');
        return { success: false };
      }

      toast.success('🎉 Yêu cầu claim đã được gửi! Admin sẽ xử lý sớm nhất.');
      return { success: true, claimId: data.id };
    } catch (error) {
      console.error('Error submitting claim:', error);
      return { success: false };
    }
  }, []);

  // Get total pending claims amount
  const getPendingClaimsAmount = useCallback(async (userId: string): Promise<number> => {
    const { data, error } = await supabase
      .from('reward_claims')
      .select('camly_amount')
      .eq('user_id', userId)
      .eq('status', 'pending');

    if (error || !data) return 0;
    return data.reduce((sum, claim) => sum + claim.camly_amount, 0);
  }, []);

  return {
    analyzeMessageEnergy,
    awardCamly,
    rewardForMessage,
    getCamlyBalance,
    getRewardHistory,
    getClaimHistory,
    submitClaimRequest,
    getPendingClaimsAmount,
    REWARD_AMOUNTS,
  };
}
