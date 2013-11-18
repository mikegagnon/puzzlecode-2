#ifndef __INIT_JS__
#define __INIT_JS__

#include "main/js/PuzzleCode/header.js"
#include "main/js/PuzzleCode/bot.js"
#include "main/js/PuzzleCode/direction.js"
#include "main/js/PuzzleCode/viz.js"
#include "main/js/PuzzleCode/board.js"
#include "main/js/PuzzleCode/buttons.js"

// divMap[divId] == the board object for that div
PuzzleCode.divMap = {}

/**
 * Creates and returns new Board object.
 *
 * @param boardConfig should be a BoardConfig object
 * @param divId should be the HTML id for an empty div. The visualization for
 * the board will be inserted into this div object. It should already include
 * the "#"
 */
PuzzleCode.init = function(boardConfig, divId) {
  "use strict"

  PuzzleCode.assert("board " + divId + " already exists", function(){
    return !(divId in PuzzleCode.divMap)
  })

	var defaultConfig = _.cloneDeep(PuzzleCode.board.DEFAULT_CONFIG)
	var config = _.merge(defaultConfig, boardConfig)

	var board = {
		config: config,
		divId: divId,

		// All elements in board are immutable, except for the state element
		state: PuzzleCode.board.newState(config)
	}

  PuzzleCode.divMap[divId] = board

  PuzzleCode.board.check(board)

  PuzzleCode.viz.init(board)

  return board
}

/**
 * Testing
 ******************************************************************************/
var config = {
  buttons: ["play", "reset", "step"],
	bots: [
    {
      color: PuzzleCode.bot.Color.BLUE,
      x: 2,
      y: 3,
      facing: PuzzleCode.direction.UP,
      programText: "move\nmove",
      constraints: {}
    },
    {
      color: PuzzleCode.bot.Color.BLUE,
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
  buttons: ["play"],
  width: 5,
  height: 3,
  cellSize: 16,
	bots: [
    {
      color: PuzzleCode.bot.Color.BLUE,
      x: 0,
      y: 0,
      facing: PuzzleCode.direction.UP,
      programText: "move\nmove",
      constraints: {}
    },
    {
      color: PuzzleCode.bot.Color.BLUE,
      x: 3,
      y: 2,
      facing: PuzzleCode.direction.LEFT,
      programText: "move",
      constraints: {}
    },
  ],
}

var board2 = PuzzleCode.init(config, "#board2")

#endif