import { useEffect, useState } from 'react';
import { DashboardSummary } from '../types';
import { fetchDashboardSummary } from '../utils/api';
import { useAuth } from '../state/AuthContext';

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const isAdmin = user?.roles?.includes('ADMIN') || user?.roles?.includes('MANAGER');

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
    <div style={{ display: 'grid', gap: 16 }}>
      <div className="card glass" style={{ background: 'linear-gradient(135deg,#312e81,#1e3a8a)', color: '#fff' }}>
        <div className="section-title">
          <div>
            <div className="chip" style={{ background: 'rgba(255,255,255,0.15)', color: '#c7d2fe', border: '1px solid rgba(255,255,255,0.25)' }}>
              📈 仪表盘速览
            </div>
            <h3 style={{ margin: '8px 0 4px', color: '#fff' }}>关键运营数据</h3>
            <p style={{ margin: 0, color: 'rgba(226,232,240,0.9)' }}>
              查看余额、低余额提醒、今日订单与充值审核进度，快速把握平台运行状态。
            </p>
          </div>
          {error && <span className="tag">{error}</span>}
        </div>
        {loading && <div style={{ color: '#e2e8f0' }}>数据加载中...</div>}
        {!loading && summary && (
          <div className="card-grid">
            <SummaryCard title="个人账户总余额" value={`¥ ${summary.totalBalance.toFixed(2)}`} accent="primary" detail="实时同步账户余额" />
            <SummaryCard title="余额不足学生" value={`${summary.lowBalanceCount} 人`} accent="warning" detail="低于提醒阈值" />
            <SummaryCard title="今日消费订单" value={`${summary.todayOrders} 笔`} accent="info" detail="包含个人与批量" />
            <SummaryCard title="待审核充值" value={`${summary.pendingRecharges} 条`} accent="danger" detail="管理员待处理" />
          </div>
        )}
        {!loading && !summary && (
          <div className="card" style={{ color: '#b91c1c', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.3)' }}>
            无法展示仪表盘统计，请检查后端接口是否可用并联系管理员。
          </div>
        )}
      </div>

      <div className="card" style={{ display: 'grid', gap: 12 }}>
        <div className="section-title">
          <h3>快捷入口与提醒</h3>
          <span className="tag">常用操作</span>
        </div>
        <div className="card-grid">
          <Callout title="我要下单" description="选择商品直接扣款，锁定下单时价格" linkText="进入下单" href="/order" emoji="🛒" isAdmin={isAdmin} />
          <Callout title="批量下单" description="管理员批量为多位成员下单并结算" linkText="开始批量下单" href="/admin/batch-order" emoji="📦" adminOnly isAdmin={isAdmin} />
          <Callout title="充值审核" description="查看待审核的线下充值申请" linkText="前往审核" href="/admin/recharges" emoji="💳" adminOnly isAdmin={isAdmin} />
          <Callout title="用户管理" description="创建成员、调整角色与额度" linkText="管理用户" href="/admin/users" emoji="🧑‍💼" adminOnly isAdmin={isAdmin} />
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ title, value, accent, detail }: { title: string; value: string; accent?: 'primary' | 'warning' | 'danger' | 'info'; detail?: string }) {
  const accentColors: Record<string, { bg: string; text: string }> = {
    primary: { bg: 'linear-gradient(135deg,#4f46e5,#3b82f6)', text: '#fff' },
    warning: { bg: 'linear-gradient(135deg,#f59e0b,#f97316)', text: '#fff' },
    danger: { bg: 'linear-gradient(135deg,#ef4444,#f87171)', text: '#fff' },
    info: { bg: 'linear-gradient(135deg,#0ea5e9,#06b6d4)', text: '#fff' },
  };
  const colors = accent ? accentColors[accent] : { bg: '#fff', text: '#0f172a' };
  return (
    <div className="card" style={{ background: colors.bg, color: colors.text }}>
      <div style={{ fontSize: 13, opacity: 0.9 }}>{title}</div>
      <div style={{ fontWeight: 800, fontSize: 26, marginTop: 6 }}>{value}</div>
      <div style={{ color: colors.text === '#fff' ? 'rgba(255,255,255,0.82)' : '#475569', fontSize: 13 }}>{detail || '实时数据'}</div>
    </div>
  );
}

function Callout({ title, description, linkText, href, emoji, adminOnly, isAdmin }: { title: string; description: string; linkText: string; href: string; emoji: string; adminOnly?: boolean; isAdmin?: boolean }) {
  if (adminOnly && !isAdmin) return null;
  return (
    <div className="card" style={{ border: '1px dashed var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 22 }}>{emoji}</span>
        <div>
          <div style={{ fontWeight: 700 }}>{title}</div>
          <div className="muted" style={{ fontSize: 13 }}>{description}</div>
        </div>
      </div>
      <div style={{ marginTop: 12 }}>
        <a href={href} className="pill" style={{ textDecoration: 'none' }}>
          {linkText}
          {adminOnly ? '（管理员）' : ''}
        </a>
      </div>
    </div>
  );
}
