import { NextResponse } from "next/server";
import { MongoClient, ObjectId } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017";
const MONGODB_DB = process.env.MONGODB_DB || "seubanco";
const COLLECTION = "carregamentos";

async function connectToDatabase() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(MONGODB_DB);
  return { client, db };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  let client;
  try {
    // Desempacotar a Promise params
    const { id } = await params;

    const { client: mongoClient, db } = await connectToDatabase();
    client = mongoClient;

    const collection = db.collection(COLLECTION);
    const carregamento = await collection.findOne({
      _id: new ObjectId(id),
    });

    if (!carregamento) {
      return NextResponse.json(
        { error: "Carregamento não encontrado" },
        { status: 404 },
      );
    }

    return NextResponse.json(carregamento);
  } catch (error) {
    console.error("Erro ao buscar carregamento:", error);
    return NextResponse.json(
      { error: "Erro ao buscar carregamento" },
      { status: 500 },
    );
  } finally {
    if (client) await client.close();
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  let client;
  try {
    // Desempacotar a Promise params
    const { id } = await params;
    const body = await request.json();

    const { client: mongoClient, db } = await connectToDatabase();
    client = mongoClient;
    const collection = db.collection(COLLECTION);

    const now = new Date();
    const updateData = {
      ...body,
      updatedAt: now,
    };

    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData },
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Carregamento não encontrado" },
        { status: 404 },
      );
    }

    const carregamentoAtualizado = await collection.findOne({
      _id: new ObjectId(id),
    });

    return NextResponse.json({
      success: true,
      message: "Carregamento atualizado com sucesso",
      data: carregamentoAtualizado,
    });
  } catch (error) {
    console.error("Erro ao atualizar carregamento:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erro ao atualizar carregamento",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  } finally {
    if (client) await client.close();
  }
}
