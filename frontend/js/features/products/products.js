import { apiRequest } from "../../api/api-client.js";
import { state } from "../../shared/state.js";
import { formatCurrency } from "../../shared/formatters.js";
import {
  createActionButton,
  createCell,
  renderEmptyRow,
  setSelectOptions,
  showStatus
} from "../../shared/dom.js";

const PRODUCT_TABLE_COLUMNS = 7;

export async function loadProducts() {
  state.products = await apiRequest("/produtos");
  state.displayedProducts = [...state.products];

  renderProducts();
  populateProductSelect();
}

function renderProducts() {
  const tbody = document.getElementById("produtos-tbody");

  if (!state.displayedProducts.length) {
    renderEmptyRow(tbody, PRODUCT_TABLE_COLUMNS, "Nenhum produto encontrado.");
    return;
  }

  const rows = state.displayedProducts.map((product) => {
    const row = document.createElement("tr");
    const stockValue = Number(product.preco) * Number(product.quantidade);

    row.append(
      createCell(product.id),
      createCell(product.nome),
      createCell(product.descricao || "—"),
      createCell(formatCurrency(product.preco)),
      createCell(product.quantidade),
      createCell(formatCurrency(stockValue))
    );

    const actionsCell = document.createElement("td");
    actionsCell.append(
      createActionButton("Editar", "edit-product", product.id),
      createActionButton("Excluir", "delete-product", product.id)
    );
    row.append(actionsCell);
    return row;
  });

  tbody.replaceChildren(...rows);
}

function populateProductSelect() {
  const select = document.getElementById("transacao-produto");
  if (!select) return;

  setSelectOptions(
    select,
    "Selecione um produto",
    state.products,
    (product) => `${product.nome} (estoque: ${product.quantidade})`
  );
}

function resetProductForm() {
  const form = document.getElementById("produto-form");
  form.reset();
  document.getElementById("produto-id").value = "";
  document.getElementById("produto-form-titulo").textContent = "Novo produto";
  form.hidden = true;
}

function openProductForm(product = null) {
  const form = document.getElementById("produto-form");
  form.hidden = false;
  form.reset();

  if (!product) {
    document.getElementById("produto-id").value = "";
    document.getElementById("produto-form-titulo").textContent = "Novo produto";
  } else {
    document.getElementById("produto-id").value = product.id;
    document.getElementById("produto-nome").value = product.nome ?? "";
    document.getElementById("produto-descricao").value = product.descricao ?? "";
    document.getElementById("produto-preco").value = product.preco;
    document.getElementById("produto-quantidade").value = product.quantidade;
    document.getElementById("produto-form-titulo").textContent = `Editar produto #${product.id}`;
  }

  document.getElementById("produto-nome").focus();
}

async function submitProductForm(event) {
  event.preventDefault();

  const id = document.getElementById("produto-id").value;
  const payload = {
    nome: document.getElementById("produto-nome").value.trim(),
    descricao: document.getElementById("produto-descricao").value.trim() || null,
    preco: Number(document.getElementById("produto-preco").value),
    quantidade: Number(document.getElementById("produto-quantidade").value)
  };

  try {
    await apiRequest(id ? `/produtos/${id}` : "/produtos", {
      method: id ? "PUT" : "POST",
      body: JSON.stringify(payload)
    });

    showStatus(
      "produto-status",
      id ? "Produto atualizado com sucesso." : "Produto cadastrado com sucesso."
    );

    resetProductForm();
    document.getElementById("produto-pesquisa").value = "";
    await loadProducts();
  } catch (error) {
    showStatus("produto-status", error.message);
  }
}

async function searchProducts(event) {
  event.preventDefault();
  const searchValue = document.getElementById("produto-pesquisa").value.trim();

  if (!searchValue) {
    state.displayedProducts = [...state.products];
    renderProducts();
    showStatus("produto-status", "");
    return;
  }

  try {
    state.displayedProducts = await apiRequest(
      `/produtos?nome=${encodeURIComponent(searchValue)}`
    );
    renderProducts();
    showStatus(
      "produto-status",
      `${state.displayedProducts.length} produto(s) encontrado(s).`
    );
  } catch (error) {
    showStatus("produto-status", error.message);
  }
}

async function handleProductTableClick(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const productId = Number(button.dataset.id);
  const product = state.products.find((item) => Number(item.id) === productId);

  if (button.dataset.action === "edit-product") {
    if (product) openProductForm(product);
    return;
  }

  if (button.dataset.action === "delete-product") {
    if (!window.confirm(`Excluir o produto #${productId}?`)) return;

    try {
      await apiRequest(`/produtos/${productId}`, { method: "DELETE" });
      showStatus("produto-status", "Produto excluído com sucesso.");
      await loadProducts();
    } catch (error) {
      showStatus("produto-status", error.message);
    }
  }
}

export function initializeProducts() {
  document.getElementById("btn-novo-produto")
    .addEventListener("click", () => openProductForm());

  document.getElementById("btn-cancelar-produto")
    .addEventListener("click", resetProductForm);

  document.getElementById("produto-form")
    .addEventListener("submit", submitProductForm);

  document.getElementById("produto-pesquisa-form")
    .addEventListener("submit", searchProducts);

  document.getElementById("btn-limpar-pesquisa").addEventListener("click", () => {
    document.getElementById("produto-pesquisa").value = "";
    state.displayedProducts = [...state.products];
    renderProducts();
    showStatus("produto-status", "");
  });

  document.getElementById("produtos-tbody")
    .addEventListener("click", handleProductTableClick);
}
