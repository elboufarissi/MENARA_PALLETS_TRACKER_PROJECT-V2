# Solde Calculation Formula - Updated

## **New Formula**

```php
SOLDE = (SUM MONTANT in xcautions where XVALSTA=2)
      - (SUM palette_a_consigner*100 in consignations where XVALSTA=2)
      + (SUM palette_deconsignees*100 in deconsignations where XVALSTA=2)
      - (SUM MONTANT in restitutions where XVALSTA=2)
```

## **Components Breakdown**

### 1. **✅ CAUTIONS (Positive contribution)**

-   `+ SUM(montant)` from `xcautions` where `xvalsta_0 = 2` (validated)
-   **Logic**: Client deposits money as caution → increases balance

### 2. **❌ CONSIGNATIONS (Negative contribution)**

-   `- SUM(palette_a_consigner × 100)` from `consignations` where `xvalsta_0 = 2` (validated)
-   **Logic**: Client consigns palettes → decreases balance (palettes cost 100 each)

### 3. **✅ DECONSIGNATIONS (Positive contribution) - CHANGED**

-   `+ SUM(palette_deconsignees × 100)` from `deconsignations` where `xvalsta_0 = 2` (validated)
-   **Logic**: Client returns palettes → increases balance (gets credit back)

### 4. **❌ RESTITUTIONS (Negative contribution) - CHANGED**

-   `- SUM(montant)` from `restitutions` where `xvalsta_0 = 2` (validated)
-   **Logic**: Client withdraws money → decreases balance

## **Changes Made**

### **Before:**

```php
$newSolde = $cautionTotal - $consignationTotal - $deconsignationTotal + $restitutionTotal;
```

### **After:**

```php
$newSolde = $cautionTotal - $consignationTotal + $deconsignationTotal - $restitutionTotal;
```

## **Business Logic Explanation**

### **Déconsignations (Now Positive)**

-   When a client returns palettes (déconsignation), they should get credit back
-   This makes sense because they're returning assets they previously consigned
-   The balance increases to reflect the returned value

### **Restitutions (Now Negative)**

-   When a client withdraws money (restitution), their balance decreases
-   This makes sense because they're taking money out of their account
-   The balance decreases to reflect the withdrawn amount

## **Example Calculation**

Let's say a client has:

-   **Caution**: 10,000 (money deposited)
-   **Consignations**: 50 palettes × 100 = 5,000 (palettes taken)
-   **Déconsignations**: 20 palettes × 100 = 2,000 (palettes returned)
-   **Restitutions**: 3,000 (money withdrawn)

**New Formula:**

```
SOLDE = 10,000 - 5,000 + 2,000 - 3,000 = 4,000
```

**Previous Formula:**

```
SOLDE = 10,000 - 5,000 - 2,000 + 3,000 = 6,000
```

## **Impact on System**

### **Validation Rules**

The déconsignation validation rules remain the same:

1. Palettes ramenées > 0
2. Palettes à déconsigner ≤ palettes ramenées
3. Palettes déconsignées ≤ palettes à déconsigner
4. Palettes à déconsigner ≤ palettes consignées validées disponibles

### **Automatic Recalculation**

The `recalculateBalance()` method is still called automatically when:

-   A caution is validated
-   A consignation is validated
-   A déconsignation is validated
-   A restitution is validated

## **Files Modified**

-   **`app/Models/Csolde.php`**: Updated `recalculateBalance()` method with new formula
-   **Documentation**: This file explains the changes

## **Testing**

After this change, it's recommended to:

1. Test the balance calculation with sample data
2. Verify that déconsignations now increase the balance
3. Verify that restitutions now decrease the balance
4. Run the balance fix endpoint to recalculate all existing balances

### **Fix All Balances**

```bash
curl -X POST http://localhost:8000/api/fix-balances
```

This will recalculate all balances in the system using the new formula.
