import { UserProfile } from '../types';

export function getCurrentUser(): UserProfile | null {
  const data = localStorage.getItem('pb_user');
  if (!data) {
    return null;
  }
  try {
    return JSON.parse(data) as UserProfile;
  } catch (err) {
    console.error('Failed to parse user cache', err);
    return null;
  }
}
