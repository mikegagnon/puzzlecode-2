#ifndef __CLICK_JS__
#define __CLICK_JS__

#include "main/js/PuzzleCode/header.js"
#include "main/js/PuzzleCode/board.js"

PuzzleCode.click = function(buttonName, divId, extraArgs) {
  "use strict"
  var board = PuzzleCode.divMap[divId]
  var fn = PuzzleCode.buttons[buttonName].fn
  fn(board, extraArgs);
}

#endif