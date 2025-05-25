import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase environment variables are not set');
}
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { eval_id, title } = body;
    if (!eval_id || !title) {
      return NextResponse.json({ error: 'Missing eval_id or title' }, { status: 400 });
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
    // Check ownership
    const { data: evalRow, error: fetchError } = await supabase.from('evals').select('id,user_id').eq('id', eval_id).single();
    if (fetchError || !evalRow) {
      return NextResponse.json({ error: 'Eval not found' }, { status: 404 });
    }
    if (evalRow.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    // Update title
    const { error: updateError } = await supabase.from('evals').update({ title }).eq('id', eval_id);
    if (updateError) {
      return NextResponse.json({ error: 'Failed to update title' }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in update title handler:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 