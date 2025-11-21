export interface UserProfile {
  id: number;
  username: string;
  realName: string;
  roles: string[];
  gradeName?: string;
  className?: string;
}

export interface RechargeRequestItem {
  id: number;
  studentName: string;
  amount: number;
  payMethod: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface DashboardSummary {
  totalBalance: number;
  lowBalanceCount: number;
  todayOrders: number;
  pendingRecharges: number;
}

export interface PublicHighlights {
  windowDays: number;
  since: string;
  totalOrdersLast7Days: number;
  totalAmountLast7Days: number;
  averageDailyOrders: number;
  topProducts: { productId: number; orders: number; amount: number }[];
  updatedAt: string;
}
