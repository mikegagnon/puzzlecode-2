#ifndef __INIT_JS__
#define __INIT_JS__

#include "main/js/PuzzleCode/header.js"
#include "main/js/PuzzleCode/board.js"
#include "main/js/PuzzleCode/viz.js"

/**
 * Creates and returns new Board object.
 *
 * @param boardSettings should be a BoardSettings object
 * @param divId should be the HTML id for an empty div. The visualization for
 * the board will be inserted into this div object 
 */
PuzzleCode.init = function(boardSettings, divId) {
  "use strict"

	var defaultSettings = _.cloneDeep(PuzzleCode.board.DEFAULT_SETTINGS)
	var settings = _.merge(defaultSettings, boardSettings)

	var board = {
		settings: settings,
		divId: divId,
	}

  PuzzleCode.viz.init(board)

  return board
}

var board1 = PuzzleCode.init({}, "#board1")
var board2 = PuzzleCode.init({numCols: 6}, "#board2")

#endif