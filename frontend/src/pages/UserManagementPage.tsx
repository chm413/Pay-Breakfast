import { useEffect, useState } from 'react';
import { fetchUsers, updateUserStatus } from '../utils/api';

interface UserListItem {
  id: number;
  username: string;
  real_name?: string;
  roles?: { code: string }[];
  status?: number;
}

const mockUsers: UserListItem[] = [
  { id: 1, username: 'admin', real_name: '超级管理员', roles: [{ code: 'SUPER_ADMIN' }], status: 1 },
  { id: 2, username: 'teacher', real_name: '班主任', roles: [{ code: 'CLASS_FINANCE' }], status: 1 },
  { id: 3, username: 'student01', real_name: '学生甲', roles: [{ code: 'STUDENT' }], status: 1 },
];

export default function UserManagementPage() {
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = (await fetchUsers()) as { data: UserListItem[] };
        setUsers(res.data ?? []);
      } catch (err) {
        console.warn('Use mock users', err);
        setError('用户接口不可用，展示示例数据');
        setUsers(mockUsers);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function toggleUser(userId: number, enabled: boolean) {
    try {
      await updateUserStatus(userId, enabled);
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, status: enabled ? 1 : 0 } : u)));
    } catch (err) {
      console.error(err);
      setError('更新失败，请稍后再试');
    }
  }

  return (
    <div className="card">
      <div className="section-title">
        <h3>用户与角色</h3>
        {error && <span className="tag">{error}</span>}
      </div>
      {loading ? (
        <div>加载中...</div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>用户名</th>
              <th>姓名</th>
              <th>角色</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.username}</td>
                <td>{user.real_name}</td>
                <td>{user.roles?.map((r) => r.code).join(', ')}</td>
                <td>
                  <span className="badge" style={{ background: user.status === 1 ? '#dcfce7' : '#fee2e2', color: '#166534' }}>
                    {user.status === 1 ? '启用' : '禁用'}
                  </span>
                </td>
                <td>
                  <button
                    className="button-primary"
                    style={{ width: 'auto', background: user.status === 1 ? '#f43f5e' : '#22c55e' }}
                    onClick={() => toggleUser(user.id, user.status !== 1)}
                  >
                    {user.status === 1 ? '禁用' : '启用'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
