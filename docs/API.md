# OpsFlow ERP - API Documentation

This document describes all active REST API endpoints supported by the OpsFlow ERP backend system, including access permissions, request bodies, and standard responses.

---

## Authentication

### Login
Authenticates a user and returns a JSON Web Token (JWT) bearer token.
* **Method**: `POST`
* **Path**: `/api/auth/login`
* **Authentication**: None
* **Request Body**:
  ```json
  {
    "email": "admin@opsflow.local",
    "password": "OpsFlow@123"
  }
  ```
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "token": "eyJhbGciOi...",
      "user": {
        "id": "user-uuid",
        "name": "Admin User",
        "email": "admin@opsflow.local",
        "role": "ADMIN"
      }
    }
  }
  ```
* **Errors**:
  * `400 Bad Request` - Validation error (missing fields)
  * `401 Unauthorized` - Invalid email or password

### Get Active Identity
Returns the profile details of the currently authenticated session.
* **Method**: `GET`
* **Path**: `/api/auth/me`
* **Authentication**: Bearer JWT
* **Allowed Roles**: Any authenticated user
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "user-uuid",
        "name": "Admin User",
        "email": "admin@opsflow.local",
        "role": "ADMIN"
      }
    }
  }
  ```

---

## Inventory Management

### List All Inventory
* **Method**: `GET`
* **Path**: `/api/inventory`
* **Authentication**: Bearer JWT
* **Allowed Roles**: `ADMIN`, `OPERATIONS`
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "inventory-uuid",
        "itemId": "item-uuid",
        "locationId": "location-uuid",
        "batchId": "batch-uuid",
        "physicalQuantity": 100,
        "reservedQuantity": 20,
        "availableQuantity": 80,
        "item": { "name": "Widget A", "sku": "W-A" },
        "location": { "name": "Warehouse North" },
        "batch": { "batchNumber": "B1" }
      }
    ]
  }
  ```

### Get Inventory Record
* **Method**: `GET`
* **Path**: `/api/inventory/:id`
* **Authentication**: Bearer JWT
* **Allowed Roles**: `ADMIN`, `OPERATIONS`
* **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "id": "inventory-uuid",
      "physicalQuantity": 100,
      "reservedQuantity": 20,
      "availableQuantity": 80
    }
  }
  ```

### Create Stock Combination
* **Method**: `POST`
* **Path**: `/api/inventory`
* **Authentication**: Bearer JWT
* **Allowed Roles**: `ADMIN`, `OPERATIONS`
* **Request Body**:
  ```json
  {
    "itemId": "item-uuid",
    "locationId": "location-uuid",
    "batchId": "batch-uuid",
    "physicalQuantity": 100,
    "reservedQuantity": 0
  }
  ```
* **Success Response (201 Created)**

### Update Stock Level
* **Method**: `PATCH`
* **Path**: `/api/inventory/:id`
* **Authentication**: Bearer JWT
* **Allowed Roles**: `ADMIN`, `OPERATIONS`
* **Request Body** (Both fields optional):
  ```json
  {
    "physicalQuantity": 120,
    "reservedQuantity": 10
  }
  ```
* **Success Response (200 OK)**

---

## Work Orders

### Create Work Order
* **Method**: `POST`
* **Path**: `/api/work-orders`
* **Authentication**: Bearer JWT
* **Allowed Roles**: `ADMIN` only
* **Request Body**:
  ```json
  {
    "workOrderId": "WO-1001",
    "locationId": "location-uuid",
    "itemId": "item-uuid",
    "requiredQuantity": 50,
    "assignedUserId": "user-uuid"
  }
  ```
* **Success Response (201 Created)**

### List Work Orders
* **Method**: `GET`
* **Path**: `/api/work-orders`
* **Authentication**: Bearer JWT
* **Allowed Roles**: `ADMIN`, `OPERATIONS`
* **Success Response (200 OK)**: Includes calculated `shortage` (`max(requiredQuantity - availableQuantity, 0)`) and `availableQuantity`.

### Advance Lifecycle Status
* **Method**: `PATCH`
* **Path**: `/api/work-orders/:id/status`
* **Authentication**: Bearer JWT
* **Allowed Roles**: `ADMIN`, `OPERATIONS`
* **Request Body**:
  ```json
  {
    "status": "IN_PROGRESS"
  }
  ```
  *Permitted transitions: ASSIGNED → IN_PROGRESS → COMPLETED.*

---

## Internal Stock Transfers

### Request Stock Transfer
* **Method**: `POST`
* **Path**: `/api/transfers`
* **Authentication**: Bearer JWT
* **Allowed Roles**: `ADMIN`, `OPERATIONS`
* **Request Body**:
  ```json
  {
    "transferId": "TR-500",
    "sourceLocationId": "source-loc-uuid",
    "destinationLocationId": "dest-loc-uuid",
    "itemId": "item-uuid",
    "batchId": "batch-uuid",
    "quantity": 30
  }
  ```

### Dispatch Transfer (Locks Row & Decreases Source Stock)
* **Method**: `PATCH`
* **Path**: `/api/transfers/:id/dispatch`
* **Authentication**: Bearer JWT
* **Allowed Roles**: `ADMIN`, `OPERATIONS`

### Receive Transfer (Locks Row & Increases Destination Stock)
* **Method**: `PATCH`
* **Path**: `/api/transfers/:id/receive`
* **Authentication**: Bearer JWT
* **Allowed Roles**: `ADMIN`, `OPERATIONS`

---

## Customer Orders

### Create Customer Order
* **Method**: `POST`
* **Path**: `/api/orders`
* **Authentication**: Bearer JWT
* **Allowed Roles**: `SALES` only
* **Request Body**:
  ```json
  {
    "orderId": "ORD-700",
    "items": [
      { "itemId": "item-uuid", "quantity": 10 }
    ]
  }
  ```
* **Success Response (201 Created)**: Returns order details and reserves quantity atomically.

### List Customer Orders
* **Method**: `GET`
* **Path**: `/api/orders`
* **Authentication**: Bearer JWT
* **Allowed Roles**: `SALES`, `ADMIN`
