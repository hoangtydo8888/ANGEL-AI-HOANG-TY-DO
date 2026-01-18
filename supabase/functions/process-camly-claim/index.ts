import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { ethers } from "https://esm.sh/ethers@5.7.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ERC20 ABI for transfer function
const ERC20_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)"
];

// BSC Mainnet RPC
const BSC_RPC_URL = "https://bsc-dataseed.binance.org/";

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const bscPrivateKey = Deno.env.get('BSC_PRIVATE_KEY');
    const camlyTokenAddress = Deno.env.get('CAMLY_TOKEN_ADDRESS');

    if (!bscPrivateKey || !camlyTokenAddress) {
      console.error('Missing BSC configuration');
      return new Response(
        JSON.stringify({ success: false, error: 'BSC configuration missing' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase admin client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user is admin
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error('User auth error:', userError);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check admin role using has_role function
    const { data: isAdminData, error: roleError } = await supabase
      .rpc('has_role', { _user_id: user.id, _role: 'admin' });

    if (roleError || !isAdminData) {
      console.error('Not admin or role check error:', roleError);
      return new Response(
        JSON.stringify({ success: false, error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { claimId, action, walletAddress, amount } = await req.json();

    console.log(`Processing claim ${claimId}: action=${action}, wallet=${walletAddress}, amount=${amount}`);

    if (action !== 'approve') {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid action' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Connect to BSC
    const provider = new ethers.providers.JsonRpcProvider(BSC_RPC_URL);
    const wallet = new ethers.Wallet(bscPrivateKey, provider);
    
    console.log(`Wallet address: ${wallet.address}`);

    // Connect to CAMLY token contract
    const tokenContract = new ethers.Contract(camlyTokenAddress, ERC20_ABI, wallet);

    // Get token decimals
    const decimals = await tokenContract.decimals();
    console.log(`Token decimals: ${decimals}`);

    // Calculate amount with decimals (CAMLY amount * 10^decimals)
    const amountWithDecimals = ethers.utils.parseUnits(amount.toString(), decimals);
    
    console.log(`Sending ${amount} CAMLY (${amountWithDecimals.toString()} wei) to ${walletAddress}`);

    // Check wallet balance
    const balance = await tokenContract.balanceOf(wallet.address);
    console.log(`Wallet CAMLY balance: ${ethers.utils.formatUnits(balance, decimals)}`);

    if (balance.lt(amountWithDecimals)) {
      console.error('Insufficient CAMLY balance in sender wallet');
      return new Response(
        JSON.stringify({ success: false, error: 'Insufficient CAMLY balance in treasury' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send transaction
    const tx = await tokenContract.transfer(walletAddress, amountWithDecimals, {
      gasLimit: 100000,
    });

    console.log(`Transaction sent: ${tx.hash}`);

    // Wait for confirmation
    const receipt = await tx.wait();
    console.log(`Transaction confirmed in block ${receipt.blockNumber}`);

    // Update claim status in database
    const { error: updateError } = await supabase
      .from('reward_claims')
      .update({
        status: 'claimed',
        processed_at: new Date().toISOString(),
        tx_hash: tx.hash,
        admin_notes: `Approved and sent by admin. Block: ${receipt.blockNumber}`,
      })
      .eq('id', claimId);

    if (updateError) {
      console.error('Error updating claim:', updateError);
      // Transaction was successful, just log the DB error
    }

    // Deduct from user's camly_balance
    const { data: claimData } = await supabase
      .from('reward_claims')
      .select('user_id')
      .eq('id', claimId)
      .single();

    if (claimData) {
      const { error: balanceError } = await supabase
        .from('profiles')
        .update({ camly_balance: supabase.rpc('decrement', { x: amount }) })
        .eq('user_id', claimData.user_id);
      
      // Alternative: Direct SQL update
      await supabase.rpc('add_camly_reward', {
        p_user_id: claimData.user_id,
        p_action_type: 'withdrawal',
        p_amount: -amount,
        p_description: `Rút CAMLY thành công - TX: ${tx.hash.slice(0, 20)}...`
      });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        txHash: tx.hash,
        blockNumber: receipt.blockNumber 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error processing claim:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to process claim' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
