import { useEffect, useMemo, useState } from 'react';
import AdminGuard from '../../components/AdminGuard';
import { BreakfastProduct, UserProfile } from '../../types';
import { createBatchOrder, fetchUsers, getProducts } from '../../utils/api';

interface TargetSelection {
  user: UserProfile;
  items: { productId: number; quantity: number; itemRemark?: string }[];
}

export default function BatchOrderPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [products, setProducts] = useState<BreakfastProduct[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [targets, setTargets] = useState<TargetSelection[]>([]);
  const [remark, setRemark] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastItems, setLastItems] = useState<{ productId: number; quantity: number; itemRemark?: string }[] | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [userRes, productRes] = await Promise.all([fetchUsers(), getProducts({ enabled: 1 })]);
        const list = (userRes as any).data || (userRes as UserProfile[]);
        setUsers(list);
        setProducts(productRes);
        setError('');
      } catch (err: any) {
        setError(err?.message || '加载数据失败');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const currentSelection = useMemo(
    () => targets.find((t) => t.user.id === selectedUserId),
    [targets, selectedUserId]
  );

  function ensureSelection(user: UserProfile) {
    setTargets((prev) => {
      const existing = prev.find((t) => t.user.id === user.id);
      if (existing) return prev;
      return [...prev, { user, items: [] }];
    });
    setSelectedUserId(user.id);
  }

  function updateItem(userId: number, productId: number, quantity: number, itemRemark?: string) {
    setTargets((prev) =>
      prev.map((target) => {
        if (target.user.id !== userId) return target;
        const existing = target.items.find((i) => i.productId === productId);
        let items = target.items;
        if (existing) {
          items = items.map((i) =>
            i.productId === productId ? { ...i, quantity: Math.max(0, quantity), itemRemark } : i
          );
        } else {
          items = [...items, { productId, quantity: Math.max(0, quantity), itemRemark }];
        }
        return { ...target, items };
      })
    );
  }

  function copyLastItems() {
    if (selectedUserId && lastItems) {
      setTargets((prev) =>
        prev.map((target) =>
          target.user.id === selectedUserId ? { ...target, items: lastItems.map((i) => ({ ...i })) } : target
        )
      );
    }
  }

  async function handleSubmit() {
    const payload = {
      targets: targets
        .map((t) => ({
          userId: t.user.id,
          items: t.items.filter((i) => i.quantity > 0),
        }))
        .filter((t) => t.items.length > 0),
      remark: remark.trim() || undefined,
    };
    if (payload.targets.length === 0) {
      setError('请至少为一名成员选择商品');
      return;
    }
    try {
      const res = await createBatchOrder(payload);
      setResult(res);
      setError('');
    } catch (err: any) {
      setError(err?.message || '批量下单失败');
      setResult(null);
    }
  }

  return (
    <AdminGuard>
      <div className="card">
        <div className="section-title">
          <div>
            <h3>批量下单</h3>
            <p className="muted">选择成员并为每人配置商品，支持复制上一人的组合。</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              className="input"
              placeholder="订单备注（如统一送达地点）"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              style={{ minWidth: 260 }}
            />
            <button className="button-primary" onClick={handleSubmit} disabled={loading}>
              提交批量订单
            </button>
          </div>
        </div>
        {error && <div style={{ color: '#b91c1c', marginBottom: 12 }}>{error}</div>}
        {loading ? (
          <div>加载中...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16 }}>
            <div className="card" style={{ border: '1px solid #e2e8f0' }}>
              <h4>选择成员</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 360, overflow: 'auto' }}>
                {users.map((u) => (
                  <button
                    key={u.id}
                    className="button-secondary"
                    style={{
                      justifyContent: 'flex-start',
                      borderColor: selectedUserId === u.id ? '#0ea5e9' : '#cbd5e1',
                      background: selectedUserId === u.id ? '#e0f2fe' : undefined,
                    }}
                    onClick={() => ensureSelection(u)}
                  >
                    <div style={{ fontWeight: 600 }}>{u.realName || u.username}</div>
                    <div className="muted" style={{ fontSize: 12 }}>{u.username}</div>
                  </button>
                ))}
              </div>
            </div>
            <div className="card" style={{ border: '1px solid #e2e8f0' }}>
              {currentSelection ? (
                <div style={{ display: 'grid', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ margin: 0 }}>{currentSelection.user.realName || currentSelection.user.username}</h4>
                      <p className="muted" style={{ margin: 0 }}>为该成员选择商品，数量为 0 将忽略。</p>
                    </div>
                    <button className="button-secondary" onClick={copyLastItems} disabled={!lastItems}>
                      复制上一人组合
                    </button>
                  </div>
                  <table className="table">
                    <thead>
                      <tr>
                        <th style={{ width: '40%' }}>商品</th>
                        <th>价格</th>
                        <th>数量</th>
                        <th>备注</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((p) => {
                        const item = currentSelection.items.find((i) => i.productId === p.id);
                        return (
                          <tr key={p.id}>
                            <td>{p.name}</td>
                            <td>¥ {Number(p.price).toFixed(2)}</td>
                            <td>
                              <input
                                type="number"
                                className="input"
                                min={0}
                                value={item?.quantity ?? 0}
                                onChange={(e) => updateItem(currentSelection.user.id, p.id, Number(e.target.value), item?.itemRemark)}
                                style={{ width: 90 }}
                              />
                            </td>
                            <td>
                              <input
                                className="input"
                                placeholder="可选"
                                value={item?.itemRemark || ''}
                                onChange={(e) => updateItem(currentSelection.user.id, p.id, item?.quantity ?? 0, e.target.value)}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      className="button-secondary"
                      onClick={() => {
                        if (currentSelection.items.length > 0) {
                          setLastItems(currentSelection.items);
                        }
                        setSelectedUserId(null);
                      }}
                    >
                      保存当前并选择下一位
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ color: '#475569' }}>请选择左侧成员以分配商品。</div>
              )}
            </div>
          </div>
        )}
        {result && (
          <div className="card" style={{ marginTop: 16, border: '1px solid #e2e8f0' }}>
            <h4>下单结果</h4>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <div className="stat-card">
                <div className="muted">订单状态</div>
                <div style={{ fontWeight: 700 }}>{result.status}</div>
              </div>
              <div className="stat-card">
                <div className="muted">总金额</div>
                <div style={{ fontWeight: 700 }}>¥ {Number(result.totalAmount || 0).toFixed(2)}</div>
              </div>
              <div className="stat-card">
                <div className="muted">成功项</div>
                <div style={{ fontWeight: 700 }}>
                  {(result.items || []).filter((i: any) => i.status === 'success').length}/{result.items?.length || 0}
                </div>
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>成员</th>
                    <th>商品</th>
                    <th>数量</th>
                    <th>金额</th>
                    <th>状态</th>
                    <th>原因</th>
                  </tr>
                </thead>
                <tbody>
                  {(result.items || []).map((item: any) => {
                    const user = users.find((u) => u.id === item.targetUserId);
                    const product = products.find((p) => p.id === item.productId);
                    return (
                      <tr key={item.id}>
                        <td>{user ? user.realName || user.username : `账户 #${item.personalAccountId}`}</td>
                        <td>{product?.name || `商品 #${item.productId}`}</td>
                        <td>{item.quantity}</td>
                        <td>¥ {Number(item.amount || 0).toFixed(2)}</td>
                        <td style={{ color: item.status === 'success' ? '#15803d' : '#b91c1c' }}>{item.status}</td>
                        <td>{item.failReason || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminGuard>
  );
}
