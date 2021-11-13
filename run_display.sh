#!/bin/bash

(cd /home/pi/pi_studio_display; forever start update_calendar.js) &
echo 'update_calendar started'
(cd /home/pi/pi_studio_display; forever start calendar_server.js) &
echo 'calendar_server started'
(cd /home/pi/pi_studio_display; http-server html_display) &
echo 'http server started'
(cd /home/pi/pi_studio_display; chromium --kiosk http://localhost:8080) &
echo 'browser started on localhost 8080'