import { useEffect, useMemo, useState } from 'react';
import {
  createAdminProduct,
  createVendor,
  deleteAdminProduct,
  deleteVendor,
  getAdminCategories,
  fetchVendorSettlements,
  fetchVendorSummary,
  fetchVendors,
  getAdminProducts,
  triggerVendorSettlement,
  updateAdminProduct,
  updateVendor,
} from '../../utils/api';
import { BreakfastCategory, BreakfastProduct, Vendor, VendorSettlement } from '../../types';

export default function VendorManagementPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [summary, setSummary] = useState<{ total: number; byCategory: { categoryName: string; ordersCount: number; totalAmount: number }[] }>({
    total: 0,
    byCategory: [],
  });
  const [products, setProducts] = useState<BreakfastProduct[]>([]);
  const [settlements, setSettlements] = useState<VendorSettlement[]>([]);
  const [categories, setCategories] = useState<BreakfastCategory[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [vendorForm, setVendorForm] = useState({ name: '', remark: '', enabled: true });
  const [productForm, setProductForm] = useState({
    name: '',
    price: 0,
    unit: '份',
    enabled: true,
    remark: '',
    categoryId: 0,
  });
  const [editingProductId, setEditingProductId] = useState<number | null>(null);

  const selectedVendor = useMemo(() => vendors.find((v) => v.id === selectedId) || null, [vendors, selectedId]);

  async function loadVendors() {
    try {
      const res = (await fetchVendors()) as Vendor[];
      setVendors(res);
      if (!selectedId && res.length) setSelectedId(res[0].id);
      setError('');
    } catch (err: any) {
      setError(err?.message || '店家加载失败');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadVendors();
    getAdminCategories()
      .then((res) => setCategories(res as BreakfastCategory[]))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    async function loadDetails() {
      if (!selectedId) return;
      try {
        const summaryRes = (await fetchVendorSummary(selectedId)) as { totalAmount?: number; byCategory?: any[] };
        setSummary({
          total: (summaryRes.totalAmount as number | undefined) || 0,
          byCategory: (summaryRes.byCategory || []).map((c: any) => ({
            categoryName: c.categoryName || '未分类',
            ordersCount: Number(c.ordersCount || 0),
            totalAmount: Number(c.totalAmount || 0),
          })),
        });
        const prods = (await getAdminProducts({ vendorId: selectedId })) as BreakfastProduct[];
        setProducts(prods);
        const settle = (await fetchVendorSettlements(selectedId)) as any[];
        setSettlements(
          (settle as VendorSettlement[]).map((s: any) => ({
            ...s,
            categoryName: (s as any).category?.name || (s as any).categoryName || null,
          })),
        );
      } catch (err: any) {
        setError(err?.message || '加载店家详情失败');
      }
    }
    loadDetails();
    if (selectedVendor) {
      setVendorForm({ name: selectedVendor.name, remark: selectedVendor.remark || '', enabled: selectedVendor.enabled });
    }
  }, [selectedId]);

  async function saveVendor() {
    try {
      if (selectedVendor) {
        await updateVendor(selectedVendor.id, vendorForm);
      } else {
        await createVendor(vendorForm);
      }
      setVendorForm({ name: '', remark: '', enabled: true });
      await loadVendors();
    } catch (err: any) {
      setError(err?.message || '保存店家失败');
    }
  }

  async function saveProduct() {
    if (!selectedId) return;
    if (!productForm.name.trim()) {
      setError('请填写商品名称');
      return;
    }
    try {
      const payload = { ...productForm, price: Number(productForm.price), vendorId: selectedId } as any;
      payload.categoryId = Number(productForm.categoryId || (categories[0]?.id ?? 0));
      if (editingProductId) {
        await updateAdminProduct(editingProductId, payload);
      } else {
        await createAdminProduct(payload);
      }
      setProductForm({ name: '', price: 0, unit: '份', enabled: true, remark: '', categoryId: 0 });
      setEditingProductId(null);
      const prods = (await getAdminProducts({ vendorId: selectedId })) as BreakfastProduct[];
      setProducts(prods);
    } catch (err: any) {
      setError(err?.message || '保存商品失败');
    }
  }

  async function toggleProduct(product: BreakfastProduct) {
    await updateAdminProduct(product.id, { enabled: !product.enabled });
    const prods = (await getAdminProducts({ vendorId: selectedId || undefined })) as BreakfastProduct[];
    setProducts(prods);
  }

  async function removeProduct(id: number) {
    await deleteAdminProduct(id);
    const prods = (await getAdminProducts({ vendorId: selectedId || undefined })) as BreakfastProduct[];
    setProducts(prods);
  }

  async function removeVendor(id: number) {
    if (!confirm('确定要禁用该店家吗？')) return;
    await deleteVendor(id);
    await loadVendors();
  }

  async function runSettlement() {
    await triggerVendorSettlement();
    if (selectedId) {
      const settle = (await fetchVendorSettlements(selectedId)) as any[];
      setSettlements(settle as VendorSettlement[]);
    }
  }

  return (
    <div className="card">
      <div className="section-title" style={{ alignItems: 'center' }}>
        <div>
          <h3>店家与日结</h3>
          <p className="muted">管理早餐提供店家、商品，并查看每日结单记录。</p>
        </div>
        <button className="button-primary" onClick={runSettlement}>立即生成今日日结</button>
      </div>
      {error && <div className="tag" style={{ background: '#fee2e2', color: '#b91c1c' }}>{error}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 14 }}>
        <div className="card" style={{ background: '#f8fafc' }}>
          <div className="section-title" style={{ justifyContent: 'space-between' }}>
            <h4>店家列表</h4>
            <button
              className="button-secondary"
              onClick={() => {
                setSelectedId(null);
                setVendorForm({ name: '', remark: '', enabled: true });
              }}
            >
              新增
            </button>
          </div>
          {loading ? (
            <div>加载中...</div>
          ) : (
            <div className="list">
              {vendors.map((v) => (
                <div key={v.id} className={`list-item ${v.id === selectedId ? 'active' : ''}`} onClick={() => setSelectedId(v.id)}>
                  <div>{v.name}</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{v.enabled ? '启用' : '禁用'}</div>
                  <button className="button-secondary" style={{ marginTop: 6 }} onClick={() => removeVendor(v.id)}>
                    禁用
                  </button>
                </div>
              ))}
            </div>
          )}
          <div style={{ marginTop: 12 }}>
            <label>
              <div>店家名称</div>
              <input className="input" value={vendorForm.name} onChange={(e) => setVendorForm((p) => ({ ...p, name: e.target.value }))} />
            </label>
            <label>
              <div>备注</div>
              <input className="input" value={vendorForm.remark} onChange={(e) => setVendorForm((p) => ({ ...p, remark: e.target.value }))} />
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
              <input type="checkbox" checked={vendorForm.enabled} onChange={(e) => setVendorForm((p) => ({ ...p, enabled: e.target.checked }))} />
              启用
            </label>
            <button className="button-primary" style={{ marginTop: 10 }} onClick={saveVendor}>
              {selectedVendor ? '更新店家' : '创建店家'}
            </button>
          </div>
        </div>

        <div className="card" style={{ background: '#fff' }}>
          {selectedVendor ? (
            <>
              <div className="section-title" style={{ justifyContent: 'space-between' }}>
                <div>
                  <h4>{selectedVendor.name}</h4>
                  <p className="muted">累计消费：¥ {summary.total.toFixed(2)}</p>
                  {summary.byCategory.length > 0 && (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
                      {summary.byCategory.map((c) => (
                        <span key={c.categoryName} className="chip" style={{ background: '#f1f5f9', color: '#0f172a' }}>
                          {c.categoryName}: ¥ {c.totalAmount.toFixed(2)} / {c.ordersCount} 单
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="card" style={{ marginBottom: 12 }}>
                <div className="section-title" style={{ justifyContent: 'space-between' }}>
                  <h5>商品</h5>
                </div>
                <table className="table">
                  <thead>
                    <tr>
                      <th>名称</th>
                      <th>分类</th>
                      <th>价格</th>
                      <th>单位</th>
                      <th>状态</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) => (
                      <tr key={p.id}>
                        <td>{p.name}</td>
                        <td>{p.categoryName || '未分类'}</td>
                        <td>¥ {Number(p.price).toFixed(2)}</td>
                        <td>{p.unit}</td>
                        <td>{p.enabled ? '启用' : '下架'}</td>
                        <td>
                          <button
                            className="button-secondary"
                            style={{ marginRight: 6 }}
                            onClick={() => {
                              setEditingProductId(p.id);
                              setProductForm({
                                name: p.name,
                                price: Number(p.price),
                                unit: p.unit,
                                enabled: p.enabled,
                                remark: p.remark || '',
                                categoryId: p.categoryId || 0,
                              });
                            }}
                          >
                            编辑
                          </button>
                          <button className="button-secondary" style={{ marginRight: 6 }} onClick={() => toggleProduct(p)}>
                            {p.enabled ? '下架' : '上架'}
                          </button>
                          <button className="button-primary" style={{ background: '#f87171' }} onClick={() => removeProduct(p.id)}>
                            删除
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="card" style={{ marginTop: 10 }}>
                  <div className="section-title">
                    <h5>新增商品</h5>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))', gap: 10 }}>
                    <label>
                      <div>名称</div>
                      <input className="input" value={productForm.name} onChange={(e) => setProductForm((p) => ({ ...p, name: e.target.value }))} />
                    </label>
                    <label>
                      <div>价格</div>
                      <input
                        className="input"
                        type="number"
                        step="0.01"
                        value={productForm.price}
                        onChange={(e) => setProductForm((p) => ({ ...p, price: Number(e.target.value) }))}
                      />
                    </label>
                    <label>
                      <div>单位</div>
                      <input className="input" value={productForm.unit} onChange={(e) => setProductForm((p) => ({ ...p, unit: e.target.value }))} />
                    </label>
                    <label>
                      <div>备注</div>
                      <input className="input" value={productForm.remark} onChange={(e) => setProductForm((p) => ({ ...p, remark: e.target.value }))} />
                    </label>
                    <label>
                      <div>分类</div>
                      <select
                        className="input"
                        value={productForm.categoryId}
                        onChange={(e) => setProductForm((p) => ({ ...p, categoryId: Number(e.target.value) }))}
                      >
                        <option value={0}>选择分类</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input
                        type="checkbox"
                        checked={productForm.enabled}
                        onChange={(e) => setProductForm((p) => ({ ...p, enabled: e.target.checked }))}
                      />
                      启用
                    </label>
                    <button className="button-primary" onClick={saveProduct}>
                      {editingProductId ? '保存修改' : '添加商品'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="section-title">
                  <h5>日结记录</h5>
                </div>
                {settlements.length === 0 ? (
                  <div className="muted">暂无日结数据</div>
                ) : (
                  <table className="table">
                    <thead>
                      <tr>
                        <th>日期</th>
                        <th>分类</th>
                        <th>单数</th>
                        <th>金额</th>
                      </tr>
                    </thead>
                    <tbody>
                      {settlements.map((s) => (
                        <tr key={s.id}>
                          <td>{s.date}</td>
                          <td>{s.categoryName || '未分类'}</td>
                          <td>{s.ordersCount}</td>
                          <td>¥ {Number(s.totalAmount).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          ) : (
            <div className="muted">选择左侧店家或新增一个店家以管理商品。</div>
          )}
        </div>
      </div>
    </div>
  );
}
