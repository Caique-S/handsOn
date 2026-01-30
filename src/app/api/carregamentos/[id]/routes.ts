import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import clientPromise from '@/app/lib/mongodb'
import { Carregamento } from '@/app/lib/models/Carregamento'

interface Params {
  params: {
    id: string
  }
}

// GET - Buscar carregamento por ID
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB)
    
    const carregamento = await db
      .collection<Carregamento>('carregamentos')
      .findOne({ _id: new ObjectId(params.id) })
    
    if (!carregamento) {
      return NextResponse.json(
        { error: 'Carregamento não encontrado' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(carregamento)
  } catch (error) {
    console.error('Erro ao buscar carregamento:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar carregamento' },
      { status: 500 }
    )
  }
}

// PUT - Atualizar carregamento
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB)
    
    const updates = await request.json()
    
    const result = await db
      .collection<Carregamento>('carregamentos')
      .updateOne(
        { _id: new ObjectId(params.id) },
        { 
          $set: {
            ...updates,
            updatedAt: new Date()
          }
        }
      )
    
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
  } catch (error) {
    console.error('Erro ao atualizar carregamento:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar carregamento' },
      { status: 500 }
    )
  }
}

// DELETE - Remover carregamento
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB)
    
    const result = await db
      .collection<Carregamento>('carregamentos')
      .deleteOne({ _id: new ObjectId(params.id) })
    
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
  } catch (error) {
    console.error('Erro ao remover carregamento:', error)
    return NextResponse.json(
      { error: 'Erro ao remover carregamento' },
      { status: 500 }
    )
  }
}