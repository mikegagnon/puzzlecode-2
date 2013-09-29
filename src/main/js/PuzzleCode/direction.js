/**
 * Copyright 2013 Michael N. Gagnon
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


PuzzleCode.direction = (function(){

	var direction = {}

  /**
   * Constants
   ****************************************************************************/
	direction.NUM_DIRECTIONS = 4
	direction.UP = 0
	direction.DOWN = 1
	direction.LEFT = 2
	direction.RIGHT = 3

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
