const API_BASE_URL = "http://localhost:8080/api/v1";

const state = {
  products: [],
  displayedProducts: [],
  clients: [],
  sellers: [],
  transactions: []
};

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL"
});

async function apiRequest(path, options = {}) {
  const headers = {
    Accept: "application/json",
    ...options.headers
  };

  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers
    });
  } catch (error) {
    throw new Error(
      "Não foi possível conectar à API. Verifique se o Spring Boot está em execução e se o CORS está configurado."
    );
  }

  if (response.status === 204) {
    return null;
  }

  const responseText = await response.text();
  let responseBody = null;

  if (responseText) {
    try {
      responseBody = JSON.parse(responseText);
    } catch {
      responseBody = responseText;
    }
  }

  if (!response.ok) {
    const message = extractErrorMessage(responseBody)
      || `A API retornou o status HTTP ${response.status}.`;
    throw new Error(message);
  }

  return responseBody;
}

function extractErrorMessage(body) {
  if (!body) return null;
  if (typeof body === "string") return body;
  if (typeof body.message === "string") return body.message;
  if (typeof body.detail === "string") return body.detail;
  if (typeof body.title === "string") return body.title;

  if (Array.isArray(body.errors)) {
    return body.errors
      .map((error) => error.defaultMessage || error.message || String(error))
      .join(" ");
  }

  return null;
}

function showStatus(elementId, message) {
  const element = document.getElementById(elementId);
  if (element) element.textContent = message;
}

function formatCurrency(value) {
  const numericValue = Number(value);
  return currencyFormatter.format(Number.isFinite(numericValue) ? numericValue : 0);
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(date);
}

function createCell(value) {
  const cell = document.createElement("td");
  cell.textContent = value ?? "—";
  return cell;
}

function createActionButton(label, action, id) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.dataset.action = action;
  button.dataset.id = String(id);
  return button;
}

function renderEmptyRow(tbody, columnCount, message) {
  const row = document.createElement("tr");
  const cell = document.createElement("td");
  cell.colSpan = columnCount;
  cell.textContent = message;
  row.append(cell);
  tbody.replaceChildren(row);
}

function setupNavigation() {
  const navigationButtons = document.querySelectorAll("[data-view-target]");

  navigationButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const target = button.dataset.viewTarget;

      document.querySelectorAll("main > section").forEach((section) => {
        section.hidden = section.id !== `view-${target}`;
      });

      navigationButtons.forEach((navigationButton) => {
        if (navigationButton === button) {
          navigationButton.setAttribute("aria-current", "page");
        } else {
          navigationButton.removeAttribute("aria-current");
        }
      });
    });
  });
}


async function loadProducts() {
  state.products = await apiRequest("/produtos");
  state.displayedProducts = [...state.products];
  renderProducts();
  populateProductSelect();
}

