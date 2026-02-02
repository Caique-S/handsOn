'use client';

import { useState, useEffect } from "react";
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
  TrendingUp,
  Loader2,
  ArrowLeft,
  BarChart,
  Database,
  FileUp,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
  observacoes?: string;
}

interface CSVRecord {
  ID?: string;
  "Nome do motorista principal"?: string;
  "Tipo de Veiculo"?: string;
  "Veiculo de tração"?: string;
  "Veiculo de carga"?: string;
  Destino?: string;
  [key: string]: any;
}

interface UploadData {
  _id: string;
  fileName: string;
  uploadDate: string;
  data: CSVRecord[];
  totalRecords: number;
  processedRecords: number;
}

// Mapeamento de códigos para cidades
const CODIGO_PARA_CIDADE: { [key: string]: string } = {
  "EBA14": "Serrinha - BA",
  "EBA99": "Valença - BA",
  "EBA4": "Santo Antônio de Jesus - BA",
  "EBA19": "Itaberaba - BA",
  "EBA3": "Jacobina - BA",
  "EBA2": "Pomba - BA",
  "EBA16": "Senhor do Bonfim - BA",
  "EBA21": "Seabra - BA",
  "EBA6": "Juazeiro - BA",
};

// Mapeamento inverso (cidade para código)
const CIDADE_PARA_CODIGO: { [key: string]: string } = {
  "Serrinha - BA": "EBA14",
  "Valença - BA": "EBA99",
  "Santo Antônio de Jesus - BA": "EBA4",
  "Itaberaba - BA": "EBA19",
  "Jacobina - BA": "EBA3",
  "Pomba - BA": "EBA2",
  "Senhor do Bonfim - BA": "EBA16",
  "Seabra - BA": "EBA21",
  "Juazeiro - BA": "EBA6",
};

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
  if (horarios.inicioCarregamento && horarios.inicioCarregamento.trim() !== "") {
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

  // Estados para os dados do CSV
  const [latestUpload, setLatestUpload] = useState<UploadData | null>(null);
  const [loadingUpload, setLoadingUpload] = useState(false);

  // Estados para filtros
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [filteredMotoristas, setFilteredMotoristas] = useState<CSVRecord[]>([]);
  const [selectedMotorista, setSelectedMotorista] = useState<string>("");

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
      encostouDoca: new Date().toLocaleTimeString('pt-BR', { hour12: false, hour: '2-digit', minute: '2-digit' }),
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
    observacoes: "",
  });

  const [selectCarro, setSelectCarro] = useState<number>(1);
  const cidades = Object.values(CODIGO_PARA_CIDADE);

  // Buscar o upload mais recente
  useEffect(() => {
    fetchLatestUpload();
  }, []);

  const fetchLatestUpload = async () => {
    try {
      setLoadingUpload(true);
      const response = await fetch('/api/upload?limit=1');

      if (!response.ok) return;

      const data = await response.json();

      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        setLatestUpload(data.data[0]);
      }
    } catch (error) {
      console.error('Erro ao buscar upload:', error);
    } finally {
      setLoadingUpload(false);
    }
  };

  // Quando a cidade é selecionada, filtrar motoristas
  useEffect(() => {
    if (selectedCity && latestUpload?.data) {
      const codigoDestino = CIDADE_PARA_CODIGO[selectedCity];

      if (codigoDestino) {
        // Filtrar motoristas pelo código de destino
        const motoristas = latestUpload.data.filter(record => {
          return record.Destino === codigoDestino;
        });

        setFilteredMotoristas(motoristas);
      } else {
        setFilteredMotoristas([]);
      }

      // Resetar motorista selecionado
      setSelectedMotorista("");
      // Resetar campos do motorista
      setCarregamento(prev => ({
        ...prev,
        motorista: { nome: "", cpf: "" },
        tipoVeiculo: "3/4",
        placas: { placaSimples: "", cavaloMecanico: "", bau: "" }
      }));
    } else {
      setFilteredMotoristas([]);
      setSelectedMotorista("");
    }
  }, [selectedCity, latestUpload]);

  // Quando um motorista é selecionado, preencher os campos
  useEffect(() => {
    if (selectedMotorista && filteredMotoristas.length > 0) {
      const motorista = filteredMotoristas.find(m =>
        m["Nome do motorista principal"] === selectedMotorista
      );

      if (motorista) {
        // Preencher motorista
        updateMotorista("nome", motorista["Nome do motorista principal"] || "");
        updateMotorista("cpf", motorista.ID || "");

        // Mapear tipo de veículo
        let tipoVeiculo: "3/4" | "TOCO" | "TRUCK" | "CARROCERIA" = "3/4";
        if (motorista["Tipo de Veiculo"]) {
          const tipo = motorista["Tipo de Veiculo"].toLowerCase();
          if (tipo.includes("3/4") || tipo.includes("3/4")) {
            tipoVeiculo = "3/4";
          } else if (tipo.includes("truck")) {
            tipoVeiculo = "TRUCK";
          } else if (tipo.includes("toco")) {
            tipoVeiculo = "TOCO";
          } else if (tipo.includes("carreta") || tipo.includes("carroceria")) {
            tipoVeiculo = "CARROCERIA";
          }
        }
        updateCarregamento("tipoVeiculo", tipoVeiculo);

        // Preencher placas
        if (motorista["Veiculo de tração"]) {
          if (tipoVeiculo === "CARROCERIA") {
            updatePlacas("cavaloMecanico", motorista["Veiculo de tração"]);
            if (motorista["Veiculo de carga"]) {
              updatePlacas("bau", motorista["Veiculo de carga"]);
            }
          } else {
            updatePlacas("placaSimples", motorista["Veiculo de tração"]);
          }
        }

        // Atualizar cidade destino
        updateCarregamento("cidadeDestino", selectedCity);
      }
    }
  }, [selectedMotorista, filteredMotoristas, selectedCity]);

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

  const prepararDadosParaAPI = () => {
    const dados = {
      doca: carregamento.doca,
      cidadeDestino: carregamento.cidadeDestino,
      sequenciaCarro: carregamento.sequenciaCarro,
      motorista: {
        nome: carregamento.motorista.nome,
        cpf: carregamento.motorista.cpf || "",
      },
      tipoVeiculo: carregamento.tipoVeiculo,
      placas: {
        placaSimples: carregamento.placas.placaSimples || "",
        ...(carregamento.tipoVeiculo === "CARROCERIA" && {
          cavaloMecanico: carregamento.placas.cavaloMecanico,
          bau: carregamento.placas.bau,
        }),
      },
      horarios: {
        encostouDoca: carregamento.horarios.encostouDoca,
        inicioCarregamento: carregamento.horarios.inicioCarregamento,
        fimCarregamento: carregamento.horarios.fimCarregamento,
        liberacao: carregamento.horarios.liberacao,
      },
      lacres: {
        traseiro: carregamento.lacres.traseiro,
        lateralEsquerdo: carregamento.lacres.lateralEsquerdo || "",
        lateralDireito: carregamento.lacres.lateralDireito || "",
      },
      cargas: {
        gaiolas: carregamento.cargas.gaiolas,
        volumosos: carregamento.cargas.volumosos,
        mangaPallets: carregamento.cargas.mangaPallets,
      },
      status: "em_uso",
      observacoes: carregamento.observacoes || "",
    };

    if (carregamento.tipoVeiculo !== "CARROCERIA") {
      delete dados.placas.cavaloMecanico;
      delete dados.placas.bau;
    }

    return dados;
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);

      if (!carregamento.cidadeDestino) {
        alert("Selecione uma cidade de destino");
        setIsLoading(false);
        return;
      }

      if (!carregamento.motorista.nome) {
        alert("Informe o nome do motorista");
        setIsLoading(false);
        return;
      }

      if (carregamento.tipoVeiculo === "CARROCERIA") {
        if (!carregamento.placas.cavaloMecanico || !carregamento.placas.bau) {
          alert("Para carroceria, informe o cavalo mecânico e o baú");
          setIsLoading(false);
          return;
        }
      } else {
        if (!carregamento.placas.placaSimples) {
          alert(`Informe a placa do ${carregamento.tipoVeiculo}`);
          setIsLoading(false);
          return;
        }
      }

      const dadosParaAPI = prepararDadosParaAPI();

      const response = await fetch("/api/carregamentos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dadosParaAPI),
      });

      const data = await response.json();

      if (response.ok) {
        router.push("/carregamento/dashboard");
        router.refresh();
      } else {
        throw new Error(data.error || "Erro ao salvar carregamento");
      }
    } catch (error: any) {
      console.error("Erro:", error);
      alert(`Erro ao salvar carregamento: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const progresso = calcularProgresso(carregamento.horarios);

  return (
    <div className="max-w-4xl mx-auto mt-20 p-4">
      {/* Botões de navegação no topo */}
      <div className="mb-8">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5 mr-1" />
              Voltar
            </Link>
            <div className="h-6 w-px bg-gray-300"></div>
        
          </div>

          <Link href="/carregamento/dashboard" className="flex items-center text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-2 rounded-lg">
            <BarChart className="w-4 h-4 mr-2" />
            Dashboard
          </Link>
        </div>
      </div>




      {/* Card de Upload - Mantido visualmente como antes, mas simplificado */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="flex items-center mb-4">
          <Database className="w-5 h-5 text-gray-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-800">
            Dados do CSV
          </h2>
        </div>

        {loadingUpload ? (
          <div className="text-center py-4">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600" />
            <p className="text-sm text-gray-600 mt-2">Carregando dados...</p>
          </div>
        ) : !latestUpload ? (
          <div className="text-center py-4 border-2 border-dashed border-gray-300 rounded-lg">
            <p className="text-gray-600">Nenhum arquivo CSV encontrado</p>
            <p className="text-sm text-gray-500 mt-1">
              Faça upload de um arquivo CSV para habilitar o preenchimento automático
            </p>
          </div>
        ) : (
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <FileUp className="h-5 w-5 text-green-600 mr-2" />
                <div>
                  <h3 className="font-medium text-gray-900">
                    {latestUpload.fileName}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Upload: {new Date(latestUpload.uploadDate).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                {latestUpload.totalRecords} registros
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {latestUpload.processedRecords} registro(s) disponível(is) para esta Facility
            </p>
          </div>
        )}
      </div>

      {/* Formulário principal */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        {/* Doca e Cidade */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="inline w-4 h-4 mr-1" />
              Doca
            </label>
            <select
              className="w-full p-3 border border-gray-300 rounded-lg"
              value={carregamento.doca}
              onChange={(e) => updateCarregamento("doca", parseInt(e.target.value))}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map((doca) => (
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
              value={selectedCity}
              onChange={(e) => {
                setSelectedCity(e.target.value);
                updateCarregamento("cidadeDestino", e.target.value);
              }}
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

        {/* Seleção de Motorista (após escolher cidade) */}
        {selectedCity && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Motorista para {selectedCity}
            </label>
            <select
              className="w-full p-3 border border-gray-300 rounded-lg"
              value={selectedMotorista}
              onChange={(e) => setSelectedMotorista(e.target.value)}
            >
              <option value="">Selecione um motorista...</option>
              {filteredMotoristas.map((motorista, index) => (
                <option
                  key={index}
                  value={motorista["Nome do motorista principal"] || ""}
                >
                  {motorista["Nome do motorista principal"]}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {filteredMotoristas.length} motorista(s) disponível(is) para {selectedCity}
            </p>
          </div>
        )}

        {/* Indicação de campos preenchidos */}
        {selectedMotorista && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm font-medium text-green-800 mb-2">
              ✓ Campos preenchidos automaticamente
            </p>
            <div className="grid grid-cols-2 gap-3 text-sm text-green-700">
              <div>
                <span className="font-medium">Motorista:</span> {carregamento.motorista.nome}
              </div>
              <div>
                <span className="font-medium">ID:</span> {carregamento.motorista.cpf}
              </div>
              <div>
                <span className="font-medium">Tipo de Veículo:</span> {carregamento.tipoVeiculo}
              </div>
              <div>
                <span className="font-medium">Placa(s):</span> {carregamento.tipoVeiculo === "CARROCERIA"
                  ? `${carregamento.placas.cavaloMecanico}/${carregamento.placas.bau}`
                  : carregamento.placas.placaSimples}
              </div>
            </div>
          </div>
        )}

        {/* Campos editáveis de motorista (se não selecionou do dropdown) */}
        <div className="mb-6">
          <label className="flex text-sm font-medium text-gray-700 mb-2 items-center">
            <User className="w-4 h-4 mr-1" />
            {selectedMotorista ? "Dados do Motorista" : "Informações do Motorista"}
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
              placeholder="ID/CPF"
              className="p-3 border border-gray-300 rounded-lg"
              value={carregamento.motorista.cpf || ""}
              onChange={(e) => updateMotorista("cpf", e.target.value)}
            />
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
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Tipo de Veículo */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tipo de Veículo
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
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

        {/* Placas do Veículo */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Placas do Veículo
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {carregamento.tipoVeiculo === "CARROCERIA" ? (
              <>
                <input
                  type="text"
                  placeholder="Cavalo Mecânico"
                  className="p-3 border border-gray-300 rounded-lg uppercase"
                  value={carregamento.placas.cavaloMecanico || ""}
                  onChange={(e) =>
                    updatePlacas("cavaloMecanico", e.target.value.toUpperCase())
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
                placeholder={carregamento.tipoVeiculo}
                className="p-3 border border-gray-300 rounded-lg uppercase"
                value={carregamento.placas.placaSimples || ""}
                onChange={(e) =>
                  updatePlacas("placaSimples", e.target.value.toUpperCase())
                }
              />
            )}
          </div>
        </div>

        {/* Horários */}
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
                onChange={(e) => updateHorarios("encostouDoca", e.target.value)}
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

        {/* Progresso do Carregamento */}
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
            {progresso.porcentagem === 0 && "Preencha os horários para atualizar o progresso"}
            {progresso.porcentagem === 25 && "Veículo encostou na doca"}
            {progresso.porcentagem === 50 && "Carregamento em andamento"}
            {progresso.porcentagem === 75 && "Carregamento finalizado, aguardando liberação"}
            {progresso.porcentagem === 100 && "Veículo liberado!"}
          </div>
        </div>

        {/* Lacres */}
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
                onChange={(e) => updateLacres("lateralEsquerdo", e.target.value)}
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
                onChange={(e) => updateLacres("lateralDireito", e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Cargas */}
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

        {/* Botão Salvar */}
        <div className="flex justify-end">
          <button
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleSubmit}
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
        </div>
      </div>
    </div>
  );
}
