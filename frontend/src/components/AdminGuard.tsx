import React from 'react';
import { useAuth } from '../state/AuthContext';
import { isAdminRoleList } from '../utils/roles';

interface AdminGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function AdminGuard({ children, fallback }: AdminGuardProps) {
  const { user } = useAuth();
  const isAdmin = isAdminRoleList(user?.roles);

  if (!isAdmin) {
    return (
      <div>
        <div
          style={{
            background: '#fee2e2',
            border: '1px solid #fca5a5',
            color: '#b91c1c',
            padding: '12px 16px',
            marginBottom: 12,
            borderRadius: 8,
          }}
        >
          你没有权限查看此页面，已记录本次访问。
        </div>
        <div style={{ opacity: 0.5 }}>{fallback ?? null}</div>
      </div>
    );
  }

  return <>{children}</>;
}
