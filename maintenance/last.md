STATUS: done
TIME: 2026-10-02T16:29:29Z
REQUEST: Add a tappable chart link for the alert's symbol to every investment/signal/position alert; keep the verdict line; no "does not place stops" line.
RESULT:
Owner, every investment alert push now ends with a tappable link that opens a chart page for that ticker. The page shows candlesticks with your stop, target and entry as dashed lines, plus support and resistance, and has 5 minute to weekly buttons. It covers stop hit, drops, targets, buy-watch signals, news alerts, sell warnings and the crypto briefs. The buy, watch or avoid lines with stop and target are unchanged, and the disclaimer stays out. It goes live when the server restarts on the new commit; the link needs the public web address, which Railway sets itself. No APK reinstall is needed. I could not test live chart data from here, since Yahoo blocks my sandbox.
