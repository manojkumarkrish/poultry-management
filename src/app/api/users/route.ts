import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { parseAndVerifyToken } from '@/lib/auth/authUtils';
import { INITIAL_USERS } from '@/lib/data/initialData';

async function checkAdminSession(): Promise<boolean> {
  const cookieStore = cookies();
  const sessionToken = cookieStore.get('kpf_session')?.value;
  if (!sessionToken) return false;
  const verified = await parseAndVerifyToken(sessionToken);
  return verified.valid && verified.role === 'owner_admin';
}

export async function GET() {
  if (!(await checkAdminSession())) {
    return NextResponse.json(
      { error: 'Forbidden: Owner/Admin role required.' },
      { status: 403 }
    );
  }

  const safeUsers = INITIAL_USERS.map(({ id, email, full_name, role, phone, is_active, created_at }) => ({
    id,
    email,
    full_name,
    role,
    phone,
    is_active,
    created_at,
  }));

  return NextResponse.json({ success: true, users: safeUsers });
}

export async function POST(request: Request) {
  if (!(await checkAdminSession())) {
    return NextResponse.json(
      { error: 'Forbidden: Owner/Admin role required.' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { email, full_name, role, password } = body;

    if (!email || !full_name || !password) {
      return NextResponse.json(
        { error: 'Missing required user parameters.' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: 'u-' + Date.now(),
        email: email.toLowerCase().trim(),
        full_name,
        role: role === 'owner_admin' ? 'owner_admin' : 'manager',
        is_active: true,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  if (!(await checkAdminSession())) {
    return NextResponse.json(
      { error: 'Forbidden: Owner/Admin role required.' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { id, role, is_active } = body;

    if (!id) {
      return NextResponse.json({ error: 'User ID is required.' }, { status: 400 });
    }

    const targetUser = INITIAL_USERS.find((u) => u.id === id);
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found in directory.' }, { status: 404 });
    }

    // Single-Admin Safeguard check:
    // If target is an admin and being deactivated or demoted
    if (targetUser.role === 'owner_admin' && (role === 'manager' || is_active === false)) {
      // In production or directory store, ensure at least one other active owner_admin remains
      const otherAdmins = INITIAL_USERS.filter(
        (u) => u.role === 'owner_admin' && u.id !== id && u.is_active !== false
      );
      if (otherAdmins.length === 0) {
        return NextResponse.json(
          {
            error:
              'Safeguard Violation: Cannot demote or deactivate the last active Farm Owner/Admin account.',
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({ success: true, updatedId: id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
