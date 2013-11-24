#ifndef __BUTTONS_JS__
#define __BUTTONS_JS__

#include "main/js/PuzzleCode/header.js"
#include "main/js/PuzzleCode/board.js"

PuzzleCode.buttons = (function(){
	"use strict"

	var buttons = {}

	buttons.getId = function(board, buttonName) {
		return board.divId + "-button-" + buttonName
	}

	buttons.setGlyph = function(board, buttonName, glyph) {
		var spanId = buttons.getId(board, buttonName) + ">span"
		$(spanId)
			.removeClass()
			.addClass("glyphicon " + glyph)
	}

	buttons.stopPlaying = function(board) {
		if (board.state.playState == PuzzleCode.board.PlayState.PLAYING)  {
			board.state.playState = PuzzleCode.board.PlayState.PAUSED
			buttons.setGlyph(board, "playpause", "glyphicon-play")
			clearInterval(board.state.playInterval)
		}
	}

	buttons.playpause = {
		glyph: "glyphicon-play",
		fn: function(board) {
			if (board.state.playState == PuzzleCode.board.PlayState.PAUSED) {
				board.state.playState = PuzzleCode.board.PlayState.PLAYING
				buttons.setGlyph(board, "playpause", "glyphicon-pause")

				var playStep = function() {
					var animationSpec = PuzzleCode.sim.step(board)
					PuzzleCode.viz.animateStep(animationSpec, board)
				}

				playStep()

				var cycleTime = board.viz.animationSpeed.duration +
												board.viz.animationSpeed.delay

				board.state.playInterval = setInterval(playStep, cycleTime)
			} else if (board.state.playState == PuzzleCode.board.PlayState.PLAYING) {
				buttons.stopPlaying(board)
			}
		} 
	}

	buttons.step = {
		glyph: "glyphicon-step-forward",
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
		glyph: "glyphicon-refresh",
		fn: function(board) {
			buttons.stopPlaying(board)
			board.state = PuzzleCode.board.newState(board.config)
			PuzzleCode.viz.initItems(board)
		}
	}

	buttons.editor_reset = {
		glyph: "glyphicon-refresh",
		fn: function(board, editorId) {
			console.dir(board)
			console.dir(editorId)
		}
	}

	return buttons
})()


#endif