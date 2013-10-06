#ifndef __VIS_JS__
#define __VIS_JS__

#include "main/js/PuzzleCode/header.js"
#include "main/js/PuzzleCode/board.js"

PuzzleCode.viz = (function(){
  "use strict"

  var viz = {}

	viz.drawBoardContainer = function(board) {

	  var h = board.config.height = board.config.numRows * board.config.cellSize
	 	var w = board.config.width = board.config.numCols * board.config.cellSize

	  board.d3 = d3.select(board.svgId)
	    .attr("height", h)
	    .attr("width", w)
	}

	viz.drawCells = function(board) {

		var hlines = _.range(board.config.numRows + 1)
		var vlines = _.range(board.config.numCols + 1)

	  var cellSize = board.config.cellSize

		board.d3.selectAll(".hline")
			.data(hlines)
			.enter().append("svg:line")
			.attr("x1", 0)
			.attr("y1", function(d){ return d * cellSize})
			.attr("x2", board.config.width)
			.attr("y2", function(d){ return d * cellSize})
			.attr("class", "pcGridLine")

		board.d3.selectAll(".vline")
			.data(vlines)
			.enter().append("svg:line")
			.attr("x1", function(d){ return d * cellSize})
			.attr("y1", 0)
			.attr("x2", function(d){ return d * cellSize})
			.attr("y2", board.config.height)
			.attr("class", "pcGridLine")
	}

	viz.init = function(board) {

		board.viz = {}

		board.svgId = board.divId + "_svg"

		$(board.divId)
			.addClass("board")
			.append("<svg id='" + board.svgId.replace(/^#/,'') + "' class='svgBoard' " +
							"xmlns='http://www.w3.org/2000/svg'></svg>")

		PuzzleCode.viz.drawBoardContainer(board)
  	PuzzleCode.viz.drawCells(board)
	}

  return viz
})()

#endif