import { apiRequest } from "../../api/api-client.js";
import { state } from "../../shared/state.js";
import { capitalize } from "../../shared/formatters.js";
import {
  createActionButton,
  createCell,
  renderEmptyRow,
  setSelectOptions,
  showStatus
} from "../../shared/dom.js";

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
    const placeholder = singular === "cliente"
      ? "Selecione um cliente"
      : "Selecione um vendedor";

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

  function initialize() {
    document.getElementById(formId).addEventListener("submit", submit);
    document.getElementById(cancelButtonId).addEventListener("click", resetForm);
    document.getElementById(tbodyId).addEventListener("click", handleTableClick);
  }

  return { load, initialize };
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

export function initializePeople() {
  clientManager.initialize();
  sellerManager.initialize();
}

export function loadClients() {
  return clientManager.load();
}

export function loadSellers() {
  return sellerManager.load();
}
