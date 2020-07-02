#!/bin/sh
nginx -g 'daemon on;'
mongod --config /etc/mongod.conf
cd /srvapi
node lifegamesrv.js
