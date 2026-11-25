import { setupNavigation } from "./shared/navigation.js";
import { showStatus } from "./shared/dom.js";

import {
  initializeProducts,
  loadProducts
} from "./features/products/products.js";

import {
  initializePeople,
  loadClients,
  loadSellers
} from "./features/people/people.js";

import {
  initializeTransactions,
  loadTransactions
} from "./features/transactions/transactions.js";

import {
  initializeCashFlow,
  loadCashFlow,
  resizeCashFlowChart
} from "./features/indicators/cash-flow.js";

async function initializeApp() {
  // Cada funcionalidade registra seus próprios eventos.
  initializeProducts();
  initializePeople();
  initializeTransactions();
  initializeCashFlow();

  // A navegação informa ao módulo principal qual área ficou visível.
  setupNavigation((viewName) => {
    if (viewName === "indicadores") {
      // O canvas só é dimensionado corretamente depois de a seção aparecer.
      loadCashFlow();
    } else {
      resizeCashFlowChart();
    }
  });

  // Carrega os dados iniciais das áreas de estoque e transações.
  const results = await Promise.allSettled([
    loadProducts(),
    loadClients(),
    loadSellers(),
    loadTransactions()
  ]);

  const failedLoads = results.filter((result) => result.status === "rejected");

  if (failedLoads.length) {
    console.error("Falha ao carregar recursos da API:", failedLoads);
    showStatus(
      "produto-status",
      "Alguns dados não puderam ser carregados. Verifique a API, os endpoints e o CORS."
    );
  }
}

initializeApp().catch((error) => {
  console.error("Falha ao inicializar o SoftNeo:", error);
  showStatus("produto-status", error.message);
});
