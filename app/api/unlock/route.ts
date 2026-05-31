import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { passcode } = await req.json();

    // The secure passcode set in Vercel environment variables
    const secretPasscode = process.env.VAULT_PASSCODE;

    if (!secretPasscode) {
      // If the user hasn't set up the passcode env var yet, allow access (or block it, but better to allow for local dev if they forgot)
      // Actually, for security, if it's missing, let's just reject.
      return NextResponse.json(
        { success: false, error: 'Vault Passcode is not configured on the server.' },
        { status: 500 }
      );
    }

    if (passcode === secretPasscode) {
      // Create response and set cookie
      const res = NextResponse.json({ success: true });
      
      // Set a secure, HTTP-only cookie valid for 30 days
      res.cookies.set({
        name: 'vault_unlocked',
        value: 'true',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
      });

      return res;
    } else {
      // Artificial delay to deter brute-force bots
      await new Promise(resolve => setTimeout(resolve, 1500));
      return NextResponse.json(
        { success: false, error: 'Incorrect Passcode.' },
        { status: 401 }
      );
    }
  } catch (err) {
    return NextResponse.json(
      { success: false, error: 'Bad request.' },
      { status: 400 }
    );
  }
}
