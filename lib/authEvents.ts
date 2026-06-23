/**
 * Lightweight auth event bus.
 *
 * Because lib/api.ts runs outside React and cannot call useRouter(),
 * it emits a custom DOM event when a 401 cannot be recovered.
 * AuthContext listens for this event and calls router.push('/login')
 * for a soft navigation that preserves all React state (cart, etc.).
 */

const AUTH_LOGOUT_EVENT = "auth:force-logout";

/** Called by api.ts when a token refresh fails irreversibly. */
export function emitForceLogout() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(AUTH_LOGOUT_EVENT));
  }
}

/** Called by AuthContext to react to the event. Returns a cleanup function. */
export function onForceLogout(handler: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(AUTH_LOGOUT_EVENT, handler);
  return () => window.removeEventListener(AUTH_LOGOUT_EVENT, handler);
}
