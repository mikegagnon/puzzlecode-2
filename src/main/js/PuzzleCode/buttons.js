#ifndef __BUTTONS_JS__
#define __BUTTONS_JS__

#include "main/js/PuzzleCode/header.js"
#include "main/js/PuzzleCode/board.js"

PuzzleCode.buttons = (function(){
	"use strict"

	var buttons = {}

	buttons.playpause = {
		glyph: "play",
		fn: function(board) {
		}
	}

	buttons.step = {
		glyph: "step-forward",
		fn: function(board) {
			if (board.state.playState == PuzzleCode.board.PlayState.PAUSED) {
				var animationSpec = PuzzleCode.sim.step(board)
				PuzzleCode.viz.animateStep(animationSpec, board)
				board.state.playState = PuzzleCode.board.PlayState.STEPPING

				var stepDone = function() {
					board.state.playState = PuzzleCode.board.PlayState.PAUSED
				}

				setTimeout(stepDone, board.viz.animationSpeed.duration)
			}
		}
	}

	buttons.reset = {
		glyph: "refresh",
		fn: function(board) {
		}
	}

	return buttons
})()


#endif