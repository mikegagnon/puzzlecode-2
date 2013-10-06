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

	viz.init = function(board) {
		PuzzleCode.viz.drawBoardContainer(board)
  	PuzzleCode.viz.drawCells(board)
	}

  return viz
})()

#endif