#ifndef __INIT_JS__
#define __INIT_JS__

#include "main/js/PuzzleCode/header.js"
#include "main/js/PuzzleCode/board.js"
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

	var board = {
		config: config,
		divId: divId,
	}

  PuzzleCode.viz.init(board)

  return board
}

var board1 = PuzzleCode.init({}, "#board1")
var board2 = PuzzleCode.init({numCols: 6}, "#board2")

#endif