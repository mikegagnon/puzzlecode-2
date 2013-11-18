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
	  	board.viz.xScale(board.config.height)
	 	var w = board.config.widthPixels =
	 		board.viz.yScale(board.config.width)

	  board.d3 = d3.select(board.svgId)
	    .attr("height", h)
	    .attr("width", w)
	}

	viz.drawCells = function(board) {

		var hlines = _.range(1, board.config.height)
		var vlines = _.range(1, board.config.width)

		board.d3.selectAll(".hline")
			.data(hlines)
			.enter().append("svg:line")
			.attr("x1", 0)
			.attr("y1", board.viz.yScale)
			.attr("x2", board.config.widthPixels)
			.attr("y2", board.viz.yScale)
			.attr("class", "pc-grid-line")

		board.d3.selectAll(".vline")
			.data(vlines)
			.enter().append("svg:line")
			.attr("x1", board.viz.xScale)
			.attr("y1", 0)
			.attr("x2", board.viz.xScale)
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
	  var x = board.viz.xScale(bot.x)
	  var y = board.viz.yScale(bot.y)
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

	viz.drawButtons = function(board) {

		var buttonTemplate =
			"<button type='button' class='btn btn-default' " +
			"onclick=\"PuzzleCode.click('{{{buttonName}}}', '{{{boardDivId}}}')\" >" +
			"<span class='glyphicon glyphicon-{{{glyph}}}'></span>"  +
			"</button>"

		var buttonOrder = [
			"reset",
			"step",
			"play"
		]

		_(buttonOrder).forEach(function(buttonName){
			if (_.contains(board.config.buttons, buttonName)) {
				$(board.playbackButtonsId)
					.append(Mustache.render(buttonTemplate, {
						buttonName: buttonName,
						glyph: PuzzleCode.buttons[buttonName].glyph,
						boardDivId: board.divId
					}))
			}
		})
	}

	viz.init = function(board) {

		var cellSize = board.config.cellSize
		var width = board.config.width
		var height = board.config.height

		board.viz = {}

		// translates column-number to the x-pixel of the left edge of that column
		board.viz.xScale = d3.scale.linear()
			.domain([0, width])
			.range([0, width * cellSize])

		board.viz.yScale = d3.scale.linear()
			.domain([0, height])
			.range([0, height * cellSize])

		board.toolbarId = board.divId + "_toolbar"
		board.playbackButtonsId = board.divId + "_playback_buttons"
		board.svgId = board.divId + "_svg"

		$(board.divId)
			.addClass("pc-board")
			.append("<div " +
				      "id='" +  board.toolbarId.replace(/^#/, '') + "' " +
						  "class='btn-toolbar'></div>")
			.append("<svg " +
							"class='pc-svg-board' "+
							"id='" + board.svgId.replace(/^#/,'') + "' class='svgBoard' " +
							"xmlns='http://www.w3.org/2000/svg'></svg>")

		$(board.toolbarId)
			.append("<div " +
				      "id='" +  board.playbackButtonsId.replace(/^#/, '') + "' " +
							"class='btn-group'></div>")

		viz.drawButtons(board)
		viz.drawBoardContainer(board)
  	viz.drawCells(board)
  	viz.drawBots(board)
	}

  return viz
})()

#endif