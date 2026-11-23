const API_BASE_URL = "http://localhost:8080/api/v1";

const state = {
  products: [],
  displayedProducts: [],
  clients: [],
  sellers: [],
  transactions: [],
  draftItems: []
};

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL"
});

// -----------------------------------------------------------------------------
// Cliente HTTP: centraliza fetch, JSON, respostas 204 e mensagens de erro.
// -----------------------------------------------------------------------------
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
  } catch {
    throw new Error(
      "Não foi possível conectar à API. Verifique o Spring Boot e a configuração de CORS."
    );
  }

  if (response.status === 204) return null;

  const responseText = await response.text();
  let body = null;

  if (responseText) {
    try {
      body = JSON.parse(responseText);
    } catch {
      body = responseText;
    }
  }

  if (!response.ok) {
    throw new Error(
      extractErrorMessage(body) || `A API retornou HTTP ${response.status}.`
    );
  }

  return body;
}

function extractErrorMessage(body) {
  if (!body) return null;
  if (typeof body === "string") return body;
  if (typeof body.detail === "string") return body.detail;
  if (typeof body.message === "string") return body.message;
  if (typeof body.title === "string") return body.title;

  if (Array.isArray(body.errors)) {
    return body.errors
      .map((error) => error.defaultMessage || error.message || String(error))
      .join(" ");
  }

  if (Array.isArray(body.fieldErrors)) {
    return body.fieldErrors
      .map((error) => error.defaultMessage || error.message || String(error))
      .join(" ");
  }

  if (body.errors && typeof body.errors === "object") {
    return Object.entries(body.errors)
      .map(([field, message]) => `${field}: ${Array.isArray(message) ? message.join(", ") : message}`)
      .join(" ");
  }

  return null;
}

// -----------------------------------------------------------------------------
// Funções utilitárias para apresentação e criação segura de elementos.
// -----------------------------------------------------------------------------
function showStatus(elementId, message) {
  const element = document.getElementById(elementId);
  if (element) element.textContent = message;
}

function formatCurrency(value) {
  const number = Number(value);
  return currencyFormatter.format(Number.isFinite(number) ? number : 0);
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

function setSelectOptions(select, placeholderText, items, getLabel) {
  const previousValue = select.value;
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = placeholderText;

  const options = items.map((item) => {
    const option = document.createElement("option");
    option.value = item.id;
    option.textContent = getLabel(item);
    return option;
  });

  select.replaceChildren(placeholder, ...options);

  if (items.some((item) => String(item.id) === previousValue)) {
    select.value = previousValue;
  }
}

// -----------------------------------------------------------------------------
// Navegação entre Estoque e Venda.
// -----------------------------------------------------------------------------
function setupNavigation() {
  const buttons = document.querySelectorAll("[data-view-target]");

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const targetId = `view-${button.dataset.viewTarget}`;

      document.querySelectorAll("#conteudo-principal > section").forEach((section) => {
        section.hidden = section.id !== targetId;
      });

      buttons.forEach((navigationButton) => {
        if (navigationButton === button) {
          navigationButton.setAttribute("aria-current", "page");
        } else {
          navigationButton.removeAttribute("aria-current");
        }
      });
    });
  });
}

// -----------------------------------------------------------------------------
// Produtos: CRUD e pesquisa por nome.
// -----------------------------------------------------------------------------
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

