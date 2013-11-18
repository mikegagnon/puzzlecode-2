#ifndef __BUTTONS_JS__
#define __BUTTONS_JS__

#include "main/js/PuzzleCode/header.js"
#include "main/js/PuzzleCode/board.js"

PuzzleCode.buttons = {}

PuzzleCode.buttons["play"] = {
	glyph: "play",
	fn: function(board) {
		"use strict"
		console.log("play")
		console.dir(board)
	}
}

PuzzleCode.buttons["step"] = {
	glyph: "step-forward",
	fn: function(board) {
		"use strict"
		console.log("step-forward")
		console.dir(board)
	}
}

PuzzleCode.buttons["reset"] = {
	glyph: "refresh",
	fn: function(board) {
		"use strict"
		console.log("reset")
		console.dir(board)
	}
}


#endif