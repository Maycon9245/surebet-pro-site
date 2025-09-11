import { NextResponse } from 'next/server'

export async function GET() {
  const MOCK_DATA = {
    last_updated: new Date().toISOString(),
    count: 3,
    surebets: [
      {
        event: "Flamengo vs Palmeiras",
        sport: "Futebol",
        start_time_br: "21:00",
        profit: 4.2,
        outcomes: [
          { team: "Flamengo", odd: 2.15, bookmaker: "Betfair" },
          { team: "Palmeiras", odd: 2.08, bookmaker: "Pinnacle" }
        ]
      }
    ]
  }

  return NextResponse.json(MOCK_DATA)
}