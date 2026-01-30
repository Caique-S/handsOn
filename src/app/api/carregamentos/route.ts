import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'

// Interface para os parâmetros
interface Params {
  id: string
}

// 🔥 SOLUÇÃO: Definir tipos inline para evitar conflitos do TypeScript
export async function GET(
  request: NextRequest,
  context: { params: Promise<Params> }
): Promise<NextResponse> {
  try {
    const params = await context.params
    const { id } = params
    
    // Conexão com MongoDB (ajuste o caminho conforme sua estrutura)
    const { MongoClient } = await import('mongodb')
    const client = new MongoClient(process.env.MONGODB_URI!)
    await client.connect()
    const db = client.db(process.env.MONGODB_DB || 'carregamentos_db')
    
    const carregamento = await db
      .collection('carregamentos')
      .findOne({ _id: new ObjectId(id) })
    
    await client.close()
    
    if (!carregamento) {
      return NextResponse.json(
        { error: 'Carregamento não encontrado' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(carregamento)
  } catch (error: any) {
    console.error('Erro ao buscar carregamento:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao buscar carregamento' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<Params> }
): Promise<NextResponse> {
  try {
    const params = await context.params
    const { id } = params
    
    const { MongoClient } = await import('mongodb')
    const client = new MongoClient(process.env.MONGODB_URI!)
    await client.connect()
    const db = client.db(process.env.MONGODB_DB || 'carregamentos_db')
    
    const updates = await request.json()
    
    const result = await db
      .collection('carregamentos')
      .updateOne(
        { _id: new ObjectId(id) },
        { 
          $set: {
            ...updates,
            updatedAt: new Date()
          }
        }
      )
    
    await client.close()
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Carregamento não encontrado' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      message: 'Carregamento atualizado com sucesso',
      modifiedCount: result.modifiedCount
    })
  } catch (error: any) {
    console.error('Erro ao atualizar carregamento:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao atualizar carregamento' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<Params> }
): Promise<NextResponse> {
  try {
    const params = await context.params
    const { id } = params
    
    const { MongoClient } = await import('mongodb')
    const client = new MongoClient(process.env.MONGODB_URI!)
    await client.connect()
    const db = client.db(process.env.MONGODB_DB || 'carregamentos_db')
    
    const result = await db
      .collection('carregamentos')
      .deleteOne({ _id: new ObjectId(id) })
    
    await client.close()
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Carregamento não encontrado' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      message: 'Carregamento removido com sucesso',
      deletedCount: result.deletedCount
    })
  } catch (error: any) {
    console.error('Erro ao remover carregamento:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao remover carregamento' },
      { status: 500 }
    )
  }
}