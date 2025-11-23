import { useEffect, useState } from 'react';
import { fetchSystemStatus } from '../../utils/api';
import { SystemStatus } from '../../types';

function formatSeconds(seconds: number) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export default function SystemStatusPage() {
  const [data, setData] = useState<SystemStatus | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = (await fetchSystemStatus()) as SystemStatus;
        setData(res);
        setError('');
      } catch (err: any) {
        setError(err?.message || '状态获取失败');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="card">
      <div className="section-title">
        <div>
          <h3>系统状态</h3>
          <p className="muted">展示前后端版本、运行时长与关键统计。</p>
        </div>
      </div>
      {error && <div className="tag" style={{ background: '#fee2e2', color: '#b91c1c' }}>{error}</div>}
      {loading ? (
        <div>加载中...</div>
      ) : !data ? (
        <div>暂无数据</div>
      ) : (
        <div className="grid" style={{ gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          <div className="card">
            <div className="muted">后端版本</div>
            <div className="stat-value">{data.backendVersion}</div>
          </div>
          <div className="card">
            <div className="muted">前端版本</div>
            <div className="stat-value">{data.frontendVersion}</div>
          </div>
          <div className="card">
            <div className="muted">运行时长</div>
            <div className="stat-value">{formatSeconds(data.uptimeSeconds)}</div>
          </div>
          <div className="card">
            <div className="muted">启用用户数</div>
            <div className="stat-value">{data.totalUsers}</div>
          </div>
          <div className="card">
            <div className="muted">完成订单数</div>
            <div className="stat-value">{data.totalCompletedOrders}</div>
          </div>
          <div className="card">
            <div className="muted">累计金额</div>
            <div className="stat-value">¥ {data.totalAmount.toFixed(2)}</div>
          </div>
        </div>
      )}
    </div>
  );
}
