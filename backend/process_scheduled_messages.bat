@echo off
cd /d %~dp0
python process_scheduled_messages.py >> scheduled_messages.log 2>&1
