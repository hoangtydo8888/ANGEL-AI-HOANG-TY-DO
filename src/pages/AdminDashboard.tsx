import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Send,
  ArrowLeft,
  RefreshCw,
  Coins,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { supabase } from '@/integrations/supabase/client';

interface ClaimRequest {
  id: string;
  user_id: string;
  wallet_address: string;
  camly_amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'claimed';
  created_at: string;
  processed_at: string | null;
  tx_hash: string | null;
  admin_notes: string | null;
  user_email?: string;
}

interface UserProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  camly_balance: number;
  total_messages: number;
  created_at: string;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { isAdmin, isLoading } = useAdminAuth();
  const [claims, setClaims] = useState<ClaimRequest[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      toast({
        title: "Truy cập bị từ chối",
        description: "Bạn không có quyền admin.",
        variant: "destructive",
      });
      navigate('/app');
    }
  }, [isAdmin, isLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  const fetchData = async () => {
    setIsLoadingData(true);
    try {
      // Fetch all claims
      const { data: claimsData, error: claimsError } = await supabase
        .from('reward_claims')
        .select('*')
        .order('created_at', { ascending: false });

      if (claimsError) throw claimsError;
      setClaims(claimsData || []);

      // Fetch all users
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('*')
        .order('camly_balance', { ascending: false });

      if (usersError) throw usersError;
      setUsers(usersData || []);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast({
        title: "Lỗi",
        description: "Không thể tải dữ liệu admin.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleApproveClaim = async (claim: ClaimRequest) => {
    setProcessingId(claim.id);
    try {
      // Call edge function to process the claim and send tokens
      const { data, error } = await supabase.functions.invoke('process-camly-claim', {
        body: {
          claimId: claim.id,
          action: 'approve',
          walletAddress: claim.wallet_address,
          amount: claim.camly_amount,
        },
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "✅ Đã phê duyệt!",
          description: `Đã gửi ${claim.camly_amount.toLocaleString()} CAMLY đến ${claim.wallet_address.slice(0, 10)}...`,
        });
        fetchData();
      } else {
        throw new Error(data.error || 'Có lỗi xảy ra');
      }
    } catch (error: any) {
      console.error('Error approving claim:', error);
      toast({
        title: "Lỗi phê duyệt",
        description: error.message || "Không thể phê duyệt yêu cầu.",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectClaim = async (claim: ClaimRequest) => {
    setProcessingId(claim.id);
    try {
      const { error } = await supabase
        .from('reward_claims')
        .update({
          status: 'rejected',
          processed_at: new Date().toISOString(),
          admin_notes: 'Rejected by admin',
        })
        .eq('id', claim.id);

      if (error) throw error;

      toast({
        title: "❌ Đã từ chối",
        description: "Yêu cầu đã bị từ chối.",
      });
      fetchData();
    } catch (error: any) {
      console.error('Error rejecting claim:', error);
      toast({
        title: "Lỗi",
        description: "Không thể từ chối yêu cầu.",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50"><Clock className="w-3 h-3 mr-1" /> Chờ duyệt</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/50"><CheckCircle className="w-3 h-3 mr-1" /> Đã duyệt</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-500/20 text-red-400 border-red-500/50"><XCircle className="w-3 h-3 mr-1" /> Từ chối</Badge>;
      case 'claimed':
        return <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/50"><Send className="w-3 h-3 mr-1" /> Đã chuyển</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Shield className="w-12 h-12 text-primary" />
        </motion.div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const pendingClaims = claims.filter(c => c.status === 'pending');
  const totalPendingAmount = pendingClaims.reduce((acc, c) => acc + c.camly_amount, 0);
  const totalUsers = users.length;
  const totalCamlyDistributed = users.reduce((acc, u) => acc + u.camly_balance, 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/app')}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Admin Dashboard</h1>
                <p className="text-sm text-muted-foreground">Quản lý CAMLY Claims</p>
              </div>
            </div>
          </div>
          <Button onClick={fetchData} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Làm mới
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="w-4 h-4" /> Đang chờ duyệt
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-400">{pendingClaims.length}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Coins className="w-4 h-4" /> CAMLY chờ duyệt
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-400">{totalPendingAmount.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="w-4 h-4" /> Tổng người dùng
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-400">{totalUsers}</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Coins className="w-4 h-4" /> Tổng CAMLY phát
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">{totalCamlyDistributed.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="claims" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="claims">
              <Clock className="w-4 h-4 mr-2" />
              Yêu cầu Claims ({claims.length})
            </TabsTrigger>
            <TabsTrigger value="users">
              <Users className="w-4 h-4 mr-2" />
              Người dùng ({users.length})
            </TabsTrigger>
          </TabsList>

          {/* Claims Tab */}
          <TabsContent value="claims">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-400" />
                  Yêu cầu rút CAMLY
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingData ? (
                  <div className="flex justify-center py-8">
                    <RefreshCw className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : claims.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Chưa có yêu cầu nào
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User ID</TableHead>
                        <TableHead>Ví</TableHead>
                        <TableHead>Số lượng</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead>Ngày tạo</TableHead>
                        <TableHead>Tx Hash</TableHead>
                        <TableHead className="text-right">Hành động</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {claims.map((claim) => (
                        <TableRow key={claim.id}>
                          <TableCell className="font-mono text-xs">
                            {claim.user_id.slice(0, 8)}...
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {claim.wallet_address.slice(0, 10)}...{claim.wallet_address.slice(-6)}
                          </TableCell>
                          <TableCell className="font-bold text-primary">
                            {claim.camly_amount.toLocaleString()} CAMLY
                          </TableCell>
                          <TableCell>{getStatusBadge(claim.status)}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(claim.created_at).toLocaleDateString('vi-VN')}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {claim.tx_hash ? (
                              <a 
                                href={`https://bscscan.com/tx/${claim.tx_hash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:underline"
                              >
                                {claim.tx_hash.slice(0, 10)}...
                              </a>
                            ) : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            {claim.status === 'pending' && (
                              <div className="flex gap-2 justify-end">
                                <Button
                                  size="sm"
                                  onClick={() => handleApproveClaim(claim)}
                                  disabled={processingId === claim.id}
                                  className="bg-green-500 hover:bg-green-600"
                                >
                                  {processingId === claim.id ? (
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <CheckCircle className="w-4 h-4" />
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleRejectClaim(claim)}
                                  disabled={processingId === claim.id}
                                >
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-400" />
                  Danh sách người dùng
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingData ? (
                  <div className="flex justify-center py-8">
                    <RefreshCw className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : users.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Chưa có người dùng nào
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User ID</TableHead>
                        <TableHead>Tên hiển thị</TableHead>
                        <TableHead>CAMLY Balance</TableHead>
                        <TableHead>Tin nhắn</TableHead>
                        <TableHead>Ngày tham gia</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-mono text-xs">
                            {user.user_id.slice(0, 8)}...
                          </TableCell>
                          <TableCell>{user.display_name || 'N/A'}</TableCell>
                          <TableCell className="font-bold text-primary">
                            {user.camly_balance.toLocaleString()} CAMLY
                          </TableCell>
                          <TableCell>{user.total_messages}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(user.created_at).toLocaleDateString('vi-VN')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
