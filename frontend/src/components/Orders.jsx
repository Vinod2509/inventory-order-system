import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import Message from "./Message.jsx";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [customerId, setCustomerId] = useState("");
  const [lines, setLines] = useState([{ product_id: "", quantity: 1 }]);
  const [detail, setDetail] = useState(null);
  const [message, setMessage] = useState(null);

  const loadAll = () => {
    api.listOrders().then(setOrders).catch(showError);
    api.listCustomers().then(setCustomers).catch(showError);
    api.listProducts().then(setProducts).catch(showError);
  };

  const showError = (e) => setMessage({ type: "error", text: e.message });

  useEffect(() => {
    loadAll();
  }, []);

  const productById = (id) => products.find((p) => p.id === Number(id));

  const updateLine = (idx, field, value) => {
    const next = [...lines];
    next[idx][field] = value;
    setLines(next);
  };

  const addLine = () =>
    setLines([...lines, { product_id: "", quantity: 1 }]);

  const removeLine = (idx) =>
    setLines(lines.filter((_, i) => i !== idx));

  const estimatedTotal = lines.reduce((sum, l) => {
    const p = productById(l.product_id);
    return sum + (p ? Number(p.price) * Number(l.quantity || 0) : 0);
  }, 0);

  const onSubmit = async (e) => {
    e.preventDefault();

    if (!customerId) {
      setMessage({ type: "error", text: "Please select a customer" });
      return;
    }
    const items = lines
      .filter((l) => l.product_id && Number(l.quantity) > 0)
      .map((l) => ({
        product_id: Number(l.product_id),
        quantity: Number(l.quantity),
      }));

    if (items.length === 0) {
      setMessage({
        type: "error",
        text: "Add at least one product with quantity",
      });
      return;
    }

    try {
      await api.createOrder({ customer_id: Number(customerId), items });
      setMessage({ type: "success", text: "Order created" });
      setCustomerId("");
      setLines([{ product_id: "", quantity: 1 }]);
      loadAll();
    } catch (e) {
      showError(e);
    }
  };

  const onDelete = async (id) => {
    if (!confirm("Cancel/delete this order? Stock will be restored.")) return;
    try {
      await api.deleteOrder(id);
      setMessage({ type: "success", text: "Order deleted" });
      if (detail && detail.id === id) setDetail(null);
      loadAll();
    } catch (e) {
      showError(e);
    }
  };

  const onView = async (id) => {
    try {
      setDetail(await api.getOrder(id));
    } catch (e) {
      showError(e);
    }
  };

  const customerName = (id) => {
    const c = customers.find((c) => c.id === id);
    return c ? c.full_name : `#${id}`;
  };

  return (
    <div>
      <Message message={message} />

      <div className="card">
        <h2>Create Order</h2>
        <form onSubmit={onSubmit}>
          <div className="row">
            <label>
              Customer
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
              >
                <option value="">Select customer…</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name} ({c.email})
                  </option>
                ))}
              </select>
            </label>
          </div>

          <h3 style={{ fontSize: "0.95rem" }}>Items</h3>
          {lines.map((line, idx) => (
            <div className="order-line" key={idx}>
              <label>
                Product
                <select
                  value={line.product_id}
                  onChange={(e) =>
                    updateLine(idx, "product_id", e.target.value)
                  }
                >
                  <option value="">Select product…</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (${Number(p.price).toFixed(2)} — {p.quantity}{" "}
                      in stock)
                    </option>
                  ))}
                </select>
              </label>
              <label style={{ maxWidth: 120 }}>
                Quantity
                <input
                  type="number"
                  min="1"
                  value={line.quantity}
                  onChange={(e) =>
                    updateLine(idx, "quantity", e.target.value)
                  }
                />
              </label>
              {lines.length > 1 && (
                <button
                  type="button"
                  className="btn btn-sm btn-danger"
                  onClick={() => removeLine(idx)}
                >
                  Remove
                </button>
              )}
            </div>
          ))}

          <button
            type="button"
            className="btn btn-sm btn-secondary"
            onClick={addLine}
          >
            + Add Item
          </button>

          <p style={{ marginTop: 12 }}>
            <strong>Estimated total: ${estimatedTotal.toFixed(2)}</strong>
            <span className="muted">
              {" "}
              (final total is calculated by the backend)
            </span>
          </p>

          <button className="btn" type="submit">
            Create Order
          </button>
        </form>
      </div>

      <div className="card">
        <h2>Orders ({orders.length})</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan="5" className="muted">
                    No orders yet.
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id}>
                    <td>{o.id}</td>
                    <td>{customerName(o.customer_id)}</td>
                    <td>{o.items.length}</td>
                    <td>${Number(o.total_amount).toFixed(2)}</td>
                    <td>
                      <div className="actions">
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => onView(o.id)}
                        >
                          View
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => onDelete(o.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {detail && (
        <div className="card">
          <h2>Order #{detail.id} Details</h2>
          <p>
            <strong>Customer:</strong> {customerName(detail.customer_id)}
          </p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Unit Price</th>
                  <th>Quantity</th>
                  <th>Line Total</th>
                </tr>
              </thead>
              <tbody>
                {detail.items.map((it) => {
                  const p = productById(it.product_id);
                  return (
                    <tr key={it.id}>
                      <td>{p ? p.name : `Product #${it.product_id}`}</td>
                      <td>${Number(it.unit_price).toFixed(2)}</td>
                      <td>{it.quantity}</td>
                      <td>
                        ${(Number(it.unit_price) * it.quantity).toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p style={{ marginTop: 12 }}>
            <strong>Total: ${Number(detail.total_amount).toFixed(2)}</strong>
          </p>
          <button
            className="btn btn-secondary"
            onClick={() => setDetail(null)}
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}
