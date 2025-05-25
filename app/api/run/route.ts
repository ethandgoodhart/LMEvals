import { NextResponse } from 'next/server';
import { backOff } from "exponential-backoff";
import { createClient } from '@supabase/supabase-js';

// const openrouter_key = "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"
const openrouter_key = "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";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase environment variables are not set');
}
const supabase = createClient(supabaseUrl, supabaseKey);

// Helper to get a completion from OpenRouter
async function getCompletion(model: string, prompt: string): Promise<string> {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openrouter_key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "user", content: prompt }
      ],
      max_tokens: 1024
    })
  });
  const rawText = await response.text();
  console.log('OpenRouter raw response:', rawText);
  let data;
  try {
    data = JSON.parse(rawText);
  } catch (e) {
    throw new Error('Non-JSON response from OpenRouter: ' + rawText);
  }
  if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
    throw new Error('Invalid completion response');
  }
  return data.choices[0].message.content.trim();
}

// Helper to score a completion using the evalPrompt
async function scoreCompletion(model: string, evalPrompt: string, prompt: string, completion: string): Promise<number> {
  // Compose the evaluation message for JSON mode
  const evalMessage = `
You are an evaluation assistant. Given the following response and evaluation instructions, return a JSON object with two keys:
- "explanation": a brief explanation for the score (1-2 sentences)
- "score": an integer from 0 to 100

Instructions: "${evalPrompt}"

Response: ${completion}

Return ONLY valid JSON in this format:
{"explanation": "...", "score": 42}
`;

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openrouter_key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: "openai/chatgpt-4o-latest",
      response_format: { type: "json_object" },
      messages: [
        { role: "user", content: evalMessage }
      ]
    })
  });

  const data = await response.json();
  if (
    !data.choices ||
    !data.choices[0] ||
    !data.choices[0].message ||
    !data.choices[0].message.content
  ) {
    throw new Error('Invalid evaluation response');
  }

  let content = data.choices[0].message.content.trim();

  // Try to parse JSON
  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch (e) {
    // Try to extract JSON substring if model returned extra text
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch (e2) {
        throw new Error('Could not parse JSON from evaluation response');
      }
    } else {
      throw new Error('Could not parse JSON from evaluation response');
    }
  }

  if (
    typeof parsed.score === "number" &&
    parsed.score >= 0 &&
    parsed.score <= 100
  ) {
    return parsed.score;
  }

  throw new Error('Could not extract score from evaluation response');
}

// Optionally, run multiple trials for robustness
async function getScore(model: string, evalPrompt: string, prompt: string, completion: string): Promise<number> {
  try {
    const score = await scoreCompletion(model, evalPrompt, prompt, completion);
    return Number((score / 100).toFixed(2));
  } catch (e) {
    return -1;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { models, prompt, evalPrompt, title } = body;
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Check credits in user_metadata
    let credits = (user.user_metadata && typeof user.user_metadata.credits === 'number') ? user.user_metadata.credits : 3;
    if (credits <= 0) {
      return NextResponse.json({ error: 'You are out of credits. Please contact support or wait for more.' }, { status: 403 });
    }
    // Decrement credits and update user_metadata
    const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
      user_metadata: { ...user.user_metadata, credits: credits - 1 }
    });
    if (updateError) {
      return NextResponse.json({ error: 'Failed to update credits.' }, { status: 500 });
    }
    // Save eval to supabase
    // Get email prefix for author
    const emailPrefix = user.email ? user.email.split('@')[0] : null;
    const { data: evalRow, error: evalError } = await supabase.from('evals').insert({
      user_id: user.id,
      prompt,
      eval_prompt: evalPrompt,
      models,
      title,
      author: emailPrefix,
      is_public: false
    }).select().single();
    if (evalError) {
      return NextResponse.json({ error: 'Failed to save eval' }, { status: 500 });
    }
    // Stream results back to UI
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        controller.enqueue(encoder.encode(JSON.stringify({ eval_id: evalRow.id }) + '\n'));
        let allResults: { model: string, score: number }[] = [];
        const concurrency = 5;
        let current = 0;
        let finished = 0;
        const results: (Promise<void> | null)[] = Array(models.length).fill(null);
        // Helper to process a single model
        const processModel = async (model: string, idx: number) => {
          try {
            const numTrials = 5;
            let scores: number[] = [];
            let completions: string[] = [];
            let completionObjs: { answer: string, score: number }[] = [];
            for (let i = 0; i < numTrials; i++) {
              const completion = await getCompletion(model, prompt);
              const score = await getScore(model, evalPrompt, prompt, completion);
              scores.push(score);
              completions.push(completion);
              completionObjs.push({ answer: completion, score });
              // Stream partial result after each trial
              const validScores = scores.filter(s => s !== -1);
              const avgScore = validScores.length > 0 ? Number((validScores.reduce((a, b) => a + b, 0) / validScores.length).toFixed(2)) : -1;
              const result = { model, score: avgScore, trials: i + 1, completions: [...completionObjs] };
              controller.enqueue(encoder.encode(JSON.stringify(result) + '\n'));
            }
            // After all trials, insert into supabase
            const validScores = scores.filter(s => s !== -1);
            const avgScore = validScores.length > 0 ? Number((validScores.reduce((a, b) => a + b, 0) / validScores.length).toFixed(2)) : -1;
            const trials = numTrials;
            await supabase.from('eval_results').insert({
              eval_id: evalRow.id,
              model,
              score: avgScore,
              trials,
              completions: completionObjs
            }).select().single();
            allResults.push({ model, score: avgScore });
          } catch (err) {
            const result = { model, error: (err as Error).message };
            controller.enqueue(encoder.encode(JSON.stringify(result) + '\n'));
          } finally {
            finished++;
            if (finished === models.length) {
              if (allResults.length > 0) {
                const best: { model: string, score: number } = allResults.reduce((a, b) => (a.score > b.score ? a : b));
                const modelIconsMap: { [key: string]: string } = {
                  'openai/gpt-4o-mini': 'https://static.vecteezy.com/system/resources/previews/021/059/827/non_2x/chatgpt-logo-chat-gpt-icon-on-white-background-free-vector.jpg',
                  'google/gemini-2.5-flash-preview-05-20': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Google_Favicon_2025.svg/330px-Google_Favicon_2025.svg.png',
                  'anthropic/claude-3.5-haiku': 'https://openrouter.ai/images/icons/Anthropic.svg',
                  'x-ai/grok-3-mini-beta': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcROcXRdeEoeB-Kl449XzrchCvGwxDaTRltKSg&s',
                  'meta-llama/llama-3.3-70b-instruct': 'https://res.cloudinary.com/apideck/image/upload/w_196,f_auto/v1677940393/marketplaces/ckhg56iu1mkpc0b66vj7fsj3o/listings/meta_nnmll6.webp',
                };
                await supabase.from('evals').update({
                  best_model: best.model,
                  best_model_score: best.score,
                  best_model_icon: modelIconsMap[best.model as string] || ''
                }).eq('id', evalRow.id);
              }
              controller.close();
            }
          }
        };
        // Start up to concurrency models at once
        function launchNext() {
          while (current < models.length && results.filter(r => r !== null).length < concurrency) {
            const idx = current;
            results[idx] = processModel(models[idx], idx);
            results[idx]!.then(() => {
              results[idx] = null;
              launchNext();
            });
            current++;
          }
        }
        launchNext();
      }
    });
    return new Response(stream, { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
  } catch (error) {
    console.error('Error in POST handler:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}