<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>Bon de consignation palettes</title>
  <style>
    /* 1 px = 0.2645833 mm */
    @page { margin: 0; }
    html, body { margin: 0; padding: 0; }
    body{
      width: 145.620mm;              /* 550.3732 px */
      margin: 3.440mm auto;          /* 13 px */
      font-family: Arial, "DejaVu Sans", sans-serif;
      font-size: 10px;
      color: #000;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .bold{font-weight:bold}
    .italic{font-style:italic}
    .center{text-align:center}
    .right{text-align:right}
    .nowrap{white-space:nowrap}

    .h35{height: 9.494mm; line-height: 9.494mm;}   /* 35.8828 px */
    .h28{height: 7.354mm; line-height: 7.354mm;}   /* 27.7928 px */

    .blue{background:#1a2c50; color:#fff}

    table{width:100%; table-layout:fixed; border-collapse:separate; border-spacing:0}
    td{vertical-align:middle; padding:0}

    /* vertical gap row (3px) */
    .gaprow td{border:none; height:0.794mm; padding:0}

    /* horizontal gap cells (strict) */
    .gap3{border:none !important; width:0.794mm; padding:0 !important; background:transparent !important}  /* 3px */
    .gap4{border:none !important; width:1.058mm; padding:0 !important; background:transparent !important}  /* 4px */
    .fill0143{border:none !important; width:0.143mm; padding:0 !important; background:transparent !important} /* tiny filler */

    /* Inner block with border included in size */
    .bx{
      box-sizing:border-box;
      height:7.354mm; line-height:7.354mm;        /* 27.7928 px */
      border:0.264mm solid #1a2c50;               /* ~1px border */
      padding:0 0.40mm;
      white-space:nowrap; overflow:hidden;
      display:block; background:#fff; color:#000; text-align:center;
    }
    .bx.lbl{ background:#1a2c50; color:#fff; position:relative; }
    .bx.lbl.c::after{
      content:":"; position:absolute; right:0.50mm; top:0; height:100%; line-height:7.354mm;
    }
    /* ultra-tight padding for narrow value boxes so text fits without changing outer size */
    .bx.val-sm{ padding:0 0.10mm; }

    /* Right column stacked blocks */
    .right-block{ width:72.231mm; }      /* 272.9978 px */
    .right-head{ padding:0 1.500mm; }
    .right-body{ border:0.264mm solid #1a2c50; padding:0 2mm; white-space:nowrap; }

    /* Visa section */
    table.visa { table-layout:fixed; border-collapse:separate; border-spacing:0 }
    .visa .cell { border:0.264mm solid #1a2c50; text-align:center; font-size:14px; }
    .visa .head .cell { background:#1a2c50; color:#fff; font-weight:bold; height:7.354mm; line-height:7.354mm }
    .visa .box  .cell { height:13.301mm }  /* 50.2703 px */
  </style>
</head>
<body>

@for ($copy = 0; $copy < 2; $copy++)

  <!-- Header -->
  <table style="margin-bottom:3.440mm">
    <tr>
      <td style="width:34.395mm"><img src="{{ public_path('logo.png') }}" alt="logo" style="width:34.395mm"></td>
      <td class="right" style="font-size:12px">{{ now()->format('d/m/Y H:i:s') }}</td>
    </tr>
  </table>

  <!-- Title -->
  <table>
    <tr class="blue h35 center bold"><td>Bon de consignation palettes</td></tr>
  </table>

  <table class="gaprow"><tr><td></td></tr></table>

  <!-- Sub-number -->
  <table>
    <tr>
      <td>
        <div class="bx" style="width:145.620mm; height:9.494mm; line-height:9.494mm; border-color:#000;">
          <span class="bold">N° {{ $consignation->xnum_0 }}</span>
        </div>
      </td>
    </tr>
  </table>

  <!-- ==================== TWO COLUMNS ==================== -->
  <table style="margin-top:3.440mm">
    <colgroup>
      <col style="width:73.341mm">
      <col style="width:72.231mm">
    </colgroup>
    <tr>
      <!-- ---------- LEFT ---------- -->
      <td style="padding-right:2.646mm; vertical-align:top;">

        <!-- Date + Heure (all gaps = 3px / 0.794mm) -->
        <table style="width:73.341mm">
          <colgroup>
            <col style="width:15.261mm"><col class="gap3">
            <col style="width:21.394mm"><col class="gap3">
            <col style="width:13.671mm"><col class="gap3">
            <col style="width:19.165mm"><col style="width:1.517mm">
          </colgroup>
          <tr>
            <td><div class="bx lbl c"  style="width:15.261mm">Date</div></td><td class="gap3"></td>
            <td><div class="bx val-sm" style="width:21.394mm">{{ \Carbon\Carbon::parse($consignation->xdate_0)->format('d/m/Y') }}</div></td><td class="gap3"></td>
            <td><div class="bx lbl c"  style="width:13.671mm">Heure</div></td><td class="gap3"></td>
            <td><div class="bx val-sm" style="width:19.165mm">{{ \Carbon\Carbon::parse($consignation->created_at)->format('H:i:s') }}</div></td><td></td>
          </tr>
        </table>

        <table class="gaprow"><tr><td></td></tr></table>

        <!-- Client (gap between label and value = 3px) -->
        <table style="width:73.341mm">
          <colgroup>
            <col style="width:15.261mm"><col class="gap3">
            <col style="width:55.988mm"><col style="width:1.298mm">
          </colgroup>
          <tr>
            <td><div class="bx lbl c" style="width:15.261mm">Client</div></td><td class="gap3"></td>
            <td><div class="bx"       style="width:55.988mm; text-align:center">
              {{ $consignation->xclient_0 }} - {{ $consignation->xraison_0 }}
            </div></td><td></td>
          </tr>
        </table>

        <table class="gaprow"><tr><td></td></tr></table>

        <!-- Nb palettes ramenées -->
        <table style="width:73.341mm">
          <colgroup>
            <col style="width:55.614mm"><col class="gap3">
            <col style="width:15.635mm"><col style="width:1.298mm">
          </colgroup>
          <tr>
            <td><div class="bx lbl c" style="width:55.614mm">Nb palettes ramenées</div></td><td class="gap3"></td>
            <td><div class="bx"       style="width:15.635mm">{{ $consignation->palette_ramene }} <span class="italic">pal</span></div></td><td></td>
          </tr>
        </table>

        <table class="gaprow"><tr><td></td></tr></table>

        <!-- Nb palettes à consigner (3px gap) -->
        <table style="width:73.341mm">
          <colgroup>
            <col style="width:55.614mm"><col class="gap3">
            <col style="width:15.635mm"><col style="width:1.298mm">
          </colgroup>
          <tr>
            <td><div class="bx lbl c" style="width:55.614mm">Nb palettes à consigner</div></td><td class="gap3"></td>
            <td><div class="bx"       style="width:15.635mm">{{ $consignation->palette_consigner }} <span class="italic">pal</span></div></td><td></td>
          </tr>
        </table>

        <!-- Bon de prélèvement (LEFT, full column width) -->
        <table class="gaprow"><tr><td></td></tr></table>
        <table style="width:73.341mm">
          <tr>
            <td>
              <div class="bx" style="width:73.341mm; text-align:left; padding-left:6px">
                <span class="bold">Bon de prélèvement :</span>
                &nbsp;<span class="nowrap">{{ $consignation->xbp_0 ?? 'N/A' }}</span>
              </div>
            </td>
          </tr>
        </table>

      </td>

      <!-- ---------- RIGHT ---------- -->
      <td style="padding-left:2.646mm; vertical-align:top;">

        <!-- Matricule (row width locked to 72.231mm; last col is a tiny filler) -->
        <table style="width:72.231mm">
          <colgroup>
            <col style="width:18.003mm"><col class="gap3">
            <col style="width:53.291mm"><col class="fill0143">
          </colgroup>
          <tr>
            <td><div class="bx lbl c" style="width:18.003mm">Matricule</div></td><td class="gap3"></td>
            <td><div class="bx"       style="width:53.291mm">{{ $consignation->xcamion_0 }}</div></td><td class="fill0143"></td>
          </tr>
        </table>

        <table class="gaprow"><tr><td></td></tr></table>

        <!-- Total palettes consignées -->
        <table class="right-block">
          <tr><td><div class="bx" style="width:72.231mm; background:#1a2c50; color:#fff; border-color:#1a2c50">Total palettes consignées :</div></td></tr>
          <tr class="gaprow"><td></td></tr>
          <tr><td>
            <div class="right-body h28" style="width:72.231mm">
              <span class="italic">Avant ce bon :</span> <span class="nowrap">{{ $before_palettes ?? '0' }} pal</span>
              &nbsp;&nbsp;&nbsp;&nbsp;
              <span class="italic">Après ce bon :</span> <span class="nowrap">{{ $after_palettes ?? '0' }} pal</span>
            </div>
          </td></tr>
        </table>

        <!-- Caution Caisse -->
        <table class="right-block" style="margin-top:0.794mm">
          <tr><td><div class="bx" style="width:72.231mm; background:#1a2c50; color:#fff; border-color:#1a2c50">Caution Caisse</div></td></tr>
          <tr class="gaprow"><td></td></tr>
          <tr><td>
            <div class="right-body h28" style="width:72.231mm">
              <span class="italic">Avant ce bon :</span> <span class="nowrap">{{ $caution_before ?? '0.00' }} pal</span>
              &nbsp;&nbsp;&nbsp;&nbsp;
              <span class="italic">Après ce bon :</span> <span class="nowrap">{{ $caution_after ?? '0.00' }} pal</span>
            </div>
          </td></tr>
        </table>

      </td>
    </tr>
  </table>

  <!-- ==================== VISA SECTION ==================== -->
  <table class="visa" style="margin-top:3.440mm">
    <colgroup>
      <col style="width:35.530mm"><col style="width:0.794mm">  <!-- 3px -->
      <col style="width:35.530mm"><col style="width:1.058mm">  <!-- 4px -->
      <col style="width:35.530mm"><col style="width:0.794mm">  <!-- 3px -->
      <col style="width:35.530mm">
    </colgroup>
    <tr class="head">
      <td class="cell">Visa Opérateur</td><td></td>
      <td class="cell">Visa Sécurité</td><td></td>
      <td class="cell">Visa Menuisier</td><td></td>
      <td class="cell">Visa Parc</td>
    </tr>
    <tr class="box">
      <td class="cell"></td><td></td>
      <td class="cell"></td><td></td>
      <td class="cell"></td><td></td>
      <td class="cell"></td>
    </tr>
  </table>

  @if ($copy === 0)
    <table style="margin:13.229mm 0"><tr><td style="border-top:0.264mm dashed #999; height:0; padding:0"></td></tr></table>
  @endif

@endfor

</body>
</html>
