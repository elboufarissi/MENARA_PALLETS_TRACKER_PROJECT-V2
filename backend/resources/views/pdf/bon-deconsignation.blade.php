<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Bon de déconsignation palettes</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      font-size: 12px;
      margin: 30px;
      color: #000;
    }

    .header-table {
      width: 100%;
      margin-bottom: 10px;
    }

    .logo {
      width: 100px;
    }

    .title-box {
      background-color: #1a2c50;
      color: white;
      padding: 10px;
      font-weight: bold;
      text-align: center;
      font-size: 18px;
      margin-top: 10px;
    }

    .main-table {
      width: 100%;
      margin-top: 15px;
      border-collapse: collapse;
    }

    .main-table td {
      vertical-align: top;
    }

    .label {
      font-weight: bold;
    }

    .italic {
      font-style: italic;
    }

    .small {
      font-size: 11px;
    }

    .align-right {
      text-align: right;
    }

    .center {
      text-align: center;
    }

    .field-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 5px;
    }

    .field-table td {
      border: 1px solid #ccc;
      padding: 6px;
    }

    .signature-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }

    .signature-table td {
      border: 1px solid #ccc;
      height: 40px;
      text-align: center;
      vertical-align: middle;
      font-weight: bold;
    }

    .value-centered {
      text-align: center;
      margin-left: 30px;
    }

    hr.separator {
      margin: 50px 0;
      border: 1px dashed #999;
    }
    .signature-label-top {
  padding-bottom: 30px;

}

  </style>
</head>
<body>

  @for ($i = 0; $i < 2; $i++)
  <!-- En-tête -->
  <table class="header-table">
    <tr>
      <td><img src="{{ public_path('logo.png') }}" class="logo"></td>
      <td class="align-right small">{{ now()->format('d/m/Y H:i:s') }}</td>
    </tr>
  </table>

  <!-- Titre -->
  <div class="title-box">
    Bon de déconsignation palettes<br>
    <span class="value-centered">N° {{ $deconsignation->xnum_0 }}</span>
  </div>

  <!-- Tableau principal -->
  <table class="main-table">
    <tr>
      <!-- Colonne gauche -->
      <td style="width: 50%; padding-right: 10px;">
        <table class="field-table">
  <tr>
    <td>
      <span class="label">Date :</span>
      <span class="value-centered italic">{{ \Carbon\Carbon::parse($deconsignation->xdate_0)->format('d/m/Y') }}</span>
      &nbsp;&nbsp;&nbsp;&nbsp;
      <span class="label">Heure :</span>
      <span class="value-centered italic">{{ \Carbon\Carbon::parse($deconsignation->created_at)->format('H:i:s') }}</span>
    </td>
  </tr>
</table>

        <table class="field-table"><tr><td><span class="label">Client :</span><span class="value-centered">{{ $deconsignation->xclient_0 }} - {{ $deconsignation->xraison_0 ?? 'Non défini' }}</span></td></tr></table>
        <table class="field-table"><tr><td><span class="label">Matricule :</span><span class="value-centered">{{ $deconsignation->xcamion_0 ?? '-' }}</span></td></tr></table>
      </td>

      <!-- Colonne droite -->
      <td style="width: 50%; padding-left: 10px;">
        <table class="field-table"><tr><td><span class="label">Solde Caution Caisse :</span><span class="value-centered">{{ floor($caution_after ?? 0) }} <span class="italic">pal</span></span></td></tr></table>
        <table class="field-table"><tr><td><span class="label">Total NB palettes consignées :</span><span class="value-centered">{{ $after_palettes ?? 0 }} <span class="italic">pal</span></span></td></tr></table>
        <table class="field-table"><tr><td><span class="label">Quantité palettes déconsignées (conforme) :</span><span class="value-centered">{{ $deconsignation->palette_deconsignees ?? 0 }} <span class="italic">pal</span></span></td></tr></table>
      </td>
    </tr>

    <!-- Signatures alignées -->
    <tr>
      <td style="padding-right: 10px;">
        <table class="signature-table">
          <tr>
            <td class="signature-label-top">VISA Opérateur</td>
          </tr>
        </table>
      </td>
      <td style="padding-left: 10px;">
        <table class="signature-table">
          <tr>
            <td class="signature-label-top">VISA Client</td>
          </tr>
        </table>
      </td>
    </tr>
  </table>

  @if($i === 0)
    <hr class="separator">
  @endif
  @endfor
</body>
</html>
