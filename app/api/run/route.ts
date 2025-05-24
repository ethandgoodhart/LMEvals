import { NextResponse } from 'next/server';
import { backOff } from "exponential-backoff";

const openrouter_key = "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"

// This code is old and should be updated to use the new Prompt + Evlautation format to score
async function processCompletion(model: string, target: string, statement: string): Promise<number> {
  const makeRequest = async () => {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openrouter_key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model,
        messages: [{
          role: "user",
          content: `You are a research assistant helping analyze statements. Based on your knowledge and analysis, assign a numerical score from 1-100 representing your assessment of how accurate or true the following statement is. Only output the score number, no other text.\n\nStatement to analyze:\n${target} ${statement}`
        }]
      })
    });

    const data = await response.json();
    const content = data.choices[0].message.content.trim();
    
    if (/^\d+$/.test(content)) {
      return parseInt(content);
    }
    throw new Error('Invalid response format');
  };

  try {
    const result = await backOff(() => makeRequest());
    return result;
  } catch (error) {
    console.error('Error in processCompletion:', error);
    return -1;
  }
}

async function agreementScore(model: string, target: string, statement: string): Promise<{score: number, trials: number}> {
  const numAttempts = 20
  const scores: number[] = []

  const promises = Array(numAttempts).fill(null).map(() => 
    processCompletion(model, target, statement)
  )

  const results = await Promise.all(promises)
  
  const validScores = results.filter(score => score !== -1)
  
  if (validScores.length > 0) {
    console.log(validScores);
    const average = validScores.reduce((a, b) => a + b, 0) / validScores.length
    return {
      score: Number((average / 100).toFixed(2)),
      trials: validScores.length
    }
  }
  
  return {
    score: -1,
    trials: -1
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { dataset, target } = body

    if (!dataset || !target) {
      return NextResponse.json(
        { error: "Dataset and target are required" },
        { status: 400 }
      )
    }

    const updatedDataset = await Promise.all(
      dataset.map(async (item: any) => {
        const statement = item.question.slice(`Do ${target} `.length)
        const result = await agreementScore("openai/chatgpt-4o-latest", target, statement)
        return {
          ...item,
          actual: result.score,
          trials: result.trials
        }
      })
    )

    return NextResponse.json(updatedDataset)

  } catch (error) {
    console.error('Error in POST handler:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}