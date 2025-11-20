import { useEffect, useState } from 'react';
import { fetchPersonalAccount } from '../utils/api';
import { useAuth } from '../state/AuthContext';

interface AccountInfo {
  balance: number;
  reminder_threshold: number;
  danger_threshold: number;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = (await fetchPersonalAccount()) as { account: Partial<AccountInfo> };
        // 防止后端缺少阈值字段导致渲染 toFixed 报错
        setAccount({
          balance: res.account.balance ?? 0,
          reminder_threshold: res.account.reminder_threshold ?? 25,
          danger_threshold: res.account.danger_threshold ?? 3,
        });
      } catch (err) {
        console.warn('Use placeholder account', err);
        setError('未能加载账户信息，以下为示例数据');
        setAccount({ balance: 52.3, reminder_threshold: 25, danger_threshold: 3 });
      }
    }
    load();
  }, []);

  const formatAmount = (value: number | undefined) =>
    typeof value === 'number' ? value.toFixed(2) : '—';

  return (
    <div className="card">
      <div className="section-title">
        <h3>个人中心</h3>
        {error && <span className="tag">{error}</span>}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
        <div>
          <div style={{ color: '#475569' }}>姓名</div>
          <div style={{ fontWeight: 700 }}>{user?.realName}</div>
        </div>
        <div>
          <div style={{ color: '#475569' }}>学号 / 账号</div>
          <div style={{ fontWeight: 700 }}>{user?.username}</div>
        </div>
        <div>
          <div style={{ color: '#475569' }}>所属</div>
          <div style={{ fontWeight: 700 }}>{user?.gradeName || '—'} · {user?.className || '—'}</div>
        </div>
        <div>
          <div style={{ color: '#475569' }}>角色</div>
          <div style={{ fontWeight: 700 }}>{user?.roles.join(' / ')}</div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 18, background: '#0ea5e9', color: 'white' }}>
        <div style={{ fontSize: 14 }}>个人账户余额</div>
        <div style={{ fontSize: 32, fontWeight: 800, marginTop: 4 }}>¥ {account?.balance?.toFixed(2) ?? '—'}</div>
        <div style={{ opacity: 0.9, fontSize: 13 }}>
          提醒阈值 ¥{formatAmount(account?.reminder_threshold)} · 危急阈值 ¥{formatAmount(account?.danger_threshold)}
        </div>
      </div>

      <p style={{ color: '#475569' }}>
        提示：充值申请提交后，审核通过会自动反映在余额中。若余额不足或危急，系统会同步通知班主任与本人。
      </p>
    </div>
  );
}
