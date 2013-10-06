#ifndef __DIRECTION_JS__
#define __DIRECTION_JS__

#include "main/js/PuzzleCode/header.js"

PuzzleCode.direction = (function(){
  "use strict"

	var direction = {}

  /**
   * Constants
   ****************************************************************************/
	direction.NUM_DIRECTIONS = 4
	direction.UP = 0
	direction.DOWN = 1
	direction.LEFT = 2
	direction.RIGHT = 3
	
	direction.diretions = [
		direction.UP,
		direction.DOWN,
		direction.LEFT,
		direction.RIGHT,
	]

	/**
   * Functions
   ****************************************************************************/
   direction.rotateLeft = function(dir) {
	  if (dir == direction.LEFT) {
	    return direction.DOWN
	  } else if (dir == direction.DOWN) {
	    return direction.RIGHT
	  } else if (dir == direction.RIGHT) {
	    return direction.UP
	  } else if (dir == direction.UP) {
	    return direction.LEFT
	  } else {
	    PuzzleCode.assert("rotateLeft(" + dir + ") invalid direction",
	    	function(){ return false })
	  }
	}

	direction.rotateRight = function(dir) {
	  if (dir == direction.LEFT) {
	    return direction.UP
	  } else if (dir == direction.UP) {
	    return direction.RIGHT
	  } else if (dir == direction.RIGHT) {
	    return direction.DOWN
	  } else if (dir == direction.DOWN) {
	    return direction.LEFT
	  } else {
	    PuzzleCode.assert("rotateRight(" + dir + ") invalid direction",
	    	function(){ return false })
	  }
	}

	direction.rotateDirection = function(oldFacing, rotateDir) {
	  if (rotateDir == direction.LEFT) {
	    return direction.rotateLeft(oldFacing)
	  } else if (rotateDir == direction.RIGHT) {
	    return direction.rotateRight(oldFacing)
	  } else {
	    PuzzleCode.assert("rotateDirection(" + rotateDir + ") invalid direction",
	    	function(){ return false })
	  }
	},

	direction.oppositeDirection = function(dir) {
	  return direction.rotateLeft(direction.rotateLeft(dir))
	}

	return direction
})()

#endif
