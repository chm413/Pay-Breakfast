import { Navigate, Route, Routes, useLocation, NavLink } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import RechargeReviewPage from './pages/RechargeReviewPage';
import UserManagementPage from './pages/UserManagementPage';
import PersonalOrderPage from './pages/PersonalOrderPage';
import CategoryManagementPage from './pages/admin/CategoryManagementPage';
import ProductManagementPage from './pages/admin/ProductManagementPage';
import BatchOrderPage from './pages/admin/BatchOrderPage';
import { useAuth } from './state/AuthContext';
import AdminGuard from './components/AdminGuard';

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { token } = useAuth();
  const location = useLocation();
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}

function Shell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const isAdmin = user?.roles?.includes('ADMIN') || user?.roles?.includes('MANAGER');
  return (
    <div className="container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: 0 }}>鸿铭外卖服务平台</h2>
          <p style={{ margin: 0, color: '#64748b' }}>个人余额、班级批量下单、充值审核一站式管理</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 700 }}>{user?.realName || '访客'}</div>
          <div style={{ color: '#475569', fontSize: 13 }}>{user?.roles.join(' / ')}</div>
          <button style={{ marginTop: 6 }} className="button-primary" onClick={logout}>
            退出登录
          </button>
        </div>
      </header>
      <nav className="nav">
        <NavLink to="/" end>
          仪表盘
        </NavLink>
        <NavLink to="/profile">个人中心</NavLink>
        <NavLink to="/order">我要下单</NavLink>
        {isAdmin && <NavLink to="/recharges">充值审核</NavLink>}
        {isAdmin && <NavLink to="/users">用户管理</NavLink>}
        {isAdmin && <NavLink to="/admin/categories">早餐分类管理</NavLink>}
        {isAdmin && <NavLink to="/admin/products">早餐商品管理</NavLink>}
        {isAdmin && <NavLink to="/admin/batch-order">批量下单</NavLink>}
      </nav>
      <main style={{ marginTop: 18 }}>{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Shell>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/order" element={<PersonalOrderPage />} />
                <Route
                  path="/recharges"
                  element={
                    <AdminGuard>
                      <RechargeReviewPage />
                    </AdminGuard>
                  }
                />
                <Route
                  path="/users"
                  element={
                    <AdminGuard>
                      <UserManagementPage />
                    </AdminGuard>
                  }
                />
                <Route
                  path="/admin/categories"
                  element={
                    <AdminGuard>
                      <CategoryManagementPage />
                    </AdminGuard>
                  }
                />
                <Route
                  path="/admin/products"
                  element={
                    <AdminGuard>
                      <ProductManagementPage />
                    </AdminGuard>
                  }
                />
                <Route
                  path="/admin/batch-order"
                  element={
                    <AdminGuard>
                      <BatchOrderPage />
                    </AdminGuard>
                  }
                />
              </Routes>
            </Shell>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
