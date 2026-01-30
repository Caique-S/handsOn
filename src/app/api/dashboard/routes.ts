import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/app/lib/mongodb'
import { Carregamento, toDocaStatus } from '@/app/lib/models/Carregamento'

export async function GET(request: NextRequest) {
  try {
    const client = await clientPromise
    const db = client.db(process.env.MONGODB_DB)
    
    // Obter parâmetros da query
    const searchParams = request.nextUrl.searchParams
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
    
    // Filtrar por data
    const startDate = new Date(date)
    startDate.setHours(0, 0, 0, 0)
    const endDate = new Date(date)
    endDate.setHours(23, 59, 59, 999)
    
    const carregamentos = await db
      .collection<Carregamento>('carregamentos')
      .find({
        createdAt: {
          $gte: startDate,
          $lte: endDate
        }
      })
      .toArray()
    
    // Converter para formato do dashboard
    const todasDocas = carregamentos.map(toDocaStatus)
    
    // Calcular estatísticas
    const docasEmUso = carregamentos.filter(c => c.status === 'em_uso').length
    const rotasLiberadas = carregamentos.filter(c => c.status === 'liberada').length
    const docasDisponiveis = 20 - carregamentos.length // Supondo 20 docas totais
    
    const cargaTotal = carregamentos.reduce(
      (acc, curr) => ({
        gaiolas: acc.gaiolas + curr.cargas.gaiolas,
        volumosos: acc.volumosos + curr.cargas.volumosos,
        mangaPallets: acc.mangaPallets + curr.cargas.mangaPallets,
      }),
      { gaiolas: 0, volumosos: 0, mangaPallets: 0 }
    )
    
    const eficiencia = carregamentos.length > 0
      ? Math.round((rotasLiberadas / (docasEmUso + rotasLiberadas)) * 100)
      : 0
    
    const stats = {
      docasEmUso,
      rotasLiberadas,
      docasDisponiveis,
      tempoMedio: calcularTempoMedio(carregamentos),
      eficiencia,
      cargaTotal
    }
    
    return NextResponse.json({
      stats,
      todasDocas,
      totalCarregamentos: carregamentos.length
    })
  } catch (error) {
    console.error('Erro ao buscar dados do dashboard:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar dados do dashboard' },
      { status: 500 }
    )
  }
}

function calcularTempoMedio(carregamentos: Carregamento[]): string {
  if (carregamentos.length === 0) return "00:00"
  
  const tempos = carregamentos
    .map(c => {
      if (!c.horarios.encostouDoca || !c.horarios.liberacao) return 0
      
      const entrada = new Date(`2000-01-01T${c.horarios.encostouDoca}`)
      const saida = new Date(`2000-01-01T${c.horarios.liberacao}`)
      return saida.getTime() - entrada.getTime()
    })
    .filter(t => t > 0)
  
  if (tempos.length === 0) return "00:00"
  
  const mediaMs = tempos.reduce((a, b) => a + b, 0) / tempos.length
  const horas = Math.floor(mediaMs / (1000 * 60 * 60))
  const minutos = Math.floor((mediaMs % (1000 * 60 * 60)) / (1000 * 60))
  
  return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`
}