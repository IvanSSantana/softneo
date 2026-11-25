// Pequenas funções de DOM reutilizadas pelas funcionalidades do sistema.

export function showStatus(elementId, message) {
  const element = document.getElementById(elementId);
  if (element) element.textContent = message;
}

export function createCell(value) {
  const cell = document.createElement("td");
  cell.textContent = value ?? "—";
  return cell;
}

export function createActionButton(label, action, id) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.dataset.action = action;
  button.dataset.id = String(id);
  return button;
}

export function renderEmptyRow(tbody, columnCount, message) {
  const row = document.createElement("tr");
  const cell = document.createElement("td");
  cell.colSpan = columnCount;
  cell.textContent = message;
  row.append(cell);
  tbody.replaceChildren(row);
}

export function setSelectOptions(select, placeholderText, items, getLabel) {
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

  // Mantém a seleção anterior quando o item ainda existe na lista.
  if (items.some((item) => String(item.id) === previousValue)) {
    select.value = previousValue;
  }
}
