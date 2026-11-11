'use client';

export default function AuthErrorActions() {
  return (
    <button type="button" className="button-primary" onClick={() => window.close()}>
      Close window
    </button>
  );
}
