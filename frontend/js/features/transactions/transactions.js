import { apiRequest } from "../../api/api-client.js";
import { state } from "../../shared/state.js";
import { formatCurrency, formatDate } from "../../shared/formatters.js";
import {
  createActionButton,
  createCell,
  renderEmptyRow,
  showStatus
} from "../../shared/dom.js";
import { loadProducts } from "../products/products.js";
import { refreshCashFlowIfVisible } from "../indicators/cash-flow.js";

// -----------------------------------------------------------------------------
// Transações com múltiplos itens.
// TransacaoSaveRequest: tipo, clienteId, vendedorId, itens[]
// ItemTransacaoSaveRequest: produtoId, quantidade, precoUnitario
// -----------------------------------------------------------------------------

function renderDraftItems() {
  const tbody = document.getElementById("itens-transacao-tbody");

  if (!state.draftItems.length) {
    renderEmptyRow(tbody, 5, "Adicione pelo menos um produto.");
    updateTransactionTotal();
    return;
  }

  const rows = state.draftItems.map((item, index) => {
    const row = document.createElement("tr");
    const product = state.products.find(
      (candidate) => Number(candidate.id) === Number(item.produtoId)
    );

    row.append(
      createCell(item.produtoNome || product?.nome || `Produto #${item.produtoId}`)
    );

    const quantityCell = document.createElement("td");
    const quantityInput = document.createElement("input");
    quantityInput.type = "number";
    quantityInput.min = "1";
    quantityInput.step = "1";
    quantityInput.required = true;
    quantityInput.value = item.quantidade;
    quantityInput.dataset.draftIndex = String(index);
    quantityInput.dataset.draftField = "quantidade";
    quantityInput.setAttribute(
      "aria-label",
      `Quantidade do produto ${item.produtoNome || item.produtoId}`
    );
    quantityCell.append(quantityInput);
    row.append(quantityCell);

    const priceCell = document.createElement("td");
    const priceInput = document.createElement("input");
    priceInput.type = "number";
    priceInput.min = "0.01";
    priceInput.step = "0.01";
    priceInput.required = true;
    priceInput.value = item.precoUnitario;
    priceInput.dataset.draftIndex = String(index);
    priceInput.dataset.draftField = "precoUnitario";
    priceInput.setAttribute(
      "aria-label",
      `Preço unitário de ${item.produtoNome || item.produtoId}`
    );
    priceCell.append(priceInput);
    row.append(priceCell);

    const subtotal = Number(item.quantidade) * Number(item.precoUnitario);
    const subtotalCell = createCell(formatCurrency(subtotal));
    subtotalCell.dataset.itemSubtotal = "true";
    row.append(subtotalCell);

    const actionsCell = document.createElement("td");
    actionsCell.append(
      createActionButton("Remover", "remove-draft-item", index)
    );
    row.append(actionsCell);

    return row;
  });

  tbody.replaceChildren(...rows);
  updateTransactionTotal();
}

function updateTransactionTotal() {
  const total = state.draftItems.reduce((sum, item) => {
    const subtotal = Number(item.quantidade) * Number(item.precoUnitario);
    return sum + (Number.isFinite(subtotal) ? subtotal : 0);
  }, 0);

  document.getElementById("transacao-total").textContent =
    `Total da transação: ${formatCurrency(total)}`;
}

