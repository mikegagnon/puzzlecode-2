#ifndef __DEBUG_JS__
#define __DEBUG_JS__

#include "main/js/PuzzleCode/header.js"

PuzzleCode.assert = function(message, func) {
	 "use strict"

  if (PuzzleCode.DEBUG && !func()) {
    alert(message)
    console.error(message)
  }
}

#endif
