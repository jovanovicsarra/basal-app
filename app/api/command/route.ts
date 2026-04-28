import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { command } = await req.json()

    return NextResponse.json({
      success: true,
      parsed: {
        text: command
      }
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    )
  }
}