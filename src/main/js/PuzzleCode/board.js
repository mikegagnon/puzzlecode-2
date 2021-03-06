#ifndef __BOARD_JS__
#define __BOARD_JS__

#include "main/js/PuzzleCode/header.js"
#include "main/js/PuzzleCode/bot.js"
#include "main/js/PuzzleCode/util.js"

PuzzleCode.board = (function(){
  "use strict"

  var board = {}

  board.PlayState = {

    /**
     * The difference between PAUSED and INITIAL_STATE_PAUSED is that 
     * INITIAL_STATE_PAUSED denotes that the simulation has NOT yet begun.
     * Therefore it is OK to do things like edit the program.
     */
    INITIAL_STATE_PAUSED: 0,
    PAUSED: 1,

    STEPPING: 2, // the animation for a single step is currently under way
    PLAYING: 3
  }

  board.getBot = function(board, botId) {
    return _.find(board.state.bots, function(b){return b.id == botId})
  }

  // ensure the all the board invariants hold
  board.check = function(board) {
    if (!PuzzleCode.DEBUG) {
      return
    }

    PuzzleCode.assert("malformed board.config", function(){
      return tv4.validate(board.config, PuzzleCode.board.BoardConfigSchema)
    })

    PuzzleCode.assert("board.bots does not match board.state", function(){

      var matrixBots = []

      _.times(board.config.width, function(x){
        _.times(board.config.height, function(y){
          if ("bot" in board.state.matrix[x][y]) {
            var bot = board.state.matrix[x][y].bot
            PuzzleCode.assert("bot / matrix disagree for bot.x",
              function(){return bot.x == x})
            PuzzleCode.assert("bot / matrix disagree for bot.y",
              function(){return bot.y == y})
            matrixBots.push(bot)
          }
        })
      })

      matrixBots = _.sortBy(matrixBots, function(bot){ return bot.id })

      var match = _.isEqual(board.state.bots, matrixBots)
      if (!match) {
        console.error("board.state.bots")
        console.dir(board.state.bots)
        console.error("matrixBots")
        console.dir(matrixBots)
      }

      return match
    })

  }

  board.isEmptyCell = function(board, x, y) {
    var cell = board.state.matrix[x][y]
    if ("bot" in cell) {
      return false
    } else {
      return true
    }
  }

  board.newState = function(boardConfig) {

    var state = {
      error: false
    }

    state.playState = board.PlayState.INITIAL_STATE_PAUSED

    // Create matrix
    state.matrix = PuzzleCode.newMatrix(boardConfig.width, boardConfig.height,
      function(){ return {} })

    // Initialize bots
    state.bots = _.cloneDeep(boardConfig.bots)

    _(state.bots).forEach(function(bot, id){

      // Every bot has UUID (unique relative to the board object)
      bot.id = id

      // instruction pointer into the bot's program (index into instructions)
      bot.ip = 0

      var program = PuzzleCode.compiler.compile(bot.programText, bot.constraints)
      bot.program = program
      state.error = state.error || program.error

      PuzzleCode.assert("newState: bot.x bad", function(){
        return bot.x >=0 && bot.x < boardConfig.width
      })
      PuzzleCode.assert("newState: bot.y bad", function(){
        return bot.y >=0 && bot.y < boardConfig.height
      })

      state.matrix[bot.x][bot.y].bot = bot
    })

    return state
  }

  board.DEFAULT_CONFIG = {
    animationStyle: "Normal",
    width: 10,
		height: 5,
		cellSize: 32,
    buttons: [],
    bots: [],
    editors: []
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
      animationStyle: {enum: ["Normal"] },
      width: {type: "integer"},
    	height: {type: "integer"},
    	cellSize: {type: "integer"},
      buttons: {
        type: "array",
        items: {enum: ["playpause", "reset", "step", "editor_reset"] }
      },
      bots: {
        type: "array",
        items: PuzzleCode.bot.BotConfigSchema
      },
      // editors == array of bot ids that have editors
      editors: {
        type: "array",
        items: "integer"
      }
    },
    required: ["height", "width", "cellSize", "bots"]
  }

#endif // #ifdef __DEBUG__

	return board
})()

#endif