import { NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';

// Configuração do MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const MONGODB_DB = process.env.MONGODB_DB || 'seubanco';
const COLLECTION = 'carregamentos';

async function connectToDatabase() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(MONGODB_DB);
  return { client, db };
}

// GET - Listar todos os carregamentos
export async function GET() {
  let client;
  try {
    const { client: mongoClient, db } = await connectToDatabase();
    client = mongoClient;
    
    const collection = db.collection(COLLECTION);
    const carregamentos = await collection.find({}).sort({ doca: 1 }).toArray();
    
    return NextResponse.json(carregamentos, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('Erro na API de carregamentos:', error);
    return NextResponse.json(
      { error: 'Erro ao carregar dados de carregamentos' },
      { status: 500 }
    );
  } finally {
    if (client) await client.close();
  }
}

// POST - Criar novo carregamento
export async function POST(request: Request) {
  let client;
  try {
    const body = await request.json();
    
    console.log('Recebendo dados:', body);
    
    // Validar campos obrigatórios
    if (!body.doca || !body.cidadeDestino || !body.motorista) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Campos obrigatórios faltando: doca, cidadeDestino, motorista'
        },
        { status: 400 }
      );
    }
    
    const { client: mongoClient, db } = await connectToDatabase();
    client = mongoClient;
    const collection = db.collection(COLLECTION);
    
    // Verificar se a doca já está em uso
    const docaEmUso = await collection.findOne({
      doca: Number(body.doca),
      status: "em_uso"
    });
    
    if (docaEmUso) {
      return NextResponse.json(
        { 
          success: false,
          error: `Doca ${body.doca} já está em uso por ${docaEmUso.motorista.nome}`
        },
        { status: 400 }
      );
    }
    
    // Preparar dados para inserção
    const now = new Date();
    const horaAtual = now.toLocaleTimeString('pt-BR', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    const novoCarregamento = {
      doca: Number(body.doca),
      cidadeDestino: body.cidadeDestino,
      sequenciaCarro: body.sequenciaCarro || 0,
      motorista: {
        nome: typeof body.motorista === 'string' ? body.motorista : body.motorista.nome || "",
        cpf: typeof body.motorista === 'string' ? "" : body.motorista.cpf || ""
      },
      tipoVeiculo: body.tipoVeiculo || "3/4",
      placas: {
        placaSimples: body.placas?.placaSimples || body.placaVeiculo || ""
      },
      horarios: {
        encostouDoca: horaAtual,
        inicioCarregamento: "",
        fimCarregamento: "",
        liberacao: ""
      },
      lacres: {
        traseiro: body.lacres?.traseiro || "",
        lateralEsquerdo: body.lacres?.lateralEsquerdo || "",
        lateralDireito: body.lacres?.lateralDireito || ""
      },
      cargas: {
        gaiolas: Number(body.cargas?.gaiolas || body.gaiolas || 0),
        volumosos: Number(body.cargas?.volumosos || body.volumosos || 0),
        mangaPallets: Number(body.cargas?.mangaPallets || body.mangaPallets || 0)
      },
      status: "em_uso",
      createdAt: now,
      updatedAt: now
    };
    
    // Inserir no MongoDB
    const result = await collection.insertOne(novoCarregamento);
    
    console.log('Carregamento criado no MongoDB:', result.insertedId);
    
    // Buscar o documento inserido para retornar com _id
    const carregamentoInserido = await collection.findOne({ _id: result.insertedId });
    
    return NextResponse.json({
      success: true,
      message: 'Carregamento criado com sucesso',
      data: carregamentoInserido
    }, { 
      status: 201,
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
  } catch (error) {
    console.error('Erro ao criar carregamento:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro ao processar a solicitação',
        details: error instanceof Error ? error.message : String(error)
      },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
  } finally {
    if (client) await client.close();
  }
}