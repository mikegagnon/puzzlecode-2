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
	sim.executeMove = function(board, bot) {

		var result = {viz: {}}
 
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

  // Make one step in the simulation
	sim.step = function(board) {
	
	  // contains all data needed to visualize this step of the simulation
	  board.viz.step = {

	    // visualizations associated with the board, but not any particular bot
	    general: {},

	    // bots[bot.id] == an object containing all visualizations for that bot
	    // e.g. bot[1].lineIndex == the index of the line currently being
	    // executed for that bot with bot.id == 1
	    bot: {}
	  }

	  _(board.bots).forEach(function(bot) {
	    sim.dubstep(board, bot)
	  })

	}

	return sim
})()

#endif