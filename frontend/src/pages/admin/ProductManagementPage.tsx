import { useEffect, useMemo, useState } from 'react';
import AdminGuard from '../../components/AdminGuard';
import { BreakfastCategory, BreakfastProduct } from '../../types';
import {
  createAdminProduct,
  disableAdminProduct,
  deleteAdminProduct,
  getAdminCategories,
  getAdminProducts,
  updateAdminProduct,
} from '../../utils/api';

interface ProductFormState {
  name: string;
  categoryId: number | '';
  price: string;
  unit: string;
  enabled: boolean;
  remark: string;
}

export default function ProductManagementPage() {
  const [categories, setCategories] = useState<BreakfastCategory[]>([]);
  const [products, setProducts] = useState<BreakfastProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterCategory, setFilterCategory] = useState<number | ''>('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ProductFormState>({
    name: '',
    categoryId: '',
    price: '',
    unit: '份',
    enabled: true,
    remark: '',
  });

  const filteredProducts = useMemo(() => {
    return products.filter((p) => (filterCategory ? p.categoryId === filterCategory : true));
  }, [products, filterCategory]);

  useEffect(() => {
    async function load() {
      try {
        const [cats, prods] = await Promise.all([getAdminCategories(), getAdminProducts({ enabled: undefined })]);
        setCategories(cats);
        setProducts(prods);
        setError('');
      } catch (err: any) {
        setError(err?.message || '加载数据失败');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function resetForm() {
    setEditingId(null);
    setForm({ name: '', categoryId: '', price: '', unit: '份', enabled: true, remark: '' });
  }

  async function refreshProducts() {
    const prods = await getAdminProducts({ enabled: undefined, categoryId: filterCategory || undefined });
    setProducts(prods);
  }

  async function handleSubmit() {
    if (!form.name.trim() || !form.categoryId) {
      setError('请填写商品名称并选择分类');
      return;
    }
    const priceValue = Number(form.price);
    if (Number.isNaN(priceValue) || priceValue < 0) {
      setError('请输入合法价格');
      return;
    }
    try {
      const payload = {
        name: form.name,
        categoryId: Number(form.categoryId),
        price: Number(priceValue.toFixed(2)),
        unit: form.unit,
        enabled: form.enabled,
        remark: form.remark || null,
      };
      if (editingId) {
        await updateAdminProduct(editingId, payload);
      } else {
        await createAdminProduct(payload);
      }
      await refreshProducts();
      resetForm();
      setError('');
    } catch (err: any) {
      setError(err?.message || '保存失败');
    }
  }

  async function handleDisable(product: any) {
    try {
      if (product.enabled) {
        await disableAdminProduct(product.id);
      } else {
        await updateAdminProduct(product.id, { enabled: true });
      }
      await refreshProducts();
    } catch (err: any) {
      setError(err?.message || '更新状态失败');
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteAdminProduct(id);
      await refreshProducts();
    } catch (err: any) {
      setError(err?.message || '删除失败');
    }
  }

  return (
    <AdminGuard>
      <div className="card">
        <div className="section-title" style={{ gap: 12, alignItems: 'flex-end' }}>
          <div>
            <h3>早餐商品管理</h3>
            <p className="muted">仅启用的商品会出现在下单页面，下架可保留历史订单。</p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <select
              className="input"
              style={{ width: 180 }}
              value={form.categoryId}
              onChange={(e) => setForm((prev) => ({ ...prev, categoryId: e.target.value ? Number(e.target.value) : '' }))}
            >
              <option value="">选择分类</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <input
              className="input"
              placeholder="商品名称"
              style={{ width: 160 }}
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            />
            <input
              className="input"
              type="number"
              step="0.01"
              placeholder="价格"
              style={{ width: 120 }}
              value={form.price}
              onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
            />
            <input
              className="input"
              placeholder="单位"
              style={{ width: 80 }}
              value={form.unit}
              onChange={(e) => setForm((prev) => ({ ...prev, unit: e.target.value }))}
            />
            <input
              className="input"
              placeholder="备注"
              style={{ width: 200 }}
              value={form.remark}
              onChange={(e) => setForm((prev) => ({ ...prev, remark: e.target.value }))}
            />
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#475569' }}>
              <input
                type="checkbox"
                checked={form.enabled}
                onChange={(e) => setForm((prev) => ({ ...prev, enabled: e.target.checked }))}
              />
              启用
            </label>
            <button className="button-primary" onClick={handleSubmit} style={{ minWidth: 120 }}>
              {editingId ? '保存修改' : '新增商品'}
            </button>
            {editingId && (
              <button className="button-secondary" onClick={resetForm}>
                取消编辑
              </button>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
          <select
            className="input"
            style={{ width: 200 }}
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value ? Number(e.target.value) : '')}
          >
            <option value="">全部分类</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          <button className="button-secondary" onClick={refreshProducts}>
            刷新
          </button>
        </div>

        {error && <div style={{ color: '#b91c1c', marginBottom: 12 }}>{error}</div>}

        {loading ? (
          <div>加载中...</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>名称</th>
                <th>分类</th>
                <th>价格</th>
                <th>单位</th>
                <th>状态</th>
                <th>备注</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p) => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td>{p.name}</td>
                  <td>{p.categoryName || categories.find((c) => c.id === p.categoryId)?.name || '-'}</td>
                  <td>¥ {Number(p.price).toFixed(2)}</td>
                  <td>{p.unit}</td>
                  <td>
                    {p.isDeleted ? (
                      <span className="badge" style={{ background: '#f1f5f9', color: '#475569' }}>已删除</span>
                    ) : (
                      <span className="badge" style={{ background: p.enabled ? '#dcfce7' : '#fee2e2' }}>
                        {p.enabled ? '启用' : '下架'}
                      </span>
                    )}
                  </td>
                  <td>{p.remark || '-'}</td>
                  <td style={{ display: 'flex', gap: 8 }}>
                    <button
                      className="button-secondary"
                      onClick={() => {
                        setEditingId(p.id);
                        setForm({
                          name: p.name,
                          categoryId: p.categoryId,
                          price: String(p.price),
                          unit: p.unit,
                          enabled: p.enabled,
                          remark: p.remark || '',
                        });
                      }}
                      >
                        编辑
                      </button>
                    <button className="button-primary" style={{ background: '#f97316' }} onClick={() => handleDisable(p)}>
                      {p.enabled ? '下架' : '上架'}
                    </button>
                    <button className="button-primary" style={{ background: '#f87171' }} onClick={() => handleDelete(p.id)}>
                      删除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminGuard>
  );
}
