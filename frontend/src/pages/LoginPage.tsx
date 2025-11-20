import { FormEvent, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { login, registerUser, requestPasswordReset, resetPassword } from '../utils/api';
import { useAuth } from '../state/AuthContext';

type Mode = 'login' | 'register' | 'reset';

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [realName, setRealName] = useState('');
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [info, setInfo] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login: saveLogin } = useAuth();

  const from = (location.state as { from?: Location })?.from?.pathname || '/';

  function switchMode(next: Mode) {
    setMode(next);
    setError('');
    setInfo('');
    setLoading(false);
  }

  async function handleResetRequest() {
    if (!email) {
      setError('请填写邮箱以接收重置口令');
      return;
    }
    setLoading(true);
    setError('');
    setInfo('');
    try {
      await requestPasswordReset(email);
      setInfo('已发送重置口令，请查收邮箱或查看日志输出');
    } catch (err) {
      console.error(err);
      setError('发送失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setInfo('');
    try {
      if (mode === 'login') {
        const res = await login(username, password);
        saveLogin({ token: res.accessToken, user: res.userInfo });
        navigate(from, { replace: true });
      } else if (mode === 'register') {
        const res = await registerUser({ username, password, realName, email });
        saveLogin({ token: res.accessToken, user: res.userInfo });
        setInfo('注册成功，已为您自动登录');
        navigate('/', { replace: true });
      } else {
        await resetPassword(resetToken, newPassword);
        setInfo('密码已重置，请使用新密码登录');
        setMode('login');
      }
    } catch (err) {
      console.error(err);
      setError(mode === 'register' ? '注册失败，请检查信息是否完整或账号是否已存在' : '操作失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container" style={{ maxWidth: 480 }}>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0 }}>欢迎使用</h2>
            <p style={{ color: '#475569', margin: '4px 0 0' }}>鸿铭外卖服务平台</p>
          </div>
          <div className="badge">安全认证</div>
        </div>
        <div className="auth-switch" style={{ marginTop: 14 }}>
          <button className={mode === 'login' ? 'pill active' : 'pill'} type="button" onClick={() => switchMode('login')}>
            登录
          </button>
          <button className={mode === 'register' ? 'pill active' : 'pill'} type="button" onClick={() => switchMode('register')}>
            注册
          </button>
          <button className={mode === 'reset' ? 'pill active' : 'pill'} type="button" onClick={() => switchMode('reset')}>
            重置密码
          </button>
        </div>
        <form onSubmit={handleSubmit} style={{ marginTop: 18 }}>
          <label>
            <div>{mode === 'register' ? '用户名（登录名）' : '用户名 / 学号'}</div>
            <input
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={mode === 'register' ? '请输入登录名' : '请输入账号'}
              required
            />
          </label>

          {mode === 'register' && (
            <label>
              <div>真实姓名</div>
              <input className="input" value={realName} onChange={(e) => setRealName(e.target.value)} placeholder="请填写姓名" required />
            </label>
          )}

          {mode !== 'login' && (
            <label>
              <div>邮箱</div>
              <input
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="用于接收验证码或通知"
                required
              />
            </label>
          )}

          {mode !== 'reset' && (
            <label>
              <div>密码</div>
              <input
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                required
              />
            </label>
          )}

          {mode === 'reset' && (
            <>
              <label>
                <div>重置口令 / Token</div>
                <input
                  className="input"
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  placeholder="请输入邮件收到的口令"
                  required
                />
              </label>
              <label>
                <div>新密码</div>
                <input
                  className="input"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="请输入新密码"
                  required
                />
              </label>
            </>
          )}

          {error && <div style={{ color: '#e11d48', margin: '8px 0' }}>{error}</div>}
          {info && <div style={{ color: '#047857', margin: '8px 0' }}>{info}</div>}

          {mode === 'reset' && (
            <button type="button" className="button-secondary" onClick={handleResetRequest} disabled={loading}>
              发送重置口令到邮箱
            </button>
          )}

          <button className="button-primary" type="submit" disabled={loading} style={{ marginTop: 10 }}>
            {loading
              ? '处理中...'
              : mode === 'login'
              ? '立即登录'
              : mode === 'register'
              ? '创建账号'
              : '提交新密码'}
          </button>
        </form>
        <div style={{ marginTop: 16, color: '#475569', fontSize: 13 }}>
          敏感字段已通过 RSA 加密传输，注册及找回密码均由前端直连后端完成。
        </div>
      </div>
    </div>
  );
}
