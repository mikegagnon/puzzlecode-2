#ifndef __BOARD_JS__
#define __BOARD_JS__

#include "main/js/PuzzleCode/header.js"
#include "main/js/PuzzleCode/bot.js"

PuzzleCode.board = (function(){
  "use strict"

  var board = {}

  board.DEFAULT_CONFIG = {
		height: 5,
		width: 10,
		cellSize: 32,
		bots: []
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
    	height: {type: "integer"},
    	width: {type: "integer"},
    	cellSize: {type: "integer"},
    	bots: {
        type: "array",
        items: PuzzleCode.bot.BotConfigSchema
      },
    },
    required: ["height", "width", "cellSize", "bots"]
  }

#endif // #ifdef __DEBUG__

	return board
})()

#endif