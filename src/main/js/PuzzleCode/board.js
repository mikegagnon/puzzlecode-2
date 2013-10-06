#ifndef __BOARD_JS__
#define __BOARD_JS__

#include "main/js/PuzzleCode/header.js"

PuzzleCode.board = (function(){
  "use strict"

  var board = {}

  board.DEFAULT_CONFIG = {
		numRows: 5,
		numCols: 10,
		cellSize: 30
	}

#ifdef __DEBUG__
	/**
   * Schemas for JSON objects
   ****************************************************************************/

  // A BoardConfig object
  board.BoardConfigSchema = {
    $schema: PuzzleCode.JSON_SCHEMA,
    type: "object",
    properties: {
    	numRows: {type: "integer"},
    	numCols: {type: "integer"},
    	cellSize: {type: "integer"},
    },
    required: ["numRows", "numCols", "cellSize"]
  }

#endif // #ifdef __DEBUG__

	return board
})()

#endif