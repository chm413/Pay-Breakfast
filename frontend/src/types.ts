export interface UserProfile {
  id: number;
  username: string;
  realName: string;
  roles: string[];
  gradeName?: string;
  className?: string;
}

export interface BreakfastCategory {
  id: number;
  name: string;
  sortOrder: number;
  enabled: boolean;
}

export interface BreakfastProduct {
  id: number;
  categoryId: number;
  categoryName?: string;
  vendorId?: number;
  vendorName?: string;
  name: string;
  price: number;
  unit: string;
  enabled: boolean;
  isDeleted?: boolean;
  remark?: string | null;
}

export interface RechargeRequestItem {
  id: number;
  studentName: string;
  amount: number;
  payMethod: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  reviewerName?: string;
  reviewTime?: string;
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

export interface Announcement {
  id: number;
  title: string;
  contentMd: string;
  showOnLogin: boolean;
  enabled: boolean;
  createdAt: string;
}

export interface SystemStatus {
  backendVersion: string;
  frontendVersion: string;
  uptimeSeconds: number;
  totalUsers: number;
  totalCompletedOrders: number;
  totalAmount: number;
}

export interface Vendor {
  id: number;
  name: string;
  enabled: boolean;
  remark?: string;
}

export interface VendorSettlement {
  id: number;
  date: string;
  ordersCount: number;
  totalAmount: number;
  categoryId?: number | null;
  categoryName?: string | null;
}
