import { apiRequest } from "../../api/api-client.js";
import {
  compactCurrencyFormatter,
  formatCurrency,
  formatDateOnly
} from "../../shared/formatters.js";
import { showStatus } from "../../shared/dom.js";

const BRAZIL_TIME_ZONE = "America/Sao_Paulo";
const CHART_JS_URL = "https://cdn.jsdelivr.net/npm/chart.js@4.6.1/dist/chart.umd.min.js";

let cashFlowChart = null;
let chartLibraryPromise = null;
let latestRequestId = 0;

// Carrega Chart.js apenas quando o usuário abre a área de indicadores.
// Isso mantém a biblioteca fora do caminho inicial de carregamento do ERP.
async function ensureChartJs() {
  if (window.Chart) return window.Chart;

  if (!chartLibraryPromise) {
    chartLibraryPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = CHART_JS_URL;
      script.async = true;

      script.onload = () => {
        if (window.Chart) {
          resolve(window.Chart);
        } else {
          chartLibraryPromise = null;
          reject(new Error("A biblioteca Chart.js foi carregada, mas não ficou disponível."));
        }
      };

      script.onerror = () => {
        chartLibraryPromise = null;
        reject(
          new Error("Não foi possível carregar o Chart.js. Verifique sua conexão com a internet.")
        );
      };

      document.head.append(script);
    });
  }

  return chartLibraryPromise;
}

function getTodayForDateInput() {
  // A data de referência deve seguir o calendário comercial brasileiro,
  // mesmo que o navegador esteja configurado com outro fuso horário.
  const dateParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BRAZIL_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());

  const values = Object.fromEntries(
    dateParts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  );

  return `${values.year}-${values.month}-${values.day}`;
}

function formatPeriodName(period) {
  const names = {
    SEMANA: "Semana",
    MES: "Mês",
    ANO: "Ano"
  };

  return names[period] ?? period;
}

function getPointLabel(point, period) {
  // Aceita os nomes atuais do DTO e os nomes anteriores durante a transição.
  if (point.textoExibicao) return point.textoExibicao;
  if (point.rotulo) return point.rotulo;
  if (!point.data) return "—";

  const date = new Date(point.data);
  if (Number.isNaN(date.getTime())) return String(point.data);

  const formatOptions = period === "ANO"
    ? { month: "short", timeZone: BRAZIL_TIME_ZONE }
    : period === "MES"
      ? { day: "2-digit", timeZone: BRAZIL_TIME_ZONE }
      : { weekday: "short", timeZone: BRAZIL_TIME_ZONE };

  return new Intl.DateTimeFormat("pt-BR", formatOptions)
    .format(date)
    .replace(".", "")
    .toUpperCase();
}

function renderCashFlowTotals(response) {
  const totalEntradas = Number(response.totalEntradas ?? 0);
  const totalSaidas = Number(response.totalSaidas ?? 0);
  const saldo = Number(response.saldo ?? totalEntradas - totalSaidas);

  document.getElementById("fluxo-total-entradas").textContent =
    formatCurrency(totalEntradas);
  document.getElementById("fluxo-total-saidas").textContent =
    formatCurrency(totalSaidas);

  const saldoElement = document.getElementById("fluxo-saldo");
  saldoElement.textContent = formatCurrency(saldo);
  saldoElement.classList.toggle("is-negative", saldo < 0);
  saldoElement.classList.toggle("is-positive", saldo > 0);

  document.getElementById("fluxo-periodo-descricao").textContent =
    `${formatPeriodName(response.periodo)}: ${formatDateOnly(response.inicio)} até ${formatDateOnly(response.fim)}`;
}

