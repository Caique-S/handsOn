import { ChartBarBig, Truck, Upload } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <>
      <div className="flex flex-col justify-center items-center gap-4 h-screen w-full">
        <div className="flex gap-4">
          <Link href={"/carregamento/new"} passHref>
            <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              <Truck className="w-4 h-4" />
              Novo Carregamento
            </button>
          </Link>
          <Link href={"/carregamento/dashboard"}>
            <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              <ChartBarBig className="w-4 h-4" />
              Dashboard
            </button>
          </Link>
        </div>

        <div className="mt-8 p-6 bg-gray-50 rounded-lg border border-gray-200 max-w-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Upload de Dados</h3>
          <p className="text-gray-600 mb-4">
            Faça upload de um arquivo CSV para processar dados automaticamente
          </p>
          <Link href={"/carregamento/upload"} passHref>
            <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Upload className="w-4 h-4" />
              Upload de CSV
            </button>
          </Link>
        </div>
      </div>
    </>
  );
}
