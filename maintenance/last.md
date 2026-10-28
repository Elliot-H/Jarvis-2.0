STATUS: done
TIME: 2026-10-28T14:02:50Z
REQUEST: Fix the fuel-range / miles-to-destination calculation (real driving distance, range from fuel, can-I-make-it verdict).
RESULT:
Done, Owner. Jarvis now gets the real driving distance from your phone's location to the destination, turns the truck's fuel percentage into miles of range, and tells you the distance, the range, and how many miles you have to spare or are short. There is a new "can I make it" tool, and the same line is added to the vehicle scan and the departure check. Tank size and mileage can be set per vehicle by voice, otherwise 31 gallons and 15 mpg are assumed. It goes live after the Railway deploy, no APK reinstall needed. I could not test it on the truck or the live routing service from here.
