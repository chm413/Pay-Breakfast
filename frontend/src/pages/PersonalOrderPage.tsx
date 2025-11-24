import { useEffect, useMemo, useState } from 'react';
import { BreakfastProduct } from '../types';
import { createPersonalOrder, getProducts } from '../utils/api';

interface OrderSelection extends BreakfastProduct {
  quantity: number;
  itemRemark?: string;
}

export default function PersonalOrderPage() {
  const [products, setProducts] = useState<OrderSelection[]>([]);
  const [remark, setRemark] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    async function load() {
      try {
        const list = await getProducts({ enabled: 1 });
        setProducts(
          list.map((p) => ({ ...p, quantity: 0, itemRemark: '' }))
        );
        setError('');
      } catch (err: any) {
        setError(err?.message || '无法加载商品');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const productMap = useMemo(() => {
    const map: Record<string, OrderSelection[]> = {};
    products.forEach((p) => {
      const key = p.categoryName || '未分组';
      if (!map[key]) map[key] = [];
      map[key].push(p);
    });
    return map;
  }, [products]);

  function updateQuantity(id: number, qty: number) {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, quantity: Math.max(0, qty) } : p)));
  }

  function updateRemark(id: number, value: string) {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, itemRemark: value } : p)));
  }

  const selectedTotal = useMemo(() => {
    const summary = products.reduce(
      (acc, item) => {
        const qty = Number(item.quantity || 0);
        const price = Number(item.price || 0);
        acc.items += qty;
        acc.amount += qty * price;
        return acc;
      },
      { items: 0, amount: 0 }
    );
    return summary;
  }, [products]);

  async function handleSubmit() {
    const items = products
      .filter((p) => p.quantity > 0)
      .map((p) => ({ productId: p.id, quantity: p.quantity, itemRemark: p.itemRemark?.trim() || undefined }));
    if (items.length === 0) {
      setError('请至少选择一件商品');
      return;
    }
    try {
      const res = await createPersonalOrder({ items, remark: remark.trim() || undefined });
      setResult(res);
      setError('');
    } catch (err: any) {
      setError(err?.message || '下单失败');
      setResult(null);
    }
  }

  return (
    <div className="card" style={{ display: 'grid', gap: 16 }}>
      <div className="section-title" style={{ alignItems: 'flex-start', gap: 10, flexWrap: 'wrap' }}>
        <div>
          <div className="chip" style={{ background: '#eef2ff', color: '#4338ca' }}>
            🛒 我要下单
          </div>
          <h3 style={{ margin: '6px 0 4px' }}>选择商品并提交订单</h3>
          <p className="muted" style={{ margin: 0 }}>
            价格在下单时锁定，可为每个商品补充备注。提交前可查看已选数量与合计金额。
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <input
            className="input"
            placeholder="订单备注（如送达地点、口味偏好）"
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            style={{ minWidth: 260 }}
          />
          <button className="button-primary" style={{ width: 'auto', minWidth: 140 }} onClick={handleSubmit} disabled={loading}>
            {selectedTotal.items > 0 ? `提交 · ¥${selectedTotal.amount.toFixed(2)}` : '提交订单'}
          </button>
        </div>
      </div>

      <div className="card" style={{ border: '1px dashed var(--border)', background: '#f8fafc' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div className="chip" style={{ background: '#dcfce7', color: '#166534' }}>
            已选 {selectedTotal.items} 件
          </div>
          <div className="chip" style={{ background: '#e0f2fe', color: '#075985' }}>
            合计 ¥ {selectedTotal.amount.toFixed(2)}
          </div>
          <div className="muted">调整数量即可实时更新金额</div>
        </div>
      </div>

      {error && <div style={{ color: '#b91c1c', marginBottom: 12 }}>{error}</div>}
      {loading ? (
        <div className="card" style={{ border: '1px dashed var(--border)' }}>加载中...</div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {Object.entries(productMap).map(([category, items]) => (
            <div key={category} className="card" style={{ border: '1px solid var(--border)', background: '#fff' }}>
              <div className="section-title" style={{ marginBottom: 8 }}>
                <div>
                  <h4 style={{ margin: 0 }}>{category}</h4>
                  <p className="muted" style={{ margin: 0 }}>每件商品均可单独备注</p>
                </div>
                <span className="tag">精选 {items.length} 款</span>
              </div>
              <div className="card-grid">
                {items.map((item) => (
                  <div key={item.id} className="card" style={{ boxShadow: 'none', border: '1px dashed var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <div>
                        <div style={{ fontWeight: 700 }}>{item.name}</div>
                        <div className="muted" style={{ fontSize: 13 }}>¥ {Number(item.price).toFixed(2)} / {item.unit || '份'}</div>
                      </div>
                      <span className="chip" style={{ background: '#f1f5f9', color: '#0f172a' }}>{item.categoryName || category}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
                      <button className="pill" style={{ minWidth: 36, textAlign: 'center' }} onClick={() => updateQuantity(item.id, Number(item.quantity) - 1)}>
                        -
                      </button>
                      <div style={{ fontWeight: 800, minWidth: 30, textAlign: 'center' }}>{item.quantity}</div>
                      <button className="pill" style={{ minWidth: 36, textAlign: 'center' }} onClick={() => updateQuantity(item.id, Number(item.quantity) + 1)}>
                        +
                      </button>
                    </div>
                    <input
                      className="input"
                      placeholder="单品备注（可选，如不要辣）"
                      value={item.itemRemark || ''}
                      onChange={(e) => updateRemark(item.id, e.target.value)}
                      style={{ marginTop: 8 }}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      {result && (
        <div className="card" style={{ marginTop: 4, border: '1px solid var(--border)', background: '#f8fafc' }}>
          <h4 style={{ marginTop: 0 }}>下单结果</h4>
          <pre style={{ whiteSpace: 'pre-wrap', background: '#fff', padding: 12, borderRadius: 8, border: '1px solid var(--border)' }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
