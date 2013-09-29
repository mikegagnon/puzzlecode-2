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

 PuzzleCode.direction = {

  NUM_DIRECTIONS: 4,
  UP: 0,
  DOWN: 1,
  LEFT: 2,
  RIGHT: 3,

	rotateLeft: function(direction) {
	  if (direction == this.LEFT) {
	    return this.DOWN
	  } else if (direction == this.DOWN) {
	    return this.RIGHT
	  } else if (direction == this.RIGHT) {
	    return this.UP
	  } else if (direction == this.UP) {
	    return this.LEFT
	  } else {
	    PuzzleCode.assert("rotateLeft(" + direction + ") invalid direction",
	    	function(){ return false })
	  }
	},

	rotateRight: function(direction) {
	  if (direction == this.LEFT) {
	    return this.UP
	  } else if (direction == this.UP) {
	    return this.RIGHT
	  } else if (direction == this.RIGHT) {
	    return this.DOWN
	  } else if (direction == this.DOWN) {
	    return this.LEFT
	  } else {
	    PuzzleCode.assert("rotateRight(" + direction + ") invalid direction",
	    	function(){ return false })
	  }
	},

	rotateDirection: function(oldFacing, rotateDirection) {
	  if (rotateDirection == this.LEFT) {
	    return this.rotateLeft(oldFacing)
	  } else if (rotateDirection == this.RIGHT) {
	    return this.rotateRight(oldFacing)
	  } else {
	    PuzzleCode.assert("rotateDirection(" + direction + ") invalid direction",
	    	function(){ return false })
	  }
	},

	oppositeDirection: function(direction) {
	  return this.rotateLeft(this.rotateLeft(direction))
	}
 }