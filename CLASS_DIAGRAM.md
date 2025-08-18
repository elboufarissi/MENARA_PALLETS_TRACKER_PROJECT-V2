# MENARA PALLETS TRACKER - Class Diagram

## UML Class Diagram

```mermaid
classDiagram
    %% Core Business Models
    class User {
        +USER_ID: string [PK]
        +FULL_NAME: string
        +ROLE: string
        +DATE_CREATION: datetime
        +USERNAME: string [unique]
        +password: string
        +api_token: string
        --
        +generateUserId(): string
        +hasRole(role: string): boolean
    }

    class Facility {
        +fcy_0: string [PK]
        +fcynam_0: string
        +cpy_0: string
        +created_at: timestamp
        +updated_at: timestamp
        --
        +cautions(): HasMany
        +consignations(): HasMany
        +deconsignations(): HasMany
    }

    class BpCustomer {
        +bpcnum_0: string [PK]
        +bpcnam_0: string
        +tsccod_0: string
        +ostctl_0: string
        +created_at: timestamp
        +updated_at: timestamp
        --
        +cautions(): HasMany
        +consignations(): HasMany
        +deconsignations(): HasMany
        +restitutions(): HasMany
    }

    class Xcaution {
        +xnum_0: string [PK]
        +xsite_0: string [FK]
        +xclient_0: string [FK]
        +xraison_0: string
        +xcin_0: string
        +xdate_0: date
        +xheure_0: time
        +xvalsta_0: integer
        +montant: decimal(15,2)
        +auuid: string
        +creusr: string
        +updusr: string
        +created_at: timestamp
        +updated_at: timestamp
        --
        +generateUniqueXnum(site: string): string
        +facility(): BelongsTo
        +customer(): BelongsTo
    }

    class Consignation {
        +xnum_0: string [PK]
        +xsite_0: string [FK]
        +xclient_0: string [FK]
        +xraison_0: string
        +xbp_0: string
        +xcamion_0: string
        +xdate_0: date
        +xheure_0: string
        +palette_ramene: integer
        +palette_a_consigner: integer
        +palette_consignees: integer
        +xvalsta_0: integer
        +created_at: timestamp
        +updated_at: timestamp
        --
        +generateUniqueXnum(site: string): string
        +getSolde(): decimal
        +facility(): BelongsTo
        +customer(): BelongsTo
    }

    class Deconsignation {
        +xnum_0: string [PK]
        +xsite_0: string [FK]
        +xclient_0: string [FK]
        +xraison_0: string
        +xcamion_0: string
        +xdate_0: date
        +xheure_0: string
        +palette_ramene: integer
        +palette_a_deconsigner: integer
        +palette_deconsignees: integer
        +xvalsta_0: integer
        +created_at: timestamp
        +updated_at: timestamp
        --
        +generateUniqueXnum(site: string): string
        +facility(): BelongsTo
        +customer(): BelongsTo
    }

    class Restitution {
        +xnum_0: string [PK]
        +xsite_0: string [FK]
        +xclient_0: string [FK]
        +xraison_0: string
        +xcin_0: string
        +xdate_0: date
        +xheure_0: string
        +xvalsta_0: integer
        +montant: decimal(10,2)
        +caution_ref: string
        +remarques: text
        +created_at: timestamp
        +updated_at: timestamp
        --
        +generateUniqueXnum(site: string): string
        +facility(): BelongsTo
        +customer(): BelongsTo
        +caution(): BelongsTo
    }

    class Csolde {
        +codeClient: string [PK]
        +site: string [PK]
        +solde: decimal(10,2)
        +updated_at: timestamp
        --
        +recalculateBalance(client: string, site: string): void
        +getBalance(client: string, site: string): decimal
        +updateBalance(client: string, site: string, amount: decimal): void
    }

    class Camion {
        +id: integer [PK]
        +xmat_0: string
        +description: string
        +enaflg_0: integer
        +created_at: timestamp
        +updated_at: timestamp
        --
        +scopeActive(): Builder
    }

    %% Controllers
    class XcautionController {
        +index(): JsonResponse
        +store(request: Request): JsonResponse
        +show(xnum_0: string): JsonResponse
        +update(request: Request, xnum_0: string): JsonResponse
        +destroy(xnum_0: string): JsonResponse
        +generatePDF(xnum_0: string): Response
        +generateRangePDF(request: Request): Response
        +validateCaution(request: Request): JsonResponse
        -generateUniqueXnum(site: string): string
        -validateCautionLogic(data: array): array
    }

    class ConsignationController {
        +index(): JsonResponse
        +store(request: Request): JsonResponse
        +show(xnum_0: string): JsonResponse
        +update(request: Request, xnum_0: string): JsonResponse
        +destroy(xnum_0: string): JsonResponse
        +generatePDF(xnum_0: string): Response
        +generateRangePDF(request: Request): Response
        +validateConsignation(request: Request): JsonResponse
        +getTrucks(): JsonResponse
        -generateUniqueXnum(site: string): string
        -validateConsignationLogic(data: array): array
    }

    class DeconsignationController {
        +index(): JsonResponse
        +store(request: Request): JsonResponse
        +show(xnum_0: string): JsonResponse
        +update(request: Request, xnum_0: string): JsonResponse
        +destroy(xnum_0: string): JsonResponse
        +generatePDF(xnum_0: string): Response
        +generateRangePDF(request: Request): Response
        +validateDeconsignation(request: Request): JsonResponse
        -generateUniqueXnum(site: string): string
        -validateDeconsignationLogic(data: array): array
    }

    class RestitutionController {
        +index(): JsonResponse
        +store(request: Request): JsonResponse
        +show(xnum_0: string): JsonResponse
        +update(request: Request, xnum_0: string): JsonResponse
        +destroy(xnum_0: string): JsonResponse
        +generatePDF(xnum_0: string): Response
        +generateRangePDF(request: Request): Response
        +validateRestitution(request: Request): JsonResponse
        -generateUniqueXnum(site: string): string
        -validateRestitutionLogic(data: array): array
    }

    class SituationClientController {
        +getSituationClient(client: string, site: string): JsonResponse
        +getClientOperations(client: string, site: string): JsonResponse
        +getClientBalance(client: string, site: string): JsonResponse
        -calculateBalance(client: string, site: string): decimal
    }

    class UserController {
        +index(): JsonResponse
        +store(request: Request): JsonResponse
        +show(id: string): JsonResponse
        +update(request: Request, id: string): JsonResponse
        +destroy(id: string): JsonResponse
    }

    class AuthController {
        +login(request: Request): JsonResponse
        +logout(request: Request): JsonResponse
        +me(request: Request): JsonResponse
        +refresh(request: Request): JsonResponse
    }

    class SiteController {
        +index(): JsonResponse
        +show(id: string): JsonResponse
    }

    class ClientController {
        +index(): JsonResponse
        +show(id: string): JsonResponse
    }

    class CamionController {
        +index(): JsonResponse
        +store(request: Request): JsonResponse
        +show(id: string): JsonResponse
        +update(request: Request, id: string): JsonResponse
        +destroy(id: string): JsonResponse
    }

    %% Relationships
    Facility ||--o{ Xcaution : "has many"
    Facility ||--o{ Consignation : "has many"
    Facility ||--o{ Deconsignation : "has many"
    Facility ||--o{ Restitution : "has many"

    BpCustomer ||--o{ Xcaution : "has many"
    BpCustomer ||--o{ Consignation : "has many"
    BpCustomer ||--o{ Deconsignation : "has many"
    BpCustomer ||--o{ Restitution : "has many"

    Xcaution ||--o{ Restitution : "referenced by"

    BpCustomer ||--o{ Csolde : "has balance"
    Facility ||--o{ Csolde : "has balance"

    %% Controller Dependencies
    XcautionController ..> Xcaution : "manages"
    XcautionController ..> Csolde : "updates balance"

    ConsignationController ..> Consignation : "manages"
    ConsignationController ..> Csolde : "updates balance"
    ConsignationController ..> Camion : "uses"

    DeconsignationController ..> Deconsignation : "manages"
    DeconsignationController ..> Csolde : "updates balance"

    RestitutionController ..> Restitution : "manages"
    RestitutionController ..> Xcaution : "references"
    RestitutionController ..> Csolde : "updates balance"

    SituationClientController ..> BpCustomer : "queries"
    SituationClientController ..> Csolde : "calculates"

    UserController ..> User : "manages"
    AuthController ..> User : "authenticates"
    SiteController ..> Facility : "queries"
    ClientController ..> BpCustomer : "queries"
    CamionController ..> Camion : "manages"

    %% Notes
    note for Xcaution "Security deposits\nFormat: C{SITE}{YEAR}{MONTH}{DAY}-{seq}\nAmount: 100 DH per pallet"
    note for Consignation "Pallet deliveries\nFormat: CS{SITE}{YEAR}{MONTH}{DAY}-{seq}\nRequires sufficient balance"
    note for Deconsignation "Pallet returns\nFormat: DS{SITE}{YEAR}{MONTH}{DAY}-{seq}\nComplex validation rules"
    note for Restitution "Deposit refunds\nFormat: R{SITE}{YEAR}{MONTH}{DAY}-{seq}\nReferences original caution"
    note for Csolde "Real-time balance tracking\nFormula: Cautions - Consignations + Deconsignations - Restitutions"
```

