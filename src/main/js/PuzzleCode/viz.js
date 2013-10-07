#ifndef __VIS_JS__
#define __VIS_JS__

#include "main/js/PuzzleCode/header.js"
#include "main/js/PuzzleCode/board.js"
#include "main/js/PuzzleCode/direction.js"

PuzzleCode.viz = (function(){
  "use strict"

  var direction = PuzzleCode.direction
  var viz = {}

	viz.drawBoardContainer = function(board) {

	  var h = board.config.heightPixels =
	  	board.config.height * board.config.cellSize
	 	var w = board.config.widthPixels =
	 		board.config.width * board.config.cellSize

	  board.d3 = d3.select(board.svgId)
	    .attr("height", h)
	    .attr("width", w)
	}

	viz.drawCells = function(board) {

		var hlines = _.range(board.config.height + 1)
		var vlines = _.range(board.config.width + 1)

	  var cellSize = board.config.cellSize

		board.d3.selectAll(".hline")
			.data(hlines)
			.enter().append("svg:line")
			.attr("x1", 0)
			.attr("y1", function(d){ return d * cellSize})
			.attr("x2", board.config.widthPixels)
			.attr("y2", function(d){ return d * cellSize})
			.attr("class", "pc-grid-line")

		board.d3.selectAll(".vline")
			.data(vlines)
			.enter().append("svg:line")
			.attr("x1", function(d){ return d * cellSize})
			.attr("y1", 0)
			.attr("x2", function(d){ return d * cellSize})
			.attr("y2", board.config.heightPixels)
			.attr("class", "pc-grid-line")
	}

	viz.directionToAngle = function(dir) {
	  if (dir == direction.UP) {
	    return 0
	  } else if (dir == direction.DOWN) {
	    return 180
	  } else if (dir == direction.LEFT) {
	    return -90
	  } else if (dir == direction.RIGHT) {
	    return 90
	  } else {
	    PuzzleCode.assert("directionToAngle bad direction: " + direction,
	    	function(){ return false })
	  }
	}

	// Returns an svg translation command to update the bot's __pixel__ position on
	// the board and it's direction
	viz.botTransformPixels = function(board, x, y, facing) {
		var halfCell = board.config.cellSize / 2
	  return "translate(" + x + ", " + y + ") " +
	    "rotate("
	    	+ viz.directionToAngle(facing) + " "
	    	+ halfCell + " " + halfCell +")"
	}

	// Like botTransformPixels, except using __cell__ position instead of __pixel__
	viz.botTransform = function(board, bot) {
	  var x = bot.x * board.config.cellSize
	  var y = bot.y * board.config.cellSize
	  return viz.botTransformPixels(board, x, y, bot.facing)
	}

	viz.botId = function(board, bot) {
  	return board.svgId.replace(/^#/, "") + "_bot_" + bot.id
	}

	viz.drawBots = function(board){
	  board.d3.selectAll(".bot")
	    .data(board.state.bots)
	    .enter().append("svg:image")
	    .attr("id", function(bot){ return viz.botId(board, bot) })
	    .attr("xlink:href", "img/bluebot.svg")
	    .attr("height", board.config.cellSize)
	    .attr("width", board.config.cellSize)
	    .attr("transform", function(bot){ return viz.botTransform(board, bot) })
	}

	viz.init = function(board) {

		board.viz = {}

		board.svgId = board.divId + "_svg"

		$(board.divId)
			.addClass("pc-board")
			.append("<svg " +
							"class='pc-svg-board' "+
							"id='" + board.svgId.replace(/^#/,'') + "' class='svgBoard' " +
							"xmlns='http://www.w3.org/2000/svg'></svg>")

		viz.drawBoardContainer(board)
  	viz.drawCells(board)
  	viz.drawBots(board)
	}

  return viz
})()

#endif