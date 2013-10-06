#ifndef __SIM_JS__
#define __SIM_JS__

#include "main/js/PuzzleCode/header.js"
#include "main/js/PuzzleCode/bot.js"

PuzzleCode.sim = (function(){
  "use strict"

  var sim = {}

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