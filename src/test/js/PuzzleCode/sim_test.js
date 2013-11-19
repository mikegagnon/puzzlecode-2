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

/******************************************************************************/
TEST = "PuzzleCode.sim.executeMove"

var config = {
	width: 5,
	height: 3,
	bots: [
    {
      color: PuzzleCode.bot.Color.BLUE,
      x: 0,
      y: 0,
      facing: PuzzleCode.direction.RIGHT,
      programText: "move",
      constraints: {}
    },
    {
      color: PuzzleCode.bot.Color.BLUE,
      x: 2,
      y: 0,
      facing: PuzzleCode.direction.UP,
      programText: "move",
      constraints: {}
    },
    {
      color: PuzzleCode.bot.Color.BLUE,
      x: 4,
      y: 0,
      facing: PuzzleCode.direction.RIGHT,
      programText: "move",
      constraints: {}
    },
  ],
}

var board = PuzzleCode.init(config, "")

var cases = [
	{
		board: _.cloneDeep(board),
		bot: _.cloneDeep(board.state.matrix[0][0].bot),
		prevX: 0,
		prevY: 0,
		destX: 1,
		destY: 0,
		expectedOutput: {
			viz: {
				nonTorusMove: true,
			},
		}
	},
	{
		board: _.cloneDeep(board),
		bot: _.cloneDeep(board.state.matrix[2][0].bot),
		prevX: 2,
		prevY: 0,
		destX: 2,
		destY: 2,
		expectedOutput: {
			viz: {
				torusMove: {
	        prevX: 2,
	        prevY: 0,
	        oobPrevX: 2,
	        oobPrevY: 3,
	        oobNextX: 2, 
	        oobNextY: -1
	      }
	    }
		}
	},
	{
		board: _.cloneDeep(board),
		bot: _.cloneDeep(board.state.matrix[4][0].bot),
		prevX: 4,
		prevY: 0,
		destX: 4,
		destY: 0,
		expectedOutput: {
			viz: {
				failMove: {
		      destX: 5,
		      destY: 0
		    }
	    }
		}
	},
]

_(cases).forEach(function(tc){
  var result = {viz:{}}
	tc.output = sim.executeMove(result, tc.board, tc.bot)
	test(tc, _.isEqual(tc.bot.x, tc.destX))
	test(tc, _.isEqual(tc.bot.y, tc.destY))
	test(tc, _.isEqual(tc.board.state.matrix[tc.bot.x][tc.bot.y].bot, tc.bot))
	if (!(tc.prevX == tc.destX && tc.prevY == tc.destY)) {
		test(tc, _.isEqual(tc.board.state.matrix[tc.prevX][tc.prevY], {}))
	}
	test(tc, _.isEqual(tc.output, tc.expectedOutput))
})

#endif