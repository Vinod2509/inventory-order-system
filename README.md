# Inventory & Order Management System

A full-stack, containerized **Inventory & Order Management System** for managing
products, customers, orders and inventory tracking.

- **Frontend:** React (Vite, JavaScript) — responsive UI served by nginx
- **Backend:** Python (FastAPI) REST API
- **Database:** PostgreSQL
- **Containerization:** Docker + Docker Compose

---

## Features

### Products
- Create, list, view, update, delete products
- Fields: name, SKU/code, price, quantity in stock
- **Unique SKU** enforced

### Customers
- Create, list, view, delete customers
- Fields: full name, email, phone
- **Unique email** enforced

### Orders
- Create orders with one or more products and quantities
- List orders, view order details, cancel/delete orders
- **Total amount calculated automatically by the backend**
- **Stock is reduced automatically** when an order is placed
- **Orders are rejected if inventory is insufficient** (HTTP 400)
- Deleting an order **restores stock**

### Dashboard
- Total products, total customers, total orders
- Low-stock products list (configurable threshold)

### Business rules
| Rule | Behavior |
|------|----------|
| Product SKU must be unique | `409 Conflict` |
| Customer email must be unique | `409 Conflict` |
| Quantity cannot be negative | `422 Unprocessable Entity` |
| Insufficient inventory | `400 Bad Request` |
| Order total | Calculated by backend |
| Stock reduction | Automatic on order creation |
| Validation | All request bodies validated |

---

## API Reference

Base URL: `http://localhost:8000` (local) — interactive docs at `/docs`.

### Products
| Method | Path | Description |
|--------|------|-------------|
| POST | `/products` | Create a product |
| GET | `/products` | List products |
| GET | `/products/{id}` | Get a product |
| PUT | `/products/{id}` | Update a product |
| DELETE | `/products/{id}` | Delete a product |

### Customers
| Method | Path | Description |
|--------|------|-------------|
| POST | `/customers` | Create a customer |
| GET | `/customers` | List customers |
| GET | `/customers/{id}` | Get a customer |
| DELETE | `/customers/{id}` | Delete a customer |

### Orders
| Method | Path | Description |
|--------|------|-------------|
| POST | `/orders` | Create an order |
| GET | `/orders` | List orders |
| GET | `/orders/{id}` | Get an order |
| DELETE | `/orders/{id}` | Cancel/delete an order |

### Other
| Method | Path | Description |
|--------|------|-------------|
| GET | `/dashboard` | Summary stats + low stock |
| GET | `/health` | Health check |

---

## Project Structure

```
.
├── backend/
│   ├── app/
│   │   ├── main.py        # FastAPI app + routes + business logic
│   │   ├── models.py      # SQLAlchemy models
│   │   ├── schemas.py     # Pydantic schemas (validation)
│   │   └── database.py    # DB engine/session
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── .env.example
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/client.js
│   │   └── components/    # Dashboard, Products, Customers, Orders
│   ├── Dockerfile         # multi-stage build -> nginx
│   ├── nginx.conf
│   ├── .dockerignore
│   ├── .env.example
│   └── package.json
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Run Locally with Docker Compose

**Prerequisites:** Docker & Docker Compose.

```bash
# 1. Copy environment file and adjust credentials
cp .env.example .env

# 2. Build and start everything
docker compose up -d --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| API docs | http://localhost:8000/docs |

Stop and remove (including the database volume):

```bash
docker compose down -v
```

> Credentials are **not hardcoded** — they come from `.env`.
> PostgreSQL data persists in the named volume `pgdata`.

---

## Run Without Docker (optional, for development)

**Backend**
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/inventory
uvicorn app.main:app --reload
```

**Frontend**
```bash
cd frontend
npm install
echo "VITE_API_URL=http://localhost:8000" > .env
npm run dev
```

---

## Deployment

### Backend → Render / Railway / Fly.io
The backend ships as a Docker image. On **Render** (Web Service → Docker):

1. Connect the repo, root directory `backend/`.
2. Add a **PostgreSQL** instance and copy its connection string.
3. Set environment variables:
   - `DATABASE_URL` = your Postgres URL
   - `CORS_ORIGINS` = your frontend URL (e.g. `https://your-app.vercel.app`)
4. The container listens on `$PORT` automatically.

### Backend image → Docker Hub
```bash
docker build -t <dockerhub-username>/inventory-backend:latest ./backend
docker login
docker push <dockerhub-username>/inventory-backend:latest
```

### Frontend → Vercel / Netlify
1. Import the repo, set **root directory** to `frontend/`.
2. Build command `npm run build`, output directory `dist`.
3. Set environment variable `VITE_API_URL` to your **deployed backend URL**.

> Note: `VITE_API_URL` is baked in at build time. After deploying the backend,
> set `VITE_API_URL` on Vercel/Netlify and redeploy the frontend.

---

## Submission Deliverables

- **GitHub repository:** _<repo link>_
- **Docker Hub backend image:** _<image link>_
- **Frontend live URL:** _<vercel/netlify link>_
- **Backend API live URL:** _<render/railway link>_
