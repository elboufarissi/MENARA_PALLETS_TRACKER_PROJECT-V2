# Règles de Validation Finales - Interface de Déconsignation

## Règles Métiers Implémentées

### 1. **Le nombre de palettes ramenées ne peut pas être égal à 0**

-   **Validation**: `$paletteRamene > 0`
-   **Message d'erreur**: "Le nombre de palettes ramenées ne peut pas être égal à zéro."
-   **Code d'erreur**: `palette_ramene_invalid`

### 2. **Le nombre de palettes à déconsigner doit être inférieur ou égal au nombre de palettes ramenées**

-   **Validation**: `$paletteADeconsigner <= $paletteRamene`
-   **Message d'erreur**: "Le nombre de palettes à déconsigner doit être inférieur ou égal au nombre de palettes ramenées."
-   **Code d'erreur**: `palette_a_deconsigner_exceed_ramene`
-   **Données supplémentaires**: `palette_ramene`, `palette_a_deconsigner`

### 3. **Le nombre de palettes déconsignées doit être inférieur ou égal au nombre de palettes à déconsigner**

-   **Validation**: `$paletteDeconsignees <= $paletteADeconsigner`
-   **Message d'erreur**: "Le nombre de palettes déconsignées doit être inférieur ou égal au nombre de palettes à déconsigner."
-   **Code d'erreur**: `palette_deconsignees_exceed_a_deconsigner`
-   **Données supplémentaires**: `palette_a_deconsigner`, `palette_deconsignees`

### 4. **Le nombre de palettes à déconsigner doit être inférieur ou égal au nombre de palettes consignées validées**

-   **Validation**: `$paletteADeconsigner <= $availablePalettesToDeconsign`
-   **Calcul**: `Disponibles = Total Consignées Validées - Total Déjà Déconsignées`
-   **Message d'erreur**: "Le nombre de palettes à déconsigner doit être inférieur ou égal au nombre de palettes consignées validées disponibles."
-   **Code d'erreur**: `palette_a_deconsigner_exceed_available`
-   **Données supplémentaires**:
    -   `palette_a_deconsigner`
    -   `total_consigned_validated`
    -   `total_already_deconsigned`
    -   `available_to_deconsign`

## Règles Supprimées

Les règles suivantes ont été supprimées selon votre demande :

-   ~~Validation du solde non négatif~~
-   ~~Validation du solde suffisant~~
-   ~~Calcul des palettes restantes~~
-   ~~Informations sur le solde client~~

## Ordre des Validations

Les validations sont effectuées dans l'ordre suivant :

1. **Palettes ramenées > 0**
2. **Palettes à déconsigner ≤ palettes ramenées**
3. **Palettes déconsignées ≤ palettes à déconsigner**
4. **Palettes à déconsigner ≤ palettes consignées validées disponibles**

## Réponses API

### Validation Réussie

```json
{
    "success": true,
    "message": "Validation réussie.",
    "validation_info": {
        "palette_ramene": 10,
        "palette_a_deconsigner": 5,
        "palette_deconsignees": 3,
        "total_consigned_validated": 20,
        "total_already_deconsigned": 5,
        "available_to_deconsign": 15
    }
}
```

### Validation Échouée

```json
{
    "success": false,
    "message": "Message d'erreur descriptif",
    "error_type": "code_erreur_specifique",
    "validation_info": {
        "palette_ramene": 10,
        "palette_a_deconsigner": 5
    }
}
```

## Points d'Entrée API

### POST /api/deconsignations/validate

-   **But**: Valider les données de déconsignation avant sauvegarde
-   **Paramètres**: `xclient_0`, `xsite_0`, `palette_ramene`, `palette_a_deconsigner`, `palette_deconsignees`
-   **Réponse**: Validation réussie ou échec avec détails

### POST /api/deconsignations

-   **But**: Créer une nouvelle déconsignation
-   **Validation**: Applique automatiquement les 4 règles métiers
-   **Recalcul**: Déclenche automatiquement le recalcul du solde si validée (xvalsta_0 = 2)

### PUT /api/deconsignations/{xnum_0}

-   **But**: Mettre à jour une déconsignation existante
-   **Validation**: Applique automatiquement les 4 règles métiers pour les modifications
-   **Recalcul**: Déclenche automatiquement le recalcul du solde si validée (xvalsta_0 = 2)

## Cas de Test Principaux

### Test 1: Palettes Ramenées = 0

-   **Entrée**: `palette_ramene = 0`
-   **Résultat attendu**: Échec avec `palette_ramene_invalid`

### Test 2: Palettes à Déconsigner > Palettes Ramenées

-   **Entrée**: `palette_ramene = 5, palette_a_deconsigner = 10`
-   **Résultat attendu**: Échec avec `palette_a_deconsigner_exceed_ramene`

### Test 3: Palettes Déconsignées > Palettes à Déconsigner

-   **Entrée**: `palette_a_deconsigner = 5, palette_deconsignees = 8`
-   **Résultat attendu**: Échec avec `palette_deconsignees_exceed_a_deconsigner`

### Test 4: Palettes à Déconsigner > Palettes Consignées Validées Disponibles

-   **Entrée**: `palette_a_deconsigner = 10` (si disponibles = 5)
-   **Résultat attendu**: Échec avec `palette_a_deconsigner_exceed_available`

### Test 5: Validation Réussie

-   **Entrée**: `palette_ramene = 10, palette_a_deconsigner = 5, palette_deconsignees = 3`
-   **Résultat attendu**: Succès avec informations détaillées

### Test 6: Valeurs Limites

-   **Entrée**: `palette_ramene = 5, palette_a_deconsigner = 5, palette_deconsignees = 5`
-   **Résultat attendu**: Succès (égalité acceptée)

## Fichiers Modifiés

-   **`app/Http/Controllers/DeconsignationController.php`**: Méthode `validateDeconsignationLogic()` simplifiée avec uniquement les 4 règles essentielles

## Intégration avec le Système de Solde

-   **Recalcul Automatique**: Le solde est toujours recalculé automatiquement après validation d'une déconsignation
-   **Méthode**: `\App\Models\Csolde::recalculateBalance($client, $site)`
-   **Déclencheur**: `xvalsta_0 = 2` (statut validé)

## Conclusion

Le système de validation est maintenant simplifié et se concentre uniquement sur les 4 règles métiers essentielles pour l'interface de déconsignation. Les validations liées au solde ont été supprimées comme demandé, tout en maintenant la fonctionnalité de recalcul automatique du solde.
