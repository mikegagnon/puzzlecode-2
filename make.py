#!/usr/bin/env python
# This is free and unencumbered software released into the public domain.
#
# Usage:
#		./make.py
#		./make.py release

import os
import sys

TEST = True
if "release" in sys.argv:
	TEST = False

js_main = os.path.join("src", "main", "js")
js_test = os.path.join("src", "test", "js")
dest = os.path.join("public", "js")

puzzlecode_js = os.path.join(dest, "PuzzleCode.js")

src_files = [
	"header.js",
	"debug.js",
	"constants.js",
	"direction.js",
	"compiler.js"]
src_files = [os.path.join(js_main, "PuzzleCode", f) for f in src_files]

test_files = [
	"header.js",
	"direction_test.js",
	"compiler_test.js"]
test_files = [os.path.join(js_test, "PuzzleCode", f) for f in test_files]

def concat(files, outfile):
	with open(outfile, 'w') as outfile:
	  for filename in files:
	    with open(filename) as f:
	      outfile.write(f.read())

if TEST:
	concat(src_files + test_files, puzzlecode_js)
	print "Created test version: %s" % puzzlecode_js
else:
	concat(src_files, puzzlecode_js)
	print "Created release version: %s" % puzzlecode_js
