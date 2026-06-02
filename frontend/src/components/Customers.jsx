import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import Message from "./Message.jsx";

const EMPTY = { full_name: "", email: "", phone: "" };

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [message, setMessage] = useState(null);

  const load = () =>
    api
      .listCustomers()
      .then(setCustomers)
      .catch((e) => setMessage({ type: "error", text: e.message }));

  useEffect(() => {
    load();
  }, []);

  const onChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const validate = () => {
    if (!form.full_name.trim()) return "Full name is required";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email))
      return "A valid email is required";
    if (!form.phone.trim()) return "Phone number is required";
    return null;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      setMessage({ type: "error", text: err });
      return;
    }
    try {
      await api.createCustomer({
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
      });
      setMessage({ type: "success", text: "Customer created" });
      setForm(EMPTY);
      load();
    } catch (e) {
      setMessage({ type: "error", text: e.message });
    }
  };

  const onDelete = async (id) => {
    if (!confirm("Delete this customer?")) return;
    try {
      await api.deleteCustomer(id);
      setMessage({ type: "success", text: "Customer deleted" });
      load();
    } catch (e) {
      setMessage({ type: "error", text: e.message });
    }
  };

  return (
    <div>
      <Message message={message} />

      <div className="card">
        <h2>Add Customer</h2>
        <form onSubmit={onSubmit}>
          <div className="row">
            <label>
              Full Name
              <input
                name="full_name"
                value={form.full_name}
                onChange={onChange}
              />
            </label>
            <label>
              Email
              <input name="email" value={form.email} onChange={onChange} />
            </label>
            <label>
              Phone
              <input name="phone" value={form.phone} onChange={onChange} />
            </label>
          </div>
          <button className="btn" type="submit">
            Add Customer
          </button>
        </form>
      </div>

      <div className="card">
        <h2>Customers ({customers.length})</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="muted">
                    No customers yet.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id}>
                    <td>{c.id}</td>
                    <td>{c.full_name}</td>
                    <td>{c.email}</td>
                    <td>{c.phone}</td>
                    <td>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => onDelete(c.id)}
                      >
                        Delete
                      </button>
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
