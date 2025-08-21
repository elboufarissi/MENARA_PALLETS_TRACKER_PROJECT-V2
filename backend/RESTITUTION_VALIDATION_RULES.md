# Validation des Restitutions - Nouvelle Règle Métier

## **Règle Implémentée**

### **Le montant de la récupération doit être inférieur ou égal au solde validé**

-   **Validation**: `$montant <= $currentBalance`
-   **Message d'erreur**: "Le montant de la récupération doit être inférieur ou égal au solde validé.\n\nVotre solde validé est : [montant] DH"
-   **Code d'erreur**: `insufficient_balance`

## **Logique Métier**

La validation empêche qu'un client puisse retirer plus d'argent que ce qui est disponible dans son solde. Cette règle garantit l'intégrité financière du système.

### **Calcul du Solde Validé**

Le solde est calculé selon la nouvelle formule :

```php
SOLDE = (SUM MONTANT in xcautions where XVALSTA=2)
      - (SUM palette_a_consigner*100 in consignations where XVALSTA=2)
      + (SUM palette_deconsignees*100 in deconsignations where XVALSTA=2)
      - (SUM MONTANT in restitutions where XVALSTA=2)
```

## **Implémentation**

### **Méthode de Validation**

```php
private function validateRestitutionLogic($client, $site, $montant)
{
    // Récupération du solde actuel
    $currentBalance = DB::table('csolde')
                       ->where('codeClient', $client)
                       ->where('site', $site)
                       ->value('solde') ?? 0;

    // Validation: montant ≤ solde
    if ($montant > $currentBalance) {
        return [
            'success' => false,
            'message' => 'Le montant de la récupération doit être inférieur ou égal au solde validé. Votre solde validé est : ' . number_format($currentBalance, 2, ',', ' ') . ' DH',
            'error_type' => 'insufficient_balance',
            'balance_info' => [...]
        ];
    }

    return ['success' => true, ...];
}
```

### **Points d'Intégration**

La validation est appliquée automatiquement lors de :

1. **Création d'une restitution** (`POST /api/restitutions`)
2. **Modification du montant** (`PUT /api/restitutions/{xnum_0}`)
3. **Validation d'une restitution** (xvalsta_0 = 2)

## **Réponses API**

### **Validation Réussie**

```json
{
    "success": true,
    "message": "Validation réussie.",
    "balance_info": {
        "current_balance": 5000,
        "requested_amount": 3000,
        "remaining_balance": 2000,
        "client": "CLIENT001",
        "site": "SITE001"
    }
}
```

### **Validation Échouée**

```json
{
    "success": false,
    "message": "Le montant de la récupération doit être inférieur ou égal au solde validé.",
    "error_type": "insufficient_balance",
    "balance_info": {
        "current_balance": 2000,
        "requested_amount": 3000,
        "excess_amount": 1000,
        "client": "CLIENT001",
        "site": "SITE001"
    }
}
```

## **Endpoints API**

### **POST /api/restitutions/validate**

-   **But**: Valider les données de restitution avant sauvegarde
-   **Paramètres**: `xclient_0`, `xsite_0`, `montant`
-   **Réponse**: Validation réussie ou échec avec détails du solde

### **POST /api/restitutions**

-   **But**: Créer une nouvelle restitution
-   **Validation**: Applique automatiquement la règle métier
-   **Recalcul**: Déclenche automatiquement le recalcul du solde si validée (xvalsta_0 = 2)

### **PUT /api/restitutions/{xnum_0}**

-   **But**: Mettre à jour une restitution existante
-   **Validation**: Applique automatiquement la règle métier lors des modifications
-   **Recalcul**: Déclenche automatiquement le recalcul du solde si validée (xvalsta_0 = 2)

## **Cas de Test**

### **Test 1: Montant Valid (doit réussir)**

-   **Solde actuel**: 5,000
-   **Montant demandé**: 3,000
-   **Résultat attendu**: Succès
-   **Solde restant**: 2,000

### **Test 2: Montant Égal au Solde (doit réussir)**

-   **Solde actuel**: 5,000
-   **Montant demandé**: 5,000
-   **Résultat attendu**: Succès
-   **Solde restant**: 0

