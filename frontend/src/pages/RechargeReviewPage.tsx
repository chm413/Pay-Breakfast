import { useEffect, useState } from 'react';
import { RechargeRequestItem } from '../types';
import { fetchRechargeRequests, reviewRecharge } from '../utils/api';

const mockRecharges: RechargeRequestItem[] = [
  { id: 1, studentName: '张同学', amount: 50, payMethod: 'WECHAT', status: 'pending', createdAt: '2024-01-01' },
  { id: 2, studentName: '李同学', amount: 80, payMethod: 'ALIPAY', status: 'pending', createdAt: '2024-01-01' },
];

export default function RechargeReviewPage() {
  const [items, setItems] = useState<RechargeRequestItem[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = (await fetchRechargeRequests()) as RechargeRequestItem[];
        setItems(
          res.map((item) => ({
            ...item,
            amount: Number(item.amount ?? 0),
          }))
        );
      } catch (err) {
        console.warn('Use mock recharge list', err);
        setItems(mockRecharges);
        setError('接口不可用，展示示例充值申请');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleReview(id: number, approve: boolean) {
    try {
      await reviewRecharge(id, approve);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      console.error(err);
      setError('审核失败，请检查网络或权限');
    }
  }

  return (
    <div className="card">
      <div className="section-title">
        <h3>线下充值审核</h3>
        {error && <span className="tag">{error}</span>}
      </div>
      {loading ? (
        <div>加载中...</div>
      ) : items.length === 0 ? (
        <div style={{ color: '#475569' }}>暂无待审核充值</div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>学生</th>
              <th>金额</th>
              <th>支付方式</th>
              <th>提交时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.studentName}</td>
                <td>¥ {item.amount.toFixed(2)}</td>
                <td>{item.payMethod}</td>
                <td>{item.createdAt}</td>
                <td>
                  <button className="button-primary" style={{ width: 'auto', marginRight: 8 }} onClick={() => handleReview(item.id, true)}>
                    通过
                  </button>
                  <button
                    className="button-primary"
                    style={{ width: 'auto', background: '#f43f5e', marginTop: 6 }}
                    onClick={() => handleReview(item.id, false)}
                  >
                    拒绝
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
