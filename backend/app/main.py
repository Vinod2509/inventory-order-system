import os
from decimal import Decimal

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from . import models, schemas
from .database import Base, engine, get_db

# Low-stock threshold used by the dashboard.
LOW_STOCK_THRESHOLD = int(os.getenv("LOW_STOCK_THRESHOLD", "10"))

# Create tables on startup. For a simplified assessment this is enough;
# a real production app would use Alembic migrations.
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Inventory & Order Management System", version="1.0.0")

# CORS — the allowed origins are configurable so the deployed frontend can
# talk to the deployed backend without code changes.
origins = os.getenv("CORS_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"status": "ok", "service": "inventory-order-management"}


@app.get("/health")
def health():
    return {"status": "healthy"}


# =============================== Products ==================================

@app.post(
    "/products",
    response_model=schemas.ProductOut,
    status_code=status.HTTP_201_CREATED,
)
def create_product(payload: schemas.ProductCreate, db: Session = Depends(get_db)):
    if db.query(models.Product).filter(models.Product.sku == payload.sku).first():
        raise HTTPException(status_code=409, detail="SKU already exists")

    product = models.Product(**payload.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@app.get("/products", response_model=list[schemas.ProductOut])
def list_products(db: Session = Depends(get_db)):
    return db.query(models.Product).order_by(models.Product.id).all()


@app.get("/products/{product_id}", response_model=schemas.ProductOut)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.get(models.Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@app.put("/products/{product_id}", response_model=schemas.ProductOut)
def update_product(
    product_id: int,
    payload: schemas.ProductUpdate,
    db: Session = Depends(get_db),
):
    product = db.get(models.Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    data = payload.model_dump(exclude_unset=True)

    # Enforce unique SKU on update.
    if "sku" in data and data["sku"] != product.sku:
        if db.query(models.Product).filter(models.Product.sku == data["sku"]).first():
            raise HTTPException(status_code=409, detail="SKU already exists")

    for field, value in data.items():
        setattr(product, field, value)

    db.commit()
    db.refresh(product)
    return product


@app.delete("/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(product_id: int, db: Session = Depends(get_db)):
    product = db.get(models.Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(product)
    db.commit()


# =============================== Customers =================================

@app.post(
    "/customers",
    response_model=schemas.CustomerOut,
    status_code=status.HTTP_201_CREATED,
)
def create_customer(payload: schemas.CustomerCreate, db: Session = Depends(get_db)):
    if (
        db.query(models.Customer)
        .filter(models.Customer.email == payload.email)
        .first()
    ):
        raise HTTPException(status_code=409, detail="Email already exists")

    customer = models.Customer(**payload.model_dump())
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer


@app.get("/customers", response_model=list[schemas.CustomerOut])
def list_customers(db: Session = Depends(get_db)):
    return db.query(models.Customer).order_by(models.Customer.id).all()


@app.get("/customers/{customer_id}", response_model=schemas.CustomerOut)
def get_customer(customer_id: int, db: Session = Depends(get_db)):
    customer = db.get(models.Customer, customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


@app.delete("/customers/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_customer(customer_id: int, db: Session = Depends(get_db)):
    customer = db.get(models.Customer, customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    db.delete(customer)
    db.commit()


# ================================ Orders ===================================

@app.post(
    "/orders",
    response_model=schemas.OrderOut,
    status_code=status.HTTP_201_CREATED,
)
def create_order(payload: schemas.OrderCreate, db: Session = Depends(get_db)):
    customer = db.get(models.Customer, payload.customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    # Validate every line, reserve stock, and compute the total. We build the
    # order in memory first so that an error on any item aborts the whole
    # order without partially mutating stock.
    total = Decimal("0")
    order = models.Order(customer_id=customer.id, total_amount=0)

    for item in payload.items:
        product = db.get(models.Product, item.product_id)
        if not product:
            raise HTTPException(
                status_code=404,
                detail=f"Product {item.product_id} not found",
            )
        if product.quantity < item.quantity:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Insufficient stock for product '{product.name}': "
                    f"available {product.quantity}, requested {item.quantity}"
                ),
            )

        # Reduce stock and record the line at the current price.
        product.quantity -= item.quantity
        line_total = Decimal(product.price) * item.quantity
        total += line_total

        order.items.append(
            models.OrderItem(
                product_id=product.id,
                quantity=item.quantity,
                unit_price=product.price,
            )
        )

    order.total_amount = total
    db.add(order)
    db.commit()
    db.refresh(order)
    return order


@app.get("/orders", response_model=list[schemas.OrderOut])
def list_orders(db: Session = Depends(get_db)):
    return db.query(models.Order).order_by(models.Order.id).all()


@app.get("/orders/{order_id}", response_model=schemas.OrderOut)
def get_order(order_id: int, db: Session = Depends(get_db)):
    order = db.get(models.Order, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@app.delete("/orders/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_order(order_id: int, db: Session = Depends(get_db)):
    order = db.get(models.Order, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Cancelling an order returns its items to stock.
    for item in order.items:
        product = db.get(models.Product, item.product_id)
        if product:
            product.quantity += item.quantity

    db.delete(order)
    db.commit()


# =============================== Dashboard =================================

@app.get("/dashboard", response_model=schemas.DashboardOut)
def dashboard(db: Session = Depends(get_db)):
    low_stock = (
        db.query(models.Product)
        .filter(models.Product.quantity <= LOW_STOCK_THRESHOLD)
        .order_by(models.Product.quantity)
        .all()
    )
    return schemas.DashboardOut(
        total_products=db.query(models.Product).count(),
        total_customers=db.query(models.Customer).count(),
        total_orders=db.query(models.Order).count(),
        low_stock_products=low_stock,
    )
