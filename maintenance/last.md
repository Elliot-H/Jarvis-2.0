STATUS: done
TIME: 2026-10-26T13:43:54Z
REQUEST: Wake-up briefing departure/bring question must keep the mic open for the answer
RESULT:
Fixed, Owner. After any spoken question, including the one at the end of the wake-up briefing, Jarvis now keeps checking for 25 seconds and reopens the mic if it closed. Question detection also catches wordings like "do you need" and "anything to bring". It goes live on the next Railway deploy, and no APK reinstall is needed. I could not test on the phone, so tell me if it still cuts off.
