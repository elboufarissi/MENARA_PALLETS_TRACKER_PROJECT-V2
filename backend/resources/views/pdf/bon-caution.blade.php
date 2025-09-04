<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Bon de Caution</title>
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
    Bon de caution <br>
    N° <span class="value-centered">{{ $caution->xnum_0 }}</span>
  </div>

  <!-- Main Info Table -->
  <table class="main-table">
    <tr>
      <!-- Colonne gauche -->
      <td style="width: 50%; padding-right: 10px;">
        <table class="field-table">
          <tr>
            <td>
              <span class="label">Date :</span>
              <span class="italic">{{ \Carbon\Carbon::parse($caution->xdate_0)->format('d/m/Y') }}</span>
              &nbsp;&nbsp;&nbsp;
              <span class="label">Heure :</span>
              <span class="italic">{{ $caution->xheure_0 ?? now()->format('H:i:s') }}</span>
            </td>
          </tr>
        </table>

        <table class="field-table"><tr><td><span class="label">Client :</span> <span class="value-centered">{{ $caution->xclient_0 }} - {{ $caution->xraison_0 }}</span></td></tr></table>
        <table class="field-table"><tr><td><span class="label">CIN :</span> <span class="value-centered">{{ $caution->xcin_0 }}</span></td></tr></table>
        <table class="field-table"><tr><td><span class="label">Caution :</span> <span class="value-centered">{{ number_format($caution->montant, 0, ',', ' ') }} DH</span></td></tr></table>

        <table class="signature-table">
          <tr>
            <td class="label">SIGN + CACHET CLIENT</td>

          </tr>
        </table>
      </td>

      <!-- Colonne droite -->
      <td style="width: 50%; padding-left: 10px;">
        <table class="field-table">
          <tr>
            <td>
              <span class="label">Solde client :</span><br>
              <span class="italic">Avant ce bon :</span> {{ number_format($caution_before * 100, 0, ',', ' ') }} DH<br>
              <span class="italic">Après ce bon :</span> {{ number_format($caution_after * 100, 0, ',', ' ') }} DH
            </td>
          </tr>
        </table>

        <table class="field-table">
          <tr>
            <td>
              <span class="label">Solde palettes :</span><br>
              <span class="italic">Avant ce bon :</span> {{ $caution_before }} pal<br>
              <span class="italic">Après ce bon :</span> {{ $caution_after }} pal
            </td>
          </tr>
        </table>

        <table class="signature-table" style="margin-top: 10px;">
          <tr>
            <td class="label">SIGN + CACHET CAISSIER</td>

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
