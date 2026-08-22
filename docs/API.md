# API Documentation

The OpsFlow ERP backend exposes a RESTful JSON API. All protected endpoints require a Bearer token obtained via the `/auth/login` endpoint.

Base URL: `http://localhost:5000/api` (Development)

---

## Authentication

### `POST /auth/login`
Authenticates a user and returns a JWT.
- **Body**: `{ "email": "admin@opsflow.com", "password": "password123" }`
- **Response**: `{ "success": true, "data": { "token": "...", "user": { ... } } }`

### `GET /auth/me`
Fetches the profile of the currently authenticated user.
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `{ "success": true, "data": { "user": { ... } } }`

---

## Inventory & Catalog

### `GET /categories`
Lists all item categories.

### `POST /categories`
Creates a new category.
- **Body**: `{ "name": "Electronics" }`

### `GET /items`
Lists all items in the catalog.

### `POST /items`
Creates a new item.
- **Body**: `{ "name": "Laptop", "sku": "001", "categoryId": "uuid" }`

### `GET /batches`
Lists all registered batches for items.

### `POST /batches`
Creates a new batch number for an item.
- **Body**: `{ "batchNumber": "B-001", "itemId": "uuid" }`

### `GET /locations`
Lists all warehouse/storage locations.

### `GET /inventory`
Lists all current physical inventory quantities mapped by location and batch.

### `POST /inventory`
Creates a new physical stock record.
- **Body**: `{ "itemId": "uuid", "locationId": "uuid", "batchId": "uuid", "physicalQuantity": 100, "reservedQuantity": 0 }`

### `PATCH /inventory/:id`
Updates quantities for a specific stock record.
- **Body**: `{ "physicalQuantity": 90 }`

---

## Operational Workflows

### `GET /work-orders`
Lists all manufacturing/processing work orders.

### `POST /work-orders`
Creates a new work order.
- **Body**: `{ "itemId": "uuid", "locationId": "uuid", "requiredQuantity": 50, "assignedUserId": "uuid", "status": "ASSIGNED" }`

### `PATCH /work-orders/:id/status`
Updates the status of a work order (e.g. to `COMPLETED`).
- **Body**: `{ "status": "COMPLETED" }`

### `GET /transfers`
Lists all internal stock transfers between locations.

### `POST /transfers`
Initiates a new stock transfer.
- **Body**: `{ "itemId": "uuid", "sourceLocationId": "uuid", "destinationLocationId": "uuid", "quantity": 25, "status": "REQUESTED" }`

### `PATCH /transfers/:id/dispatch`
Marks a transfer as dispatched (in-transit).

### `PATCH /transfers/:id/receive`
Marks a transfer as received and automatically updates destination inventory.

---

## Sales & Customers

### `GET /orders`
Lists all outbound customer orders.

### `POST /orders`
Creates a new customer order and reserves inventory.
- **Body**: `{ "orderId": "ORD-123", "status": "PENDING", "orderItems": [ { "itemId": "uuid", "quantity": 5 } ] }`

### `GET /orders/:id`
Fetches a specific customer order including its child items.
