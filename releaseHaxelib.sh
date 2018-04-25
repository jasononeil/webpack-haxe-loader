#!/bin/sh

rm -f haxe-loader.zip
zip -r haxe-loader.zip haxelib haxelib.json README.md
haxelib submit haxe-loader.zip $1 $2 --always
