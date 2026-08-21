# OpsFlow ERP - Database Documentation & ER Diagram

This document details the schema design, keys, relationships, and constraints in the OpsFlow ERP database.

## Entity Relationship Diagram (Mermaid)

```mermaid
erDiagram
    USER ||--o{ WORK_ORDER : "assigned to"
    USER ||--o{ CUSTOMER_ORDER : "creates"
    CATEGORY ||--o{ ITEM : "contains"
    ITEM ||--o{ BATCH : "has"
    ITEM ||--o{ INVENTORY : "stocked in"
    LOCATION ||--o{ INVENTORY : "stores"
    LOCATION ||--o{ WORK_ORDER : "scheduled at"
    LOCATION ||--o{ TRANSFER : "source/destination"
    CUSTOMER_ORDER ||--o{ ORDER_ITEM : "contains"
    ITEM ||--o{ ORDER_ITEM : "references"
    BATCH ||--o{ INVENTORY : "associates"
    BATCH ||--o{ TRANSFER : "associates"

    USER {
        string id PK
        string name
        string email UK
        string passwordHash
        Role role
        datetime createdAt
        datetime updatedAt
    }

    CATEGORY {
        string id PK
        string name UK
        datetime createdAt
        datetime updatedAt
    }

    ITEM {
        string id PK
        string name
        string sku UK
        string categoryId FK
        datetime createdAt
        datetime updatedAt
    }

    LOCATION {
        string id PK
        string name
        string code UK
        datetime createdAt
        datetime updatedAt
    }

    BATCH {
        string id PK
        string batchNumber
        string itemId FK
        datetime createdAt
        datetime updatedAt
    }

    INVENTORY {
        string id PK
        string itemId FK
        string locationId FK
        string batchId FK
        int physicalQuantity
        int reservedQuantity
        datetime createdAt
        datetime updatedAt
    }

    WORK_ORDER {
        string id PK
        string workOrderId UK
        string locationId FK
        string itemId FK
        int requiredQuantity
        string assignedUserId FK
        WorkOrderStatus status
        datetime createdAt
        datetime updatedAt
    }

    TRANSFER {
        string id PK
        string transferId UK
        string sourceLocationId FK
        string destinationLocationId FK
        string itemId FK
        string batchId FK "nullable"
        int quantity
        TransferStatus status
        datetime createdAt
        datetime updatedAt
    }

    CUSTOMER_ORDER {
        string id PK
        string orderId UK
        string createdByUserId FK
        string status
        datetime createdAt
        datetime updatedAt
    }

    ORDER_ITEM {
        string id PK
        string orderId FK
        string itemId FK
        int quantity
    }
```

## Relationships & Constraints

1. **Prisma Unique Constraints**:
   - `User.email`
   - `Category.name`
   - `Item.sku`
   - `Location.code`
   - `WorkOrder.workOrderId`
   - `Transfer.transferId`
   - `CustomerOrder.orderId`
   - `Inventory` has a unique compound constraint on: `[itemId, locationId, batchId]` to prevent duplicate ledger entries for the same batch in the same warehouse.

2. **Indexes**:
   - Compounded index on `Inventory([locationId])` and `Inventory([batchId])` to speed up location queries.
   - Indices on `WorkOrder([locationId], [itemId], [assignedUserId])` to optimize scheduling lookup performance.
   - Indices on `Transfer([sourceLocationId], [destinationLocationId], [itemId], [batchId])`.
   - Index on `CustomerOrder([createdByUserId])`.
   - Indices on `OrderItem([orderId], [itemId])`.
