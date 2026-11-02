# Jarvis Node (room lights + clapper)

Runs on a Raspberry Pi in the building. Talks to the lights on the LAN (no vendor cloud, no accounts) and connects **out** to Jarvis, so no port forwarding.

- **Lights:** Shelly relays/dimmers (any generation, local HTTP; detected automatically) and Zigbee bulbs/plugs/switches through zigbee2mqtt.
- **Clapper:** USB mic. 2 claps = toggle the clapper room, 3 claps = every light on this node off. Works with the internet down.
- **Zigbee buttons (optional):** map `single` / `double` / `hold` to `toggle:<room>`, `on:<room>[:brightness]`, `off:all`.

## Setup
1. Railway: add variable `JARVIS_NODE_TOKEN` (any long random string).
2. Pi (Raspberry Pi OS): copy this folder to the Pi, then `bash install.sh` (installs Node 22 + alsa-utils, creates `config.json`).
3. Edit `config.json`: `token` = the Railway value, each light's `host` (Shelly IP) or `device` (zigbee2mqtt name), `room`, `dim: true` for dimmers.
4. Mic: `node agent.js --mics` lists capture devices; put it in `clapper.mic` as `plughw:<card>,<device>`.
5. `node agent.js --calibrate`: clap twice / three times / talk; it shows levels and what it would do. Tune `clapper.sensitivity` (1-10).
6. `bash install.sh` again: installs and starts the service. Logs: `journalctl -u jarvis-node -f`.

Shelly: give each one a fixed IP (DHCP reservation in the router), turn its cloud off, leave its local login off (or the node cannot reach it).

## Voice (no AI call)
"lights off", "turn on the bedroom lights", "dim the bedroom to 30", "all lights off", "what lights are on", "clapper on / off", "clapper on for the office", "clapper sensitivity 7". Colors and effects still go to the LED strip.
