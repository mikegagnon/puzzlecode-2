#ifndef __DIRECTION_TEST_JS__
#define __DIRECTION_TEST_JS__

#include "main/js/PuzzleCode/direction.js"
#include "test/js/PuzzleCode/header.js"

FILENAME = "direction_test.js"

var direction = PuzzleCode.direction

/******************************************************************************/
TEST = "PuzzleCode.direction.rotateLeft"
var cases = [
	{
		direction: 			direction.UP,
		expectedOutput: direction.LEFT
	},
	{
		direction: 			direction.LEFT,
		expectedOutput: direction.DOWN
	},
	{
		direction: 			direction.DOWN,
		expectedOutput: direction.RIGHT
	},
	{
		direction: 			direction.RIGHT,
		expectedOutput: direction.UP
	},
]

_(cases).forEach(function(tc){
	tc.output = direction.rotateLeft(tc.direction)
	test(tc, _.isEqual(tc.output, tc.expectedOutput))
})

/******************************************************************************/
TEST = "PuzzleCode.direction.rotateRight"
var cases = [
	{
		direction: 			direction.UP,
		expectedOutput: direction.RIGHT
	},
	{
		direction: 			direction.RIGHT,
		expectedOutput: direction.DOWN
	},
	{
		direction: 			direction.DOWN,
		expectedOutput: direction.LEFT
	},
	{
		direction: 			direction.LEFT,
		expectedOutput: direction.UP
	},
]

_(cases).forEach(function(tc){
	tc.output = direction.rotateRight(tc.direction)
	test(tc, _.isEqual(tc.output, tc.expectedOutput))
})

/******************************************************************************/
TEST = "PuzzleCode.direction.rotateDirection"
var cases = [
	{
		oldFacing:        direction.UP,
		rotateDirection: 	direction.RIGHT,
		expectedOutput: 	direction.RIGHT
	},
	{
		oldFacing:        direction.LEFT,
		rotateDirection: 	direction.LEFT,
		expectedOutput: 	direction.DOWN
	},
]

_(cases).forEach(function(tc){
	tc.output = direction.rotateDirection(tc.oldFacing, tc.rotateDirection)
	test(tc, _.isEqual(tc.output, tc.expectedOutput))
})

/******************************************************************************/
TEST = "PuzzleCode.direction.oppositeDirection"
var cases = [
	{
		direction: 			direction.UP,
		expectedOutput: direction.DOWN
	},
	{
		direction: 			direction.DOWN,
		expectedOutput: direction.UP
	},
	{
		direction: 			direction.LEFT,
		expectedOutput: direction.RIGHT
	},
	{
		direction: 			direction.RIGHT,
		expectedOutput: direction.LEFT
	}
]

_(cases).forEach(function(tc){
	tc.output = direction.oppositeDirection(tc.direction)
	test(tc, _.isEqual(tc.output, tc.expectedOutput))
})

#endif
