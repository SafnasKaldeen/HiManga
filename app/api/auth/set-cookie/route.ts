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

    const cookieStore = await cookies();
    const isProd = process.env.NODE_ENV === "production";

    const cookieOptions = {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      maxAge: 60 * 60 * 24 * 365 * 10, // ✅ 10 years
      path: "/",
      domain: isProd ? ".himanga.fun" : undefined,
    };

    cookieStore.set("userId", userId, cookieOptions);
    cookieStore.set("accessToken", accessToken, cookieOptions);

    return NextResponse.json(
      { message: "Cookies set (never expire)" },
      { status: 200 }
    );

  } catch (error) {
    console.error("Set cookie error:", error);
    return NextResponse.json(
      { error: "Failed to set cookies" },
      { status: 500 }
    );
  }
}
