STATUS: done
TIME: 2026-10-05T15:56:44Z
REQUEST: Add whole-share (quantity) buy/sell route to trade_propose
RESULT:
Owner, trade propose now takes a share count, or a whole-shares mode that rounds down to whole shares within your per-order and daily limits.
Use it for symbols like SCKT, SAIQ and AIFA where dollar orders get rejected.
It is the same flow: Jarvis reads back symbol, side, shares and price, and only places after you say confirm in your next message.
It goes live when Railway finishes redeploying. No APK reinstall needed. Not tested against the live broker.
