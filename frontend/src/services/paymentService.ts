import api from '@/lib/api';

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface BalanceData {
  balance: number;
}

export interface ChargeData {
  order_id: string;
  pay_url: string;
}

export interface Product {
  amount: number;
  credits: number;
  subject: string;
  product_code: string;
}

export interface Order {
  id: number;
  order_id: string;
  user_id: number;
  amount: number;
  credits: number;
  payment_method: string;
  pay_url: string;
  status: string;
  created_at: string;
  updated_at: string;
  paid_at?: string;
  expire_at?: string;
}

export const paymentService = {
  getProducts: async () => {
    return api.get<any, ApiResponse<Record<string, Product>>>('/payment/products');
  },

  getBalance: async () => {
    return api.get<any, ApiResponse<BalanceData>>('/account/balance');
  },

  charge: async (product_id: number, method: string = 'alipay') => {
    return api.post<any, ApiResponse<ChargeData>>('/payment/charge', {
      product_id,
      payment_method: method,
    });
  },

  verifyAlipayReturn: async (params: Record<string, string>) => {
    // Convert params object to query string
    const searchParams = new URLSearchParams(params);
    return api.get<any, ApiResponse<any>>(`/payment/return/alipay?${searchParams.toString()}`);
  },

  getOrders: async () => {
    return api.get<any, ApiResponse<Order[]>>('/orders');
  },

  cancelOrder: async (order_id: string) => {
    return api.post<any, ApiResponse<null>>(`/orders/${order_id}/cancel`, {});
  },
};
