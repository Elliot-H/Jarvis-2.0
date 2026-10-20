STATUS: done
TIME: 2026-10-20T13:57:14Z
REQUEST: Fix prompt order and breakfast food rules on the home-to-shop drive
RESULT:
Owner, the coffee and breakfast question now waits until you have arrived at the shop and are no longer driving. Before, it fired on the road because heading to the shop turned work mode on. Breakfast suggestions now follow the route: home to shop offers bacon, egg and cheese at McDonald's or Hardee's, and Wawa burritos appear only on the Camden house route. Chick-fil-A is never suggested for breakfast. The destination question was already guarded once you answer it. This is server only and goes live on the Railway deploy, no APK needed. I could not run a live drive test from here, only a syntax check.
