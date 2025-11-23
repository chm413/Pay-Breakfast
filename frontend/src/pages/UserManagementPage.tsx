import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../state/AuthContext';
import { ADMIN_ROLE_OPTIONS, isAdminRoleList } from '../utils/roles';
import {
  adminCreateUser,
  createUserTransaction,
  deleteUserTransaction,
  fetchUserTransactions,
  fetchUsers,
  updateUserPassword,
  updateUserProfile,
  updateUserTransaction,
  updateUserStatus,
} from '../utils/api';

interface UserListItem {
  id: number;
  username: string;
  real_name?: string;
  realName?: string;
  roles?: { code: string }[] | string[];
  status?: number;
  email?: string;
  balance?: number;
  credit_limit?: number;
  creditLimit?: number;
}

export default function UserManagementPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [noPermission, setNoPermission] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    username: '',
    realName: '',
    email: '',
    role: 'MEMBER',
    initialBalance: 0,
    creditLimit: 30,
    classOrDorm: '',
  });
  const [createdPassword, setCreatedPassword] = useState<string | null>(null);
  const [activeUser, setActiveUser] = useState<UserListItem | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [txForm, setTxForm] = useState({ type: 'CONSUME', amount: 0, remark: '' });
  const [profileForm, setProfileForm] = useState({ email: '', qq: '', classOrDorm: '' });
  const [passwordForm, setPasswordForm] = useState('');

  const isAdmin = useMemo(() => isAdminRoleList(currentUser?.roles), [currentUser]);

  const loadUsers = async () => {
    try {
      const res = (await fetchUsers()) as { data?: UserListItem[] } | UserListItem[];
      const list = Array.isArray(res) ? res : res.data || [];
      setUsers(list);
      setError('');
      setNoPermission(false);
    } catch (err: any) {
      const message = err?.message || '加载用户失败';
      setError(message);
      if (message.includes('403')) {
        setNoPermission(true);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  async function toggleUser(userId: number, enabled: boolean) {
    try {
      await updateUserStatus(userId, enabled);
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, status: enabled ? 1 : 0 } : u)));
      setError('');
    } catch (err: any) {
      setError(err?.message || '更新失败，请稍后再试');
    }
  }

  async function openDetails(user: UserListItem) {
    setActiveUser(user);
    setProfileForm({ email: user.email || '', qq: (user as any).qq || '', classOrDorm: (user as any).classOrDorm || '' });
    try {
      const txList = (await fetchUserTransactions(user.id)) as any[];
      setTransactions(txList);
    } catch (err: any) {
      setError(err?.message || '加载交易记录失败');
    }
  }

  async function saveProfile() {
    if (!activeUser) return;
    try {
      await updateUserProfile(activeUser.id, profileForm);
      await loadUsers();
    } catch (err: any) {
      setError(err?.message || '更新用户资料失败');
    }
  }

  async function savePassword() {
    if (!activeUser) return;
    if (!passwordForm.trim()) return;
    await updateUserPassword(activeUser.id, passwordForm.trim());
    setPasswordForm('');
  }

  async function addTransaction() {
    if (!activeUser) return;
    await createUserTransaction(activeUser.id, {
      type: txForm.type,
      amount: Number(txForm.amount),
      remark: txForm.remark,
    });
    const txList = (await fetchUserTransactions(activeUser.id)) as any[];
    setTransactions(txList);
    await loadUsers();
  }

  async function updateTx(txId: number, amount: number, type: string, remark: string) {
    await updateUserTransaction(txId, { amount, type, remark });
    if (activeUser) {
      const txList = (await fetchUserTransactions(activeUser.id)) as any[];
      setTransactions(txList);
      await loadUsers();
    }
  }

  async function deleteTx(txId: number) {
    if (!activeUser) return;
    await deleteUserTransaction(txId);
    const txList = (await fetchUserTransactions(activeUser.id)) as any[];
    setTransactions(txList);
    await loadUsers();
  }

  async function handleCreate() {
    if (!createForm.username.trim() || !createForm.realName.trim()) {
      setError('请填写用户名和姓名');
      return;
    }
    setCreating(true);
    try {
      const res = await adminCreateUser({
        username: createForm.username.trim(),
        realName: createForm.realName.trim(),
        email: createForm.email.trim(),
        role: createForm.role as any,
        initialBalance: Number(createForm.initialBalance) || 0,
        creditLimit: Number(createForm.creditLimit) || 0,
        classOrDorm: createForm.classOrDorm || undefined,
      });
      setCreatedPassword(res.initialPassword);
      setShowCreate(false);
      setCreateForm({ username: '', realName: '', email: '', role: 'MEMBER', initialBalance: 0, creditLimit: 30, classOrDorm: '' });
      const refreshed = (await fetchUsers()) as { data?: UserListItem[] } | UserListItem[];
      const list = Array.isArray(refreshed) ? refreshed : refreshed.data || [];
      setUsers(list);
      setError('');
    } catch (err: any) {
      setError(err?.message || '创建用户失败');
    } finally {
      setCreating(false);
    }
  }

  const roleLabels = (roles?: UserListItem['roles']) => {
    if (!roles) return '';
    if (Array.isArray(roles) && typeof roles[0] === 'string') return (roles as string[]).join(', ');
    return (roles as { code: string }[]).map((r) => r.code).join(', ');
  };

  return (
    <div className="card">
      <div className="section-title" style={{ alignItems: 'center' }}>
        <div>
          <h3>用户与角色</h3>
          <p className="muted">敏感字段仅管理员可见，接口返回 403 时将提示无权限。</p>
        </div>
        {isAdmin && (
          <button className="button-primary" onClick={() => setShowCreate(true)}>
            手动创建用户
          </button>
        )}
      </div>
      {noPermission && (
        <div style={{ background: '#fee2e2', border: '1px solid #fecdd3', color: '#b91c1c', padding: 12, borderRadius: 8 }}>
          你没有权限查看此页面，已记录本次访问。
        </div>
      )}
      {error && <div style={{ color: '#b91c1c', margin: '8px 0' }}>{error}</div>}
      {createdPassword && (
        <div style={{ background: '#ecfeff', border: '1px solid #bae6fd', padding: 10, borderRadius: 8, marginBottom: 8 }}>
          账户已创建，初始密码：<strong>{createdPassword}</strong>
        </div>
      )}
      {loading ? (
        <div>加载中...</div>
      ) : noPermission ? null : (
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>用户名</th>
              <th>姓名</th>
              {isAdmin && <th>邮箱</th>}
              <th>角色</th>
              {isAdmin && <th>余额</th>}
              {isAdmin && <th>透支额度</th>}
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.username}</td>
                <td>{user.real_name || user.realName}</td>
                {isAdmin && <td>{user.email || '-'}</td>}
                <td>{roleLabels(user.roles)}</td>
                {isAdmin && <td>{user.balance != null ? Number(user.balance).toFixed(2) : '-'}</td>}
                {isAdmin && <td>{(user.credit_limit ?? user.creditLimit ?? null) != null ? Number(user.credit_limit ?? user.creditLimit).toFixed(2) : '-'}</td>}
                <td>
                  <span
                    className="badge"
                    style={{ background: user.status === 1 ? '#dcfce7' : '#fee2e2', color: '#166534' }}
                  >
                    {user.status === 1 ? '启用' : '禁用'}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <button
                      className="button-primary"
                      style={{ width: 'auto', background: user.status === 1 ? '#f43f5e' : '#22c55e' }}
                      onClick={() => toggleUser(user.id, user.status !== 1)}
                      disabled={!isAdmin}
                    >
                      {user.status === 1 ? '禁用' : '启用'}
                    </button>
                    {isAdmin && (
                      <button className="button-secondary" onClick={() => openDetails(user)}>
                        详情 / 流水
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showCreate && (
        <div className="card" style={{ marginTop: 12, border: '1px solid #e2e8f0' }}>
          <div className="section-title">
            <h4>手动创建用户</h4>
            <button className="button-secondary" onClick={() => setShowCreate(false)}>
              关闭
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            <label>
              <div>用户名</div>
              <input
                className="input"
                value={createForm.username}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, username: e.target.value }))}
                placeholder="登录名"
              />
            </label>
            <label>
              <div>姓名</div>
              <input
                className="input"
                value={createForm.realName}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, realName: e.target.value }))}
                placeholder="真实姓名"
              />
            </label>
            <label>
              <div>邮箱</div>
              <input
                className="input"
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="可选"
              />
            </label>
            <label>
              <div>角色</div>
              <select
                className="input"
                value={createForm.role}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, role: e.target.value }))}
              >
                {ADMIN_ROLE_OPTIONS.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
                <option value="MEMBER">MEMBER</option>
              </select>
            </label>
            <label>
              <div>初始余额</div>
              <input
                className="input"
                type="number"
                value={createForm.initialBalance}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, initialBalance: Number(e.target.value) }))}
              />
            </label>
            <label>
              <div>透支额度</div>
              <input
                className="input"
                type="number"
                value={createForm.creditLimit}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, creditLimit: Number(e.target.value) }))}
              />
            </label>
            <label>
              <div>班级/宿舍</div>
              <input
                className="input"
                value={createForm.classOrDorm}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, classOrDorm: e.target.value }))}
                placeholder="如 高二4/宿舍A"
              />
            </label>
          </div>
          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <button className="button-primary" onClick={handleCreate} disabled={creating}>
              {creating ? '创建中...' : '创建并返回初始密码'}
            </button>
            <button className="button-secondary" onClick={() => setShowCreate(false)}>
              取消
            </button>
          </div>
        </div>
      )}

      {activeUser && (
        <div className="card" style={{ marginTop: 12 }}>
          <div className="section-title" style={{ justifyContent: 'space-between' }}>
            <div>
              <h4>用户详情：{activeUser.real_name || activeUser.realName}</h4>
              <p className="muted">修改邮箱/QQ/班级，并可手动补充交易，修改后自动重算余额。</p>
            </div>
            <button className="button-secondary" onClick={() => setActiveUser(null)}>
              关闭
            </button>
          </div>

          <div className="grid" style={{ gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
            <div className="card">
              <h5>资料</h5>
              <label>
                <div>邮箱</div>
                <input className="input" value={profileForm.email} onChange={(e) => setProfileForm((p) => ({ ...p, email: e.target.value }))} />
              </label>
              <label>
                <div>QQ</div>
                <input className="input" value={profileForm.qq} onChange={(e) => setProfileForm((p) => ({ ...p, qq: e.target.value }))} />
              </label>
              <label>
                <div>班级/宿舍</div>
                <input
                  className="input"
                  value={profileForm.classOrDorm}
                  onChange={(e) => setProfileForm((p) => ({ ...p, classOrDorm: e.target.value }))}
                />
              </label>
              <button className="button-primary" style={{ marginTop: 8 }} onClick={saveProfile}>
                保存资料
              </button>

              <div style={{ marginTop: 14 }}>
                <div>重置密码</div>
                <input className="input" value={passwordForm} onChange={(e) => setPasswordForm(e.target.value)} placeholder="输入新密码" />
                <button className="button-secondary" style={{ marginTop: 6 }} onClick={savePassword}>
                  重置密码
                </button>
              </div>
            </div>

            <div className="card">
              <h5>新增交易</h5>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: 10 }}>
                <label>
                  <div>类型</div>
                  <select className="input" value={txForm.type} onChange={(e) => setTxForm((p) => ({ ...p, type: e.target.value }))}>
                    <option value="CONSUME">支出</option>
                    <option value="RECHARGE">充值</option>
                    <option value="ADJUST">调整</option>
                  </select>
                </label>
                <label>
                  <div>金额</div>
                  <input
                    className="input"
                    type="number"
                    step="0.01"
                    value={txForm.amount}
                    onChange={(e) => setTxForm((p) => ({ ...p, amount: Number(e.target.value) }))}
                  />
                </label>
                <label>
                  <div>备注</div>
                  <input className="input" value={txForm.remark} onChange={(e) => setTxForm((p) => ({ ...p, remark: e.target.value }))} />
                </label>
              </div>
              <button className="button-primary" style={{ marginTop: 8 }} onClick={addTransaction}>
                记录交易并重算余额
              </button>
            </div>

            <div className="card" style={{ gridColumn: '1 / -1' }}>
              <div className="section-title" style={{ justifyContent: 'space-between' }}>
                <h5>交易记录</h5>
              </div>
              {transactions.length === 0 ? (
                <div className="muted">暂无交易</div>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>类型</th>
                      <th>金额</th>
                      <th>方向</th>
                      <th>备注</th>
                      <th>时间</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => (
                      <tr key={tx.id}>
                        <td>{tx.id}</td>
                        <td>{tx.type}</td>
                        <td>¥ {Number(tx.amount).toFixed(2)}</td>
                        <td>{tx.direction === -1 ? '支出' : '收入'}</td>
                        <td>{tx.description || '-'}</td>
                        <td>{tx.createdAt ? new Date(tx.createdAt).toLocaleString() : ''}</td>
                        <td style={{ display: 'flex', gap: 6 }}>
                          <button
                            className="button-secondary"
                            onClick={() => {
                              const amount = Number(prompt('输入新金额', tx.amount) || tx.amount);
                              const type = prompt('类型', tx.type) || tx.type;
                              const remark = prompt('备注', tx.description || '') || tx.description || '';
                              updateTx(tx.id, amount, type, remark);
                            }}
                          >
                            修改
                          </button>
                          <button className="button-primary" style={{ background: '#f43f5e' }} onClick={() => deleteTx(tx.id)}>
                            删除
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
