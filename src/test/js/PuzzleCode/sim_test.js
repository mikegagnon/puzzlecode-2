#ifndef __SIM_TEST_JS__
#define __SIM_TEST_JS__

#include "test/js/PuzzleCode/header.js"
#include "main/js/PuzzleCode/sim.js"

var sim = PuzzleCode.sim

/******************************************************************************/
TEST = "PuzzleCode.sim.wrapAdd"
var cases = [
	{
		value: 1,
		increment: 1,
		outOfBounds: 3,
		expectedOutput: {
			value: 2,
			torus: false
		}
	},
	{
		value: 2,
		increment: 1,
		outOfBounds: 3,
		expectedOutput: {
			value: 0,
			torus: true
		}
	},
	{
		value: 0,
		increment: -1,
		outOfBounds: 3,
		expectedOutput: {
			value: 2,
			torus: true
		}
	},
]

_(cases).forEach(function(tc){
	tc.output = sim.wrapAdd(tc.value, tc.increment, tc.outOfBounds)
	test(tc, _.isEqual(tc.output, tc.expectedOutput))
})

#endif