// app/api/auth/set-cookie/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { userId, accessToken } = await request.json();

    if (!userId || !accessToken) {
      return NextResponse.json(
        { error: 'Missing userId or accessToken' },
        { status: 400 }
      );
    }

    // Set cookies - await is required in Next.js 15+
    const cookieStore = await cookies();
    
    console.log('Setting cookies for userId:', userId);
    
    // Set user ID cookie
    cookieStore.set('userId', userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    // Set access token cookie
    cookieStore.set('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    console.log('Cookies set successfully');

    return NextResponse.json(
      { 
        message: 'Cookies set successfully',
        debug: { userId: 'set', accessToken: 'set' }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Set cookie error:', error);
    return NextResponse.json(
      { error: 'Failed to set cookies' },
      { status: 500 }
    );
  }
}