function addDraftItem() {
  const productId = Number(document.getElementById("transacao-produto").value);
  const quantity = Number(document.getElementById("transacao-quantidade").value);
  const unitPrice = Number(document.getElementById("transacao-preco-unitario").value);
  const product = state.products.find((item) => Number(item.id) === productId);

  if (!product) {
    showStatus("transacao-status", "Selecione um produto válido.");
    return;
  }

  if (!Number.isInteger(quantity) || quantity <= 0) {
    showStatus(
      "transacao-status",
      "A quantidade deve ser um número inteiro maior que zero."
    );
    return;
  }

  if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
    showStatus("transacao-status", "O preço unitário deve ser maior que zero.");
    return;
  }

  const existingItem = state.draftItems.find(
    (item) => Number(item.produtoId) === productId
  );

  if (existingItem) {
    existingItem.quantidade += quantity;
    showStatus(
      "transacao-status",
      `A quantidade de ${product.nome} foi somada ao item existente. O preço já registrado foi mantido.`
    );
  } else {
    state.draftItems.push({
      produtoId: product.id,
      produtoNome: product.nome,
      quantidade: quantity,
      precoUnitario: unitPrice
    });
    showStatus("transacao-status", "Produto adicionado à transação.");
  }

  document.getElementById("transacao-produto").value = "";
  document.getElementById("transacao-quantidade").value = "1";
  document.getElementById("transacao-preco-unitario").value = "";
  renderDraftItems();
}

function resetTransactionForm() {
  document.getElementById("transacao-form").reset();
  document.getElementById("transacao-id").value = "";
  document.getElementById("transacao-quantidade").value = "1";
  document.getElementById("btn-cancelar-transacao").hidden = true;
  document.getElementById("btn-salvar-transacao").textContent = "Registrar transação";
  state.draftItems = [];
  renderDraftItems();
}

function renderTransactions() {
  const tbody = document.getElementById("transacoes-tbody");

  if (!state.transactions.length) {
    renderEmptyRow(tbody, 8, "Nenhuma transação cadastrada.");
    return;
  }

  const rows = state.transactions.map((transaction) => {
    const itemNames = (transaction.itens ?? [])
      .map((item) => `${item.produtoNome} (${item.quantidade})`)
      .join(" · ");

    const row = document.createElement("tr");
    row.append(
      createCell(transaction.id),
      createCell(transaction.tipo ? "Venda" : "Compra"),
      createCell(transaction.clienteNome),
      createCell(transaction.vendedorNome),
      createCell(itemNames || "—"),
      createCell(formatCurrency(transaction.total)),
      createCell(formatDate(transaction.dataTransacao))
    );

    const actionsCell = document.createElement("td");
    actionsCell.append(
      createActionButton("Editar", "edit-transaction", transaction.id),
      createActionButton("Excluir", "delete-transaction", transaction.id)
    );
    row.append(actionsCell);
    return row;
  });

  tbody.replaceChildren(...rows);
}

export async function loadTransactions() {
  state.transactions = await apiRequest("/transacoes");
  renderTransactions();
}

async function submitTransactionForm(event) {
  event.preventDefault();

  if (!state.draftItems.length) {
    showStatus("transacao-status", "Adicione pelo menos um produto à transação.");
    return;
  }

  const transactionId = document.getElementById("transacao-id").value;
  const typeValue = document.getElementById("transacao-tipo").value;

  const payload = {
    tipo: typeValue === "true",
    clienteId: Number(document.getElementById("transacao-cliente").value),
    vendedorId: Number(document.getElementById("transacao-vendedor").value),
    itens: state.draftItems.map((item) => ({
      produtoId: Number(item.produtoId),
      quantidade: Number(item.quantidade),
      precoUnitario: Number(item.precoUnitario)
    }))
  };

  try {
    await apiRequest(
      transactionId ? `/transacoes/${transactionId}` : "/transacoes",
      {
        method: transactionId ? "PUT" : "POST",
        body: JSON.stringify(payload)
      }
    );

    resetTransactionForm();

    // O backend atualiza o estoque. O frontend apenas recarrega os dados.
    const refreshResults = await Promise.allSettled([
      loadTransactions(),
      loadProducts(),
      refreshCashFlowIfVisible()
    ]);

    const refreshFailed = refreshResults.some(
      (result) => result.status === "rejected"
    );

    showStatus(
      "transacao-status",
      refreshFailed
        ? "Transação salva, mas não foi possível atualizar todas as listas. Recarregue a página."
        : transactionId
          ? "Transação atualizada com sucesso."
          : "Transação registrada com sucesso."
    );
  } catch (error) {
    showStatus("transacao-status", error.message);
  }
}

