<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Demande de déconsignation palettes</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      font-size: 11px;
      margin: 20px;
      color: #000;
    }

    .copy-container {
      height: 48vh; /* Half page height for each copy */
      page-break-inside: avoid;
      margin-bottom: 15px;
    }

    .copy-container:first-child {
      border-bottom: 2px dashed #ccc;
      padding-bottom: 15px;
    }

    .header-table {
      width: 100%;
      margin-bottom: 10px;
    }

    .logo {
      width: 70px;
    }

    .title-box {
      background-color: #1a2c50;
      color: white;
      padding: 8px;
      font-weight: bold;
      text-align: center;
      font-size: 14px;
      margin-top: 10px;
    }

    .field-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 6px;
    }

    .field-table td {
      border: 1px solid #ccc;
      padding: 6px;
    }

    .label {
      font-weight: bold;
    }

    .italic {
      font-style: italic;
    }

    .small {
      font-size: 9px;
    }

    .align-right {
      text-align: right;
    }

    .center {
      text-align: center;
    }

    .signature-table {
      width: 100%;
      border-collapse: collapse;
    }

    .signature-table td {
      border: 1px solid #ccc;
      height: 50px;
      padding: 6px;
      text-align: center;
      vertical-align: top;
      box-sizing: border-box;
    }

    .value-centered {
      text-align: center;
      margin-left: 20px;
    }

    .column {
      width: 50%;
      vertical-align: top;
    }

    .signature-block {
      width: 25%;
      padding: 6px;
    }

    .copy-label {
      font-weight: bold;
      color: #666;
      font-size: 11px;
      margin-bottom: 8px;
      text-align: center;
    }
  </style>