// -----------------------------------------------------------------------------
// Clientes e vendedores: CRUD usado para preencher os dados da transação.
// -----------------------------------------------------------------------------
function createPersonManager(config) {
  const {
    resource,
    singular,
    stateKey,
    formId,
    idInputId,
    nameInputId,
    cancelButtonId,
    statusId,
    tbodyId,
    selectId
  } = config;

  async function load() {
    state[stateKey] = await apiRequest(`/${resource}`);
    render();
    populateSelect();
  }

  function render() {
    const tbody = document.getElementById(tbodyId);
    const people = state[stateKey];

    if (!people.length) {
      renderEmptyRow(tbody, 3, `Nenhum ${singular} cadastrado.`);
      return;
    }

    const rows = people.map((person) => {
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
    const people = state[stateKey];
    const placeholder = singular === "cliente" ? "Selecione um cliente" : "Selecione um vendedor";

    setSelectOptions(
      select,
      placeholder,
      people,
      (person) => `${person.nome} (ID: ${person.id})`
    );
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
      await apiRequest(id ? `/${resource}/${id}` : `/${resource}`, {
        method: id ? "PUT" : "POST",
        body: JSON.stringify(payload)
      });

      showStatus(
        statusId,
        id
          ? `${capitalize(singular)} atualizado(a) com sucesso.`
          : `${capitalize(singular)} cadastrado(a) com sucesso.`
      );

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
    const person = state[stateKey].find((item) => Number(item.id) === id);
    if (!person) return;

    if (button.dataset.action === `edit-${singular}`) {
      document.getElementById(idInputId).value = person.id;
      document.getElementById(nameInputId).value = person.nome ?? "";
      document.getElementById(cancelButtonId).hidden = false;
      document.getElementById(nameInputId).focus();
      return;
    }

    if (button.dataset.action === `delete-${singular}`) {
      if (!window.confirm(`Excluir ${singular} "${person.nome}"?`)) return;

      try {
        await apiRequest(`/${resource}/${id}`, { method: "DELETE" });
        showStatus(statusId, `${capitalize(singular)} excluído(a) com sucesso.`);
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

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const clientManager = createPersonManager({
  resource: "clientes",
  singular: "cliente",
  stateKey: "clients",
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
  stateKey: "sellers",
  formId: "vendedor-form",
  idInputId: "vendedor-id",
  nameInputId: "vendedor-nome",
  cancelButtonId: "btn-cancelar-vendedor",
  statusId: "vendedor-status",
  tbodyId: "vendedores-tbody",
  selectId: "transacao-vendedor"
});

// -----------------------------------------------------------------------------
// Transação com múltiplos itens: contrato novo da API.
// TransacaoSaveRequest: tipo, clienteId, vendedorId, itens[]
// ItemTransacaoSaveRequest: produtoId, quantidade, precoUnitario
// -----------------------------------------------------------------------------
function populateProductSelect() {
  setSelectOptions(
    document.getElementById("transacao-produto"),
    "Selecione um produto",
    state.products,
    (product) => `${product.nome} (estoque: ${product.quantidade})`
  );
}

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

    row.append(createCell(item.produtoNome || product?.nome || `Produto #${item.produtoId}`));

    const quantityCell = document.createElement("td");
    const quantityInput = document.createElement("input");
    quantityInput.type = "number";
    quantityInput.min = "1";
    quantityInput.step = "1";
    quantityInput.required = true;
    quantityInput.value = item.quantidade;
    quantityInput.dataset.draftIndex = String(index);
    quantityInput.dataset.draftField = "quantidade";
    quantityInput.setAttribute("aria-label", `Quantidade do produto ${item.produtoNome || item.produtoId}`);
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
    priceInput.setAttribute("aria-label", `Preço unitário de ${item.produtoNome || item.produtoId}`);
    priceCell.append(priceInput);
    row.append(priceCell);

    const subtotal = Number(item.quantidade) * Number(item.precoUnitario);
    const subtotalCell = createCell(formatCurrency(subtotal));
    subtotalCell.dataset.itemSubtotal = "true";
    row.append(subtotalCell);

    const actionsCell = document.createElement("td");
    actionsCell.append(createActionButton("Remover", "remove-draft-item", index));
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
    showStatus("transacao-status", "A quantidade deve ser um número inteiro maior que zero.");
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

async function loadTransactions() {
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

    const refreshResults = await Promise.allSettled([
      loadTransactions(),
      loadProducts()
    ]);

    const refreshFailed = refreshResults.some((result) => result.status === "rejected");
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

async function handleDraftItemsClick(event) {
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
    if (!window.confirm(`Excluir a transação #${id}? O estoque será ajustado pelo backend.`)) return;

    try {
      await apiRequest(`/transacoes/${id}`, { method: "DELETE" });
      await Promise.all([loadTransactions(), loadProducts()]);
      showStatus("transacao-status", "Transação excluída e estoque atualizado com sucesso.");
    } catch (error) {
      showStatus("transacao-status", error.message);
    }
  }
}

// -----------------------------------------------------------------------------
// Eventos da página.
// -----------------------------------------------------------------------------
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
  document.getElementById("btn-adicionar-item").addEventListener("click", addDraftItem);
  document.getElementById("itens-transacao-tbody").addEventListener("click", handleDraftItemsClick);
  document.getElementById("itens-transacao-tbody").addEventListener("input", handleDraftItemsInput);
  document.getElementById("transacoes-tbody").addEventListener("click", handleTransactionTableClick);

  document.getElementById("transacao-produto").addEventListener("change", (event) => {
    const product = state.products.find((item) => String(item.id) === event.target.value);
    document.getElementById("transacao-preco-unitario").value = product?.preco ?? "";
  });
}

// -----------------------------------------------------------------------------
// Inicialização: carrega os dados necessários às duas áreas existentes.
// -----------------------------------------------------------------------------
async function initialize() {
  setupNavigation();
  setupEventListeners();
  renderDraftItems();

  const results = await Promise.allSettled([
    loadProducts(),
    clientManager.load(),
    sellerManager.load(),
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

initialize();
