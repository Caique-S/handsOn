import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ message: 'API está funcionando' ,
        MONGODB_URI: process.env.MONGODB_URI ? 'Definida' : 'Não definida',
        MONGODB_DB: process.env.MONGODB_DB ? 'Definida' : 'Não definida',
  })
}