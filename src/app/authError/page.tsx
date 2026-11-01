import AuthErrorActions from './AuthErrorActions';

const messages: Record<string, string> = {
  access_denied: 'You cancelled the Google Calendar connection.',
  invalid_state: 'The sign-in request expired. Please try connecting again.',
  missing_data: 'Google did not return the information needed to connect.',
  connection_failed: 'We could not connect your Google Calendar. Please try again.',
};

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason = 'connection_failed' } = await searchParams;
  const message = messages[reason] || messages.connection_failed;

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
      <section style={{ maxWidth: 420, textAlign: 'center' }}>
        <h1>Calendar connection failed</h1>
        <p>{message}</p>
        <AuthErrorActions />
      </section>
    </main>
  );
}
