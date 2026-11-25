export const API_BASE_URL = "http://localhost:8080/api/v1";

export async function apiRequest(path, options = {}) {
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
      .map(([field, message]) =>
        `${field}: ${Array.isArray(message) ? message.join(", ") : message}`
      )
      .join(" ");
  }

  return null;
}
