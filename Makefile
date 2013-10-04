
output=public/js/PuzzleCode.js
gcc_flags=-x c -C -P -E -I src
debug_flag=-D__DEBUG__

test:
	gcc $(debug_flag) $(gcc_flags) src/test/js/PuzzleCode/build.js -o $(output)

release:
	gcc $(gcc_flags) src/main/js/PuzzleCode/build.js -o $(output)
