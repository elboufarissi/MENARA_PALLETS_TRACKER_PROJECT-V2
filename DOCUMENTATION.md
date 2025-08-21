# MENARA PALLETS TRACKER - Project Documentation

## Project Overview

MENARA PALLETS TRACKER is a comprehensive Laravel + React application for managing pallet operations including:

- **Caution**: Security deposits management
- **Consignation**: Pallet delivery tracking
- **Déconsignation**: Pallet return tracking
- **Restitution/Récupération**: Deposit return management

---

## ✅ MAJOR FIXES & RESOLUTIONS

### 1. Déconsignation Module - "Erreur lors de la création de la déconsignation"

### Root Cause Identified and Fixed

The error was caused by missing database columns and a data type mismatch:

1. **Missing Database Columns**: The `deconsignations` table was missing two critical columns:

   - `palette_ramene` (int)
   - `palette_deconsignees` (int)

2. **Data Type Mismatch**: Frontend was sending `xvalsta_0` as a string, but backend expected an integer.

### Fixes Applied

1. **Database Structure Fixed**:

   - Added missing columns `palette_ramene` and `palette_deconsignees`
   - Table now matches the model's fillable fields

2. **Frontend Data Type Fix**:

   ```jsx
   // Before (incorrect)
   xvalsta_0: String(currentFormValues.xvalsta_0 || "1");

   // After (correct)
   xvalsta_0: Number(currentFormValues.xvalsta_0 || 1);
   ```

3. **Backend Debugging**: Added comprehensive logging to identify issues

### Verification

- ✅ Direct model creation works
- ✅ API endpoint accepts frontend data format
- ✅ Date conversion (DD/MM/YYYY → YYYY-MM-DD) works
- ✅ Number generation (DS{SITE}{YEAR}{MONTH}{DAY}-{sequence}) works
- ✅ All validation rules working correctly

## Form vs Database Structure Verification ✅

### Database Table: `deconsignations`

The form fields are correctly mapped to the database structure:

| Form Field              | Database Column         | Type    | Required | Notes                         |
| ----------------------- | ----------------------- | ------- | -------- | ----------------------------- |
| Bon de Déconsignation   | `xnum_0`                | string  | ✅       | Auto-generated (Primary Key)  |
| Site                    | `xsite_0`               | string  | ✅       | Required for creation         |
| Client                  | `xclient_0`             | string  | ✅       | Required for creation         |
| Raison sociale          | `xraison_0`             | string  | -        | Auto-populated from client    |
| Matricule Camion/Client | `xcamion_0`             | string  | ✅       | Required (internal/external)  |
| Date                    | `xdate_0`               | date    | ✅       | French format DD/MM/YYYY      |
| Heure                   | `xheure_0`              | string  | ✅       | HH:MM format                  |
| Validée                 | `xvalsta_0`             | integer | -        | 1=Non, 2=Oui                  |
| Palettes ramenées       | `palette_ramene`        | integer | ✅       | Required ≥ 0                  |
| Palettes à déconsigner  | `palette_a_deconsigner` | integer | ✅       | Required ≥ 1                  |
| Palettes déconsignées   | `palette_deconsignees`  | integer | -        | Optional ≥ 0, ≤ à déconsigner |

## Number Generation System ✅

### Déconsignation Number Format (XNUM_0)

- **Format**: `DS{SITE}{YEAR}{MONTH}{DAY}-{sequence}`
- **Example**: `DS1250703-0001`
  - `DS` = Déconsignation prefix
  - `1` = Site code
  - `25` = Year (2025)
  - `07` = Month (July)
  - `03` = Day
  - `0001` = 4-digit sequence number

### Consignation Number Format (Comparison)

- **Format**: `CS{SITE}{YEAR}{MONTH}{DAY}-{sequence}`
- **Example**: `CS1250703-0001`
  - `CS` = Consignation prefix
  - Same pattern as déconsignations

## Validation Rules ✅

### Frontend (Yup Schema)

- **Create Mode**: All required fields validated
- **Edit Mode**: Only editable fields validated (matricule, palettes)
- **Read-Only Mode**: No validation required

### Custom Validation Logic

- ✅ Site must exist in sites list
- ✅ Client must exist in clients list
- ✅ Matricule required (internal truck or external)
- ✅ Palettes à déconsigner > 0
- ✅ Palettes ramenées ≥ 0
- ✅ Palettes déconsignées ≤ Palettes à déconsigner

