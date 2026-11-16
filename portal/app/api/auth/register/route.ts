export async function POST() {
  return Response.json(
    {
      message:
        "Public registration is disabled. Please contact the administrator for an account.",
    },
    { status: 403 }
  );
}