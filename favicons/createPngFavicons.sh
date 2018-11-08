#!/usr/bin/env bash

# Declare an array with the image sizes to export
array=( 64 128 192 256 512 )
for i in "${array[@]}"
do
	# Export each size as a `png` favicon from `favicon.svg`
	inkscape ".\favicon.svg" --export-png="favicon_"$i".png" --export-width=$i --export-height=$i --without-gui
done
