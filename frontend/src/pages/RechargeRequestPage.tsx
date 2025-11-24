import { useEffect, useMemo, useState } from 'react';
import { createRechargeRequest, fetchPersonalAccount, fetchRechargeRequests } from '../utils/api';

interface AccountInfo {
  id: number;
  balance: number;
  reminderThreshold?: number;
  dangerThreshold?: number;
}

interface RechargeRequestItem {
  id: number;
  amount: number;
  payMethod: string;
  status: string;
  createdAt?: string;
  reviewTime?: string;
  reviewerName?: string;
}

export default function RechargeRequestPage() {
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [requests, setRequests] = useState<RechargeRequestItem[]>([]);
  const [amount, setAmount] = useState('');
  const [payMethod, setPayMethod] = useState('微信转账');
  const [voucher, setVoucher] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const balanceStatus = useMemo(() => {
    if (!account) return null;
    if (account.balance < (account.dangerThreshold ?? 3)) return { label: '危急', color: '#dc2626', bg: '#fee2e2' };
    if (account.balance < (account.reminderThreshold ?? 25)) return { label: '提醒', color: '#b45309', bg: '#fef9c3' };
    return { label: '正常', color: '#166534', bg: '#dcfce7' };
  }, [account]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const acc = (await fetchPersonalAccount()) as any;
        setAccount({
          id: acc.id,
          balance: Number(acc.balance ?? 0),
          reminderThreshold: Number(acc.reminderThreshold ?? acc.account?.reminder_threshold ?? 25),
          dangerThreshold: Number(acc.dangerThreshold ?? acc.account?.danger_threshold ?? 3),
        });
        const list = (await fetchRechargeRequests()) as RechargeRequestItem[];
        setRequests(Array.isArray(list) ? list : []);
        setError('');
      } catch (err: any) {
        console.error(err);
        setError(err?.message || '无法加载账户与充值记录');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleSubmit() {
    if (!account) return;
    const parsedAmount = Number(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      setError('请输入大于 0 的充值金额');
      return;
    }
    setSubmitting(true);
    try {
      await createRechargeRequest({ amount: parsedAmount, payMethod, voucherImageUrl: voucher.trim() || undefined, accountId: account.id });
      setMessage('充值申请已提交，待管理员审核');
      setError('');
      setAmount('');
      setVoucher('');
      const list = (await fetchRechargeRequests()) as RechargeRequestItem[];
      setRequests(Array.isArray(list) ? list : []);
    } catch (err: any) {
      setMessage('');
      setError(err?.message || '提交失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="card" style={{ display: 'grid', gap: 14 }}>
      <div className="section-title">
        <div>
          <h3 style={{ margin: 0 }}>余额充值</h3>
          <p className="muted" style={{ margin: 0 }}>提交充值申请并上传支付凭证，管理员审核通过后余额自动增加。</p>
        </div>
        {balanceStatus && (
          <span className="chip" style={{ background: balanceStatus.bg, color: balanceStatus.color }}>
            余额状态：{balanceStatus.label}
          </span>
        )}
      </div>

      {error && <div className="tag" style={{ background: '#fee2e2', color: '#b91c1c' }}>{error}</div>}
      {message && <div className="tag" style={{ background: '#dcfce7', color: '#166534' }}>{message}</div>}

      <div className="card" style={{ border: '1px solid var(--border)', background: '#fff' }}>
        {loading ? (
          <div>加载账户信息...</div>
        ) : account ? (
          <div style={{ display: 'grid', gap: 10 }}>
            <div style={{ fontSize: 14, color: '#475569' }}>当前余额</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#0f172a' }}>¥ {account.balance.toFixed(2)}</div>
            <div className="muted">
              提醒阈值 ¥{account.reminderThreshold?.toFixed(2)} · 危急阈值 ¥{account.dangerThreshold?.toFixed(2)}
            </div>
          </div>
        ) : (
          <div>无法获取账户信息</div>
        )}
      </div>

      <div className="card" style={{ border: '1px solid var(--border)', background: '#fff' }}>
        <h4 style={{ marginTop: 0 }}>提交充值申请</h4>
        <div style={{ display: 'grid', gap: 10 }}>
          <div>
            <label className="muted" htmlFor="amount">
              充值金额（元）
            </label>
            <input
              id="amount"
              className="input"
              type="number"
              min="0"
              placeholder="请输入金额，例如 50"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div>
            <label className="muted" htmlFor="payMethod">
              支付方式
            </label>
            <select id="payMethod" className="input" value={payMethod} onChange={(e) => setPayMethod(e.target.value)}>
              <option>微信转账</option>
              <option>支付宝</option>
              <option>现金</option>
              <option>银行卡转账</option>
            </select>
          </div>
          <div>
            <label className="muted" htmlFor="voucher">
              凭证链接（可选）
            </label>
            <input
              id="voucher"
              className="input"
              placeholder="粘贴截图外链或备注"
              value={voucher}
              onChange={(e) => setVoucher(e.target.value)}
            />
          </div>
          <button className="button-primary" style={{ width: 'auto' }} onClick={handleSubmit} disabled={submitting || loading}>
            {submitting ? '提交中...' : '提交充值申请'}
          </button>
        </div>
      </div>

      <div className="card" style={{ border: '1px solid var(--border)', background: '#fff' }}>
        <div className="section-title" style={{ marginBottom: 8 }}>
          <h4 style={{ margin: 0 }}>我的充值记录</h4>
          <span className="muted">最近 50 条</span>
        </div>
        {requests.length === 0 ? (
          <div className="muted">暂无记录</div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>时间</th>
                  <th>金额</th>
                  <th>方式</th>
                  <th>状态</th>
                  <th>审核人</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req.id}>
                    <td>{req.createdAt ? new Date(req.createdAt).toLocaleString() : '—'}</td>
                    <td>¥ {req.amount.toFixed(2)}</td>
                    <td>{req.payMethod}</td>
                    <td>
                      <StatusPill status={req.status} />
                    </td>
                    <td>{req.reviewerName || (req.reviewTime ? '系统' : '未审核')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { text: string; color: string; bg: string }> = {
    pending: { text: '待审核', color: '#92400e', bg: '#fef3c7' },
    approved: { text: '已通过', color: '#166534', bg: '#dcfce7' },
    rejected: { text: '已拒绝', color: '#b91c1c', bg: '#fee2e2' },
  };
  const info = map[status] || { text: status, color: '#0f172a', bg: '#e2e8f0' };
  return (
    <span className="chip" style={{ background: info.bg, color: info.color, fontWeight: 700 }}>
      {info.text}
    </span>
  );
}
