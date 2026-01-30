// @ts-nocheck

import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import clientPromise from '../../lib/mongodb'
import { Carregamento } from '../../lib/models/Carregamento'

// Note que no Next.js 14, `params` é uma Promise
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Aguardar a Promise dos params
    const { id } = await params
    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB || 'carregamentos_db')
    
    const carregamento = await db
      .collection<Carregamento>('carregamentos')
      .findOne({ _id: new ObjectId(id) })
    
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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB || 'carregamentos_db')
    
    const updates = await request.json()
    
    const result = await db
      .collection<Carregamento>('carregamentos')
      .updateOne(
        { _id: new ObjectId(id) },
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB || 'carregamentos_db')
    
    const result = await db
      .collection<Carregamento>('carregamentos')
      .deleteOne({ _id: new ObjectId(id) })
    
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