### **Test 3: Montant Supérieur au Solde (doit échouer)**

-   **Solde actuel**: 2,000
-   **Montant demandé**: 3,000
-   **Résultat attendu**: Échec avec `insufficient_balance`
-   **Montant en excès**: 1,000

### **Test 4: Solde Négatif (doit échouer)**

-   **Solde actuel**: -1,000
-   **Montant demandé**: 500
-   **Résultat attendu**: Échec avec `insufficient_balance`
-   **Montant en excès**: 1,500

## **Fichiers Modifiés**

### **1. RestitutionController.php**

-   **Ajout**: Méthode `validateRestitutionLogic()`
-   **Ajout**: Méthode `validateRestitution()` (endpoint)
-   **Modification**: Méthode `store()` avec validation
-   **Modification**: Méthode `update()` avec validation
-   **Import**: Ajout de `Illuminate\Support\Facades\DB`

### **2. routes/api.php**

-   **Ajout**: Route `POST /api/restitutions/validate`

## **Intégration avec le Système**

### **Recalcul Automatique**

-   Le solde est recalculé automatiquement après validation d'une restitution
-   Utilise `\App\Models\Csolde::recalculateBalance($client, $site)`
-   Logging des succès et erreurs

### **Cohérence du Système**

-   La validation s'applique avant toute modification du solde
-   Le recalcul se fait après validation pour maintenir la cohérence
-   Les règles s'appliquent de manière uniforme sur tous les endpoints

## **Exemple d'Utilisation**

### **Validation avant Sauvegarde**

```javascript
// Frontend - Validation avant soumission
const response = await fetch("/api/restitutions/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
        xclient_0: "CLIENT001",
        xsite_0: "SITE001",
        montant: 3000,
    }),
});

const result = await response.json();
if (result.success) {
    console.log(
        "Validation réussie, solde restant:",
        result.balance_info.remaining_balance
    );
} else {
    console.error("Validation échouée:", result.message);
}
```

### **Création avec Validation Automatique**

```javascript
// Frontend - Création avec validation automatique
const response = await fetch("/api/restitutions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
        xsite_0: "SITE001",
        xclient_0: "CLIENT001",
        xraison_0: "Récupération partielle",
        xcin_0: "AB123456",
        xvalsta_0: 1,
        montant: 3000,
        xdate_0: "09/07/2025",
        xheure_0: "14:30",
    }),
});

const result = await response.json();
if (response.ok) {
    console.log("Restitution créée avec succès");
} else {
    console.error("Erreur:", result.message);
}
```

## **Impact sur les Utilisateurs**

-   **Protection**: Empêche les retraits excédentaires
-   **Transparence**: Messages d'erreur clairs avec informations détaillées
-   **Efficacité**: Validation en temps réel avant soumission
-   **Intégrité**: Maintien de la cohérence des données financières

La nouvelle règle de validation garantit que le système de restitutions respecte les contraintes financières tout en offrant une expérience utilisateur claire et informative.

## **Format des Messages d'Erreur Amélioré**

### **Message d'Erreur Enrichi**

Le message d'erreur a été amélioré pour inclure le solde validé actuel avec la devise:

**Format**:

```
Le montant de la récupération doit être inférieur ou égal au solde validé.

Votre solde validé est : [montant] DH
```

**Exemples**:

```
Le montant de la récupération doit être inférieur ou égal au solde validé.

Votre solde validé est : 1 000,00 DH
```

```
Le montant de la récupération doit être inférieur ou égal au solde validé.

Votre solde validé est : 5 500,50 DH
```

### **Formatage du Montant**

-   **Fonction utilisée**: `number_format($currentBalance, 2, ',', ' ')`
-   **Séparateur décimal**: virgule (,)
-   **Séparateur de milliers**: espace
-   **Devise**: DH (Dirham marocain)
-   **Précision**: 2 décimales

### **Avantages de l'Amélioration**

1. **Information claire**: L'utilisateur connaît exactement son solde disponible
2. **Transparence**: Pas de confusion sur le montant maximum autorisé
3. **Format localisé**: Affichage en format français avec devise locale
4. **Expérience utilisateur**: Message plus informatif et utile
