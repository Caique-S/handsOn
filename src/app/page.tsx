import { ChartBarBig, Truck } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <>
      <div className="flex justify-center items-center gap-2 h-screen w-full">
        <Link href={"/carregamento/new"} passHref>
          <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            <Truck className="w-4 h-4" />
            Novo Carregamento
          </button> 
        </Link>
        <Link href={"/carregamento/dashboard"}>
          <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            <ChartBarBig className="w-4 h-4" />
            Dashboard
          </button>
        </Link>
      </div>
    </>
  );
}
