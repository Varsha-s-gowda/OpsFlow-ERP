# Database Schema

Below is the Entity Relationship Diagram (ERD) mapping out the PostgreSQL database used in OpsFlow ERP.

```mermaid
erDiagram
    User {
        String id PK
        String name
        String email
        String passwordHash
        Role role
        DateTime createdAt
        DateTime updatedAt
    }

    Category {
        String id PK
        String name
        DateTime createdAt
        DateTime updatedAt
    }

    Item {
        String id PK
        String name
        String sku
        String categoryId FK
        DateTime createdAt
        DateTime updatedAt
    }

    Location {
        String id PK
        String name
        String code
        DateTime createdAt
        DateTime updatedAt
    }

    Batch {
        String id PK
        String batchNumber
        String itemId FK
        DateTime createdAt
        DateTime updatedAt
    }

    Inventory {
        String id PK
        String itemId FK
        String locationId FK
        String batchId FK
        Int physicalQuantity
        Int reservedQuantity
        DateTime createdAt
        DateTime updatedAt
    }

    WorkOrder {
        String id PK
        String workOrderId
        String locationId FK
        String itemId FK
        Int requiredQuantity
        String assignedUserId FK
        WorkOrderStatus status
        DateTime createdAt
        DateTime updatedAt
    }

    Transfer {
        String id PK
        String transferId
        String sourceLocationId FK
        String destinationLocationId FK
        String itemId FK
        String batchId FK
        Int quantity
        TransferStatus status
        DateTime createdAt
        DateTime updatedAt
    }

    CustomerOrder {
        String id PK
        String orderId
        String createdByUserId FK
        String status
        DateTime createdAt
        DateTime updatedAt
    }

    OrderItem {
        String id PK
        String orderId FK
        String itemId FK
        Int quantity
    }

    User ||--o{ WorkOrder : assigned
    User ||--o{ CustomerOrder : creates
    Category ||--o{ Item : contains
    Item ||--o{ Batch : has
    Item ||--o{ Inventory : tracked_in
    Item ||--o{ WorkOrder : required_for
    Item ||--o{ Transfer : moved_in
    Item ||--o{ OrderItem : included_in
    Location ||--o{ Inventory : stores
    Location ||--o{ WorkOrder : occurs_at
    Location ||--o{ Transfer : source_of
    Location ||--o{ Transfer : destination_of
    Batch ||--o{ Inventory : part_of
    Batch ||--o{ Transfer : part_of
    CustomerOrder ||--o{ OrderItem : contains
```

### Key Concepts

- **Items & Categories**: Core definitions of physical goods. Every `Item` belongs to a `Category` and has a unique SKU.
- **Batches**: Used for lot tracking. Items can optionally have a `Batch` to track specific manufacturing runs or expirations.
- **Inventory**: The master record of physical goods. It creates a unique composite key combining `(itemId, locationId, batchId)`.
- **Locations**: Represents physical warehouses or specific zones.
- **Work Orders**: Instructions to assemble or process goods. Assigned to a specific `User`.
- **Transfers**: Movement of goods between two `Locations`.
- **Customer Orders**: Outbound sales orders, consisting of multiple `OrderItems`.
