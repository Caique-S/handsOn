import { MongoClient, MongoClientOptions } from 'mongodb'
import { attachDatabasePool } from '@vercel/functions'

const options: MongoClientOptions={
  appName: "devrel.vercel.integration",
  maxIdleTimeMS: 5000
}

const clientPromise = new MongoClient(process.env.MONGODB_URI, options)

attachDatabasePool(clientPromise)

{/*       
  
  if (!process.env.MONGODB_URI) {
    throw new Error('Por favor, adicione a URI do MongoDB no arquivo .env.local')
  }
  
  const uri = process.env.MONGODB_URI
  const options = {}

  let client
  let clientPromise: Promise<MongoClient>

if (process.env.NODE_ENV === 'development') {
  // Em desenvolvimento, use uma variável global para preservar a conexão
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>
  }
  
  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options)
    globalWithMongo._mongoClientPromise = client.connect()
  }
  clientPromise = globalWithMongo._mongoClientPromise
  } else {
    // Em produção, sempre crie uma nova conexão
  client = new MongoClient(uri, options)
  clientPromise = client.connect()
}
*/}

export default clientPromise