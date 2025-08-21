<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>État Cautions - {{ $valeur_debut }} à {{ $valeur_fin }}</title>
    <style>
        @font-face {
            font-family: 'DAX-Light';
            src: url('{{ storage_path('fonts/DAX-Light.ttf') }}') format('truetype');
            font-weight: normal;
            font-style: normal;
        }

        @font-face {
            font-family: 'DAX-Medium';
            src: url('{{ storage_path('fonts/DAX-Medium.ttf') }}') format('truetype');
            font-weight: normal;
            font-style: normal;
        }

        body {
            font-family: 'DAX-Light', sans-serif;
            margin: 0;
            padding: 20px;
            font-size: 12px;
        }

        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 15px;
        }

        .title {
            font-family: 'DAX-Medium', sans-serif;
            font-size: 24px;
            font-weight: bold;
            color: #333;
            margin-bottom: 10px;
        }

        .subtitle {
            font-size: 14px;
            color: #666;
            margin-bottom: 5px;
        }

        .info-section {
            margin-bottom: 20px;
            display: table;
            width: 100%;
        }

        .info-row {
            display: table-row;
        }

        .info-label {
            display: table-cell;
            font-family: 'DAX-Medium', sans-serif;
            font-weight: bold;
            width: 150px;
            padding: 3px 0;
        }

        .info-value {
            display: table-cell;
            padding: 3px 0;
        }

        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            font-size: 10px;
        }

        .data-table th {
            background-color: #f5f5f5;
            border: 1px solid #ddd;
            padding: 8px 4px;
            text-align: center;
            font-family: 'DAX-Medium', sans-serif;
            font-weight: bold;
        }

        .data-table td {
            border: 1px solid #ddd;
            padding: 6px 4px;
            text-align: center;
        }

        .data-table tr:nth-child(even) {
            background-color: #f9f9f9;
        }

        .summary-section {
            margin-top: 30px;
            padding: 15px;
            background-color: #f8f9fa;
            border: 1px solid #dee2e6;
        }

        .summary-title {
            font-family: 'DAX-Medium', sans-serif;
            font-weight: bold;
            margin-bottom: 10px;
        }

        .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 10px;
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 10px;
        }

        .status-validated {
            color: #28a745;
            font-weight: bold;
        }

        .status-pending {
            color: #ffc107;
            font-weight: bold;
        }

        .amount {
            font-weight: bold;
            color: #2c5aa0;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">ÉTAT DES CAUTIONS</div>
        <div class="subtitle">{{ $code_etat }} - Plage: {{ $valeur_debut }} à {{ $valeur_fin }}</div>
        <div class="subtitle">Généré le: {{ $date_generation }}</div>
    </div>

    <div class="info-section">
        <div class="info-row">
            <div class="info-label">Nombre de documents:</div>
            <div class="info-value">{{ $cautions->count() }}</div>
        </div>
        <div class="info-row">
            <div class="info-label">Plage demandée:</div>
            <div class="info-value">{{ $valeur_debut }} → {{ $valeur_fin }}</div>
        </div>
        <div class="info-row">
            <div class="info-label">Total montant cautions:</div>
            <div class="info-value">{{ number_format($cautions->sum('montant') / 100, 2, ',', ' ') }} DH</div>
        </div>
    </div>

    <table class="data-table">
        <thead>
            <tr>
                <th>N°</th>
                <th>Numéro Document</th>
                <th>Date</th>
                <th>Heure</th>
                <th>Client</th>
                <th>Site</th>
                <th>CIN</th>
                <th>Raison</th>
                <th>Montant (DH)</th>
                <th>Statut</th>
                <th>Créé le</th>
            </tr>
        </thead>
        <tbody>
            @foreach($cautions as $index => $caution)
            <tr>
                <td>{{ $index + 1 }}</td>
                <td>{{ $caution->xnum_0 }}</td>
                <td>{{ $caution->xdate_0 ? \Carbon\Carbon::parse($caution->xdate_0)->format('d/m/Y') : '-' }}</td>
                <td>{{ $caution->xheure_0 ?? '-' }}</td>
                <td>{{ $caution->xclient_0 }}</td>
                <td>{{ $caution->xsite_0 }}</td>
                <td>{{ $caution->xcin_0 ?? '-' }}</td>
                <td>{{ $caution->xraison_0 ?? '-' }}</td>
                <td class="amount">{{ number_format($caution->montant / 100, 2, ',', ' ') }}</td>
                <td>
                    @if($caution->xvalsta_0 == 2)
                        <span class="status-validated">Validée</span>
                    @else
                        <span class="status-pending">En attente</span>
                    @endif
                </td>
                <td>{{ $caution->created_at ? \Carbon\Carbon::parse($caution->created_at)->format('d/m/Y H:i') : '-' }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div class="summary-section">
        <div class="summary-title">Résumé</div>
        <div class="info-section">
            <div class="info-row">
                <div class="info-label">Documents trouvés:</div>
                <div class="info-value">{{ $cautions->count() }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Total des montants:</div>
                <div class="info-value"><strong>{{ number_format($cautions->sum('montant') / 100, 2, ',', ' ') }} DH</strong></div>
            </div>
            <div class="info-row">
                <div class="info-label">Montant moyen:</div>
                <div class="info-value">{{ $cautions->count() > 0 ? number_format(($cautions->sum('montant') / $cautions->count()) / 100, 2, ',', ' ') : '0,00' }} DH</div>
            </div>
            <div class="info-row">
                <div class="info-label">Montant minimum:</div>
                <div class="info-value">{{ $cautions->count() > 0 ? number_format($cautions->min('montant') / 100, 2, ',', ' ') : '0,00' }} DH</div>
            </div>
            <div class="info-row">
                <div class="info-label">Montant maximum:</div>
                <div class="info-value">{{ $cautions->count() > 0 ? number_format($cautions->max('montant') / 100, 2, ',', ' ') : '0,00' }} DH</div>
            </div>
        </div>
    </div>

    <div class="footer">
        <p>État généré automatiquement par le système Palettes-Track</p>
        <p>Date et heure de génération: {{ $date_generation }}</p>
    </div>
</body>
</html>
