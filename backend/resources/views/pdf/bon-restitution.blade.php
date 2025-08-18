<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Bon de Récupération Caution</title>
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
    </style>
    <link href="{{ public_path('css/bootstrap.min.css') }}" rel="stylesheet">
    <link href="{{ public_path('css/bon-caution.css') }}" rel="stylesheet">
</head>
<body>
    @for($i = 0; $i < 2; $i++)
    <div class="receipt-block">
        <table width="100%">
            <tr>
                <td width="40%" style="vertical-align: top;">
                    <img src="{{ public_path('logo.png') }}" alt="Logo" class="logo">
                </td>
                <td width="60%" style="vertical-align: top;">
                    <div class="date-time">{{ now()->addHour()->format('d/m/Y H:i:s') }}</div>
                    <div class="bon-title">BON DE RÉCUPÉRATION CAUTION</div>
                </td>
            </tr>
        </table>

        <hr class="divider">

        <div class="info-row">
            <span style="display: inline-block; width: 45%;">
                <span class="info-label bold-label">Date :</span>
                <span class="info-value grey-value">
                    @if($restitution->xdate_0)
                        {{ \Carbon\Carbon::parse($restitution->xdate_0)->format('d/m/Y') }} {{ $restitution->xheure_0 ?? now()->format('H:i:s') }}
                    @else
                        {{ now()->format('d/m/Y H:i:s') }}
                    @endif
                </span>
            </span>
            <span style="display: inline-block; width: 45%;">
                <span class="info-label bold-label">Client :</span>
                <span class="info-value grey-value">{{ $restitution->xclient_0 }} - {{ $restitution->xraison_0 }}</span>
            </span>
        </div>

        <div class="info-row">
            <span style="display: inline-block; width: 45%;">
                <span class="info-label bold-label">Num :</span>
                <span class="info-value grey-value">{{ $restitution->xnum_0 }}</span>
            </span>
            <span style="display: inline-block; width: 45%;">
                <span class="info-label bold-label">CIN :</span>
                <span class="info-value grey-value">{{ $restitution->xcin_0 }}</span>
            </span>
        </div>

        @if($restitution->caution_ref)
        <div class="info-row">
            <span style="display: inline-block; width: 45%;">
                <span class="info-label bold-label">Réf. Caution :</span>
                <span class="info-value">{{ $restitution->caution_ref }}</span>
            </span>
        </div>
        @endif

        <table class="type-table">
            <tr>
                <th width="200" class="bold-label">Type</th>
                <th class="bold-label">Montant</th>
            </tr>
            <tr>
                <td colspan="2"><hr style="margin: 2px 0; border: none; border-top: 0.5px solid #000;"></td>
            </tr>
            <tr>
                <td style="font-size:1.2em; font-family: 'DAX-Medium', sans-serif; font-weight: normal; color: #222;">Récupération caution</td>
                <td class="grey-value">{{ number_format($restitution->montant, 0, ',', ' ') }} DH</td>
            </tr>
        </table>
<table width="100%" style="margin-top: 30px;">
    <tr>
        <td style="width: 50%; vertical-align: top;">
            <div class="bold-label">Solde client :</div>
            <div style="margin-left: 10px;">
                <span class="grey-value" style="font-style: italic;">Avant ce bon :</span>
                <span class="grey-value" style="font-style: italic;">{{number_format($caution_before * 100, 0, ',', ' ') }} DH</span><br>
                <span class="grey-value" style="font-style: italic;">Après ce bon :</span>
                <span class="grey-value" style="font-style: italic;">{{number_format($caution_after * 100, 0, ',', ' ') }} DH</span>
            </div>
        </td>
        <td style="width: 50%; vertical-align: top;">
            <div class="bold-label">Solde palette :</div>
            <div style="margin-left: 10px;">
                <span class="grey-value" style="font-style: italic;">Avant ce bon :</span>
                <span class="grey-value" style="font-style: italic;">{{ $caution_before }} pal</span><br>
                <span class="grey-value" style="font-style: italic;">Après ce bon :</span>
                <span class="grey-value" style="font-style: italic;">{{ $caution_after }} pal</span>
            </div>
        </td>
    </tr>
</table>
        <table width="100%" class="total-section">
            <tr>
                <td width="40%" style="vertical-align: top;">
                    <br><br><br>
                    <div class="total-box">
                        <span class="bold-label">Total règlement :</span> <span class="grey-value">{{ number_format($restitution->montant, 0, ',', ' ') }} DH</span>
                    </div>
                </td>
                <td width="5%"></td>
                <td width="27%" style="vertical-align: bottom;">
                    <div class="signature-label bold-label">Client :</div>
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
</body>
</html>
