#ifndef __SIM_JS__
#define __SIM_JS__

#include "main/js/PuzzleCode/header.js"
#include "main/js/PuzzleCode/bot.js"

PuzzleCode.sim = (function(){
  "use strict"

  var sim = {}

	/**
	 * assumes relatively sane values for increment
	 *
	 * returns {
	 *	value: (value + increment), wrapped around the torus if need be,
	 *  torus: true iff the value wrapped around the edge
	 * }
	 *
	 */
	sim.wrapAdd = function(value, increment, outOfBounds) {
	  value += increment
	  if (value >= outOfBounds) {
	    return {
	    	value: value % outOfBounds,
	    	torus: true
	    }
	  } else if (value < 0) {
	    return {
	    	value: outOfBounds + value,
	    	torus: true
	    }
	  } else {
	    return {
	    	value: value,
	    	torus: false
	    }
	  }
	}

	/**
	 * executes the 'move' instruciton on the bot
	 * updates the bot and board state
	 * When a bot moves, it deposits two markers:
	 *  - at the head in the old cell
	 *  - at the tail in the new cell
	 */
	sim.executeMove = function(result, board, bot) {
 
	  var prevX = bot.x
	  var prevY = bot.y

	 	var delta = PuzzleCode.direction.dxdy(bot.facing)

	  var xResult = sim.wrapAdd(bot.x, delta.dx, board.config.width)
	  var yResult = sim.wrapAdd(bot.y, delta.dy, board.config.height)
	  var destX = xResult.value
	  var destY = yResult.value
	  var xTorus = xResult.torus
	  var yTorus = yResult.torus

	  // if the movement is blocked by an obstacle
	  if (!PuzzleCode.board.isEmptyCell(board, destX, destY)) {
	    result.viz.failMove = {
	      destX: bot.x + delta.dx,
	      destY: bot.y + delta.dy
	    }
	  }
	  // if the movement is NOT blocked
	  else {

	  	delete board.state.matrix[prevX][prevY].bot
	  	board.state.matrix[destX][destY].bot = bot

	    bot.x = destX
	    bot.y = destY
	   
	    if (!xTorus && !yTorus) {
	      result.viz.nonTorusMove = true
	    } else {
	      result.viz.torusMove = {
	        prevX: prevX,
	        prevY: prevY,
	        oobPrevX: destX - delta.dx,
	        oobPrevY: destY - delta.dy,
	        oobNextX: prevX + delta.dx, 
	        oobNextY: prevY + delta.dy
	      }
	    }
	  }

	  return result
	}

  sim.botDone = function(result, animationSpec, board, bot) {
    bot.program.done = true
    result.viz.programDone = true

    // TODO only set encourage_reset if it's sensible.
    // Right now, if any bot's program finishes encourage_reset will be
    // activated.
    // Perhaps the best thing is have each puzzle define a function that
    // analyzes the board and determines whether or not a reset should be
    // encouraged
    animationSpec.general.encourage_reset = true
  }

	// a sub-step in the simulation
	sim.dubstep = function(animationSpec, board, bot) {

	  // make sure this bot hasn't finished
	  if ("done" in bot.program) {
	    return
	  }

    /**
     * the executeFoo(...) functions return a result object that has two
     * properties:
     *    viz:      an object describing the visualizations for this bot that
     *              result from the execution of the instruction
     *    markers:  array of markers deposited by the bot
     */
    var result = {viz: {}}

    // if the bot has an empty program
    if (bot.program.instructions.length == 0) {
      sim.botDone(result, animationSpec, board, bot)
    } else {
      PuzzleCode.assert(
        "dubstep: bot.ip >= 0 && bot.ip < bot.program.instructions.length",
        function() {
          return bot.ip >= 0 && bot.ip < bot.program.instructions.length
        })

      var instruction = bot.program.instructions[bot.ip]

      // NOTE: executing the goto instruction (and others) may modify the ip
      bot.ip = bot.ip + 1

      if (instruction.opcode == PuzzleCode.compiler.Opcode.MOVE) {
        sim.executeMove(result, board, bot)
      }

      result.viz.lineIndex = instruction.lineIndex

      if (bot.ip < bot.program.instructions.length) {
        var nextInstruction = bot.program.instructions[bot.ip]
        result.viz.nextLineIndex = nextInstruction.lineIndex
      }

      // if the bot has reached the end of its program
      if (bot.ip >= bot.program.instructions.length) {
        sim.botDone(result, animationSpec, board, bot)
      }
    }

	  animationSpec.bot[bot.id] = result.viz
	}

  // Make one step in the simulation
	sim.step = function(board) {
	
	  // contains all data needed to visualize this step of the simulation
	  var animationSpec = {

	    // visualizations associated with the board, but not any particular bot
	    general: {},

	    // bots[bot.id] == an object containing all visualizations for that bot
	    // e.g. bot[1].lineIndex == the index of the line currently being
	    // executed for that bot with bot.id == 1
	    bot: {}
	  }

	  _(board.state.bots).forEach(function(bot) {
	    sim.dubstep(animationSpec, board, bot)
	  })

    return animationSpec
	}

	return sim
})()

#endif