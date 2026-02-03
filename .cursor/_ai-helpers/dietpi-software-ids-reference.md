# DietPi Software IDs Reference

This document lists the DietPi software IDs for common software packages.

## Finding Software IDs

The official DietPi software list is available at:
- GitHub: https://github.com/MichaIng/DietPi/wiki/DietPi-Software-list
- Or run on DietPi: `dietpi-software` and note the ID numbers

## Common Software IDs

Based on typical DietPi installations, here are the likely IDs (verify with official list):

### Development Tools
- **Node.js**: ID varies by version (typically 9, 10, or 11)
- **Git**: ID varies (typically 17 or 18)
- **Python 3 RPi.GPIO**: ID varies (typically 20-25 range)
- **WiringPi**: ID varies (typically 26-30 range)

### System Services
- **I2C**: ID varies (typically 15-20 range)
- **OpenSSH Server**: Already configured via `AUTO_SETUP_SSH_SERVER_INDEX=-2`
- **Docker**: ID varies (typically 100-150 range)

### Home Automation
- **Node-RED**: ID varies (typically 80-90 range)
- **Mosquitto (MQTT)**: ID varies (typically 70-80 range)
- **Home Assistant**: ID varies (typically 150-200 range)

## Usage in dietpi.txt

Add software IDs to `AUTO_SETUP_INSTALL_SOFTWARE_ID` separated by spaces:

```bash
AUTO_SETUP_INSTALL_SOFTWARE_ID=9 17 20 26 15 80 70 150
```

## How to Find Exact IDs

1. **On DietPi system**: Run `dietpi-software` and note the ID numbers
2. **Online**: Check https://github.com/MichaIng/DietPi/wiki/DietPi-Software-list
3. **From dietpi.txt**: Some IDs may be listed in comments

## Important Notes

- Software IDs can change between DietPi versions
- Always verify IDs against the official list for your DietPi version
- Some software may require dependencies that are auto-installed
- The order in `AUTO_SETUP_INSTALL_SOFTWARE_ID` doesn't matter - DietPi handles dependencies

