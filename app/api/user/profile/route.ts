// app/api/user/profile/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabase } from '@/lib/supabase';

export async function PUT(request: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value;
    const accessToken = cookieStore.get('accessToken')?.value;

    // Debug logging
    // console.log('Cookies received:', { 
    //   userId: userId ? 'present' : 'missing', 
    //   accessToken: accessToken ? 'present' : 'missing',
    //   allCookies: cookieStore.getAll().map(c => c.name)
    // });

    if (!userId || !accessToken) {
      return NextResponse.json(
        { 
          error: 'Unauthorized - Please login again',
          debug: {
            hasUserId: !!userId,
            hasAccessToken: !!accessToken,
            availableCookies: cookieStore.getAll().map(c => c.name)
          }
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { username, avatarId } = body;

    // Build update object
    const updates: any = {};
    if (username !== undefined) updates.username = username;
    if (avatarId !== undefined) updates.avatar_id = avatarId;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No updates provided' },
        { status: 400 }
      );
    }

    // Update user profile in Supabase
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        message: 'Profile updated successfully', 
        user: data 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value;

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ user: data }, { status: 200 });
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}