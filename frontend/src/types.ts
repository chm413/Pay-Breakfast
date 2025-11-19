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
