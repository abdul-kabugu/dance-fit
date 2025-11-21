import { handleApiError, respond } from '@/lib/api-helpers';
import { buildProfileStatus, requireUser } from '@/lib/auth';

async function getSessionPayload(sessionId?: string) {
  const user = await requireUser({ sessionId });
  const status = buildProfileStatus(user);
  return { user, ...status };
}

export async function GET() {
  try {
    return respond(await getSessionPayload());
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    let sessionId: string | undefined;
    if (
      request.headers.get('content-type')?.includes('application/json') &&
      request.body
    ) {
      const body = (await request.json().catch(() => ({}))) as {
        sessionId?: unknown;
      };
      if (typeof body.sessionId === 'string') {
        sessionId = body.sessionId;
      }
    }

    return respond(await getSessionPayload(sessionId));
  } catch (error) {
    return handleApiError(error);
  }
}
