STATUS: done
TIME: 2026-10-15T13:50:20Z
REQUEST: Read the truck OBD dongle immediately at engine start, not 8+ minutes into the drive
RESULT:
Owner, the cause was that every background check was a full, slow diagnostic read, and a failed connection kept the scanner busy for minutes. I added a quick engine check that connects once and reads only rpm, speed and battery, so engine start is caught within about a minute.
The departure questions, bring list and vehicle check now fire off that quick read, and the full scan runs right after. The server side goes live on the Railway deploy.
You need to reinstall the new APK for the quick check to work. Until then the old slow scan keeps running. I could not test it on the truck from here.
