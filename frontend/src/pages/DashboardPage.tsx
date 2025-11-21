import { useEffect, useState } from 'react';
import { DashboardSummary } from '../types';
import { fetchDashboardSummary } from '../utils/api';

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetchDashboardSummary();
        const parsed = res as Partial<DashboardSummary>;
        setSummary({
          totalBalance: Number(parsed.totalBalance ?? 0),
          lowBalanceCount: Number(parsed.lowBalanceCount ?? 0),
          todayOrders: Number(parsed.todayOrders ?? 0),
          pendingRecharges: Number(parsed.pendingRecharges ?? 0),
        });
        setError('');
      } catch (err: any) {
        setSummary(null);
        const detail = err?.message || '后端接口异常';
        setError(`无法获取后台报表：${detail}。请截图并联系站点管理员。`);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div>
      <div className="section-title">
        <h3>总览</h3>
        {error && <span className="tag">{error}</span>}
      </div>
      {loading ? <div className="card">数据加载中...</div> : null}
      {!loading && summary && (
        <div className="flex-grid">
          <SummaryCard title="个人账户总余额" value={`¥ ${summary.totalBalance.toFixed(2)}`} highlight />
          <SummaryCard title="余额不足学生" value={`${summary.lowBalanceCount} 人`} />
          <SummaryCard title="今日消费订单" value={`${summary.todayOrders} 笔`} />
          <SummaryCard title="待审核充值" value={`${summary.pendingRecharges} 条`} />
        </div>
      )}
      {!loading && !summary && (
        <div className="card" style={{ color: '#b91c1c' }}>
          无法展示仪表盘统计，请检查后端接口是否可用并联系管理员。
        </div>
      )}

      <div style={{ marginTop: 22 }} className="card">
        <div className="section-title">
          <h3>班级批量下单趋势</h3>
          <span className="tag">近 7 天</span>
        </div>
        <p style={{ color: '#475569', marginTop: 0 }}>此处可接入折线图组件，展示各班次日下单量、金额。</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
          {['高一(1)班', '高一(2)班', '高一(3)班', '高一(4)班'].map((cls) => (
            <div key={cls} className="card" style={{ boxShadow: 'none', border: '1px dashed #cbd5e1' }}>
              <div style={{ fontWeight: 700 }}>{cls}</div>
              <div style={{ color: '#475569', fontSize: 13 }}>近 7 天订单 40 笔 · 金额 ¥320.00</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ title, value, highlight }: { title: string; value: string; highlight?: boolean }) {
  return (
    <div className="card" style={highlight ? { background: 'linear-gradient(135deg, #4f46e5, #3b82f6)', color: 'white' } : {}}>
      <div style={{ fontSize: 13, opacity: highlight ? 0.9 : 1 }}>{title}</div>
      <div style={{ fontWeight: 800, fontSize: 26, marginTop: 6 }}>{value}</div>
      <div style={{ color: highlight ? 'rgba(255,255,255,0.82)' : '#475569', fontSize: 13 }}>自动同步统计</div>
    </div>
  );
}