function createCashFlowChart(response, ChartConstructor) {
  const canvas = document.getElementById("fluxo-caixa-chart");
  const points = response.pontos ?? [];
  const labels = points.map((point) => getPointLabel(point, response.periodo));

  const entries = points.map((point) => Number(point.entradas ?? 0));
  const outflows = points.map((point) => Number(point.saidas ?? 0));
  const balance = points.map((point) => Number(point.saldo ?? 0));

  const chartData = {
    labels,
    datasets: [
      {
        type: "bar",
        label: "Entradas",
        data: entries,
        backgroundColor: "rgba(255, 160, 30, 0.82)",
        borderColor: "#c77b08",
        borderWidth: 1,
        borderRadius: 6,
        maxBarThickness: 28,
        order: 2
      },
      {
        type: "bar",
        label: "Saídas",
        data: outflows,
        backgroundColor: "rgba(24, 24, 24, 0.76)",
        borderColor: "#181818",
        borderWidth: 1,
        borderRadius: 6,
        maxBarThickness: 28,
        order: 2
      },
      {
        type: "line",
        label: "Saldo",
        data: balance,
        borderColor: "#c77b08",
        backgroundColor: "#c77b08",
        borderWidth: 2.5,
        pointRadius: 3,
        pointHoverRadius: 5,
        pointBackgroundColor: "#ffa01e",
        pointBorderColor: "#181818",
        pointBorderWidth: 1,
        tension: 0.25,
        fill: false,
        order: 1
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index",
      intersect: false
    },
    layout: {
      padding: { top: 8, right: 10, bottom: 0, left: 4 }
    },
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          usePointStyle: true,
          pointStyle: "circle",
          boxWidth: 9,
          boxHeight: 9,
          padding: 20,
          color: "#181818",
          font: {
            family: "Arial, Helvetica, sans-serif",
            size: 12,
            weight: "700"
          }
        }
      },
      tooltip: {
        backgroundColor: "#181818",
        titleColor: "#ffffff",
        bodyColor: "#ffffff",
        borderColor: "#ffa01e",
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        callbacks: {
          label(context) {
            return `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: {
          color: "#555555",
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: response.periodo === "MES" ? 16 : 12,
          font: { family: "Arial, Helvetica, sans-serif", size: 11 }
        }
      },
      y: {
        beginAtZero: true,
        border: { display: false },
        grid: {
          color: "rgba(24, 24, 24, 0.10)",
          tickBorderDash: [3, 3]
        },
        ticks: {
          color: "#555555",
          callback(value) {
            return compactCurrencyFormatter.format(value);
          },
          font: { family: "Arial, Helvetica, sans-serif", size: 11 }
        }
      }
    }
  };

  if (cashFlowChart) {
    cashFlowChart.data = chartData;
    cashFlowChart.options = chartOptions;
    cashFlowChart.update();
    // Recalcula as dimensões quando a seção volta a ficar visível.
    cashFlowChart.resize();
    return;
  }

  cashFlowChart = new ChartConstructor(canvas.getContext("2d"), {
    type: "bar",
    data: chartData,
    options: chartOptions
  });
}

export async function loadCashFlow() {
  const periodInput = document.getElementById("fluxo-periodo");
  const dateInput = document.getElementById("fluxo-data-referencia");
  const updateButton = document.getElementById("btn-atualizar-fluxo");
  const referenceDate = dateInput.value;

  if (!referenceDate) {
    showStatus("fluxo-status", "Selecione uma data de referência.");
    return;
  }

  // O backend recebe Instant. Meio-dia UTC permanece no mesmo dia civil
  // depois da conversão para America/Sao_Paulo.
  const dataReferencia = `${referenceDate}T12:00:00Z`;
  const params = new URLSearchParams({
    periodo: periodInput.value,
    dataReferencia
  });

  const requestId = ++latestRequestId;
  updateButton.disabled = true;
  updateButton.textContent = "Carregando...";
  showStatus("fluxo-status", "Consultando movimentações...");

  try {
    const [response, ChartConstructor] = await Promise.all([
      apiRequest(`/indicadores/fluxo-caixa?${params.toString()}`),
      ensureChartJs()
    ]);

    // Impede que uma resposta antiga sobrescreva uma consulta mais recente.
    if (requestId !== latestRequestId) return;

    renderCashFlowTotals(response);
    createCashFlowChart(response, ChartConstructor);
    showStatus("fluxo-status", "Fluxo de caixa atualizado.");
  } catch (error) {
    if (requestId === latestRequestId) {
      showStatus("fluxo-status", error.message);
    }
  } finally {
    if (requestId === latestRequestId) {
      updateButton.disabled = false;
      updateButton.textContent = "Atualizar gráfico";
    }
  }
}

export async function refreshCashFlowIfVisible() {
  const indicatorsView = document.getElementById("view-indicadores");
  if (indicatorsView && !indicatorsView.hidden) {
    await loadCashFlow();
  }
}

export function resizeCashFlowChart() {
  if (cashFlowChart) {
    cashFlowChart.resize();
  }
}

export function initializeCashFlow() {
  const dateInput = document.getElementById("fluxo-data-referencia");
  dateInput.value = getTodayForDateInput();

  document.getElementById("fluxo-filtros-form")
    .addEventListener("submit", (event) => {
      event.preventDefault();
      loadCashFlow();
    });
}
