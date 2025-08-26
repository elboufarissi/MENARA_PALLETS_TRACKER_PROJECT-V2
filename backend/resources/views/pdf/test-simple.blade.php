<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Test PDF</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            font-size: 14px;
            line-height: 1.4;
        }
        .header {
            text-align: center;
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 20px;
        }
        .info {
            margin-bottom: 10px;
        }
        .label {
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="header">Test PDF Generation</div>
    
    <div class="info">
        <span class="label">Caution ID:</span> {{ $caution->xnum_0 ?? 'N/A' }}
    </div>
    
    <div class="info">
        <span class="label">Client:</span> {{ $caution->xclient_0 ?? 'N/A' }}
    </div>
    
    <div class="info">
        <span class="label">Amount:</span> {{ $caution->montant ?? 'N/A' }} DH
    </div>
    
    <div class="info">
        <span class="label">Date:</span> {{ now()->format('d/m/Y H:i:s') }}
    </div>
    
    <div style="margin-top: 30px; text-align: center;">
        <p>This is a simple test PDF to verify basic functionality.</p>
    </div>
</body>
</html>