</head>
<body>

  <!-- FIRST COPY -->
  <div class="copy-container">
    <div class="copy-label">COPIE EXPLOITANT</div>
    
    <!-- Header -->
    <table class="header-table">
      <tr>
        <td><img src="{{ public_path('logo.png') }}" class="logo"></td>
        <td class="align-right small">{{ now()->format('d/m/Y H:i:s') }}</td>
      </tr>
    </table>

    <!-- Title -->
    <div class="title-box">
      Demande de déconsignation palettes <br>
      <span class="value-centered">N° {{ $deconsignation->xnum_0 }}</span>
    </div>

    <!-- Main Content in Two Columns -->
    <table style="width: 100%; margin-top: 12px;">
      <tr>
        <!-- Colonne gauche -->
        <td class="column" style="padding-right: 10px;">
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
          <table class="field-table">
            <tr><td><span class="label">Matricule :</span> <span class="value-centered">{{ $deconsignation->xcamion_0 }}</span></td></tr>
          </table>
          <table class="field-table">
            <tr><td><span class="label">Client :</span> <span class="value-centered">{{ $deconsignation->xclient_0 }} - {{ $deconsignation->xraison_0 ?? 'Non défini' }}</span></td></tr>
          </table>
          <table class="field-table">
            <tr><td><span class="label">Nb palettes ramenées :</span> <span class="value-centered">{{ $deconsignation->palette_ramene }}</span></td></tr>
          </table>
          <table class="field-table">
            <tr><td><span class="label">Nb palettes à déconsigner :</span> <span class="value-centered">{{ $deconsignation->palette_a_deconsigner }}</span></td></tr>
          </table>
        </td>

        <!-- Colonne droite -->
        <td class="column" style="padding-left: 10px;">
          <table class="field-table">
            <tr>
              <td>
                <span class="label">Caution Caisse :</span>
                <span class="value-centered">{{ $caution_before }} <span class="italic">pal</span></span>
              </td>
            </tr>
          </table>
          <table class="field-table">
            <tr>
              <td>
                <span class="label">Total Nb palettes consignées</span><br>
                <span class="italic">Avant ce bon :</span> <span class="value-centered">{{ $before_palettes ?? '0' }} <span class="italic">pal</span></span><br>
                <span class="italic">Après ce bon :</span> <span class="value-centered">{{ $after_palettes ?? '0' }} <span class="italic">pal</span></span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Signatures Row -->
    <table style="width: 100%; margin-top: 12px;">
      <tr>
        <td class="signature-block">
          <table class="signature-table">
            <tr><td class="label">VISA OPERATEUR</td></tr>
          </table>
        </td>
        <td class="signature-block">
          <table class="signature-table">
            <tr><td class="label">VISA SECURITE</td></tr>
          </table>
        </td>
        <td class="signature-block">
          <table class="signature-table">
            <tr>
              <td class="label">
                VISA MENUISIER<br>
                <span class="italic small" style="font-weight: normal;">Quantité palettes conformes :</span>
              </td>
            </tr>
          </table>
        </td>
        <td class="signature-block">
          <table class="signature-table">
            <tr><td class="label">VISA Agent de parc</td></tr>
          </table>
        </td>
      </tr>
    </table>
  </div>

  <!-- SECOND COPY -->
  <div class="copy-container">
    <div class="copy-label">COPIE CLIENT</div>
    
    <!-- Header -->
    <table class="header-table">
      <tr>
        <td><img src="{{ public_path('logo.png') }}" class="logo"></td>
        <td class="align-right small">{{ now()->format('d/m/Y H:i:s') }}</td>
      </tr>
    </table>

    <!-- Title -->
    <div class="title-box">
      Demande de déconsignation palettes <br>
      <span class="value-centered">N° {{ $deconsignation->xnum_0 }}</span>
    </div>

    <!-- Main Content in Two Columns -->
    <table style="width: 100%; margin-top: 12px;">
      <tr>
        <!-- Colonne gauche -->
        <td class="column" style="padding-right: 10px;">
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
          <table class="field-table">
            <tr><td><span class="label">Matricule :</span> <span class="value-centered">{{ $deconsignation->xcamion_0 }}</span></td></tr>
          </table>
          <table class="field-table">
            <tr><td><span class="label">Client :</span> <span class="value-centered">{{ $deconsignation->xclient_0 }} - {{ $deconsignation->xraison_0 ?? 'Non défini' }}</span></td></tr>
          </table>
          <table class="field-table">
            <tr><td><span class="label">Nb palettes ramenées :</span> <span class="value-centered">{{ $deconsignation->palette_ramene }}</span></td></tr>
          </table>
          <table class="field-table">
            <tr><td><span class="label">Nb palettes à déconsigner :</span> <span class="value-centered">{{ $deconsignation->palette_a_deconsigner }}</span></td></tr>
          </table>
        </td>

        <!-- Colonne droite -->
        <td class="column" style="padding-left: 10px;">
          <table class="field-table">
            <tr>
              <td>
                <span class="label">Caution Caisse :</span>
                <span class="value-centered">{{ $caution_before }} <span class="italic">pal</span></span>
              </td>
            </tr>
          </table>
          <table class="field-table">
            <tr>
              <td>
                <span class="label">Total Nb palettes consignées</span><br>
                <span class="italic">Avant ce bon :</span> <span class="value-centered">{{ $before_palettes ?? '0' }} <span class="italic">pal</span></span><br>
                <span class="italic">Après ce bon :</span> <span class="value-centered">{{ $after_palettes ?? '0' }} <span class="italic">pal</span></span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Signatures Row -->
    <table style="width: 100%; margin-top: 12px;">
      <tr>
        <td class="signature-block">
          <table class="signature-table">
            <tr><td class="label">VISA OPERATEUR</td></tr>
          </table>
        </td>
        <td class="signature-block">
          <table class="signature-table">
            <tr><td class="label">VISA SECURITE</td></tr>
          </table>
        </td>
        <td class="signature-block">
          <table class="signature-table">
            <tr>
              <td class="label">
                VISA MENUISIER<br>
                <span class="italic small" style="font-weight: normal;">Quantité palettes conformes :</span>
              </td>
            </tr>
          </table>
        </td>
        <td class="signature-block">
          <table class="signature-table">
            <tr><td class="label">VISA Agent de parc</td></tr>
          </table>
        </td>
      </tr>
    </table>
  </div>


</body>
</html>