## Key Design Patterns

### 1. **Repository Pattern (Implicit)**

- Models encapsulate data access logic
- Controllers handle business logic and validation
- Separation of concerns between data and presentation layers

### 2. **Factory Pattern**

- Unique number generation methods in each model
- Consistent format: `{PREFIX}{SITE}{DATE}-{SEQUENCE}`

### 3. **Observer Pattern**

- Model events trigger balance recalculation
- Automatic solde updates on validated operations

### 4. **Strategy Pattern**

- Different validation strategies for each operation type
- PDF generation strategies for different document types

## Business Logic Flow

### 1. **Caution Flow**

```
Client Request → Validation → Create Caution → Update Balance → Generate PDF
```

### 2. **Consignation Flow**

```
Pallet Request → Balance Check → Create Consignation → Update Balance → Generate Delivery Note
```

### 3. **Déconsignation Flow**

```
Return Request → Complex Validation → Create Déconsignation → Update Balance → Generate Return Note
```

### 4. **Restitution Flow**

```
Refund Request → Validation → Create Restitution → Update Balance → Generate Refund Note
```

## Validation Architecture

### 1. **Frontend Validation (React + Yup)**

- Form field validation
- Real-time user feedback
- Business rule enforcement

### 2. **Backend Validation (Laravel)**

