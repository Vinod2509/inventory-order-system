import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import Message from "./Message.jsx";

const EMPTY = { name: "", sku: "", price: "", quantity: "" };

export default function Products() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState(null);

  const load = () =>
    api
      .listProducts()
      .then(setProducts)
      .catch((e) => setMessage({ type: "error", text: e.message }));

  useEffect(() => {
    load();
  }, []);

  const onChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const validate = () => {
    if (!form.name.trim()) return "Product name is required";
    if (!form.sku.trim()) return "SKU is required";
    if (form.price === "" || Number(form.price) < 0)
      return "Price must be 0 or greater";
    if (form.quantity === "" || Number(form.quantity) < 0)
      return "Quantity must be 0 or greater";
    return null;
  };

  const resetForm = () => {
    setForm(EMPTY);
    setEditingId(null);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      setMessage({ type: "error", text: err });
      return;
    }

    const body = {
      name: form.name.trim(),
      sku: form.sku.trim(),
      price: Number(form.price),
      quantity: Number(form.quantity),
    };

    try {
      if (editingId) {
        await api.updateProduct(editingId, body);
        setMessage({ type: "success", text: "Product updated" });
      } else {
        await api.createProduct(body);
        setMessage({ type: "success", text: "Product created" });
      }
      resetForm();
      load();
    } catch (e) {
      setMessage({ type: "error", text: e.message });
    }
  };

  const onEdit = (p) => {
    setEditingId(p.id);
    setForm({
      name: p.name,
      sku: p.sku,
      price: p.price,
      quantity: p.quantity,
    });
  };

  const onDelete = async (id) => {
    if (!confirm("Delete this product?")) return;
    try {
      await api.deleteProduct(id);
      setMessage({ type: "success", text: "Product deleted" });
      load();
    } catch (e) {
      setMessage({ type: "error", text: e.message });
    }
  };

  return (
    <div>
      <Message message={message} />

      <div className="card">
        <h2>{editingId ? "Edit Product" : "Add Product"}</h2>
        <form onSubmit={onSubmit}>
          <div className="row">
            <label>
              Name
              <input name="name" value={form.name} onChange={onChange} />
            </label>
            <label>
              SKU
              <input name="sku" value={form.sku} onChange={onChange} />
            </label>
            <label>
              Price
              <input
                name="price"
                type="number"
                step="0.01"
                min="0"
                value={form.price}
                onChange={onChange}
              />
            </label>
            <label>
              Quantity
              <input
                name="quantity"
                type="number"
                min="0"
                value={form.quantity}
                onChange={onChange}
              />
            </label>
          </div>
          <div className="actions">
            <button className="btn" type="submit">
              {editingId ? "Update" : "Add"} Product
            </button>
            {editingId && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={resetForm}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="card">
        <h2>Products ({products.length})</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>SKU</th>
                <th>Price</th>
                <th>Quantity</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan="6" className="muted">
                    No products yet.
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id}>
                    <td>{p.id}</td>
                    <td>{p.name}</td>
                    <td>{p.sku}</td>
                    <td>${Number(p.price).toFixed(2)}</td>
                    <td>{p.quantity}</td>
                    <td>
                      <div className="actions">
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => onEdit(p)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => onDelete(p.id)}
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
    </div>
  );
}