function editTransaction(transaction) {
  document.getElementById("transacao-id").value = transaction.id;
  document.getElementById("transacao-cliente").value = transaction.clienteId;
  document.getElementById("transacao-vendedor").value = transaction.vendedorId;
  document.getElementById("transacao-tipo").value = String(transaction.tipo);

  state.draftItems = (transaction.itens ?? []).map((item) => ({
    produtoId: item.produtoId,
    produtoNome: item.produtoNome,
    quantidade: Number(item.quantidade),
    precoUnitario: Number(item.precoUnitario)
  }));

  document.getElementById("btn-cancelar-transacao").hidden = false;
  document.getElementById("btn-salvar-transacao").textContent = "Salvar alterações";
  renderDraftItems();
  document.getElementById("transacao-cliente").focus();
  showStatus("transacao-status", `Editando transação #${transaction.id}.`);
}

function handleDraftItemsClick(event) {
  const button = event.target.closest('button[data-action="remove-draft-item"]');
  if (!button) return;

  const index = Number(button.dataset.id);
  if (!Number.isInteger(index) || !state.draftItems[index]) return;

  state.draftItems.splice(index, 1);
  renderDraftItems();
}

function handleDraftItemsInput(event) {
  const input = event.target.closest("input[data-draft-index][data-draft-field]");
  if (!input) return;

  const index = Number(input.dataset.draftIndex);
  const field = input.dataset.draftField;
  const item = state.draftItems[index];
  if (!item || !["quantidade", "precoUnitario"].includes(field)) return;

  item[field] = input.value === "" ? 0 : Number(input.value);

  const subtotalCell = input.closest("tr")?.querySelector("[data-item-subtotal]");
  if (subtotalCell) {
    subtotalCell.textContent = formatCurrency(
      Number(item.quantidade) * Number(item.precoUnitario)
    );
  }

  updateTransactionTotal();
}

async function handleTransactionTableClick(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const id = Number(button.dataset.id);
  const transaction = state.transactions.find((item) => Number(item.id) === id);
  if (!transaction) return;

  if (button.dataset.action === "edit-transaction") {
    editTransaction(transaction);
    document.querySelector('[data-view-target="venda"]').click();
    return;
  }

  if (button.dataset.action === "delete-transaction") {
    if (!window.confirm(`Excluir a transação #${id}? O estoque será ajustado pelo backend.`)) {
      return;
    }

    try {
      await apiRequest(`/transacoes/${id}`, { method: "DELETE" });

      await Promise.all([
        loadTransactions(),
        loadProducts(),
        refreshCashFlowIfVisible()
      ]);

      showStatus(
        "transacao-status",
        "Transação excluída e estoque atualizado com sucesso."
      );
    } catch (error) {
      showStatus("transacao-status", error.message);
    }
  }
}

export function initializeTransactions() {
  document.getElementById("transacao-form")
    .addEventListener("submit", submitTransactionForm);

  document.getElementById("btn-cancelar-transacao")
    .addEventListener("click", resetTransactionForm);

  document.getElementById("btn-adicionar-item")
    .addEventListener("click", addDraftItem);

  document.getElementById("itens-transacao-tbody")
    .addEventListener("click", handleDraftItemsClick);

  document.getElementById("itens-transacao-tbody")
    .addEventListener("input", handleDraftItemsInput);

  document.getElementById("transacoes-tbody")
    .addEventListener("click", handleTransactionTableClick);

  document.getElementById("transacao-produto")
    .addEventListener("change", (event) => {
      const product = state.products.find(
        (item) => String(item.id) === event.target.value
      );
      document.getElementById("transacao-preco-unitario").value = product?.preco ?? "";
    });

  renderDraftItems();
}
