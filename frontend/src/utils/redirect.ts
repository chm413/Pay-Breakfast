export function redirectToAppRoot() {
  if (typeof window === 'undefined') return;
  // GitHub Pages sub-routes (e.g. /login) 404, so always return to root
  window.location.replace('/');
}
