// Base URL of the backend API. In production this is injected at build time
// via VITE_API_URL; locally it falls back to the docker-compose backend port.
const BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000";

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (res.status === 204) return null;

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const message =
      (data && (data.detail || data.message)) || `Request failed (${res.status})`;
    throw new Error(
      typeof message === "string" ? message : JSON.stringify(message)
    );
  }
  return data;
}

export const api = {
  // Products
  listProducts: () => request("/products"),
  createProduct: (body) =>
    request("/products", { method: "POST", body: JSON.stringify(body) }),
  updateProduct: (id, body) =>
    request(`/products/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteProduct: (id) => request(`/products/${id}`, { method: "DELETE" }),

  // Customers
  listCustomers: () => request("/customers"),
  createCustomer: (body) =>
    request("/customers", { method: "POST", body: JSON.stringify(body) }),
  deleteCustomer: (id) => request(`/customers/${id}`, { method: "DELETE" }),

  // Orders
  listOrders: () => request("/orders"),
  getOrder: (id) => request(`/orders/${id}`),
  createOrder: (body) =>
    request("/orders", { method: "POST", body: JSON.stringify(body) }),
  deleteOrder: (id) => request(`/orders/${id}`, { method: "DELETE" }),

  // Dashboard
  dashboard: () => request("/dashboard"),
};
