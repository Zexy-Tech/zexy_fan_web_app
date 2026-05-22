#!/bin/bash
# Detects the local machine IP for real device testing.
# Both phone and laptop must be on the same WiFi network.
# Backend must run with: uvicorn app.main:app --host 0.0.0.0 --port 8000
ip=$(ip route get 1.1.1.1 | awk '{print $7}')
echo "http://$ip:8000"
