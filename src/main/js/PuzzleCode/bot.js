#ifndef __BOT_JS__
#define __BOT_JS__

#include "main/js/PuzzleCode/header.js"
#include "main/js/PuzzleCode/constants.js"
#include "main/js/PuzzleCode/direction.js"

PuzzleCode.bot = (function(){
  "use strict"

  var bot = {}

  bot.Color = {
    BLUE: 0,
    RED: 1
  }

#ifdef __DEBUG__
	/**
   * Schemas for JSON objects
   ****************************************************************************/

  // A BotConfig object describes the configuration for a single bot
  bot.BotConfigSchema = {
    $schema: PuzzleCode.JSON_SCHEMA,
    type: "object",
    properties: {
    	color: {enum: _.values(bot.Color) },
      x: {type: "integer"},
      y: {type: "integer"},
      facing: {enum: PuzzleCode.direction.diretions },
      programText: {type: "string"},
      constraints: {type: "object"}
    },
    required: ["color", "x", "y", "facing", "programText", "constraints"]
  }

#endif // #ifdef __DEBUG__

	return bot
})()

#endif