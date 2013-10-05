#ifndef __VIS_JS__
#define __VIS_JS__

#include "main/js/PuzzleCode/header.js"

PuzzleCode.viz = (function(){
  "use strict"

  var viz = {}

	viz.drawBoardContainer = function(board, boardId) {

	  var h = board.view.height = board.numRows * board.view.cellSize
	 	var w = board.view.width = board.numCols * board.view.cellSize

	  board.d3 = d3.select(boardId)
	    .attr("class", "vis")
	    .attr("height", h)
	    .attr("width", w)
	}

	viz.drawCells = function(board) {

		var hlines = _.range(board.numRows + 1)
		var vlines = _.range(board.numCols + 1)

	  var cellSize = board.view.cellSize

		board.d3.selectAll(".hline")
			.data(hlines)
			.enter().append("svg:line")
			.attr("x1", 0)
			.attr("y1", function(d){ return d * cellSize})
			.attr("x2", board.view.width)
			.attr("y2", function(d){ return d * cellSize})
			.attr("class", "pcGridLine")

		board.d3.selectAll(".vline")
			.data(vlines)
			.enter().append("svg:line")
			.attr("x1", function(d){ return d * cellSize})
			.attr("y1", 0)
			.attr("x2", function(d){ return d * cellSize})
			.attr("y2", board.view.height)
			.attr("class", "pcGridLine")
	}

	viz.init = function(board, boardId) {
	  viz.drawBoardContainer(board, boardId)
	  viz.drawCells(board)
	}

  return viz
})()

board = {
	numRows: 5,
	numCols: 10,
	view: {
		cellSize: 30
	}
}

PuzzleCode.viz.init(board, "#board")

#endif