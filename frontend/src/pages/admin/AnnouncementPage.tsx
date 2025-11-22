import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  createAdminAnnouncement,
  deleteAdminAnnouncement,
  fetchAdminAnnouncements,
  updateAdminAnnouncement,
} from '../../utils/api';
import { Announcement } from '../../types';

interface FormState {
  title: string;
  contentMd: string;
  showOnLogin: boolean;
  enabled: boolean;
}

export default function AnnouncementPage() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [form, setForm] = useState<FormState>({ title: '', contentMd: '', showOnLogin: false, enabled: true });

  async function load() {
    try {
      const res = (await fetchAdminAnnouncements()) as any[];
      setItems(res as Announcement[]);
      setError('');
    } catch (err: any) {
      setError(err?.message || '公告加载失败');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function startEdit(item?: Announcement) {
    if (item) {
      setEditing(item);
      setForm({
        title: item.title,
        contentMd: item.contentMd,
        showOnLogin: item.showOnLogin,
        enabled: item.enabled,
      });
    } else {
      setEditing(null);
      setForm({ title: '', contentMd: '', showOnLogin: false, enabled: true });
    }
  }

  async function submit() {
    try {
      if (editing) {
        await updateAdminAnnouncement(editing.id, form);
      } else {
        await createAdminAnnouncement(form);
      }
      await load();
      startEdit();
    } catch (err: any) {
      setError(err?.message || '保存失败');
    }
  }

  async function remove(id: number) {
    if (!confirm('确定要删除该公告吗？')) return;
    await deleteAdminAnnouncement(id);
    await load();
  }

  return (
    <div className="card">
      <div className="section-title" style={{ alignItems: 'center' }}>
        <div>
          <h3>公告管理</h3>
          <p className="muted">支持 Markdown，勾选“在登陆时弹出”可在用户登录后提示。</p>
        </div>
        <button className="button-primary" onClick={() => startEdit()}>
          新建公告
        </button>
      </div>
      {error && <div className="tag" style={{ background: '#fee2e2', color: '#b91c1c' }}>{error}</div>}
      {loading ? (
        <div>加载中...</div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>标题</th>
              <th>弹窗</th>
              <th>状态</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.title}</td>
                <td>{item.showOnLogin ? '是' : '否'}</td>
                <td>{item.enabled ? '启用' : '禁用'}</td>
                <td>{new Date(item.createdAt).toLocaleString()}</td>
                <td>
                  <button className="button-secondary" style={{ marginRight: 6 }} onClick={() => startEdit(item)}>
                    编辑
                  </button>
                  <button className="button-primary" style={{ background: '#f87171' }} onClick={() => remove(item.id)}>
                    删除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {(editing || form.title || form.contentMd) && (
        <div className="card" style={{ marginTop: 14 }}>
          <div className="section-title">
            <h4>{editing ? '编辑公告' : '新建公告'}</h4>
            <button className="button-secondary" onClick={() => startEdit()}>
              关闭
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
            <div>
              <label>
                <div>标题</div>
                <input className="input" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
              </label>
              <label style={{ marginTop: 10 }}>
                <div>内容（Markdown）</div>
                <textarea
                  className="input"
                  style={{ minHeight: 160 }}
                  value={form.contentMd}
                  onChange={(e) => setForm((p) => ({ ...p, contentMd: e.target.value }))}
                />
              </label>
              <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input
                    type="checkbox"
                    checked={form.showOnLogin}
                    onChange={(e) => setForm((p) => ({ ...p, showOnLogin: e.target.checked }))}
                  />
                  登陆时弹出
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input type="checkbox" checked={form.enabled} onChange={(e) => setForm((p) => ({ ...p, enabled: e.target.checked }))} />
                  启用
                </label>
              </div>
              <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                <button className="button-primary" onClick={submit}>
                  保存
                </button>
                <button className="button-secondary" onClick={() => startEdit()}>
                  取消
                </button>
              </div>
            </div>
            <div className="card" style={{ background: '#f8fafc' }}>
              <div className="section-title">
                <h4>预览</h4>
              </div>
              <div className="prose" style={{ maxHeight: 260, overflow: 'auto' }}>
                {form.contentMd ? <ReactMarkdown>{form.contentMd}</ReactMarkdown> : <div className="muted">输入内容后显示预览</div>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
