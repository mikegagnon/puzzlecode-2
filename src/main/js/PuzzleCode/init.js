#ifndef __INIT_JS__
#define __INIT_JS__

#include "main/js/PuzzleCode/header.js"
#include "main/js/PuzzleCode/bot.js"
#include "main/js/PuzzleCode/direction.js"
#include "main/js/PuzzleCode/viz.js"

/**
 * Creates and returns new Board object.
 *
 * @param boardConfig should be a BoardConfig object
 * @param divId should be the HTML id for an empty div. The visualization for
 * the board will be inserted into this div object 
 */
PuzzleCode.init = function(boardConfig, divId) {
  "use strict"

	var defaultConfig = _.cloneDeep(PuzzleCode.board.DEFAULT_CONFIG)
	var config = _.merge(defaultConfig, boardConfig)

	var error = false

	_(config.bots).forEach(function(bot, id){
		bot.id = id
		var program = PuzzleCode.compiler.compile(bot.programText, bot.constraints)
		bot.program = program
		error = error || program.error
	})

	var board = {
		config: config,
		divId: divId,

		// All elements in board are immutable, except for the state element
		state: {
			error: error,
			bots: _.cloneDeep(config.bots)
		}
	}

  PuzzleCode.viz.init(board)

  return board
}

var config = {
	bots: [
    {
      botColor: PuzzleCode.bot.Color.BLUE,
      x: 2,
      y: 3,
      facing: PuzzleCode.direction.UP,
      programText: "move\nmove",
      constraints: {}
    },
    {
      botColor: PuzzleCode.bot.Color.BLUE,
      x: 0,
      y: 0,
      facing: PuzzleCode.direction.LEFT,
      programText: "move",
      constraints: {}
    },
  ],
}

var board1 = PuzzleCode.init(config, "#board1")

var config = {
	cellSize: 16,
	bots: [
    {
      botColor: PuzzleCode.bot.Color.BLUE,
      x: 0,
      y: 0,
      facing: PuzzleCode.direction.UP,
      programText: "move\nmove",
      constraints: {}
    },
    {
      botColor: PuzzleCode.bot.Color.BLUE,
      x: 3,
      y: 3,
      facing: PuzzleCode.direction.LEFT,
      programText: "move",
      constraints: {}
    },
  ],
}

var board2 = PuzzleCode.init(config, "#board2")

#endif