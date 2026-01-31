import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const MONGODB_DB = process.env.MONGODB_DB || 'seubanco';
const COLLECTION = 'carregamentos';

async function connectToDatabase() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(MONGODB_DB);
  return { client, db };
}

// Função para calcular diferença de tempo
function calcularDiferencaHoras(inicio: string, fim: string): string {
  if (!inicio || !fim) return "00:00";
  
  const [h1, m1] = inicio.split(':').map(Number);
  const [h2, m2] = fim.split(':').map(Number);
  
  const inicioMinutos = h1 * 60 + m1;
  const fimMinutos = h2 * 60 + m2;
  
  if (fimMinutos < inicioMinutos) return "00:00";
  
  const diferencaMinutos = fimMinutos - inicioMinutos;
  const horas = Math.floor(diferencaMinutos / 60);
  const minutos = diferencaMinutos % 60;
  
  return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`;
}

function calcularTempoMedio(docas: any[]): string {
  const docasEmUso = docas.filter(d => d.status === "em_uso" && d.horarios?.encostouDoca);
  
  if (docasEmUso.length === 0) return "00:00";
  
  let totalMinutos = 0;
  const agora = new Date();
  const horaAtual = agora.getHours();
  const minutoAtual = agora.getMinutes();
  
  docasEmUso.forEach(doca => {
    if (doca.horarios?.encostouDoca) {
      const [h, m] = doca.horarios.encostouDoca.split(':').map(Number);
      const inicioMinutos = h * 60 + m;
      const atualMinutos = horaAtual * 60 + minutoAtual;
      
      if (atualMinutos > inicioMinutos) {
        totalMinutos += (atualMinutos - inicioMinutos);
      }
    }
  });
  
  const mediaMinutos = Math.floor(totalMinutos / docasEmUso.length);
  const horas = Math.floor(mediaMinutos / 60);
  const minutos = mediaMinutos % 60;
  
  return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`;
}

function calcularEficiencia(docas: any[]): number {
  const docasLiberadas = docas.filter(d => d.status === "liberada");
  const docasEmUso = docas.filter(d => d.status === "em_uso");
  
  if (docasLiberadas.length + docasEmUso.length === 0) return 0;
  
  const totalProcessadas = docasLiberadas.length + docasEmUso.length;
  const eficiencia = (docasLiberadas.length / totalProcessadas) * 100;
  
  return Math.min(Math.round(eficiencia), 100);
}

export async function GET(request: Request) {
  let client;
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    
    const { client: mongoClient, db } = await connectToDatabase();
    client = mongoClient;
    const collection = db.collection(COLLECTION);
    
    // Buscar todos os carregamentos
    const query: any = {};
    
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      
      query.createdAt = {
        $gte: startDate,
        $lte: endDate
      };
    }
    
    const carregamentos = await collection.find(query).sort({ doca: 1 }).toArray();
    
    // Transformar dados para o formato do dashboard
    const todasDocas = carregamentos.map((item) => {
      let status: "ocupada" | "liberada" | "disponivel" = "disponivel";
      
      if (item.status === "em_uso") {
        status = "ocupada";
      } else if (item.status === "liberada") {
        status = "liberada";
      }
      
      let tempoTotal = "";
      if (item.horarios?.encostouDoca && item.horarios?.liberacao) {
        tempoTotal = calcularDiferencaHoras(item.horarios.encostouDoca, item.horarios.liberacao);
      }
      
      return {
        id: item.doca,
        doca: item.doca,
        status,
        motorista: item.motorista?.nome || "N/A",
        cidadeDestino: item.cidadeDestino,
        placaVeiculo: item.placas?.placaSimples,
        tipoVeiculo: item.tipoVeiculo,
        horarioEntrada: item.horarios?.encostouDoca,
        horarioSaida: item.horarios?.liberacao,
        tempoTotal,
        carga: {
          gaiolas: item.cargas?.gaiolas || 0,
          volumosos: item.cargas?.volumosos || 0,
          mangaPallets: item.cargas?.mangaPallets || 0,
        },
        sequenciaCarro: item.sequenciaCarro,
        horarios: item.horarios,
        lacres: item.lacres,
        _id: item._id.toString(),
      };
    });
    
    // Calcular estatísticas
    const stats = {
      docasEmUso: todasDocas.filter((d) => d.status === "ocupada").length,
      rotasLiberadas: todasDocas.filter((d) => d.status === "liberada").length,
      docasDisponiveis: Math.max(0, 20 - todasDocas.filter((d) => d.status === "ocupada").length),
      tempoMedio: calcularTempoMedio(carregamentos),
      eficiencia: calcularEficiencia(carregamentos),
      cargaTotal: {
        gaiolas: todasDocas.reduce((sum, d) => sum + (d.carga?.gaiolas || 0), 0),
        volumosos: todasDocas.reduce((sum, d) => sum + (d.carga?.volumosos || 0), 0),
        mangaPallets: todasDocas.reduce((sum, d) => sum + (d.carga?.mangaPallets || 0), 0),
      },
    };
    
    return NextResponse.json({
      stats,
      todasDocas,
      timestamp: new Date().toISOString(),
      totalRegistros: carregamentos.length,
      success: true,
    });
    
  } catch (error) {
    console.error('Erro na API do dashboard:', error);
    
    // Fallback para desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      const mockData = [
        {
          id: 2,
          doca: 2,
          status: "ocupada" as const,
          motorista: "Marcio",
          cidadeDestino: "Juazeiro - BA",
          placaVeiculo: "NUT-3H18",
          tipoVeiculo: "3/4" as const,
          horarioEntrada: "16:09",
          carga: {
            gaiolas: 12,
            volumosos: 8,
            mangaPallets: 9,
          },
          _id: "697ce2f9514cc08d275122a0",
        }
      ];
      
      const mockStats = {
        docasEmUso: 1,
        rotasLiberadas: 0,
        docasDisponiveis: 19,
        tempoMedio: "01:30",
        eficiencia: 85,
        cargaTotal: {
          gaiolas: 12,
          volumosos: 8,
          mangaPallets: 9,
        },
      };
      
      return NextResponse.json({
        stats: mockStats,
        todasDocas: mockData,
        timestamp: new Date().toISOString(),
        totalRegistros: mockData.length,
        success: false,
        error: "Usando dados mockados - MongoDB indisponível",
      });
    }
    
    return NextResponse.json(
      { 
        error: 'Erro ao carregar dados do dashboard',
        success: false 
      },
      { status: 500 }
    );
  } finally {
    if (client) await client.close();
  }
}