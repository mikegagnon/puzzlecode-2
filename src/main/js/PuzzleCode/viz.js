#ifndef __VIS_JS__
#define __VIS_JS__

#include "main/js/PuzzleCode/header.js"
#include "main/js/PuzzleCode/board.js"

PuzzleCode.viz = (function(){
  "use strict"

  var viz = {}

	viz.drawBoardContainer = function(board) {

	  var h = board.settings.height = board.settings.numRows * board.settings.cellSize
	 	var w = board.settings.width = board.settings.numCols * board.settings.cellSize

	 	console.log(board.svgId)

	  board.d3 = d3.select(board.svgId)
	    .attr("height", h)
	    .attr("width", w)
	}

	viz.drawCells = function(board) {

		var hlines = _.range(board.settings.numRows + 1)
		var vlines = _.range(board.settings.numCols + 1)

	  var cellSize = board.settings.cellSize

		board.d3.selectAll(".hline")
			.data(hlines)
			.enter().append("svg:line")
			.attr("x1", 0)
			.attr("y1", function(d){ return d * cellSize})
			.attr("x2", board.settings.width)
			.attr("y2", function(d){ return d * cellSize})
			.attr("class", "pcGridLine")

		board.d3.selectAll(".vline")
			.data(vlines)
			.enter().append("svg:line")
			.attr("x1", function(d){ return d * cellSize})
			.attr("y1", 0)
			.attr("x2", function(d){ return d * cellSize})
			.attr("y2", board.settings.height)
			.attr("class", "pcGridLine")
	}

	/**
	 * Creates and returns new Board object.
	 *
	 * @param boardSettings should be a BoardSettings object
	 * @param divId should be the HTML id for an empty div. The visualization for
	 * the board will be inserted into this div object 
	 */
	viz.init = function(boardSettings, divId) {

		var svgId = divId + "_svg"

		$(divId)
			.addClass("board")
			.append("<svg id='" + svgId.replace(/^#/,'') + "' class='svgBoard' " +
							"xmlns='http://www.w3.org/2000/svg'></svg>")

		var defaultSettings = _.cloneDeep(PuzzleCode.board.DEFAULT_SETTINGS)
		var settings = _.merge(defaultSettings, boardSettings)

		var board = {
			settings: settings,
			divId: divId,
			svgId: svgId
		}

	  viz.drawBoardContainer(board)
	  viz.drawCells(board)

	  return board
	}

  return viz
})()

var board = PuzzleCode.viz.init({}, "#board1")
var board = PuzzleCode.viz.init({numCols: 6}, "#board2")

#endif