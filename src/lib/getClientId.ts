export function getClientId(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    const user = JSON.parse(localStorage.getItem('current_user') || '{}');

    // ✅ Final & Safe Priority Order
    return (
      user.client_id ||
      user.society_id ||
      user.clientId ||
      null
    );
  } catch (e) {
    console.error('Failed to parse current_user', e);
    return null;
  }
}
