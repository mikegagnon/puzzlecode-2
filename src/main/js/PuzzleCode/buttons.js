#ifndef __BUTTONS_JS__
#define __BUTTONS_JS__

#include "main/js/PuzzleCode/header.js"
#include "main/js/PuzzleCode/board.js"

PuzzleCode.buttons = (function(){
	"use strict"

	var buttons = {}

	buttons.getId = function(board, buttonName) {
		return board.divId + "-" + buttonName
	}

	buttons.setGlyph = function(board, buttonName, glyph) {

	}

	buttons.playpause = {
		glyph: "play",
		fn: function(board) {
			if (board.state.playState == PuzzleCode.board.PlayState.PAUSED) {
				board.state.playState = PuzzleCode.board.PlayState.PLAYING

				var playStep = function() {
					var animationSpec = PuzzleCode.sim.step(board)
					PuzzleCode.viz.animateStep(animationSpec, board)
				}

				playStep()

				var cycleTime = board.viz.animationSpeed.duration +
												board.viz.animationSpeed.delay

				setInterval(playStep, cycleTime)
			}
		}
	}

	buttons.step = {
		glyph: "step-forward",
		fn: function(board) {
			if (board.state.playState == PuzzleCode.board.PlayState.PAUSED) {
				board.state.playState = PuzzleCode.board.PlayState.STEPPING

				var animationSpec = PuzzleCode.sim.step(board)
				PuzzleCode.viz.animateStep(animationSpec, board)

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