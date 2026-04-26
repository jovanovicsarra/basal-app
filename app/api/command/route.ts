import OpenAI from 'openai'
import { NextResponse } from 'next/server'

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: Request) {
  try {
    const { command } = await req.json()

    const response = await client.responses.create({
      model: 'gpt-4.1-mini',
      input: `
You are BASAL, an AI command parser for a company operating assistant.

Convert the user's message into JSON only.

Return this exact shape:
{
  "action": "add_transaction",
  "type": "income" or "expense",
  "amount": number,
  "description": string
}

Rules:
- If user paid/spent/bought/platila/platio/kupila/kupili/trošak/trosak = expense
- If user received/earned/primila/uplata/prihod/zaradili = income
- amount must be positive number
- description should be short business description
- return JSON only, no markdown

User message:
${command}
      `,
    })

    const text = response.output_text.trim()
    const parsed = JSON.parse(text)

    return NextResponse.json(parsed)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'AI parsing failed' },
      { status: 500 }
    )
  }
}
