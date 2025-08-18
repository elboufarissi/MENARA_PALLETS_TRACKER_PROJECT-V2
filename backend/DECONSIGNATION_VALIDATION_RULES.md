# Règles de Validation pour la Déconsignation

## Règles Métiers Implémentées

### 1. **Palettes Ramenées > 0**

-   **Règle**: Le nombre de palettes ramenées doit être supérieur à zéro
-   **Message d'erreur**: "Le nombre de palettes ramenées doit être supérieur à zéro."
-   **Code d'erreur**: `palette_ramene_invalid`

### 2. **Palettes à Déconsigner ≤ Palettes Ramenées**

-   **Règle**: Le nombre de palettes à déconsigner ne peut pas dépasser le nombre de palettes ramenées
-   **Message d'erreur**: "Le nombre de palettes à déconsigner ne peut pas dépasser le nombre de palettes ramenées."
-   **Code d'erreur**: `palette_a_deconsigner_exceed_ramene`
-   **Données supplémentaires**: `palette_ramene`, `palette_a_deconsigner`

### 3. **Palettes Déconsignées ≤ Palettes à Déconsigner**

-   **Règle**: Le nombre de palettes déconsignées ne peut pas dépasser le nombre de palettes à déconsigner
-   **Message d'erreur**: "Le nombre de palettes déconsignées ne peut pas dépasser le nombre de palettes à déconsigner."
-   **Code d'erreur**: `palette_deconsignees_exceed_a_deconsigner`
-   **Données supplémentaires**: `palette_a_deconsigner`, `palette_deconsignees`

### 4. **Palettes à Déconsigner ≤ Palettes Consignées Validées Disponibles**

-   **Règle**: Le nombre de palettes à déconsigner ne peut pas dépasser les palettes consignées validées disponibles
-   **Calcul**: `Disponibles = Total Consignées Validées - Total Déjà Déconsignées`
-   **Message d'erreur**: "Le nombre de palettes à déconsigner dépasse les palettes consignées validées disponibles."
-   **Code d'erreur**: `palette_a_deconsigner_exceed_available`
-   **Données supplémentaires**:
    -   `palette_a_deconsigner`
    -   `total_consigned_validated`
    -   `total_already_deconsigned`
    -   `available_to_deconsign`

### 5. **Solde Non Négatif**

-   **Règle**: Le solde client ne peut pas être négatif
-   **Message d'erreur**: "Vous n'avez pas le droit de consigner des palettes, merci de déposer une caution."
-   **Code d'erreur**: `negative_balance`
-   **Données supplémentaires**: `current_balance`, `client`, `site`

### 6. **Solde Suffisant**

-   **Règle**: Le solde doit être suffisant pour couvrir la déconsignation
-   **Calcul**: `Montant Requis = Palettes à Déconsigner × 100`
-   **Message d'erreur**: "Le nombre de palette à consigner dépasse votre solde actuel."
-   **Code d'erreur**: `insufficient_balance`
-   **Données supplémentaires**: `current_balance`, `required_amount`, `missing_amount`, `client`, `site`

## Ordre des Validations

Les validations sont effectuées dans l'ordre suivant pour une logique métier cohérente :

1. **Palettes ramenées > 0**
2. **Palettes à déconsigner ≤ palettes ramenées**
3. **Palettes déconsignées ≤ palettes à déconsigner**
4. **Palettes à déconsigner ≤ palettes consignées validées disponibles**
5. **Solde non négatif**
6. **Solde suffisant**

## Réponses API

### Validation Réussie

```json
{
    "success": true,
    "info_message": "Il vous reste X palettes à consommer.",
    "balance_info": {
        "current_balance": 1000,
        "required_amount": 300,
        "remaining_palettes": 7,
        "client": "CLIENT001",
        "site": "SITE001"
    },
    "validation_info": {
        "palette_ramene": 10,
        "palette_a_deconsigner": 3,
        "palette_deconsignees": 2,
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
        // Données spécifiques à l'erreur
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
-   **Validation**: Applique automatiquement toutes les règles métiers
-   **Recalcul**: Déclenche automatiquement le recalcul du solde si validée (xvalsta_0 = 2)

### PUT /api/deconsignations/{xnum_0}

-   **But**: Mettre à jour une déconsignation existante
-   **Validation**: Applique automatiquement toutes les règles métiers pour les modifications
-   **Recalcul**: Déclenche automatiquement le recalcul du solde si validée (xvalsta_0 = 2)

## Intégration avec le Système de Solde

-   **Recalcul Automatique**: Le solde est recalculé automatiquement après validation d'une déconsignation
-   **Méthode**: `\App\Models\Csolde::recalculateBalance($client, $site)`
-   **Déclencheur**: `xvalsta_0 = 2` (statut validé)

## Gestion des Erreurs

-   **Logging**: Toutes les erreurs sont enregistrées dans les logs Laravel
-   **Réponses HTTP**: Codes d'erreur appropriés (422 pour validation, 500 pour erreurs serveur)
-   **Informations Détaillées**: Chaque erreur fournit des informations contextuelles pour le débogage

## Tests

Voir `DECONSIGNATION_VALIDATION_TESTS.md` pour les cas de test détaillés.
