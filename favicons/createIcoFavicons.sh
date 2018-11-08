#!/usr/bin/env bash

# Before using this script you need to execute `createPngFavicons.sh`!
magick convert favicon_512.png -define icon:auto-resize=128,96,64,48,32,16 favicon.ico
