<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>État Déconsignations - {{ $valeur_debut }} à {{ $valeur_fin }}</title>
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
    </style>
</head>
<body>
    <div class="header">
        <div class="title">ÉTAT DES DÉCONSIGNATIONS</div>
        <div class="subtitle">{{ $code_etat }} - Plage: {{ $valeur_debut }} à {{ $valeur_fin }}</div>
        <div class="subtitle">Généré le: {{ $date_generation }}</div>
    </div>

    <div class="info-section">
        <div class="info-row">
            <div class="info-label">Nombre de documents:</div>
            <div class="info-value">{{ $deconsignations->count() }}</div>
        </div>
        <div class="info-row">
            <div class="info-label">Plage demandée:</div>
            <div class="info-value">{{ $valeur_debut }} → {{ $valeur_fin }}</div>
        </div>
        <div class="info-row">
            <div class="info-label">Total palettes déconsignées:</div>
            <div class="info-value">{{ $deconsignations->sum('palette_deconsignees') ?? 0 }}</div>
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
                <th>Matricule</th>
                <th>Palettes Ramenées</th>
                <th>Palettes à Déconsigner</th>
                <th>Palettes Déconsignées</th>
                <th>Statut</th>
                <th>Créé le</th>
            </tr>
        </thead>
        <tbody>
            @foreach($deconsignations as $index => $deconsignation)
            <tr>
                <td>{{ $index + 1 }}</td>
                <td>{{ $deconsignation->xnum_0 }}</td>
                <td>{{ $deconsignation->xdate_0 ? \Carbon\Carbon::parse($deconsignation->xdate_0)->format('d/m/Y') : '-' }}</td>
                <td>{{ $deconsignation->xheure_0 ?? '-' }}</td>
                <td>{{ $deconsignation->xclient_0 }}</td>
                <td>{{ $deconsignation->xsite_0 }}</td>
                <td>{{ $deconsignation->xcamion_0 ?? '-' }}</td>
                <td>{{ $deconsignation->palette_ramene ?? 0 }}</td>
                <td>{{ $deconsignation->palette_a_deconsigner ?? 0 }}</td>
                <td>{{ $deconsignation->palette_deconsignees ?? 0 }}</td>
                <td>
                    @if($deconsignation->xvalsta_0 == 2)
                        <span class="status-validated">Validée</span>
                    @else
                        <span class="status-pending">En attente</span>
                    @endif
                </td>
                <td>{{ $deconsignation->created_at ? \Carbon\Carbon::parse($deconsignation->created_at)->format('d/m/Y H:i') : '-' }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div class="summary-section">
        <div class="summary-title">Résumé</div>
        <div class="info-section">
            <div class="info-row">
                <div class="info-label">Documents trouvés:</div>
                <div class="info-value">{{ $deconsignations->count() }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Total palettes ramenées:</div>
                <div class="info-value">{{ $deconsignations->sum('palette_ramene') ?? 0 }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Total palettes à déconsigner:</div>
                <div class="info-value">{{ $deconsignations->sum('palette_a_deconsigner') ?? 0 }}</div>
            </div>
            <div class="info-row">
                <div class="info-label">Total palettes déconsignées:</div>
                <div class="info-value">{{ $deconsignations->sum('palette_deconsignees') ?? 0 }}</div>
            </div>
        </div>
    </div>

    <div class="footer">
        <p>État généré automatiquement par le système Palettes-Track</p>
        <p>Date et heure de génération: {{ $date_generation }}</p>
    </div>
</body>
</html>
