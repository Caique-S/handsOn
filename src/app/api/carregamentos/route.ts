import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/app/lib/mongodb'
import { Carregamento } from '@/app/lib/models/Carregamento'

// GET - Listar todos os carregamentos (com filtros)
export async function GET(request: NextRequest) {
  try {
    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB)
    
    // Obter parâmetros da query
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const date = searchParams.get('date')
    
    // Construir filtro
    const filter: any = {}
    if (status) filter.status = status
    if (date) {
      // Filtro por data (simplificado)
      const startDate = new Date(date)
      startDate.setHours(0, 0, 0, 0)
      const endDate = new Date(date)
      endDate.setHours(23, 59, 59, 999)
      
      filter.createdAt = {
        $gte: startDate,
        $lte: endDate
      }
    }
    
    const carregamentos = await db
      .collection<Carregamento>('carregamentos')
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray()
    
    return NextResponse.json(carregamentos)
  } catch (error) {
    console.error('Erro ao buscar carregamentos:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar carregamentos' },
      { status: 500 }
    )
  }
}

// POST - Criar novo carregamento
export async function POST(request: NextRequest) {
  try {
    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB)
    
    const body: Carregamento = await request.json()
    
    // Validar dados obrigatórios
    if (!body.doca || !body.cidadeDestino || !body.motorista.nome) {
      return NextResponse.json(
        { error: 'Dados obrigatórios faltando' },
        { status: 400 }
      )
    }
    
    // Preparar documento
    const carregamento: Carregamento = {
      ...body,
      status: 'em_uso', // Status inicial
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    const result = await db
      .collection<Carregamento>('carregamentos')
      .insertOne(carregamento)
    
    return NextResponse.json(
      { 
        message: 'Carregamento criado com sucesso',
        id: result.insertedId 
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Erro ao criar carregamento:', error)
    return NextResponse.json(
      { error: 'Erro ao criar carregamento' },
      { status: 500 }
    )
  }
}