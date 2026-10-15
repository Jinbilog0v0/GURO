<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $title }}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #F8FAFC; margin: 0; padding: 24px;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0">
        <tr>
            <td align="center">
                <table width="100%" style="max-width: 500px; background-color: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);" cellpadding="0" cellspacing="0">
                    <!-- Header with Logo beside GURO -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #11428E 0%, #1E3A8A 100%); background-color: #11428E; padding: 24px 32px; text-align: center;">
                            <table border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto;">
                                <tr>
                                    <td style="vertical-align: middle; padding-right: 14px;">
                                        <img src="{{ $logoUrl ?? 'https://neoguro.app/images/guro-mark-email.png' }}" width="44" height="44" alt="GURO Logo" style="display: block; width: 44px; height: 44px; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.2);" />
                                    </td>
                                    <td style="vertical-align: middle; text-align: left;">
                                        <h1 style="color: #FFFFFF; font-size: 24px; margin: 0; font-weight: 800; letter-spacing: 1.5px; line-height: 1.1;">GURO</h1>
                                        <p style="color: #BFDBFE; font-size: 10px; margin: 3px 0 0; text-transform: uppercase; letter-spacing: 0.8px; font-weight: 600;">Guided Unified Resource Optimization</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <!-- Main Body Content -->
                    <tr>
                        <td style="padding: 32px;">
                            <h2 style="color: #0F172A; font-size: 18px; margin: 0 0 12px; font-weight: 700;">{{ $title }}</h2>
                            <p style="color: #475569; font-size: 14px; line-height: 1.5; margin: 0 0 24px;">
                                Hello <strong>{{ $greetingName }}</strong>,<br>
                                {{ $bodyMessage }}
                            </p>
                            
                            <!-- 1-Click Copy Code Box -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F1F5F9; border: 2px dashed #11428E; border-radius: 14px; margin: 0 0 24px; cursor: pointer; user-select: all; -webkit-user-select: all; -moz-user-select: all;">
                                <tr>
                                    <td style="padding: 10px 14px 2px 14px;" align="right">
                                        <span style="display: inline-block; background-color: #11428E; color: #FFFFFF; font-size: 10px; font-weight: 700; padding: 4px 10px; border-radius: 6px; letter-spacing: 0.5px; text-transform: uppercase; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">
                                            📋 1-Click Copy
                                        </span>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 4px 14px 6px 14px; text-align: center;">
                                        <span style="display: inline-block; font-family: monospace, 'Courier New', Courier; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #11428E; user-select: all; -webkit-user-select: all; -moz-user-select: all;">
                                            {{ $code }}
                                        </span>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 0 14px 12px 14px; text-align: center;">
                                        <span style="color: #64748B; font-size: 11px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">
                                            👆 Click anywhere on the box to select & copy code
                                        </span>
                                    </td>
                                </tr>
                            </table>

                            <p style="color: #64748B; font-size: 12px; line-height: 1.5; margin: 0 0 16px;">
                                ⏱️ This code will expire in <strong>10 minutes</strong>. If you did not make this request, you can safely disregard this message.
                            </p>
                            <hr style="border: 0; border-top: 1px solid #E2E8F0; margin: 24px 0 16px;">
                            <p style="color: #94A3B8; font-size: 11px; margin: 0; text-align: center;">
                                GURO Platform · Secure Authentication · <a href="https://neoguro.app" style="color: #11428E; text-decoration: none;">neoguro.app</a>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
