import { useEffect, useMemo, useState } from 'react';
import AdminGuard from '../../components/AdminGuard';
import { BreakfastCategory } from '../../types';
import {
  createAdminCategory,
  deleteAdminCategory,
  getAdminCategories,
  updateAdminCategory,
} from '../../utils/api';

interface FormState {
  name: string;
  sortOrder: number;
  enabled: boolean;
}

export default function CategoryManagementPage() {
  const [categories, setCategories] = useState<BreakfastCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>({ name: '', sortOrder: 0, enabled: true });

  const sortedCategories = useMemo(
    () => categories.slice().sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id),
    [categories]
  );

  useEffect(() => {
    async function load() {
      try {
        const res = await getAdminCategories();
        setCategories(res);
        setError('');
      } catch (err: any) {
        setError(err?.message || '加载分类失败');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function resetForm() {
    setEditingId(null);
    setForm({ name: '', sortOrder: 0, enabled: true });
  }

  async function handleSubmit() {
    if (!form.name.trim()) {
      setError('请填写分类名称');
      return;
    }
    try {
      if (editingId) {
        await updateAdminCategory(editingId, form);
      } else {
        await createAdminCategory(form);
      }
      const res = await getAdminCategories();
      setCategories(res);
      resetForm();
      setError('');
    } catch (err: any) {
      setError(err?.message || '保存失败');
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteAdminCategory(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
    } catch (err: any) {
      setError(err?.message || '删除失败');
    }
  }

  return (
    <AdminGuard>
      <div className="card">
        <div className="section-title" style={{ gap: 12, alignItems: 'flex-end' }}>
          <div>
            <h3>早餐分类管理</h3>
            <p className="muted">按排序升序展示，禁用后成员下单不可见。</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              className="input"
              style={{ width: 160 }}
              placeholder="分类名称"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            />
            <input
              className="input"
              type="number"
              style={{ width: 120 }}
              placeholder="排序"
              value={form.sortOrder}
              onChange={(e) => setForm((prev) => ({ ...prev, sortOrder: Number(e.target.value) }))}
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
              {editingId ? '保存修改' : '新增分类'}
            </button>
            {editingId && (
              <button className="button-secondary" onClick={resetForm}>
                取消编辑
              </button>
            )}
          </div>
        </div>
        {error && (
          <div style={{ color: '#b91c1c', marginBottom: 12 }}>
            {error}
          </div>
        )}
        {loading ? (
          <div>加载中...</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>名称</th>
                <th>排序</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {sortedCategories.map((cat) => (
                <tr key={cat.id}>
                  <td>{cat.id}</td>
                  <td>{cat.name}</td>
                  <td>{cat.sortOrder}</td>
                  <td>
                    <span className="badge" style={{ background: cat.enabled ? '#dcfce7' : '#fee2e2' }}>
                      {cat.enabled ? '启用' : '禁用'}
                    </span>
                  </td>
                  <td style={{ display: 'flex', gap: 8 }}>
                    <button
                      className="button-secondary"
                      onClick={() => {
                        setEditingId(cat.id);
                        setForm({ name: cat.name, sortOrder: cat.sortOrder, enabled: cat.enabled });
                      }}
                    >
                      编辑
                    </button>
                    <button className="button-primary" style={{ background: '#f97316' }} onClick={() => handleDelete(cat.id)}>
                      禁用/删除
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
