import { FormEvent, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { login } from '../utils/api';
import { useAuth } from '../state/AuthContext';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login: saveLogin } = useAuth();

  const from = (location.state as { from?: Location })?.from?.pathname || '/';

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await login(username, password);
      saveLogin({ token: res.accessToken, user: res.userInfo });
      navigate(from, { replace: true });
    } catch (err) {
      console.error(err);
      setError('登录失败，请检查账号或密码');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container" style={{ maxWidth: 480 }}>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0 }}>欢迎登录</h2>
            <p style={{ color: '#475569', margin: '4px 0 0' }}>校园早餐账户平台</p>
          </div>
          <div className="badge">安全认证</div>
        </div>
        <form onSubmit={handleSubmit} style={{ marginTop: 18 }}>
          <label>
            <div>用户名 / 学号</div>
            <input className="input" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="请输入账号" />
          </label>
          <label>
            <div>密码</div>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
            />
          </label>
          {error && <div style={{ color: '#e11d48', margin: '8px 0' }}>{error}</div>}
          <button className="button-primary" type="submit" disabled={loading}>
            {loading ? '登录中...' : '立即登录'}
          </button>
        </form>
        <div style={{ marginTop: 16, color: '#475569', fontSize: 13 }}>
          默认演示账号：<br />
          管理员 admin / 123456 &nbsp;|&nbsp; 班主任 teacher / 123456
        </div>
      </div>
    </div>
  );
}