### Backend Validation

- ✅ French date format support: `date_format:d/m/Y`
- ✅ Date conversion: DD/MM/YYYY → YYYY-MM-DD
- ✅ All numeric fields validated
- ✅ Prevents modification when validated (xvalsta_0 = 2)

## Date Format Implementation ✅

### Frontend Date Handling

```javascript
// Current date display (French format)
setCurrentDate(now.toLocaleDateString("fr-FR")); // DD/MM/YYYY

// Time display
setCurrentTime(
  now.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  })
); // HH:MM
```

### Backend Date Processing

```php
// Validation rule
'xdate_0' => 'required|string|date_format:d/m/Y'

// Conversion for database
$validatedData['xdate_0'] = Carbon::createFromFormat('d/m/Y', $validatedData['xdate_0'])->format('Y-m-d');
```

## Fixed Issues ✅

### 1. Validation Error for Valid Input

- **Problem**: "Palettes à déconsigner invalide" for valid numbers
- **Cause**: Conflicting validation systems (Yup + custom state)
- **Solution**: Removed redundant custom validation, rely on Yup only

### 2. Date Format Support

- **Problem**: Backend expecting different date format
- **Cause**: Missing French date format support
- **Solution**: Added `date_format:d/m/Y` validation + Carbon conversion

### 3. Number Generation

- **Problem**: Wrong format (DEC prefix instead of DS)
- **Cause**: Outdated generation function
- **Solution**: Updated to match requirement: `DS{SITE}{YEAR}{MONTH}{DAY}-{sequence}`

### 4. PDF Generation Issues - "No query results for model"

#### Root Cause Identified and Fixed

The error was caused by incorrect parameter passing from frontend to backend:

**Problem**: Frontend was passing `selectedCaution.id` instead of `selectedCaution.xnum_0` to PDF endpoints.

**Solution Applied**:

```jsx
// Before (incorrect)
endpoint = `http://localhost:8000/api/restitutions/${selectedCaution.id}/preview-pdf`;

// After (correct)
endpoint = `http://localhost:8000/api/restitutions/${selectedCaution.xnum_0}/preview-pdf`;
```

**Files Fixed**:

- `frontend/src/components/SidebarBootstrap.jsx`
- `frontend/src/pages/Recuperation.jsx`

---

## 🏗️ SYSTEM ARCHITECTURE

### Frontend (React)

- **Location**: `/frontend/`
- **Framework**: React 18 with Hooks
- **Key Libraries**: React Hook Form, Yup validation, Axios
- **Structure**: Component-based architecture with shared components

### Backend (Laravel)

- **Location**: `/backend/`
- **Framework**: Laravel 10
- **Database**: MySQL/MariaDB
- **API**: RESTful APIs with JSON responses

### Database Structure

- **Cautions**: Security deposits (`cautions`, `xcautions`)
- **Consignations**: Pallet deliveries (`consignations`)
- **Déconsignations**: Pallet returns (`deconsignations`)
- **Restitutions**: Deposit returns (`restitutions`)
- **Support Tables**: Sites (`facilities`), Clients (`bpcustomers`), Balances (`csolde`)

---

## 🔧 DEVELOPMENT GUIDELINES

### Code Quality Standards

- ✅ No debug files in production
- ✅ Minimal logging (errors only, no verbose debugging)
- ✅ Proper imports and dependencies
- ✅ Consistent field naming between frontend/backend

### Database Conventions

- Primary keys use `xnum_0` format with auto-generation
- Date fields accept French format (DD/MM/YYYY) in frontend
- Validation status: `xvalsta_0` (1=Non validé, 2=Validé)
- All monetary amounts stored as decimal(10,2)

### API Conventions

- RESTful endpoints with consistent naming
- French date format support in validation
- Proper error handling with meaningful messages
- Validation prevents modification of validated records

---

## 🚀 DEPLOYMENT STATUS

### Production Ready ✅

- All core modules working correctly
- PDF generation functional for all modules
- Database structure properly aligned
- Clean codebase with no temporary files
- Comprehensive error handling
- Proper validation throughout

### Recent Improvements

- Fixed form field/database mismatches
- Corrected PDF parameter passing
- Cleaned excessive debug logging
- Removed all temporary files and debug scripts
- Standardized error handling patterns

---
