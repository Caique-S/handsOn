import { ObjectId } from 'mongodb'

export interface Carregamento {
  _id?: ObjectId
  doca: number
  cidadeDestino: string
  sequenciaCarro: number
  motorista: {
    nome: string
    cpf?: string
  }
  tipoVeiculo: "3/4" | "TOCO" | "TRUCK" | "CARROCERIA"
  placas: {
    placaSimples?: string
    cavaloMecanico?: string
    bau?: string
  }
  horarios: {
    encostouDoca: string
    inicioCarregamento: string
    fimCarregamento: string
    liberacao: string,
    previsaoChegada?: string
  }
  lacres: {
    traseiro: number
    lateralEsquerdo?: number
    lateralDireito?: number
  }
  cargas: {
    gaiolas: number
    volumosos: number
    mangaPallets: number
  }
  status: "em_uso" | "liberada" | "disponivel"
  createdAt: Date
  updatedAt: Date
  observacoes?: string
}

// Função para converter para DocaStatus do dashboard
export function toDocaStatus(carregamento: Carregamento) {
  return {
    id: carregamento.doca,
    status: carregamento.status,
    motorista: carregamento.motorista.nome,
    cidadeDestino: carregamento.cidadeDestino,
    placaVeiculo: carregamento.tipoVeiculo === "CARROCERIA" 
      ? `${carregamento.placas.cavaloMecanico}/${carregamento.placas.bau}`
      : carregamento.placas.placaSimples || "N/A",
    tipoVeiculo: carregamento.tipoVeiculo,
    horarioEntrada: carregamento.horarios.encostouDoca,
    horarioSaida: carregamento.horarios.liberacao,
    tempoTotal: calcularTempoTotal(carregamento.horarios),
    carga: carregamento.cargas
  }
}

function calcularTempoTotal(horarios: Carregamento["horarios"]) {
  if (!horarios.encostouDoca || !horarios.liberacao) return "00:00"
  
  const entrada = new Date(`2000-01-01T${horarios.encostouDoca}`)
  const saida = new Date(`2000-01-01T${horarios.liberacao}`)
  const diffMs = saida.getTime() - entrada.getTime()
  
  const horas = Math.floor(diffMs / (1000 * 60 * 60))
  const minutos = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
  
  return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`
}