"use client";

import { useState } from "react";
import {
  Truck,
  Clock,
  Package,
  User,
  MapPin,
  Lock,
  Save,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  TrendingUp,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";

// Usando a interface do frontend
interface CarregamentoInput {
  doca: number;
  cidadeDestino: string;
  sequenciaCarro: number;
  motorista: {
    nome: string;
    cpf?: string;
  };
  tipoVeiculo: "3/4" | "TOCO" | "TRUCK" | "CARROCERIA";
  placas: {
    placaSimples?: string;
    cavaloMecanico?: string;
    bau?: string;
  };
  horarios: {
    encostouDoca: string;
    inicioCarregamento: string;
    fimCarregamento: string;
    liberacao: string;
  };
  lacres: {
    traseiro: string;
    lateralEsquerdo?: string;
    lateralDireito?: string;
  };
  cargas: {
    gaiolas: number;
    volumosos: number;
    mangaPallets: number;
  };
}

// ✅ ADICIONAR: Função para calcular progresso
const calcularProgresso = (horarios: CarregamentoInput["horarios"]) => {
  if (!horarios)
    return {
      porcentagem: 0,
      status: "na_fila",
      label: "Na Fila",
      color: "bg-gray-400",
    };

  if (horarios.liberacao && horarios.liberacao.trim() !== "") {
    return {
      porcentagem: 100,
      status: "liberado",
      label: "Liberado",
      color: "bg-green-500",
    };
  }
  if (horarios.fimCarregamento && horarios.fimCarregamento.trim() !== "") {
    return {
      porcentagem: 75,
      status: "finalizado",
      label: "Finalizado",
      color: "bg-purple-500",
    };
  }
  if (
    horarios.inicioCarregamento &&
    horarios.inicioCarregamento.trim() !== ""
  ) {
    return {
      porcentagem: 50,
      status: "carregando",
      label: "Carregando",
      color: "bg-blue-500",
    };
  }
  if (horarios.encostouDoca && horarios.encostouDoca.trim() !== "") {
    return {
      porcentagem: 25,
      status: "encostado",
      label: "Encostado na Doca",
      color: "bg-orange-500",
    };
  }

  return {
    porcentagem: 0,
    status: "na_fila",
    label: "Na Fila",
    color: "bg-gray-400",
  };
};

export default function NovoCarregamento() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const [carregamento, setCarregamento] = useState<CarregamentoInput>({
    doca: 1,
    cidadeDestino: "",
    sequenciaCarro: 1,
    motorista: {
      nome: "",
      cpf: "",
    },
    tipoVeiculo: "3/4",
    placas: {
      placaSimples: "",
      cavaloMecanico: "",
      bau: "",
    },
    horarios: {
      encostouDoca: "",
      inicioCarregamento: "",
      fimCarregamento: "",
      liberacao: "",
    },
    lacres: {
      traseiro: "",
      lateralEsquerdo: "",
      lateralDireito: "",
    },
    cargas: {
      gaiolas: 0,
      volumosos: 0,
      mangaPallets: 0,
    },
  });

  const [selectCarro, setSelectCarro] = useState<number>(1);

  const cidades = [
    "Juazeiro - BA",
    "Santo Antônio de Jesus - BA",
    "Itaberaba - BA",
    "Seabra - BA",
    "Valença - BA",
    "Jacobina - BA",
    "Serrinha - BA",
    "Pombal - BA",
    "Bonfim - BA",
  ];

  const updateCarregamento = (field: keyof CarregamentoInput, value: any) => {
    setCarregamento((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateMotorista = (
    field: keyof CarregamentoInput["motorista"],
    value: string,
  ) => {
    setCarregamento((prev) => ({
      ...prev,
      motorista: {
        ...prev.motorista,
        [field]: value,
      },
    }));
  };

  const updatePlacas = (
    field: keyof CarregamentoInput["placas"],
    value: string,
  ) => {
    setCarregamento((prev) => ({
      ...prev,
      placas: {
        ...prev.placas,
        [field]: value,
      },
    }));
  };

  const updateHorarios = (
    field: keyof CarregamentoInput["horarios"],
    value: string,
  ) => {
    setCarregamento((prev) => ({
      ...prev,
      horarios: {
        ...prev.horarios,
        [field]: value,
      },
    }));
  };

  const updateLacres = (
    field: keyof CarregamentoInput["lacres"],
    value: string,
  ) => {
    setCarregamento((prev) => ({
      ...prev,
      lacres: {
        ...prev.lacres,
        [field]: value,
      },
    }));
  };

  const updateCargas = (
    field: keyof CarregamentoInput["cargas"],
    value: number,
  ) => {
    setCarregamento((prev) => ({
      ...prev,
      cargas: {
        ...prev.cargas,
        [field]: value,
      },
    }));
  };

  const handleSelectCarro = (num: number) => {
    setSelectCarro(num);
    updateCarregamento("sequenciaCarro", num);
  };

  const handleScroll = (direction: "left" | "right") => {
    const container = document.getElementById("carros-scroll-container");
    if (container) {
      const scrollAmount = 200;
      if (direction === "left") {
        container.scrollLeft -= scrollAmount;
      } else {
        container.scrollLeft += scrollAmount;
      }
    }
  };

  // ✅ ADICIONAR: Função para verificar se todos os campos obrigatórios estão preenchidos
  const verificarCamposObrigatorios = () => {
    const horarios = carregamento.horarios;
    return (
      horarios.encostouDoca &&
      horarios.encostouDoca.trim() !== "" &&
      horarios.inicioCarregamento &&
      horarios.inicioCarregamento.trim() !== "" &&
      horarios.fimCarregamento &&
      horarios.fimCarregamento.trim() !== "" &&
      horarios.liberacao &&
      horarios.liberacao.trim() !== ""
    );
  };

  // ✅ ADICIONAR: Função para preparar dados limpos
  const prepararDados = () => {
    return {
      ...carregamento,
      placas: {
        ...(carregamento.tipoVeiculo === "CARROCERIA"
          ? {
              cavaloMecanico: carregamento.placas.cavaloMecanico,
              bau: carregamento.placas.bau,
            }
          : { placaSimples: carregamento.placas.placaSimples }),
      },
    };
  };

  // ✅ ADICIONAR: Função para salvar carregamento
  const handleSaveCarregamento = async (finalizar = false) => {
    setIsLoading(true);
    
    try {
      const dadosPreparados = prepararDados();
      
      // Adicionar status baseado se está finalizando
      const dadosComStatus = {
        ...dadosPreparados,
        status: finalizar ? "liberada" : "em_uso"
      };
      
      const response = await fetch('/api/carregamentos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dadosComStatus),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert(
          finalizar 
            ? 'Carregamento finalizado com sucesso! Veículo marcado como em rota.'
            : 'Carregamento salvo com sucesso!'
        );
        
        // Redirecionar para dashboard se finalizado
        if (finalizar) {
          router.push('/carregamento/dashboard');
        }
      } else {
        alert(`Erro: ${data.error}`);
      }
    } catch (error) {
      console.error('Erro ao salvar carregamento:', error);
      alert('Erro ao salvar carregamento. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Calcular progresso atual
  const progresso = calcularProgresso(carregamento.horarios);

  return (
    <>
      <div className="max-w-4xl mx-auto mt-20 p-4">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Truck className="text-blue-600" />
          Novo Carregamento
        </h1>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="inline w-4 h-4 mr-1" />
                Doca
              </label>
              <select
                className="w-full p-3 border border-gray-300 rounded-lg"
                value={carregamento.doca}
                onChange={(e) =>
                  updateCarregamento("doca", parseInt(e.target.value))
                }
              >
                {[
                  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18,
                  19, 20,
                ].map((doca) => (
                  <option key={doca} value={doca}>
                    Doca {doca}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cidade de Destino
              </label>
              <select
                className="w-full p-3 border border-gray-300 rounded-lg"
                value={carregamento.cidadeDestino}
                onChange={(e) =>
                  updateCarregamento("cidadeDestino", e.target.value)
                }
              >
                <option value="">Selecione a cidade</option>
                {cidades.map((cidade) => (
                  <option key={cidade} value={cidade}>
                    {cidade}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Sequência do Carro */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Qual carro na sequência?
            </label>
            <div className="relative">
              <button
                onClick={() => handleScroll("left")}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white border border-gray-300 rounded-full p-2 shadow-md hover:bg-gray-50"
                aria-label="Rolar para esquerda"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div
                id="carros-scroll-container"
                className="flex gap-3 overflow-x-auto py-3 px-10 scrollbar-hide scroll-smooth"
                style={{ scrollbarWidth: "none" }}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleSelectCarro(num)}
                    className={`min-w-30 shrink-0 p-4 border rounded-lg text-center transition-all ${selectCarro === num ? "border-blue-500 bg-blue-50 text-blue-700 font-medium" : "border-gray-300 hover:bg-gray-50"}`}
                  >
                    <div className="font-medium text-lg">{num}º</div>
                    <div className="text-sm mt-1">Carro</div>
                  </button>
                ))}
              </div>
              <button
                onClick={() => handleScroll("right")}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white border border-gray-300 rounded-full p-2 shadow-md hover:bg-gray-50"
                aria-label="Rolar para direita"
              >
                <ChevronRight className=" w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          <div className="mb-6">
            <label className="flex text-sm font-medium text-gray-700 mb-2 items-center">
              <User className="w-4 h-4 mr-1" />
              Motorista
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Nome do motorista"
                className="p-3 border border-gray-300 rounded-lg"
                value={carregamento.motorista.nome}
                onChange={(e) => updateMotorista("nome", e.target.value)}
              />
              <input
                type="text"
                placeholder="ID/CPF (opcional)"
                className="p-3 border border-gray-300 rounded-lg"
                value={carregamento.motorista.cpf || ""}
                onChange={(e) => updateMotorista("cpf", e.target.value)}
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Veículo
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "3/4", label: "3/4", desc: "1 placa" },
                { value: "TRUCK", label: "Truck", desc: "1 placa" },
                { value: "TOCO", label: "Toco", desc: "1 placa" },
                { value: "CARROCERIA", label: "Carroceria", desc: "2 placas" },
              ].map((tipo) => (
                <button
                  key={tipo.value}
                  type="button"
                  onClick={() => updateCarregamento("tipoVeiculo", tipo.value)}
                  className={`p-4 border rounded-lg text-center ${carregamento.tipoVeiculo === tipo.value ? "border-blue-500 bg-blue-50" : "border-gray-300"}`}
                >
                  <div className="font-medium">{tipo.label}</div>
                  <div className="text-sm text-gray-500">{tipo.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Placas do Veículo
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {carregamento.tipoVeiculo === "CARROCERIA" ? (
                <>
                  <input
                    type="text"
                    placeholder="Cavalo Mecãnico"
                    className="p-3 border border-gray-300 rounded-lg uppercase"
                    value={carregamento.placas.cavaloMecanico || ""}
                    onChange={(e) =>
                      updatePlacas(
                        "cavaloMecanico",
                        e.target.value.toUpperCase(),
                      )
                    }
                  />
                  <input
                    type="text"
                    placeholder="Baú"
                    className="p-3 border border-gray-300 rounded-lg uppercase"
                    value={carregamento.placas.bau || ""}
                    onChange={(e) =>
                      updatePlacas("bau", e.target.value.toUpperCase())
                    }
                  />
                </>
              ) : (
                <input
                  type="text"
                  placeholder={
                    carregamento.tipoVeiculo === "3/4"
                      ? "3/4"
                      : carregamento.tipoVeiculo === "TOCO"
                        ? "Toco"
                        : carregamento.tipoVeiculo === "TRUCK"
                          ? "Truck"
                          : "Placa do Veículo"
                  }
                  className="p-3 border border-gray-300 rounded-lg uppercase"
                  value={carregamento.placas.placaSimples || ""}
                  onChange={(e) =>
                    updatePlacas("placaSimples", e.target.value.toUpperCase())
                  }
                />
              )}
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-medium text-gray-700 mb-3 flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              Horários
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Encostou na Doca
                </label>
                <input
                  type="time"
                  className="w-full p-2 border border-gray-300 rounded"
                  value={carregamento.horarios.encostouDoca}
                  onChange={(e) =>
                    updateHorarios("encostouDoca", e.target.value)
                  }
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Início Carregamento
                </label>
                <input
                  type="time"
                  className="w-full p-2 border border-gray-300 rounded"
                  value={carregamento.horarios.inicioCarregamento}
                  onChange={(e) =>
                    updateHorarios("inicioCarregamento", e.target.value)
                  }
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Fim Carregamento
                </label>
                <input
                  type="time"
                  className="w-full p-2 border border-gray-300 rounded"
                  value={carregamento.horarios.fimCarregamento}
                  onChange={(e) =>
                    updateHorarios("fimCarregamento", e.target.value)
                  }
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Liberação
                </label>
                <input
                  type="time"
                  className="w-full p-2 border border-gray-300 rounded"
                  value={carregamento.horarios.liberacao}
                  onChange={(e) => updateHorarios("liberacao", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* ✅ ADICIONAR: Barra de Progresso */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="font-medium text-gray-700 mb-3 flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" />
              Progresso do Carregamento
            </h3>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className={`h-4 rounded-full transition-all duration-500 ${progresso.color}`}
                style={{ width: `${progresso.porcentagem}%` }}
              />
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-sm font-medium text-gray-600">
                {progresso.label}
              </span>
              <span className="text-sm font-bold text-gray-800">
                {progresso.porcentagem}%
              </span>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              {progresso.porcentagem === 0 &&
                "Preencha os horários para atualizar o progresso"}
              {progresso.porcentagem === 25 && "Veículo encostou na doca"}
              {progresso.porcentagem === 50 && "Carregamento em andamento"}
              {progresso.porcentagem === 75 &&
                "Carregamento finalizado, aguardando liberação"}
              {progresso.porcentagem === 100 && "Veículo liberado!"}
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-medium text-gray-700 mb-3 flex items-center">
              <Lock className="w-4 h-4 mr-2" />
              Lacres
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Traseiro (obrigatório)
                </label>
                <input
                  type="number"
                  placeholder="Número do lacre"
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  value={carregamento.lacres.traseiro}
                  onChange={(e) => updateLacres("traseiro", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Lateral Esquerdo (opcional)
                </label>
                <input
                  type="number"
                  placeholder="Número do lacre"
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  value={carregamento.lacres.lateralEsquerdo || ""}
                  onChange={(e) =>
                    updateLacres("lateralEsquerdo", e.target.value)
                  }
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Lateral Direito (opcional)
                </label>
                <input
                  type="number"
                  placeholder="Número do lacre"
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  value={carregamento.lacres.lateralDireito || ""}
                  onChange={(e) =>
                    updateLacres("lateralDireito", e.target.value)
                  }
                />
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="font-medium text-gray-700 mb-3 flex items-center">
              <Package className="w-4 h-4 mr-2" />
              Cargas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm text-gray-700 mb-2">
                  Gaiolas
                </label>
                <input
                  type="number"
                  min="0"
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  placeholder="0"
                  value={carregamento.cargas.gaiolas}
                  onChange={(e) =>
                    updateCargas("gaiolas", parseInt(e.target.value) || 0)
                  }
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-2">
                  Volumosos
                </label>
                <input
                  type="number"
                  min="0"
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  placeholder="0"
                  value={carregamento.cargas.volumosos}
                  onChange={(e) =>
                    updateCargas("volumosos", parseInt(e.target.value) || 0)
                  }
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-2">
                  Manga Pallets
                </label>
                <input
                  type="number"
                  min="0"
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  placeholder="0"
                  value={carregamento.cargas.mangaPallets}
                  onChange={(e) =>
                    updateCargas("mangaPallets", parseInt(e.target.value) || 0)
                  }
                />
              </div>
            </div>
          </div>

          {/* ✅ CORREÇÃO: Dois botões - Salvar e Finalizar */}
          <div className="flex justify-end gap-4">
            <button
              onClick={() => handleSaveCarregamento(false)}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Salvar Carregamento
                </>
              )}
            </button>
            <button
              onClick={() => handleSaveCarregamento(true)}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed ${
                verificarCamposObrigatorios()
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : "bg-gray-400 text-gray-200 cursor-not-allowed"
              }`}
              disabled={isLoading || !verificarCamposObrigatorios()}
              title={
                !verificarCamposObrigatorios()
                  ? "Preencha todos os horários para finalizar"
                  : "Finalizar carregamento"
              }
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Finalizando...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Finalizar Carregamento
                </>
              )}
            </button>
          </div>

          {/* ✅ ADICIONAR: Legenda dos botões */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-gray-600">
            <p className="flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
              <strong>Salvar:</strong> Salva o carregamento sem finalizar (pode
              editar depois)
            </p>
            <p className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 bg-green-600 rounded-full"></span>
              <strong>Finalizar:</strong> Marca como Veículo em Rota
            </p>
          </div>
        </div>
      </div>
    </>
  );
}