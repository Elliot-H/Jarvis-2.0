STATUS: needs-owner
TIME: 2026-10-25T17:43:06Z
REQUEST: Wire Jarvis to the MyGuru financial forecast data directly, in a private file under ./self, no Owner action
RESULT:
Nothing was changed, Owner. I found the forecast: it is the Revenue Forecast page under MyGuru HQ, Finance, in your Notion. But a private file cannot work: Railway deploys from the public repo, so an ignored file never reaches Jarvis, and a committed one would expose the numbers. The only secure live link is Jarvis reading that Notion page directly, which needs a Notion integration token stored as a Railway variable. Only you can create that token, so I stopped rather than copy private financials into the repo. Say go once the token is set and I will build the read tool.
