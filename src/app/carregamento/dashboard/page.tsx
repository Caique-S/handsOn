"use client";

import { useState, useEffect } from "react";
import {
  Truck,
  Users,
  Calendar,
  BarChart3,
  CheckCircle,
  Download,
  Filter,
  RefreshCw,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Car,
  Loader,
  Edit,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface DocaStatus {
  id: number;
  status: "ocupada" | "liberada"  | "disponivel";
  motorista?: string;
  cidadeDestino?: string;
  placaVeiculo?: string;
  tipoVeiculo?: "3/4" | "TOCO" | "TRUCK" | "CARROCERIA";
  horarioEntrada?: string;
  horarioSaida?: string;
  tempoTotal?: string;
  carga?: {
    gaiolas: number;
    volumosos: number;
    mangaPallets: number;
  };
  _id?: string;
  sequenciaCarro?: number;
  horarios?: {
    encostouDoca: string;
    inicioCarregamento: string;
    fimCarregamento: string;
    liberacao: string;
  };
  lacres?: {
    traseiro: string;
    lateralEsquerdo?: string;
    lateralDireito?: string;
  };
  createdAt?: string;
}

interface DashboardStats {
  docasEmUso: number;
  rotasLiberadas: number;
  docasDisponiveis: number;
  tempoMedio: string;
  eficiencia: number;
  cargaTotal: {
    gaiolas: number;
    volumosos: number;
    mangaPallets: number;
  };
}

export default function DashboardAnalise() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [selectedPeriod, setSelectedPeriod] = useState<string>("hoje");
  const [viewMode, setViewMode] = useState<"em_uso" | "liberadas">("em_uso");

  const [stats, setStats] = useState<DashboardStats>({
    docasEmUso: 0,
    rotasLiberadas: 0,
    docasDisponiveis: 0,
    tempoMedio: "00:00",
    eficiencia: 0,
    cargaTotal: {
      gaiolas: 0,
      volumosos: 0,
      mangaPallets: 0,
    },
  });

  const [todasDocas, setTodasDocas] = useState<DocaStatus[]>([]);

  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 4; // 2 colunas x 2 linhas = 4 docas por página

  const periodos = [
    { value: "hoje", label: "Hoje" },
    { value: "ontem", label: "Ontem" },
    { value: "semana", label: "Esta Semana" },
    { value: "mes", label: "Este Mês" },
    { value: "personalizado", label: "Personalizado" },
  ];

  // Função para carregar dados do dashboard
  const loadDashboardData = async () => {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/dashboard?date=${selectedDate}`);
      if (!response.ok) {
        throw new Error('Erro ao carregar dados');
      }
      const data = await response.json();

      setStats(data.stats);
      setTodasDocas(data.todasDocas);
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
      alert('Erro ao carregar dados. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [selectedDate, selectedPeriod]);

  // Filtrar docas baseado no modo de visualização
  const docasFiltradas = todasDocas.filter((doca) => {
    if (viewMode === "em_uso") {
      return doca.status === "ocupada";
    } else {
      return doca.status === "liberada";
    }
  });

  const handleExportData = () => {
    const dataStr = JSON.stringify(
      {
        periodo: selectedPeriod,
        data: selectedDate,
        estatisticas: stats,
        docas: todasDocas,
        modoVisualizacao: viewMode,
      },
      null,
      2,
    );

    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `status-docas-${selectedDate}-${viewMode}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    alert("Dados exportados com sucesso!");
  };

  const handleRefresh = () => {
    loadDashboardData();
  };

  const handleNovoCarregamento = () => {
    router.push("/carregamento/new");
  };

  // NOVA FUNÇÃO: Editar carregamento da doca
  const handleEditarCarregamento = (doca: DocaStatus) => {
    if (doca.status === "ocupada" && doca._id) {
      // Redirecionar para a página de carregamento com os dados existentes
      const carregamentoData = {
        doca: doca.id,
        cidadeDestino: doca.cidadeDestino || "",
        motorista: {
          nome: doca.motorista || "",
          cpf: "",
        },
        tipoVeiculo: doca.tipoVeiculo || "3/4",
        placas: {
          placaSimples: doca.placaVeiculo || "",
        },
        horarios: doca.horarios || {
          encostouDoca: doca.horarioEntrada || "",
          inicioCarregamento: "",
          fimCarregamento: "",
          liberacao: "",
        },
        lacres: doca.lacres || {
          traseiro: "",
          lateralEsquerdo: "",
          lateralDireito: "",
        },
        cargas: doca.carga || {
          gaiolas: 0,
          volumosos: 0,
          mangaPallets: 0,
        },
        _id: doca._id,
        isEditing: true,
      };

      // Salvar os dados no localStorage para a página de carregamento acessar
      localStorage.setItem('carregamentoEditavel', JSON.stringify(carregamentoData));
      router.push(`/carregamento/edit?id=${doca._id}&doca=${doca.id}`);
    }
  };

  const handleScroll = (direction: "left" | "right") => {
    const totalPages = Math.ceil(docasFiltradas.length / itemsPerPage);
    if (direction === "left") {
      setCurrentPage((prev) => Math.max(0, prev - 1));
    } else {
      setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1));
    }
  };

  // Calcular docas para a página atual
  const startIndex = currentPage * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentDocas = docasFiltradas.slice(startIndex, endIndex);

  // Dividir as docas em 2 colunas
  const colunaEsquerda = currentDocas.slice(0, 2);
  const colunaDireita = currentDocas.slice(2, 4);

  // Função para obter cor baseada no modo de visualização
  const getBorderColor = () => {
    return viewMode === "em_uso"
      ? "border-orange-200 hover:border-orange-300"
      : "border-green-200 hover:border-green-300";
  };

  const getBgColor = () => {
    return viewMode === "em_uso" ? "bg-orange-50" : "bg-green-50";
  };

  const getTextColor = () => {
    return viewMode === "em_uso" ? "text-orange-700" : "text-green-700";
  };

  const getBadgeColor = () => {
    return viewMode === "em_uso"
      ? "bg-orange-100 text-orange-800"
      : "bg-green-100 text-green-800";
  };

  // Estilo para card clicável
  const getCardStyle = (doca: DocaStatus) => {
    const baseStyle = `p-4 border rounded-lg transition-all duration-300 ${getBorderColor()} ${getBgColor()}`;

    if (viewMode === "em_uso" && doca.status === "ocupada") {
      return `${baseStyle} cursor-pointer hover:shadow-md hover:scale-[1.02] active:scale-[0.99]`;
    }

    return baseStyle;
  };

  return (
    <>
      <div className="max-w-7xl mx-auto mt-20 p-4">
        {/* Cabeçalho */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <BarChart3 className="text-blue-600" />
              Dashboard de Carregamentos
            </h1>
            <p className="text-gray-600 mt-2">
              Monitoramento e análise em tempo real das operações
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled={isLoading}
            >
              <RefreshCw
                className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
              />
              Atualizar
            </button>
            <button
              onClick={handleExportData}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Download className="w-4 h-4" />
              Exportar Dados
            </button>
            <button
              onClick={handleNovoCarregamento}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Truck className="w-4 h-4" />
              Novo Carregamento
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-3">
              <Filter className="text-gray-500" />
              <h3 className="font-medium">Filtros</h3>
            </div>

            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <input
                  type="date"
                  className="p-2 border border-gray-300 rounded-lg"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  disabled={selectedPeriod !== "personalizado"}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {periodos.map((periodo) => (
                  <button
                    key={periodo.value}
                    onClick={() => {
                      setSelectedPeriod(periodo.value);
                      if (periodo.value !== "personalizado") {
                        const today = new Date();
                        if (periodo.value === "ontem") {
                          const yesterday = new Date(today);
                          yesterday.setDate(yesterday.getDate() - 1);
                          setSelectedDate(
                            yesterday.toISOString().split("T")[0],
                          );
                        } else {
                          setSelectedDate(today.toISOString().split("T")[0]);
                        }
                      }
                    }}
                    className={`px-3 py-1 rounded-full text-sm ${selectedPeriod === periodo.value ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                  >
                    {periodo.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="flex flex-col items-center gap-4">
              <Loader className="w-8 h-8 animate-spin text-blue-600" />
              <p className="text-gray-600">Carregando dados do dashboard...</p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                Docas/Rotas
              </h3>

              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500">
                  Página {currentPage + 1} de{" "}
                  {Math.ceil(docasFiltradas.length / itemsPerPage)}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleScroll("left")}
                    disabled={currentPage === 0}
                    className={`p-2 border border-gray-300 rounded-lg ${currentPage === 0 ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50"}`}
                    aria-label="Anterior"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                  </button>
                  <button
                    onClick={() => handleScroll("right")}
                    disabled={
                      currentPage ===
                      Math.ceil(docasFiltradas.length / itemsPerPage) - 1
                    }
                    className={`p-2 border border-gray-300 rounded-lg ${currentPage === Math.ceil(docasFiltradas.length / itemsPerPage) - 1 ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50"}`}
                    aria-label="Próximo"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>
            </div>

            {/* Botões de Modo de Visualização */}
            <div className="flex gap-4 mb-6">
              <button
                onClick={() => {
                  setViewMode("em_uso");
                  setCurrentPage(0);
                }}
                className={`flex-1 py-3 px-4 rounded-lg border flex flex-col items-center justify-center ${viewMode === "em_uso" ? "bg-orange-50 border-orange-300 text-orange-700 font-medium" : "bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100"}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Truck className="w-5 h-5" />
                  <span className="text-lg">Docas em Uso</span>
                </div>
                <span className="text-sm">
                  {todasDocas.filter((d) => d.status === "ocupada").length} docas
                  ocupadas
                </span>
              </button>

              <button
                onClick={() => {
                  setViewMode("liberadas");
                  setCurrentPage(0);
                }}
                className={`flex-1 py-3 px-4 rounded-lg border flex flex-col items-center justify-center ${viewMode === "liberadas" ? "bg-green-50 border-green-300 text-green-700 font-medium" : "bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100"}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-lg">Rotas Liberadas</span>
                </div>
                <span className="text-sm">
                  {todasDocas.filter((d) => d.status === "liberada").length} rotas
                  liberadas
                </span>
              </button>
            </div>

            {/* Carrossel de Docas */}
            <div className="relative">
              {docasFiltradas.length === 0 ? (
                <div
                  className={`p-8 rounded-lg border ${getBorderColor()} ${getBgColor()} text-center`}
                >
                  <div className="text-gray-500 mb-2">
                    {viewMode === "em_uso" ? (
                      <Truck className="w-12 h-12 mx-auto mb-3 text-orange-300" />
                    ) : (
                      <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-300" />
                    )}
                  </div>
                  <h4 className={`font-bold text-lg mb-1 ${getTextColor()}`}>
                    {viewMode === "em_uso"
                      ? "Nenhuma doca em uso"
                      : "Nenhuma rota liberada"}
                  </h4>
                  <p className="text-gray-600">
                    {viewMode === "em_uso"
                      ? "Todas as docas estão disponíveis ou em manutenção"
                      : "Nenhuma rota foi liberada ainda hoje"}
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Coluna Esquerda */}
                    <div className="space-y-4">
                      {colunaEsquerda.map((doca) => (
                        <div
                          key={doca.id}
                          className={getCardStyle(doca)}
                          onClick={() => {
                            if (viewMode === "em_uso" && doca.status === "ocupada") {
                              handleEditarCarregamento(doca);
                            }
                          }}
                          title={viewMode === "em_uso" && doca.status === "ocupada" ? "Clique para editar/finalizar este carregamento" : ""}
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-3">
                              <div
                                className={`p-2 rounded-lg ${getBadgeColor()}`}
                              >
                                {viewMode === "em_uso" ? (
                                  <Truck className="w-6 h-6" />
                                ) : (
                                  <CheckCircle className="w-6 h-6" />
                                )}
                              </div>
                              <div>
                                <div className="font-bold text-xl flex items-center gap-2">
                                  Doca {doca.id}
                                  {viewMode === "em_uso" && doca.status === "ocupada" && (
                                    <Edit className="w-4 h-4 text-orange-500" />
                                  )}
                                </div>
                                <div
                                  className={`text-sm font-medium ${getTextColor()}`}
                                >
                                  {viewMode === "em_uso"
                                    ? "Em Carregamento"
                                    : "Rota Liberada"}
                                </div>
                              </div>
                            </div>
                            {doca.tipoVeiculo && (
                              <span className="px-3 py-1 bg-white border rounded-full text-xs font-medium">
                                {doca.tipoVeiculo}
                              </span>
                            )}
                          </div>

                          <div className="space-y-3">
                            {/* Motorista */}
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                                <Users className="w-4 h-4 text-gray-500" />
                              </div>
                              <div>
                                <div className="text-xs text-gray-500">
                                  Motorista
                                </div>
                                <div className="font-medium">
                                  {doca.motorista}
                                </div>
                              </div>
                            </div>

                            {/* Destino */}
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                                <MapPin className="w-4 h-4 text-gray-500" />
                              </div>
                              <div>
                                <div className="text-xs text-gray-500">
                                  Destino
                                </div>
                                <div className="font-medium">
                                  {doca.cidadeDestino}
                                </div>
                              </div>
                            </div>

                            {/* Placa */}
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                                <Car className="w-4 h-4 text-gray-500" />
                              </div>
                              <div>
                                <div className="text-xs text-gray-500">
                                  Placa do Veículo
                                </div>
                                <div className="font-medium font-mono">
                                  {doca.placaVeiculo}
                                </div>
                              </div>
                            </div>

                            {/* Carga */}
                            {doca.carga && (
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                <div className="text-xs text-gray-500 mb-2">
                                  Carga
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                  <div className="text-center">
                                    <div className="font-bold">{doca.carga.gaiolas}</div>
                                    <div className="text-xs text-gray-500">Gaiolas</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="font-bold">{doca.carga.volumosos}</div>
                                    <div className="text-xs text-gray-500">Volumosos</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="font-bold">{doca.carga.mangaPallets}</div>
                                    <div className="text-xs text-gray-500">Manga Pallets</div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Horário se disponível */}
                            {viewMode === "liberadas" && doca.horarioSaida && (
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                <div className="text-xs text-gray-500">
                                  Horário de Saída
                                </div>
                                <div className="font-medium">
                                  {doca.horarioSaida}
                                </div>
                              </div>
                            )}

                            {/* Botão de ação para docas em uso */}
                            {viewMode === "em_uso" && doca.status === "ocupada" && (
                              <div className="mt-4 pt-4 border-t border-gray-200">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditarCarregamento(doca);
                                  }}
                                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                                >
                                  <Edit className="w-4 h-4" />
                                  Editar/Finalizar Carregamento
                                </button>
                                <p className="text-xs text-gray-500 mt-1 text-center">
                                  Clique no card ou botão para editar
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Coluna Direita */}
                    <div className="space-y-4">
                      {colunaDireita.map((doca) => (
                        <div
                          key={doca.id}
                          className={getCardStyle(doca)}
                          onClick={() => {
                            if (viewMode === "em_uso" && doca.status === "ocupada") {
                              handleEditarCarregamento(doca);
                            }
                          }}
                          title={viewMode === "em_uso" && doca.status === "ocupada" ? "Clique para editar/finalizar este carregamento" : ""}
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-3">
                              <div
                                className={`p-2 rounded-lg ${getBadgeColor()}`}
                              >
                                {viewMode === "em_uso" ? (
                                  <Truck className="w-6 h-6" />
                                ) : (
                                  <CheckCircle className="w-6 h-6" />
                                )}
                              </div>
                              <div>
                                <div className="font-bold text-xl flex items-center gap-2">
                                  Doca {doca.id}
                                  {viewMode === "em_uso" && doca.status === "ocupada" && (
                                    <Edit className="w-4 h-4 text-orange-500" />
                                  )}
                                </div>
                                <div
                                  className={`text-sm font-medium ${getTextColor()}`}
                                >
                                  {viewMode === "em_uso"
                                    ? "Em Carregamento"
                                    : "Rota Liberada"}
                                </div>
                              </div>
                            </div>
                            {doca.tipoVeiculo && (
                              <span className="px-3 py-1 bg-white border rounded-full text-xs font-medium">
                                {doca.tipoVeiculo}
                              </span>
                            )}
                          </div>

                          <div className="space-y-3">
                            {/* Motorista */}
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                                <Users className="w-4 h-4 text-gray-500" />
                              </div>
                              <div>
                                <div className="text-xs text-gray-500">
                                  Motorista
                                </div>
                                <div className="font-medium">
                                  {doca.motorista}
                                </div>
                              </div>
                            </div>

                            {/* Destino */}
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                                <MapPin className="w-4 h-4 text-gray-500" />
                              </div>
                              <div>
                                <div className="text-xs text-gray-500">
                                  Destino
                                </div>
                                <div className="font-medium">
                                  {doca.cidadeDestino}
                                </div>
                              </div>
                            </div>

                            {/* Placa */}
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                                <Car className="w-4 h-4 text-gray-500" />
                              </div>
                              <div>
                                <div className="text-xs text-gray-500">
                                  Placa do Veículo
                                </div>
                                <div className="font-medium font-mono">
                                  {doca.placaVeiculo}
                                </div>
                              </div>
                            </div>

                            {/* Carga */}
                            {doca.carga && (
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                <div className="text-xs text-gray-500 mb-2">
                                  Carga
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                  <div className="text-center">
                                    <div className="font-bold">{doca.carga.gaiolas}</div>
                                    <div className="text-xs text-gray-500">Gaiolas</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="font-bold">{doca.carga.volumosos}</div>
                                    <div className="text-xs text-gray-500">Volumosos</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="font-bold">{doca.carga.mangaPallets}</div>
                                    <div className="text-xs text-gray-500">Manga Pallets</div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Horário se disponível */}
                            {viewMode === "liberadas" && doca.horarioSaida && (
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                <div className="text-xs text-gray-500">
                                  Horário de Saída
                                </div>
                                <div className="font-medium">
                                  {doca.horarioSaida}
                                </div>
                              </div>
                            )}

                            {/* Botão de ação para docas em uso */}
                            {viewMode === "em_uso" && doca.status === "ocupada" && (
                              <div className="mt-4 pt-4 border-t border-gray-200">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditarCarregamento(doca);
                                  }}
                                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                                >
                                  <Edit className="w-4 h-4" />
                                  Editar/Finalizar Carregamento
                                </button>
                                <p className="text-xs text-gray-500 mt-1 text-center">
                                  Clique no card ou botão para editar
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Indicadores de página */}
                  {Math.ceil(docasFiltradas.length / itemsPerPage) > 1 && (
                    <div className="flex justify-center gap-2 mt-6">
                      {Array.from({
                        length: Math.ceil(docasFiltradas.length / itemsPerPage),
                      }).map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentPage(index)}
                          className={`w-3 h-3 rounded-full ${currentPage === index ? getTextColor().replace("text-", "bg-") : "bg-gray-300"}`}
                          aria-label={`Ir para página ${index + 1}`}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Resumo */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex flex-wrap justify-between items-center">
                <div className={`text-sm font-medium ${getTextColor()}`}>
                  {viewMode === "em_uso"
                    ? `Mostrando ${docasFiltradas.length} docas em uso (clique para editar)`
                    : `Mostrando ${docasFiltradas.length} rotas liberadas`}
                </div>
                <div className="text-sm text-gray-500">
                  Última atualização:{" "}
                  {new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
