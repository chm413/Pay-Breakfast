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

  const grouped = useMemo(() => {
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
    <div className="card">
      <div className="section-title">
        <div>
          <h3>我要下单</h3>
          <p className="muted">选择商品、填写备注后直接扣款，价格以下单时为准。</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            className="input"
            placeholder="订单备注（如送达地点、口味偏好）"
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            style={{ minWidth: 260 }}
          />
          <button className="button-primary" onClick={handleSubmit} disabled={loading}>
            提交订单
          </button>
        </div>
      </div>
      {error && <div style={{ color: '#b91c1c', marginBottom: 12 }}>{error}</div>}
      {loading ? (
        <div>加载中...</div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category} className="card" style={{ border: '1px solid #e2e8f0' }}>
              <div className="section-title" style={{ marginBottom: 8 }}>
                <h4 style={{ margin: 0 }}>{category}</h4>
                <span className="muted">选择数量即可下单</span>
              </div>
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: '40%' }}>名称</th>
                    <th>价格</th>
                    <th>数量</th>
                    <th>单品备注</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td>{item.name}</td>
                      <td>¥ {Number(item.price).toFixed(2)}</td>
                      <td>
                        <input
                          type="number"
                          className="input"
                          min={0}
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item.id, Number(e.target.value))}
                          style={{ width: 90 }}
                        />
                      </td>
                      <td>
                        <input
                          className="input"
                          placeholder="可选，如不要辣"
                          value={item.itemRemark || ''}
                          onChange={(e) => updateRemark(item.id, e.target.value)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
      {result && (
        <div className="card" style={{ marginTop: 16, border: '1px solid #e2e8f0' }}>
          <h4>下单结果</h4>
          <pre style={{ whiteSpace: 'pre-wrap', background: '#f8fafc', padding: 12, borderRadius: 8 }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
