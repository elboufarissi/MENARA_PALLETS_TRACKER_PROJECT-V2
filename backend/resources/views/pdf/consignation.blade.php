<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Bon de consignation palettes</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      font-size: 10px;
      margin: 30px;
      color: #000;
    }

    .header-table {
      width: 100%;
      margin-bottom: 10px;
    }

    .logo {
      width: 130px;
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
      margin-top: 10px;
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
      font-size: 15px;
    }

    .align-right {
      text-align: right;
    }

    .center {
      text-align: center;
    }

    .signature-cell {
      height: 65px;
      border: 1px solid #ccc;
    }

    .field-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 5px;
      font-size: 13px;
    }

    .field-table td {
      border: 1px solid #ccc;
      padding: 6px;
    }

    .signature-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 5px;
    }

    .signature-table td {
      border: 1px solid #ccc;
      text-align: center;
      height: 65px;
       font-size: 14px;
    }

    .value-centered {

      text-align: center;
       margin-left: 30px ;

    }

    hr.separator {
      margin: 50px 0;
      border: 1px dashed #999;
    }
  </style>
</head>
<body>

@for ($i = 0; $i < 2; $i++)
  <!-- Header -->
  <table class="header-table">
    <tr>
      <td><img src="{{ public_path('logo.png') }}" class="logo"></td>
      <td class="align-right small">{{ now()->format('d/m/Y H:i:s') }}</td>
    </tr>
  </table>

  <!-- Title -->
  <div class="title-box">
    Bon de consignation palettes <br>
    N° <span class="value-centered">{{ $consignation->xnum_0 }}</span>
  </div>

  <!-- Main Info Table -->
  <table class="main-table">
    <tr>
      <!-- Colonne gauche : Infos + Signature opérateur -->
      <td style="width: 50%; padding-right: 10px;">
        <table class="field-table">
  <tr>
    <td>
      <span class="label">Date :</span> <span class="value-centered italic">{{ \Carbon\Carbon::parse($consignation->xdate_0)->format('d/m/Y') }}</span>
      &nbsp;&nbsp;&nbsp;&nbsp;
      <span class="label">Heure :</span> <span class="value-centered italic">{{ \Carbon\Carbon::parse($consignation->created_at)->format('H:i:s') }}</span>
    </td>
  </tr>
</table>

        <table class="field-table"><tr><td><span class="label">Matricule :</span> <span class="value-centered">{{ $consignation->xcamion_0 }}</span></td></tr></table>
        <table class="field-table"><tr><td><span class="label">Client :</span> <span class="value-centered">{{ $consignation->xclient_0 }} - {{ $consignation->xraison_0 }}</span></td></tr></table>
        <table class="field-table"><tr><td><span class="label">Nb palettes ramenées :</span> <span class="value-centered">{{ $consignation->palette_ramene }}</span></td></tr></table>
        <table class="field-table"><tr><td><span class="label">Nb palettes à consigner :</span> <span class="value-centered">{{ $consignation->palette_consigner }}</span></td></tr></table>
        <table class="signature-table">
  <tr>
    <td class="label">SIGN + CACHET OPERATEUR</td>
    <td class="label">SIGN + CACHET SECURITE</td>
  </tr>
</table>

      </td>

      <!-- Colonne droite : Infos + Signature client -->
      <td style="width: 50%; padding-left: 10px;">
        <table class="field-table"><tr><td><span class="label">Bon de prélèvement :</span> <span class="value-centered">{{ $consignation->xbp_0 ?? 'N/A' }}</span></td></tr></table>
        <table class="field-table">
          <tr>
            <td>
              <span class="label">Caution Caisse :</span><br>
              <span class="italic">Avant ce bon :</span> <span class="value-centered">{{ $caution_before ?? '0.00'}} <span class="italic">pal</span></span><br>
              <span class="italic">Après ce bon :</span> <span class="value-centered">{{ $caution_after ?? '0.00' }} <span class="italic">pal</span></span>
            </td>
          </tr>
        </table>
        <table class="field-table">
          <tr>
            <td>
              <span class="label">Total Nb palettes consignées :</span><br>
              <span class="italic">Avant ce bon :</span> <span class="value-centered">{{ $before_palettes ?? '0' }} <span class="italic">pal</span></span><br>
              <span class="italic">Après ce bon :</span> <span class="value-centered">{{ $after_palettes ?? '0' }} <span class="italic">pal</span></span>
            </td>
          </tr>
        </table>
        <table class="signature-table" style="margin-top: 10px;">
  <tr>
    <td class="label">SIGN + CACHET CLIENT</td>
    <td class="label">SIGN + CACHET PARC</td>
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
