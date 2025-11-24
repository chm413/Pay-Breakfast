import { Navigate, Route, Routes, NavLink } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import RechargeReviewPage from './pages/RechargeReviewPage';
import UserManagementPage from './pages/UserManagementPage';
import PersonalOrderPage from './pages/PersonalOrderPage';
import CategoryManagementPage from './pages/admin/CategoryManagementPage';
import ProductManagementPage from './pages/admin/ProductManagementPage';
import BatchOrderPage from './pages/admin/BatchOrderPage';
import AnnouncementPage from './pages/admin/AnnouncementPage';
import SystemStatusPage from './pages/admin/SystemStatusPage';
import VendorManagementPage from './pages/admin/VendorManagementPage';
import { useAuth } from './state/AuthContext';
import AdminGuard from './components/AdminGuard';
import AdminLayout from './layouts/AdminLayout';
import { isAdminRoleList } from './utils/roles';

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { token } = useAuth();
  if (!token) {
    return <LoginPage />;
  }
  return children;
}

function Shell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const isAdmin = isAdminRoleList(user?.roles);

  const navItems = [
    { to: '/', label: '仪表盘', icon: '📊' },
    { to: '/profile', label: '个人中心', icon: '👤' },
    { to: '/order', label: '我要下单', icon: '🧾' },
  ];

  return (
    <div className="container">
      <header className="hero" style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ maxWidth: 700 }}>
            <div className="chip" style={{ background: 'rgba(255,255,255,0.18)', color: '#fff', border: '1px solid rgba(255,255,255,0.35)' }}>
              <span role="img" aria-label="sparkle">
                ✨
              </span>
              鸿铭外卖服务平台
            </div>
            <h2 style={{ margin: '10px 0 6px' }}>每日早餐、资金安全，一站式管理</h2>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.9)', lineHeight: 1.6 }}>
              统一下单、充值审核、余额告警和报表统计，全部在同一工作台完成。RSA 保护登录凭据，SMTP 支持自助注册与找回密码。
            </p>
            <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
              <NavLink className="pill-button" to="/order">
                🛒 立即下单
              </NavLink>
              {isAdmin && (
                <NavLink className="pill-button secondary" to="/admin">
                  🚀 打开管理工作台
                </NavLink>
              )}
            </div>
          </div>
          <div className="glass" style={{ padding: 16, borderRadius: 16, minWidth: 240 }}>
            <div style={{ fontSize: 13, color: '#0ea5e9', fontWeight: 700 }}>当前用户</div>
            <div style={{ fontWeight: 800, fontSize: 22 }}>{user?.realName || '访客'}</div>
            <div style={{ color: '#e0f2fe', background: 'rgba(0,0,0,0.12)', padding: '6px 10px', borderRadius: 10, display: 'inline-flex', gap: 6 }}>
              {(user?.roles || []).join(' / ') || '未登录'}
            </div>
            <button className="pill-button" style={{ marginTop: 10, width: '100%' }} onClick={logout}>
              退出登录
            </button>
          </div>
        </div>
        <nav className="nav">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'}>
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main style={{ marginTop: 10 }}>{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/admin/*"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="users" replace />} />
        <Route path="users" element={<UserManagementPage />} />
        <Route path="recharges" element={<RechargeReviewPage />} />
        <Route path="announcements" element={<AnnouncementPage />} />
        <Route path="system" element={<SystemStatusPage />} />
        <Route path="vendors" element={<VendorManagementPage />} />
        <Route path="categories" element={<CategoryManagementPage />} />
        <Route path="products" element={<ProductManagementPage />} />
        <Route path="batch-order" element={<BatchOrderPage />} />
      </Route>

      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Shell>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/order" element={<PersonalOrderPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Shell>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
