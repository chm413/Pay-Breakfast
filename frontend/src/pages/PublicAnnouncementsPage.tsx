import { useEffect, useState } from 'react';
import { fetchLoginAnnouncements } from '../utils/api';

interface AnnItem {
  id: number;
  title: string;
  contentMd: string;
  showOnLogin: boolean;
  enabled: boolean;
  createdAt?: string;
}

export default function PublicAnnouncementsPage() {
  const [items, setItems] = useState<AnnItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchLoginAnnouncements(); // 复用已存在的公开接口
        setItems(Array.isArray(res) ? res : []);
        setError('');
      } catch (e: any) {
        setError(e?.message || '公告加载失败');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="card">
      <div className="section-title">
        <h3>公告通知</h3>
        <p className="muted">平台公开公告（只读）</p>
      </div>
      {loading ? (
        <div>加载中...</div>
      ) : error ? (
        <div className="tag" style={{ background: '#fee2e2', color: '#b91c1c' }}>{error}</div>
      ) : items.length === 0 ? (
        <div className="muted">暂无公告</div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {items.map((it) => (
            <div key={it.id} className="card" style={{ border: '1px solid var(--border)' }}>
              <div className="section-title">
                <h4 style={{ margin: 0 }}>{it.title}</h4>
                {it.createdAt && (
                  <div className="muted" style={{ fontSize: 12 }}>
                    {new Date(it.createdAt).toLocaleString()}
                  </div>
                )}
              </div>
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                {it.contentMd}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
