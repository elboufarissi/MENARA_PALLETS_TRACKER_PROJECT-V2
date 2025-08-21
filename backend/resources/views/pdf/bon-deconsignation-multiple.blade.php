<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>{{ $description }}</title>
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
        }

        .dax-medium {
            font-family: 'DAX-Medium', sans-serif;
            font-weight: bold;
            color: #222;
        }

        .bold-label, .type-table th {
            font-family: 'DAX-Medium', sans-serif !important;
            font-weight: bold !important;
            color: #222 !important;
            font-size: 1.1em !important;
        }

        .grey-value {
            color: #666;
            font-family: 'DAX-Light', sans-serif;
        }

        .bon-title {
            font-family: 'DAX-Medium', sans-serif;
            font-weight: 900;
            font-size: 2.7em;
            color: #222;
            letter-spacing: 1px;
        }

        .total-box {
            font-family: 'DAX-Medium', sans-serif;
            font-weight: bold;
            color: #222;
            min-width: 350px;
            max-width: 100%;
            display: inline-block;
            white-space: nowrap;
        }

        .signature-label {
            font-family: 'DAX-Medium', sans-serif;
            font-weight: bold;
            color: #222;
        }

        .page-break {
            page-break-before: always;
        }
    </style>
    <link href="{{ public_path('css/bootstrap.min.css') }}" rel="stylesheet">
    <link href="{{ public_path('css/bon-caution.css') }}" rel="stylesheet">
</head>
<body>
    @foreach($deconsignations as $deconsignationIndex => $deconsignation)
        @if($deconsignationIndex > 0)
            <div class="page-break"></div>
        @endif
        
        @for($i = 0; $i < 2; $i++)
        <div class="receipt-block">
            <table width="100%">
                <tr>
                    <td width="40%" style="vertical-align: top;">
                        <img src="{{ public_path('logo.png') }}" alt="Logo" class="logo">
                    </td>
                    <td width="60%" style="vertical-align: top;">
                        <div class="date-time">{{ now()->addHour()->format('d/m/Y H:i:s') }}</div>
                        <div class="bon-title">BON DE DÉCONSIGNATION</div>
                    </td>
                </tr>
            </table>

            <hr class="divider">

            <div class="info-row">
                <span style="display: inline-block; width: 45%;">
                    <span class="info-label bold-label">Date :</span>
                    <span class="info-value grey-value">
                        {{ $deconsignation->xdate_0 ? \Carbon\Carbon::parse($deconsignation->xdate_0)->format('d/m/Y') : now()->format('d/m/Y') }} {{ $deconsignation->xheure_0 ?? now()->format('H:i:s') }}
                    </span>
                </span>
                <span style="display: inline-block; width: 45%;">
                    <span class="info-label bold-label">Client :</span>
                    <span class="info-value grey-value">{{ $deconsignation->xclient_0 }} - {{ $deconsignation->xraison_0 ?? 'N/A' }}</span>
                </span>
            </div>

            <div class="info-row">
                <span style="display: inline-block; width: 45%;">
                    <span class="info-label bold-label">Num :</span>
                    <span class="info-value grey-value">{{ $deconsignation->xnum_0 }}</span>
                </span>
                <span style="display: inline-block; width: 45%;">
                    <span class="info-label bold-label">Site :</span>
                    <span class="info-value grey-value">{{ $deconsignation->xsite_0 }}</span>
                </span>
            </div>

            <div class="info-row">
                <span style="display: inline-block; width: 45%;">
                    <span class="info-label bold-label">Matricule :</span>
                    <span class="info-value grey-value">{{ $deconsignation->xcamion_0 ?? 'N/A' }}</span>
                </span>
                <span style="display: inline-block; width: 45%;">
                    <span class="info-label bold-label">Validé :</span>
                    <span class="info-value grey-value">{{ $deconsignation->xvalsta_0 == 2 ? 'Oui' : 'Non' }}</span>
                </span>
            </div>

            <table class="type-table">
                <tr>
                    <th width="200" class="bold-label">Type</th>
                    <th class="bold-label">Quantité</th>
                </tr>
                <tr>
                    <td colspan="2"><hr style="margin: 2px 0; border: none; border-top: 0.5px solid #000;"></td>
                </tr>
                <tr>
                    <td style="font-size:1.2em; font-family: 'DAX-Medium', sans-serif; font-weight: normal; color: #222;">Palettes ramenées</td>
                    <td class="grey-value">{{ $deconsignation->palette_ramene ?? '0' }}</td>
                </tr>
                <tr>
                    <td style="font-size:1.2em; font-family: 'DAX-Medium', sans-serif; font-weight: normal; color: #222;">Palettes à déconsigner</td>
                    <td class="grey-value">{{ $deconsignation->palette_a_deconsigner ?? '0' }}</td>
                </tr>
                <tr>
                    <td style="font-size:1.2em; font-family: 'DAX-Medium', sans-serif; font-weight: normal; color: #222;">Palettes déconsignées</td>
                    <td class="grey-value">{{ $deconsignation->palette_deconsignees ?? '0' }}</td>
                </tr>
            </table>

            <table width="100%" class="total-section">
                <tr>
                    <td width="40%" style="vertical-align: top;">
                        <br><br><br>
                        <div class="total-box">
                            <span class="bold-label">Validation :</span> <span class="grey-value">{{ $deconsignation->xvalsta_0 == 2 ? 'Validée' : 'Non validée' }}</span>
                        </div>
                    </td>
                    <td width="5%"></td>
                    <td width="27%" style="vertical-align: bottom;">
                        <div class="signature-label bold-label">Remise par :</div>
                        <div class="signature-box"></div>
                    </td>
                    <td width="28%" style="vertical-align: bottom;">
                        <div class="signature-label bold-label">Opérateur :</div>
                        <div class="signature-box"></div>
                    </td>
                </tr>
            </table>
            <br><br><br>
            @if($i == 0)
            <hr class="section-divider">
            @endif
        </div>
        @endfor
    @endforeach
</body>
</html>
