import { JSEncrypt } from 'jsencrypt';
import { BreakfastCategory, BreakfastProduct, PublicHighlights, UserProfile } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

interface LoginResponse {
  accessToken: string;
  userInfo: UserProfile;
}

interface RegisterPayload {
  username: string;
  realName: string;
  email: string;
  code: string;
  password: string;
}

interface AdminCreateUserPayload {
  username: string;
  realName: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'MEMBER';
  initialBalance: number;
  creditLimit: number;
  classOrDorm?: string;
}

interface PersonalOrderPayload {
  items: { productId: number; quantity: number; itemRemark?: string }[];
  remark?: string;
}

interface BatchOrderPayload {
  targets: { userId: number; items: { productId: number; quantity: number; itemRemark?: string }[] }[];
  remark?: string;
}

let cachedPublicKey: string | null = null;

async function fetchPublicKey(): Promise<string> {
  if (cachedPublicKey) return cachedPublicKey;
  const data = await request<{ publicKey: string }>('/auth/public-key');
  cachedPublicKey = data.publicKey;
  return cachedPublicKey;
}

async function encryptSensitive(content: string): Promise<string> {
  const publicKey = await fetchPublicKey();
  const encryptor = new JSEncrypt();
  encryptor.setPublicKey(publicKey);
  const encrypted = encryptor.encrypt(content);
  if (!encrypted) {
    throw new Error('加密失败，请稍后重试');
  }
  return encrypted;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('pb_token');
  const headers = new Headers(options.headers || undefined);
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const bodyText = await res.text();
    const detail = bodyText ? bodyText.slice(0, 400) : res.statusText;
    throw new Error(`HTTP ${res.status} ${res.statusText}: ${detail}`);
  }
  return (await res.json()) as T;
}

export async function login(username: string, password: string) {
  const encryptedPassword = await encryptSensitive(password);
  const data = await request<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password: encryptedPassword, encrypted: true }),
  });
  return data;
}

export async function registerUser(payload: RegisterPayload) {
  const encryptedPassword = await encryptSensitive(payload.password);
  const data = await request<LoginResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ ...payload, password: encryptedPassword, encrypted: true }),
  });
  return data;
}

export async function registerWithCode(payload: RegisterPayload) {
  return registerUser(payload);
}

export async function requestRegisterCode(email: string) {
  return request<{ success: boolean }>('/auth/register/request-code', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function requestPasswordReset(email: string) {
  return request<{ success: boolean }>('/auth/request-reset', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword(token: string, newPassword: string) {
  const encryptedPassword = await encryptSensitive(newPassword);
  return request<{ success: boolean }>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, newPassword: encryptedPassword, encrypted: true }),
  });
}

export async function fetchDashboardSummary() {
  return request('/reports/class/summary');
}

export async function fetchPublicHighlights(): Promise<PublicHighlights> {
  return request('/public/highlights');
}

export async function fetchRechargeRequests() {
  return request('/recharge-requests?status=pending');
}

export async function reviewRecharge(id: number, approve: boolean, comment?: string) {
  return request(`/recharge-requests/${id}/review`, {
    method: 'POST',
    body: JSON.stringify({ approve, comment }),
  });
}

export async function fetchUsers() {
  return request('/users');
}

export async function adminCreateUser(payload: AdminCreateUserPayload) {
  return request<{ userId: number; initialPassword: string }>('/admin/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateUserStatus(userId: number, enabled: boolean) {
  return request(`/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify({ status: enabled ? 1 : 0 }),
  });
}

export async function fetchPersonalAccount() {
  return request('/accounts/me');
}

export async function getAdminCategories(): Promise<BreakfastCategory[]> {
  return request('/admin/categories');
}

export async function createAdminCategory(payload: Partial<BreakfastCategory>) {
  return request('/admin/categories', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateAdminCategory(id: number, payload: Partial<BreakfastCategory>) {
  return request(`/admin/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteAdminCategory(id: number) {
  return request(`/admin/categories/${id}`, {
    method: 'DELETE',
  });
}

export async function getAdminProducts(params?: { categoryId?: number; enabled?: number | boolean }) {
  const query = params
    ? '?' +
      Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== null)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join('&')
    : '';
  return request<BreakfastProduct[]>(`/admin/products${query}`);
}

export async function createAdminProduct(payload: Partial<BreakfastProduct>) {
  return request('/admin/products', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateAdminProduct(id: number, payload: Partial<BreakfastProduct>) {
  return request(`/admin/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteAdminProduct(id: number) {
  return request(`/admin/products/${id}`, { method: 'DELETE' });
}

export async function getProducts(params?: { categoryId?: number; enabled?: number | boolean }) {
  const query = params
    ? '?' +
      Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== null)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join('&')
    : '';
  return request<BreakfastProduct[]>(`/products${query}`);
}

export async function createPersonalOrder(payload: PersonalOrderPayload) {
  return request('/orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function createBatchOrder(payload: BatchOrderPayload) {
  return request('/admin/batch-orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