- Data type validation
- Business logic validation
- Database constraint enforcement

### 3. **Business Rule Validation**

- Complex inter-model validations
- Balance sufficiency checks
- Operational constraints

## Security & Authentication

### 1. **Role-Based Access Control**

- ADMIN: Full system access
- CAISSIER/CAISSIERE: Financial operations
- AGENT_ORDONANCEMENT: Daily operations
- CHEF_PARC: Supervisory access

### 2. **API Security**

- Laravel Sanctum for API authentication
- Token-based authentication
- Role-based route protection

## Data Integrity

### 1. **Balance Management**

- Real-time balance calculation
- Automatic recalculation on validation
- Composite primary key for client-site balance

### 2. **Transaction Integrity**

- Database transactions for complex operations
- Rollback on validation failures
- Audit trail through timestamps

### 3. **Sequential Numbering**

- Site-based sequence generation
- Date-based prefixes for organization
- Unique constraint enforcement

## Performance Considerations

### 1. **Database Optimization**

- Indexed foreign keys
- Composite primary keys for balance table
- Efficient query patterns

### 2. **Caching Strategy**

- Balance calculation optimization
- Reduced database queries for frequent operations

### 3. **PDF Generation**

- On-demand PDF generation
- Range PDF for bulk operations
- Memory-efficient processing

This class diagram represents a well-architected Laravel application with clear separation of concerns, robust validation, and comprehensive business logic implementation.
