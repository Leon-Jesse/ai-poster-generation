import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authService } from '@/services/authService';
import { paymentService, Order } from '@/services/paymentService';
import { useAuthStore } from '@/store/useAuthStore';
import { Loader2, Lock, ShoppingBag, User, CheckCircle, Clock, CreditCard, Mail } from 'lucide-react';

export default function Settings() {
  const { user } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'profile';

  const setActiveTab = (tab: string) => {
    setSearchParams({ tab });
  };
  
  // Password Change State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Orders State
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const fetchOrders = async () => {
    setOrdersLoading(true);
    try {
      const res = await paymentService.getOrders();
      if (res.code === 0) {
        setOrders(res.data);
      }
    } catch (error) {
      console.error("Failed to fetch orders", error);
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'orders') {
      fetchOrders();
    }
  }, [activeTab]);

  // ----- Order statistics (for orders tab) -----
  const totalOrders = orders.length;
  const paidStats = orders.reduce(
    (acc, order) => {
      if (order.status === 'paid') {
        acc.count += 1;
        acc.amount += order.amount || 0;
      }
      return acc;
    },
    { count: 0, amount: 0 }
  );

  const cancelledStats = orders.reduce(
    (acc, order) => {
      if (order.status === 'cancelled' || order.status === 'canceled') {
        acc.count += 1;
        acc.amount += order.amount || 0;
      }
      return acc;
    },
    { count: 0, amount: 0 }
  );

  const pendingStats = orders.reduce(
    (acc, order) => {
      if (order.status === 'pending') {
        acc.count += 1;
        acc.amount += order.amount || 0;
      }
      return acc;
    },
    { count: 0, amount: 0 }
  );

  // Credits stats based on paid orders and current balance
  const totalPaidCredits = orders.reduce((sum, order) => {
    if (order.status === 'paid') {
      return sum + (order.credits || 0);
    }
    return sum;
  }, 0);

  const remainingCredits = user?.balance ?? 0;
  const consumedCredits = Math.max(totalPaidCredits - remainingCredits, 0);

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    try {
      const res = await paymentService.cancelOrder(orderId);
      if (res.code === 0) {
        // Refresh orders
        fetchOrders();
      } else {
        alert(res.message || 'Failed to cancel order');
      }
    } catch (error: any) {
      alert(error.message || 'Failed to cancel order');
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: "New passwords don't match" });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: "Password must be at least 6 characters" });
      return;
    }

    try {
      setLoading(true);
      const res = await authService.changePassword({
        old_password: oldPassword,
        new_password: newPassword
      });

      if (res.code === 0) {
        setMessage({ type: 'success', text: "Password changed successfully" });
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setMessage({ type: 'error', text: res.message || "Failed to change password" });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || "An error occurred" });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-green-100 text-green-800 hover:bg-green-200">
            <CheckCircle className="mr-1 h-3 w-3" />
            Paid
          </span>
        );
      case 'pending':
        return null;
      default:
        return (
          <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-gray-100 text-gray-800 hover:bg-gray-200">
            {status}
          </span>
        );
    }
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
    }).format(cents / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getRemainingTime = (expireAt?: string) => {
    if (!expireAt) return null;
    const now = new Date().getTime();
    const expire = new Date(expireAt).getTime();
    const diff = expire - now;
    if (diff <= 0) return null;

    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  // Timer for countdown
  const [, setTick] = useState(0);
  useEffect(() => {
    if (activeTab === 'orders') {
      const timer = setInterval(() => {
        setTick(t => t + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [activeTab]);

  return (
    <div className="container py-10 min-h-screen">
      <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
        <aside className="-mx-4 lg:w-1/5">
          <nav className="flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1">
            <Button
              variant={activeTab === "profile" ? "secondary" : "ghost"}
              className="justify-start"
              onClick={() => setActiveTab("profile")}
            >
              <User className="mr-2 h-4 w-4" />
              Profile
            </Button>
            <Button
              variant={activeTab === "security" ? "secondary" : "ghost"}
              className="justify-start"
              onClick={() => setActiveTab("security")}
            >
              <Lock className="mr-2 h-4 w-4" />
              Security
            </Button>
            <Button
              variant={activeTab === "orders" ? "secondary" : "ghost"}
              className="justify-start"
              onClick={() => setActiveTab("orders")}
            >
              <ShoppingBag className="mr-2 h-4 w-4" />
              Orders
            </Button>
          </nav>
        </aside>
        
        <div className="flex-1 lg:max-w-2xl">
          {activeTab === "security" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium">Security</h3>
                <p className="text-sm text-muted-foreground">
                  Manage your account security and password.
                </p>
              </div>
              <div className="border-t" />
              
              <div className="rounded-xl border bg-card text-card-foreground shadow">
                <div className="flex flex-col space-y-1.5 p-6">
                  <h3 className="font-semibold leading-none tracking-tight">Change Password</h3>
                  <p className="text-sm text-muted-foreground">
                    Update your password to keep your account secure.
                  </p>
                </div>
                <form onSubmit={handlePasswordChange}>
                  <div className="p-6 pt-0 space-y-4">
                    {message && (
                      <div className={`p-3 rounded-md text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-destructive/15 text-destructive'}`}>
                        {message.text}
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="old-password">Current Password</Label>
                      <Input
                        id="old-password"
                        type="password"
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <Input
                        id="new-password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm New Password</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                    </div>
                  </div>
                  <div className="flex items-center p-6 pt-0">
                    <Button type="submit" disabled={loading}>
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Change Password
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {activeTab === "profile" && (
             <div className="space-y-6">
               <div>
                 <h3 className="text-lg font-medium">Profile</h3>
                 <p className="text-sm text-muted-foreground">
                   View your profile information.
                 </p>
               </div>
               <div className="border-t" />
               
               <div className="rounded-xl border bg-card text-card-foreground shadow">
                <div className="flex flex-col space-y-1.5 p-6">
                  <h3 className="font-semibold leading-none tracking-tight">Personal Information</h3>
                </div>
                <div className="p-6 pt-0 space-y-4">
                  <div className="space-y-2">
                    <Label>Email Address</Label>
                    <div className="flex items-center space-x-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{user?.email}</span>
                    </div>
                  </div>
                </div>
               </div>
             </div>
          )}

          {activeTab === "orders" && (
             <div className="space-y-6">
               <div>
                 <h3 className="text-lg font-medium">Order History</h3>
                 <p className="text-sm text-muted-foreground">
                  View your past transactions and orders.
                 </p>
                 {orders.length > 0 && (
                   <div className="mt-2 text-xs text-muted-foreground space-y-1">
                     <p>
                       共 <span className="font-semibold text-foreground">{totalOrders}</span> 笔订单。
                     </p>
                     <p>
                       购买成功：<span className="font-semibold text-emerald-600">{paidStats.count}</span> 笔，
                       金额合计 <span className="font-semibold text-emerald-600">{formatCurrency(paidStats.amount)}</span>；
                       待支付：<span className="font-semibold">{pendingStats.count}</span> 笔，
                       金额合计 <span className="font-semibold">{formatCurrency(pendingStats.amount)}</span>；
                       已取消：<span className="font-semibold text-red-500">{cancelledStats.count}</span> 笔，
                       金额合计 <span className="font-semibold text-red-500">{formatCurrency(cancelledStats.amount)}</span>。
                      </p>
                      <p>
                        Credits 统计：总购买 <span className="font-semibold text-foreground">{totalPaidCredits}</span>，
                        已消费 <span className="font-semibold text-amber-600">{consumedCredits}</span>，
                        当前剩余 <span className="font-semibold text-emerald-600">{remainingCredits}</span>。
                     </p>
                   </div>
                 )}
               </div>
               <div className="border-t" />
               
               {ordersLoading ? (
                 <div className="flex justify-center py-8">
                   <Loader2 className="h-8 w-8 animate-spin text-primary" />
                 </div>
               ) : orders.length === 0 ? (
                 <div className="text-center py-8 text-muted-foreground">
                   No orders found.
                 </div>
               ) : (
                 <div className="space-y-4">
                   {orders.map((order) => (
                     <div key={order.id} className="rounded-lg border bg-card text-card-foreground shadow-sm p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="bg-primary/10 p-2 rounded-full mt-1">
                            <CreditCard className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium">
                              {order.credits} Credits Recharge
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Order ID: {order.order_id}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {formatDate(order.created_at)}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col md:items-end gap-2">
                          <div className="font-bold text-lg">
                            {formatCurrency(order.amount)}
                          </div>
                          <div>
                            {getStatusBadge(order.status)}
                          </div>
                          {order.status === 'pending' && (
                            <div className="flex flex-col gap-2 items-end">
                              <div className="flex items-center gap-2">
                                {order.pay_url && (
                                  <a href={order.pay_url} target="_blank" rel="noopener noreferrer">
                                    <Button size="sm" variant="outline" className="h-7 text-xs">
                                      Pay Now
                                    </Button>
                                  </a>
                                )}
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="h-7 text-xs text-destructive hover:text-destructive/90 hover:bg-destructive/10 border-destructive/20"
                                  onClick={() => handleCancelOrder(order.order_id)}
                                >
                                  Cancel
                                </Button>
                              </div>
                              {getRemainingTime(order.expire_at) && (
                                <div className="text-xs text-muted-foreground flex items-center">
                                  <Clock className="h-3 w-3 mr-1" />
                                  Expires in {getRemainingTime(order.expire_at)}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                     </div>
                   ))}
                 </div>
               )}
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
