#ifndef __UTIL_TEST_JS__
#define __UTIL_TEST_JS__

#include "main/js/PuzzleCode/util.js"

/******************************************************************************/
TEST = "PuzzleCode.newMatrix"
var cases = [
	{
		width: 3,
		height: 2,
		defaultValue: "a",
		expectedOutput: [["a", "a"], ["a", "a"], ["a", "a"]]
	},
]

_(cases).forEach(function(tc){
	tc.output = PuzzleCode.newMatrix(tc.width, tc.height, tc.defaultValue)
	test(tc, _.isEqual(tc.output, tc.expectedOutput))
})

#endif