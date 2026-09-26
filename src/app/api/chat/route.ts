
export async function POST(request: Request) {
  const formData = await request.formData();
  const message = formData.get('message');
  const file = formData.get('file');

  if (typeof message !== 'string') {
    return Response.json({ error: 'Invalid message.' }, { status: 400 });
  }

  if (message.length > 2000) {
    return Response.json(
      { error: 'The message cannot exceed 2000 characters.' },
      { status: 400 }
    );
  }

  if (file !== null && !(file instanceof File)) {
    return Response.json({ error: 'Invalid file.' }, { status: 400 });
  }

  if (file instanceof File && file.type !== 'application/pdf') {
    return Response.json({ error: 'Only PDF files are accepted.' }, { status: 415 });
  }

  return Response.json({
    message: file instanceof File ? `PDF received: ${file.name}` : 'Message received.',
  });
}
