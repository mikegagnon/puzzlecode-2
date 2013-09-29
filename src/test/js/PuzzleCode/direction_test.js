/**
 * Copyright 2013 Michael N. Gagnon
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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
