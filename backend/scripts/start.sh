#!/bin/bash

# Configuration
APP_NAME="auradraw-backend"
BIN_PATH="./$APP_NAME"
PID_FILE="./$APP_NAME.pid"
LOG_FILE="./$APP_NAME.log"

# Check if binary exists
if [ ! -f "$BIN_PATH" ]; then
    echo "Error: Binary not found at $BIN_PATH"
    echo "Please run 'make build' first."
    exit 1
fi

get_pid() {
    if [ -f "$PID_FILE" ]; then
        cat "$PID_FILE"
    else
        echo ""
    fi
}

is_running() {
    pid=$(get_pid)
    if [ -n "$pid" ] && ps -p "$pid" > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

start() {
    if is_running; then
        echo "$APP_NAME is already running (PID: $(get_pid))"
    else
        echo "Starting $APP_NAME..."
        nohup "$BIN_PATH" > "$LOG_FILE" 2>&1 &
        pid=$!
        echo "$pid" > "$PID_FILE"
        sleep 1
        if is_running; then
            echo "$APP_NAME started successfully (PID: $pid)"
        else
            echo "Failed to start $APP_NAME. Check $LOG_FILE for details."
        fi
    fi
}

stop() {
    if is_running; then
        pid=$(get_pid)
        echo "Stopping $APP_NAME (PID: $pid)..."
        kill "$pid"
        sleep 1
        if is_running; then
            echo "Force killing..."
            kill -9 "$pid"
        fi
        rm -f "$PID_FILE"
        echo "$APP_NAME stopped."
    else
        echo "$APP_NAME is not running."
        rm -f "$PID_FILE"
    fi
}

status() {
    if is_running; then
        echo "$APP_NAME is running (PID: $(get_pid))"
    else
        echo "$APP_NAME is not running"
    fi
}

restart() {
    stop
    start
}

case "$1" in
    start)
        start
        ;;
    stop)
        stop
        ;;
    restart)
        restart
        ;;
    status)
        status
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status}"
        exit 1
        ;;
esac
