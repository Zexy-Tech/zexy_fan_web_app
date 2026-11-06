#!/bin/bash
# Prints this machine's LAN API URL for real-device testing (phone and laptop on the same Wi-Fi).
# Backend must run with: uvicorn app.main:app --host 0.0.0.0 --port 8000
ip=$(ip route get 1.1.1.1 2>/dev/null | awk '{for (i = 1; i < NF; i++) if ($i == "src") { print $(i + 1); exit }}')
[ -z "$ip" ] && ip=$(hostname -I 2>/dev/null | awk '{print $1}')
echo "http://${ip:-127.0.0.1}:8000"
