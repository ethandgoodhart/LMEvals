import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase environment variables are not set');
}
const supabase = createClient(supabaseUrl, supabaseKey);

// POST: Upvote an eval
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { eval_id } = body;
    if (!eval_id) {
      return NextResponse.json({ error: 'Missing eval_id' }, { status: 400 });
    }
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Insert upvote if not exists
    const { error: insertError } = await supabase.from('eval_upvotes').insert({ eval_id, user_id: user.id }).select();
    if (insertError && !insertError.message.includes('duplicate key')) {
      return NextResponse.json({ error: 'Failed to upvote' }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Remove upvote
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const eval_id = searchParams.get('eval_id');
    if (!eval_id) {
      return NextResponse.json({ error: 'Missing eval_id' }, { status: 400 });
    }
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await supabase.from('eval_upvotes').delete().eq('eval_id', eval_id).eq('user_id', user.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET: Get upvote count and if user has upvoted
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const eval_id = searchParams.get('eval_id');
    if (!eval_id) {
      return NextResponse.json({ error: 'Missing eval_id' }, { status: 400 });
    }
    let userId = null;
    const authHeader = request.headers.get('Authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) userId = user.id;
    }
    // Count upvotes
    const { count, error: countError } = await supabase.from('eval_upvotes').select('*', { count: 'exact', head: true }).eq('eval_id', eval_id);
    if (countError) {
      return NextResponse.json({ error: 'Failed to get upvote count' }, { status: 500 });
    }
    // Check if user has upvoted
    let hasUpvoted = false;
    if (userId) {
      const { data: upvoteRow } = await supabase.from('eval_upvotes').select('*').eq('eval_id', eval_id).eq('user_id', userId).single();
      hasUpvoted = !!upvoteRow;
    }
    return NextResponse.json({ count, hasUpvoted });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 