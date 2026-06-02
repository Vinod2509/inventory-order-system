import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import Message from "./Message.jsx";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    api
      .dashboard()
      .then(setData)
      .catch((e) => setMessage({ type: "error", text: e.message }));
  }, []);

  return (
    <div>
      <Message message={message} />

      {!data ? (
        <p className="muted">Loading…</p>
      ) : (
        <>
          <div className="grid">
            <div className="stat">
              <div className="value">{data.total_products}</div>
              <div className="label">Total Products</div>
            </div>
            <div className="stat">
              <div className="value">{data.total_customers}</div>
              <div className="label">Total Customers</div>
            </div>
            <div className="stat">
              <div className="value">{data.total_orders}</div>
              <div className="label">Total Orders</div>
            </div>
            <div className="stat">
              <div className="value">{data.low_stock_products.length}</div>
              <div className="label">Low Stock Products</div>
            </div>
          </div>

          <div className="card" style={{ marginTop: 20 }}>
            <h2>Low Stock Products</h2>
            {data.low_stock_products.length === 0 ? (
              <p className="muted">All products are well stocked. 🎉</p>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>SKU</th>
                      <th>Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.low_stock_products.map((p) => (
                      <tr key={p.id}>
                        <td>{p.name}</td>
                        <td>{p.sku}</td>
                        <td>
                          <span className="badge-low">{p.quantity} left</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
