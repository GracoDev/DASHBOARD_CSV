#!/bin/sh
set -e
mkdir -p /data/pgdata
chown -R postgres:postgres /data
exec docker-entrypoint.sh "$@"
