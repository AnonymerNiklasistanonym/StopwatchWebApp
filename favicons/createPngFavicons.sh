#!/usr/bin/env bash

# declare an array called array and define 3 vales
array=( 64 128 256 512 )
for i in "${array[@]}"
do
	echo "favicon_"$i".png"
	inkscape ".\favicon.svg" --export-png="favicon_"$i".png" --export-width=$i --export-height=$i --without-gui
done
