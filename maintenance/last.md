STATUS: needs-owner
TIME: 2026-10-01T17:49:25Z
REQUEST: Add flash/strobe "party mode" effects with speed and brightness to the SP63XE led_color tool.
RESULT:
Owner, I changed nothing. The strip's effect and speed commands are not documented anywhere in the repo, and I cannot test against the real controller from here. Guessing the Bluetooth bytes could send wrong commands, and Jarvis would still report success. I need the effect and speed packet format, either captured from the SP63XE app with a Bluetooth log or from the protocol document. With that, it is a small server-only change, so no APK reinstall. The physical remote being removed is noted.
