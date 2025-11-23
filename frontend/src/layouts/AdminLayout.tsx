import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../state/AuthContext';
import AdminGuard from '../components/AdminGuard';

const adminNav = [
  { to: '/admin/users', label: '用户管理', icon: '🧑‍💼' },
  { to: '/admin/recharges', label: '充值审核', icon: '💳' },
  { to: '/admin/announcements', label: '公告管理', icon: '📢' },
  { to: '/admin/system', label: '系统状态', icon: '🖥️' },
  { to: '/admin/vendors', label: '店家与日结', icon: '🏪' },
  { to: '/admin/categories', label: '早餐分类', icon: '🍱' },
  { to: '/admin/products', label: '早餐商品', icon: '🛒' },
  { to: '/admin/batch-order', label: '批量下单', icon: '📦' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <AdminGuard>
      <div className="admin-shell">
        <aside className="admin-nav">
          <div className="admin-brand" onClick={() => navigate('/')}>鸿铭外卖管理台</div>
          <div className="admin-user">{user?.realName}</div>
          {adminNav.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? 'admin-link active' : 'admin-link')}>
              <span className="admin-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
          <button className="pill-button" style={{ marginTop: 'auto' }} onClick={logout}>
            退出登录
          </button>
        </aside>
        <main className="admin-main">
          <header className="admin-header">
            <div>管理面板</div>
            <div style={{ fontSize: 13, color: '#475569' }}>仅管理员可见的操作与审核</div>
          </header>
          <div className="admin-content">
            <Outlet />
          </div>
        </main>
      </div>
    </AdminGuard>
  );
}
