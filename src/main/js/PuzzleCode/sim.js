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

	// a bot tries to move into cell x,y.
	// returns true if the bot is allowed to move in, false otherwise
	sim.tryMove = function(board, bot, x, y) {
	  // TODO: matching objects like this doesn't seem to to be the best idea.
	  // Instead, uild up a cell matrix or some other data structure
	  var matchingBlocks = _(board.blocks)
	    .filter( function(block) {
	      return block.x == x && block.y == y
	    })
	    .value()

	  var matchingBots = _(board.bots)
	    .filter( function(bot) {
	      return bot.cellX == x && bot.cellY == y
	    })
	    .value()

	  return matchingBlocks.length == 0 && matchingBots.length == 0
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