function renderProducts() {
  const tbody = document.getElementById("produtos-tbody");

  if (!state.displayedProducts.length) {
    renderEmptyRow(tbody, 7, "Nenhum produto encontrado.");
    return;
  }

  const rows = state.displayedProducts.map((product) => {
    const row = document.createElement("tr");
    const stockTotal = Number(product.preco) * Number(product.quantidade);

    row.append(
      createCell(product.id),
      createCell(product.nome),
      createCell(product.descricao || "—"),
      createCell(formatCurrency(product.preco)),
      createCell(product.quantidade),
      createCell(formatCurrency(stockTotal))
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

  if (!product) {
    form.reset();
    document.getElementById("produto-id").value = "";
    document.getElementById("produto-form-titulo").textContent = "Novo produto";
    document.getElementById("produto-nome").focus();
    return;
  }

  document.getElementById("produto-id").value = product.id;
  document.getElementById("produto-nome").value = product.nome ?? "";
  document.getElementById("produto-descricao").value = product.descricao ?? "";
  document.getElementById("produto-preco").value = product.preco;
  document.getElementById("produto-quantidade").value = product.quantidade;
  document.getElementById("produto-form-titulo").textContent = `Editar produto #${product.id}`;
  document.getElementById("produto-nome").focus();
}

async function submitProductForm(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const id = document.getElementById("produto-id").value;

  const payload = {
    nome: document.getElementById("produto-nome").value.trim(),
    descricao: document.getElementById("produto-descricao").value.trim() || null,
    preco: Number(document.getElementById("produto-preco").value),
    quantidade: Number(document.getElementById("produto-quantidade").value)
  };

  try {
    if (id) {
      await apiRequest(`/produtos/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      });
      showStatus("produto-status", "Produto atualizado com sucesso.");
    } else {
      await apiRequest("/produtos", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      showStatus("produto-status", "Produto cadastrado com sucesso.");
    }

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
    return;
  }

  try {
    state.displayedProducts = await apiRequest(
      `/produtos?nome=${encodeURIComponent(searchValue)}`
    );
    renderProducts();
    showStatus("produto-status", `${state.displayedProducts.length} produto(s) encontrado(s).`);
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
    const confirmed = window.confirm(`Excluir o produto #${productId}?`);
    if (!confirmed) return;

    try {
      await apiRequest(`/produtos/${productId}`, { method: "DELETE" });
      showStatus("produto-status", "Produto excluído com sucesso.");
      await loadProducts();
    } catch (error) {
      showStatus("produto-status", error.message);
    }
  }
}

function createPersonManager(config) {
  const {
    resource,
    singular,
    plural,
    formId,
    idInputId,
    nameInputId,
    cancelButtonId,
    statusId,
    tbodyId,
    selectId
  } = config;

  const listKey = resource === "clientes" ? "clients" : "sellers";

  async function load() {
    state[listKey] = await apiRequest(`/${resource}`);
    render();
    populateSelect();
  }

  function render() {
    const tbody = document.getElementById(tbodyId);

    if (!state[listKey].length) {
      renderEmptyRow(tbody, 3, `Nenhum ${singular} cadastrado.`);
      return;
    }

    const rows = state[listKey].map((person) => {
      const row = document.createElement("tr");
      row.append(createCell(person.id), createCell(person.nome));

      const actionsCell = document.createElement("td");
      actionsCell.append(
        createActionButton("Editar", `edit-${singular}`, person.id),
        createActionButton("Excluir", `delete-${singular}`, person.id)
      );
      row.append(actionsCell);
      return row;
    });

    tbody.replaceChildren(...rows);
  }

  function populateSelect() {
    const select = document.getElementById(selectId);
    const previousValue = select.value;
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = `Selecione ${singular === "cliente" ? "um cliente" : "um vendedor"}`;

    const options = state[listKey].map((person) => {
      const option = document.createElement("option");
      option.value = person.id;
      option.textContent = `${person.nome} (ID: ${person.id})`;
      return option;
    });

    select.replaceChildren(placeholder, ...options);
    if (state[listKey].some((person) => String(person.id) === previousValue)) {
      select.value = previousValue;
    }
  }

  function resetForm() {
    document.getElementById(formId).reset();
    document.getElementById(idInputId).value = "";
    document.getElementById(cancelButtonId).hidden = true;
  }

  async function submit(event) {
    event.preventDefault();
    const id = document.getElementById(idInputId).value;
    const payload = {
      nome: document.getElementById(nameInputId).value.trim()
    };

    try {
      if (id) {
        await apiRequest(`/${resource}/${id}`, {
          method: "PUT",
          body: JSON.stringify(payload)
        });
        showStatus(statusId, `${singular[0].toUpperCase()}${singular.slice(1)} atualizado(a) com sucesso.`);
      } else {
        await apiRequest(`/${resource}`, {
          method: "POST",
          body: JSON.stringify(payload)
        });
        showStatus(statusId, `${singular[0].toUpperCase()}${singular.slice(1)} cadastrado(a) com sucesso.`);
      }

      resetForm();
      await load();
    } catch (error) {
      showStatus(statusId, error.message);
    }
  }

  async function handleTableClick(event) {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const id = Number(button.dataset.id);
    const person = state[listKey].find((item) => Number(item.id) === id);
    if (!person) return;

    if (button.dataset.action === `edit-${singular}`) {
      document.getElementById(idInputId).value = person.id;
      document.getElementById(nameInputId).value = person.nome ?? "";
      document.getElementById(cancelButtonId).hidden = false;
      document.getElementById(nameInputId).focus();
      return;
    }

    if (button.dataset.action === `delete-${singular}`) {
      const confirmed = window.confirm(`Excluir ${singular} "${person.nome}"?`);
      if (!confirmed) return;

      try {
        await apiRequest(`/${resource}/${id}`, { method: "DELETE" });
        showStatus(statusId, `${singular[0].toUpperCase()}${singular.slice(1)} excluído(a) com sucesso.`);
        await load();
      } catch (error) {
        showStatus(statusId, error.message);
      }
    }
  }

  document.getElementById(formId).addEventListener("submit", submit);
  document.getElementById(cancelButtonId).addEventListener("click", resetForm);
  document.getElementById(tbodyId).addEventListener("click", handleTableClick);

  return { load };
}

const clientManager = createPersonManager({
  resource: "clientes",
  singular: "cliente",
  formId: "cliente-form",
  idInputId: "cliente-id",
  nameInputId: "cliente-nome",
  cancelButtonId: "btn-cancelar-cliente",
  statusId: "cliente-status",
  tbodyId: "clientes-tbody",
  selectId: "transacao-cliente"
});

const sellerManager = createPersonManager({
  resource: "vendedores",
  singular: "vendedor",
  formId: "vendedor-form",
  idInputId: "vendedor-id",
  nameInputId: "vendedor-nome",
  cancelButtonId: "btn-cancelar-vendedor",
  statusId: "vendedor-status",
  tbodyId: "vendedores-tbody",
  selectId: "transacao-vendedor"
});

function getRelationName(value) {
  if (value && typeof value === "object") return value.nome ?? value.name ?? "—";
  return value ?? "—";
}

function getRelationId(value) {
  if (value && typeof value === "object") return value.id;
  return value;
}

function populateProductSelect() {
  const select = document.getElementById("transacao-produto");
  const previousValue = select.value;
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Selecione um produto";

  const options = state.products.map((product) => {
    const option = document.createElement("option");
    option.value = product.id;
    option.textContent = `${product.nome} (ID: ${product.id})`;
    return option;
  });

  select.replaceChildren(placeholder, ...options);
  if (state.products.some((product) => String(product.id) === previousValue)) {
    select.value = previousValue;
  }
}

function updateTransactionTotal() {
  const quantity = Number(document.getElementById("transacao-quantidade").value) || 0;
  const unitPrice = Number(document.getElementById("transacao-preco-unitario").value) || 0;
  document.getElementById("transacao-total").textContent =
    `Total: ${formatCurrency(quantity * unitPrice)}`;
}

function resetTransactionForm() {
  const form = document.getElementById("transacao-form");
  form.reset();
  document.getElementById("transacao-id").value = "";
  document.getElementById("transacao-quantidade").value = "1";
  document.getElementById("btn-cancelar-transacao").hidden = true;
  updateTransactionTotal();
}

function renderTransactions() {
  const tbody = document.getElementById("transacoes-tbody");

  if (!state.transactions.length) {
    renderEmptyRow(tbody, 10, "Nenhuma transação cadastrada.");
    return;
  }

  const rows = state.transactions.map((transaction) => {
    const product = transaction.produto;
    const quantity = Number(transaction.quantidade) || 0;
    const unitPrice = Number(transaction.precoUnitario) || 0;
    const row = document.createElement("tr");

    row.append(
      createCell(transaction.id),
      createCell(getRelationName(product)),
      createCell(getRelationName(transaction.cliente)),
      createCell(getRelationName(transaction.vendedor)),
      createCell(transaction.tipo ? "Venda" : "Compra"),
      createCell(quantity),
      createCell(formatCurrency(unitPrice)),
      createCell(formatCurrency(quantity * unitPrice)),
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

async function loadTransactions() {
  state.transactions = await apiRequest("/transacoes");
  renderTransactions();
}

async function submitTransactionForm(event) {
  event.preventDefault();
  const id = document.getElementById("transacao-id").value;
  const payload = {
    produtoId: Number(document.getElementById("transacao-produto").value),
    clienteId: Number(document.getElementById("transacao-cliente").value),
    vendedorId: Number(document.getElementById("transacao-vendedor").value),
    tipo: document.getElementById("transacao-tipo").value === "true",
    quantidade: Number(document.getElementById("transacao-quantidade").value),
    precoUnitario: Number(document.getElementById("transacao-preco-unitario").value)
  };

  try {
    if (id) {
      await apiRequest(`/transacoes/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      });
      showStatus("transacao-status", "Transação atualizada com sucesso.");
    } else {
      await apiRequest("/transacoes", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      showStatus("transacao-status", "Transação registrada com sucesso.");
    }

    resetTransactionForm();
    await Promise.all([loadTransactions(), loadProducts()]);
  } catch (error) {
    showStatus("transacao-status", error.message);
  }
}

function editTransaction(transaction) {
  document.getElementById("transacao-id").value = transaction.id;
  document.getElementById("transacao-produto").value = getRelationId(transaction.produto) ?? transaction.produtoId ?? "";
  document.getElementById("transacao-cliente").value = getRelationId(transaction.cliente) ?? transaction.clienteId ?? "";
  document.getElementById("transacao-vendedor").value = getRelationId(transaction.vendedor) ?? transaction.vendedorId ?? "";
  document.getElementById("transacao-tipo").value = String(transaction.tipo);
  document.getElementById("transacao-quantidade").value = transaction.quantidade;
  document.getElementById("transacao-preco-unitario").value = transaction.precoUnitario;
  document.getElementById("btn-cancelar-transacao").hidden = false;
  updateTransactionTotal();
  document.getElementById("transacao-produto").focus();
}

async function handleTransactionTableClick(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const id = Number(button.dataset.id);
  const transaction = state.transactions.find((item) => Number(item.id) === id);
  if (!transaction) return;

  if (button.dataset.action === "edit-transaction") {
    editTransaction(transaction);
    return;
  }

  if (button.dataset.action === "delete-transaction") {
    const confirmed = window.confirm(`Excluir a transação #${id}?`);
    if (!confirmed) return;

    try {
      await apiRequest(`/transacoes/${id}`, { method: "DELETE" });
      showStatus("transacao-status", "Transação excluída com sucesso.");
      await loadTransactions();
    } catch (error) {
      showStatus("transacao-status", error.message);
    }
  }
}

function setupEventListeners() {
  document.getElementById("btn-novo-produto").addEventListener("click", () => openProductForm());
  document.getElementById("btn-cancelar-produto").addEventListener("click", resetProductForm);
  document.getElementById("produto-form").addEventListener("submit", submitProductForm);
  document.getElementById("produto-pesquisa-form").addEventListener("submit", searchProducts);
  document.getElementById("btn-limpar-pesquisa").addEventListener("click", () => {
    document.getElementById("produto-pesquisa").value = "";
    state.displayedProducts = [...state.products];
    renderProducts();
    showStatus("produto-status", "");
  });
  document.getElementById("produtos-tbody").addEventListener("click", handleProductTableClick);

  document.getElementById("transacao-form").addEventListener("submit", submitTransactionForm);
  document.getElementById("btn-cancelar-transacao").addEventListener("click", resetTransactionForm);
  document.getElementById("transacoes-tbody").addEventListener("click", handleTransactionTableClick);

  document.getElementById("transacao-produto").addEventListener("change", (event) => {
    const product = state.products.find((item) => String(item.id) === event.target.value);
    if (product) {
      document.getElementById("transacao-preco-unitario").value = product.preco;
    }
    updateTransactionTotal();
  });

  document.getElementById("transacao-quantidade").addEventListener("input", updateTransactionTotal);
  document.getElementById("transacao-preco-unitario").addEventListener("input", updateTransactionTotal);
}

async function initialize() {
  setupNavigation();
  setupEventListeners();

  const initialLoads = await Promise.allSettled([
    loadProducts(),
    clientManager.load(),
    sellerManager.load(),
    loadTransactions()
  ]);

  const failedLoads = initialLoads.filter((result) => result.status === "rejected");
  if (failedLoads.length) {
    console.error("Falha ao carregar um ou mais recursos da API:", failedLoads);
    showStatus(
      "produto-status",
      "Alguns dados não puderam ser carregados. Confira se a API está ativa e consulte o console do navegador."
    );
  }

  updateTransactionTotal();
}

initialize();
