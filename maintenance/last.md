STATUS: needs-owner
TIME: 2026-10-13T20:54:06Z
REQUEST: OBD2 Bluetooth dongle will not connect for vehicle_scan / vehicle_status
RESULT:
Owner, I could not reach the live logs from here, so I hardened the phone's connection code blind. It now tries more connection methods, three rounds, and reports exactly which one failed.
If the saved dongle name does not match, it picks the one paired device that looks like an OBD dongle, or lists all paired devices in the error.
This is in the Android app, so you need to reinstall the APK; it is not live until then, and I could not compile it here. If it still fails, the error text will say whether the dongle is Bluetooth LE only, which this app cannot use.
