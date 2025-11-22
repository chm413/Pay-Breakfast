import { FormEvent, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { login, registerUser, requestPasswordReset, requestRegisterCode, resetPassword, fetchPublicHighlights } from '../utils/api';
import { PublicHighlights } from '../types';
import { useAuth } from '../state/AuthContext';

type Mode = 'login' | 'register' | 'reset';

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [realName, setRealName] = useState('');
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [info, setInfo] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [codeCooldown, setCodeCooldown] = useState(0);
  const [highlights, setHighlights] = useState<PublicHighlights | null>(null);
  const [highlightError, setHighlightError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { login: saveLogin } = useAuth();

  const from = (location.state as { from?: Location })?.from?.pathname || '/';

  function switchMode(next: Mode) {
    setMode(next);
    setError('');
    setInfo('');
    setLoading(false);
    setSendingCode(false);
    setCodeCooldown(0);
  }

  useEffect(() => {
    if (codeCooldown <= 0) return;
    const timer = setTimeout(() => setCodeCooldown((prev) => (prev > 0 ? prev - 1 : 0)), 1000);
    return () => clearTimeout(timer);
  }, [codeCooldown]);

  useEffect(() => {
    async function loadHighlights() {
      try {
        const res = await fetchPublicHighlights();
        setHighlights(res);
        setHighlightError('');
      } catch (err: any) {
        const detail = err?.message || '后端接口不可用';
        setHighlightError(`无法获取站点数据：${detail}。请截图并联系站点管理员。`);
      }
    }
    loadHighlights();
  }, []);

  async function handleSendRegisterCode() {
    if (!email) {
      setError('请填写邮箱以接收验证码');
      return;
    }
    setSendingCode(true);
    setError('');
    setInfo('');
    try {
      await requestRegisterCode(email);
      setInfo('验证码已发送，请在 10 分钟内完成注册');
      setCodeCooldown(60);
    } catch (err) {
      console.error(err);
      setError('发送验证码失败，请稍后重试或检查邮箱是否已注册');
    } finally {
      setSendingCode(false);
    }
  }

  async function handleResetRequest() {
    if (!email) {
      setError('请填写邮箱以接收重置验证码');
      return;
    }
    setLoading(true);
    setError('');
    setInfo('');
    try {
      await requestPasswordReset(email);
      setInfo('已发送重置验证码，请查收邮箱或查看日志输出');
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
        if (!verificationCode) {
          setError('请填写邮箱验证码后再注册');
          setLoading(false);
          return;
        }
        const res = await registerUser({ username, password, realName, email, code: verificationCode });
        saveLogin({ token: res.accessToken, user: res.userInfo });
        setInfo('注册成功，已为您自动登录');
        navigate('/', { replace: true });
      } else {
        if (!resetCode) {
          setError('请填写邮箱验证码后再重置密码');
          setLoading(false);
          return;
        }
        await resetPassword(email, resetCode, newPassword);
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
    <div className="container" style={{ maxWidth: 960 }}>
      <div className="card" style={{ marginBottom: 16, background: 'linear-gradient(135deg,#0ea5e9,#6366f1)', color: '#fff' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'center' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 999, background: 'rgba(255,255,255,0.18)', fontWeight: 700 }}>
              <span>鸿铭外卖服务平台</span>
              <span style={{ fontSize: 12 }}>安全·便捷·账本隔离</span>
            </div>
            <h2 style={{ margin: '10px 0 4px' }}>早点下单与账户服务</h2>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.86)' }}>
              支持个人下单、批量下单、充值审核与余额安全提醒，全程 RSA 加密与 SMTP 找回密码保护。
            </p>
            {highlightError && (
              <div style={{ marginTop: 10, padding: '10px 12px', borderRadius: 12, background: 'rgba(248,113,113,0.12)', color: '#fee2e2' }}>
                {highlightError}
              </div>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 12 }}>
            {highlights ? (
              <>
                <StatPill label="近7天日均单量" value={`${highlights.averageDailyOrders} 笔/天`} />
                <StatPill label="近7天总单量" value={`${highlights.totalOrdersLast7Days} 笔`} />
                <StatPill label="近7天成交额" value={`¥ ${highlights.totalAmountLast7Days.toFixed(2)}`} />
                <StatPill
                  label="热门商品ID"
                  value={
                    highlights.topProducts.length > 0
                      ? highlights.topProducts
                          .map((p) => `#${p.productId} x${p.orders}`)
                          .join('、')
                      : '暂无数据'
                  }
                />
              </>
            ) : (
              <>
                <PlaceholderPill text="正在同步统计..." />
                <PlaceholderPill text="请稍候" />
              </>
            )}
          </div>
        </div>
      </div>
      <div className="card" style={{ maxWidth: 520, margin: '0 auto' }}>
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

          {mode === 'register' && (
            <>
              <label>
                <div>邮箱验证码</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    className="input"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="请输入邮箱收到的验证码"
                    required
                  />
                  <button
                    type="button"
                    className="button-secondary"
                    onClick={handleSendRegisterCode}
                    disabled={sendingCode || codeCooldown > 0 || !email}
                    style={{ minWidth: 120 }}
                  >
                    {codeCooldown > 0 ? `重发(${codeCooldown}s)` : '获取验证码'}
                  </button>
                </div>
              </label>
              <p style={{ color: '#475569', fontSize: 13, marginTop: 4 }}>
                注册需邮箱验证，请在 10 分钟内使用验证码完成注册。
              </p>
            </>
          )}

          {mode === 'register' && (
            <label>
              <div>真实姓名</div>
              <input className="input" value={realName} onChange={(e) => setRealName(e.target.value)} placeholder="请填写姓名" required />
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
                <div>邮箱验证码</div>
                <input
                  className="input"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  placeholder="请输入邮件收到的验证码"
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
              发送重置验证码到邮箱
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

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="card" style={{ border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.06)' }}>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.82)' }}>{label}</div>
      <div style={{ fontWeight: 800, fontSize: 22 }}>{value}</div>
      <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>数据来自后端实时汇总</div>
    </div>
  );
}

function PlaceholderPill({ text }: { text: string }) {
  return (
    <div className="card" style={{ border: '1px dashed rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.04)' }}>
      <div style={{ fontWeight: 700 }}>{text}</div>
      <div style={{ color: 'rgba(255,255,255,0.72)', fontSize: 13 }}>等待后端接口响应</div>
    </div>
  );
}
