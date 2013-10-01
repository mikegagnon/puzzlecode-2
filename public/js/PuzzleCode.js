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

var PuzzleCode = {}
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

PuzzleCode.Debug = true

PuzzleCode.assert = function(message, func) {
  if (PuzzleCode.Debug && !func()) {
    alert(message)
    console.error(message)
  }
}/**
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

 PuzzleCode.HELP_URL = "http://puzzlecode.org/help/"
 PuzzleCode.JSON_SCHEMA = "http://json-schema.org/draft-04/schema#"/**
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

PuzzleCode.compiler = (function(){
  var compiler = {};

  /**
   * Constants
   ****************************************************************************/
  compiler.Opcode = {
    MOVE: 0,
    TURN: 1,
    GOTO: 2
  }

  // map of reserved words
  compiler.RESERVED_WORDS = {
    "move": true,
    "turn": true,
    "left": true,
    "right": true,
    "goto": true
  }

  compiler.MAX_TOKEN_LENGTH = 5,

  // regex for identifiers
  compiler.IDENT_REGEX = /^[A-Za-z][A-Za-z0-9_]*$/

  /**
   * Schemas for JSON objects
   ****************************************************************************/

  /**
   * A Comment object represents a compiler-generated comment for an
   * instruction --- most commonly error messages. 
   */
  compiler.CommentSchema = {
    "$schema":  PuzzleCode.JSON_SCHEMA,
    "type": "object",
    "properties": {

        // The message for the comment
        "message": { "type": "string" },

        // If the message should be hyperlinked, the urlKeyword specifies
        // the "keyword" part of the hyperlink
        "urlKeyword": { "type": "string" },
    },
    "required": ["message"]
  }

  // Instruction objects
  compiler.InstructionSchema = {
    "$schema":  PuzzleCode.JSON_SCHEMA,
    "type": "object",
    "properties": {

        // opcode must be either absent or a value from the Opcode enum
        // if opcode is absent, then it represents a NOOP
        "opcode": {"enum": _.values(compiler.Opcode) },

        // Some instructions have data associated with the opcode.
        // For example, the TURN instruction has the turn-direction as the data.
        // The interpretation of data depends on opcode.
        "data": {},

        // A compilter-generated comment associated with the instruction
        "comment": compiler.CommentSchema,

        // true iff there was an error compiling the instruction
        "error": {"type": "boolean"},

        // the label for this instruction
        "label": {"type": "string"},

        // the index of the line from the program text
        "lineIndex": {"type": "integer"},
    },
    "required": ["error"]
  }

  /**
   * Data structures
   ****************************************************************************/

  compiler.Program = function(
      // string
      programText,
      // array of instruction objects (or null if there was an error)
      instructions,
      // maps lineNumber to comment for that line
      lineComments,
      // true iff the program violates a constraint
      constraintViolation) {
    this.programText = programText
    this.instructions = instructions
    this.lineComments = lineComments
    this.constraintViolation = constraintViolation
  }

  compiler.TokensLabel = function(
      tokens,
      label) {
    this.tokens = tokens
    this.label = label
  }

  compiler.ErrorMessage = function(
      message,
      urlKeyword) {
    this.message = message
    this.urlKeyword = urlKeyword
  }

  /**
   * Compilation errors
   ****************************************************************************/
  compiler.Error = {
    MALFORMED_MOVE: {
      message:    "Malformed 'move' instruction",
      urlKeyword: "malformed_move"
    },
    TURN_WITHOUT_DIRECTION: new compiler.ErrorMessage(
      "The 'turn' instruction is missing a direction",
      "turn_without_direction"),
    MALFORMED_TURN: new compiler.ErrorMessage(
      "Malformed 'turn' instruction",
      "malformed_turn"),
    turnWithBadDirection: function(direction) {
      return new compiler.ErrorMessage(
        "'" + compiler.trim(direction) + "' is not a valid direction",
        "turn_with_bad_direction")
    },
    GOTO_WITHOUT_LABEL: new compiler.ErrorMessage(
      "The 'goto' instruction is missing a label",
      "goto_without_label"
      ),
    MALFORMED_GOTO: new compiler.ErrorMessage(
      "Malformed 'goto' instruction",
      "malformed_goto"
      ),
    gotoWithInvalidLabel: function(label) {
      return new compiler.ErrorMessage(
        "'" + compiler.trim(label) + "' is not a valid label",
        "goto_with_invalid_label")
    },
    instructionWithInvalidLabel: function(label) {
      return new compiler.ErrorMessage(
        "'" + compiler.trim(label) + "' is not a valid label",
        "instruction_with_invalid_label")
    },
    duplicateLabel: function(label) {
      return new compiler.ErrorMessage(
        "The label '" + compiler.trim(label) + "' is already defined",
        "duplicate_label")
    },
    invalidOpcode: function(opcode) {
      return new compiler.ErrorMessage(
        "'" + opcode + "' is not an instruction",
        "invalid_opcode")
    }
  }

  /**
   * Functions for tokenizing text and operating on tokens
   ****************************************************************************/
  compiler.trim = function(token) {
    return token.slice(0, compiler.MAX_TOKEN_LENGTH)
  }

  compiler.isValidLabel = function(label) {
    return label.length > 0 &&
      label.length <= compiler.MAX_TOKEN_LENGTH &&
      !(label in compiler.RESERVED_WORDS) &&
      compiler.IDENT_REGEX.test(label)
  }

  /**
   * Split line into words.
   * Returns array of words, where each word does not begin or end with
   * whitespace.
   */
  compiler.tokenize = function(line) {
    var tokens = line
      .replace(/\s+/g, " ")
      .replace(/(^\s+)|(\s+$)/g, "")
      .split(" ")
    if (_(tokens).isEqual([""])) {
      return []
    } else {
      return tokens
    }
  }

  // Returns tokens, but with any comments removed
  compiler.removeComment = function(tokens) {

    // the index for the first token that contains "//"
    var commentIndex = _.findIndex(tokens, function(token){
      return token.indexOf("//") >= 0
    })

    // if tokens does not contain a comment
    if (commentIndex < 0) {
      return tokens
    } else {
      var token = tokens[commentIndex]
      var commentCharIndex = token.indexOf("//")
      // if token begins with "//"
      if (commentCharIndex == 0) {
        return _.first(tokens, commentIndex)
      } else {
        tokens[commentIndex] = token.substr(0, commentCharIndex)
        return _.first(tokens, commentIndex + 1)
      }
    }
  }

  /**
   * If tokens contains a label, then returns:
   *  TokensLabel(tokens but without the label, label)
   * Otherwise returns:
   *  TokensLabel(tokens, null)
   */
  compiler.removeLabel = function(tokens) {
    if (tokens.length == 0) {
      return new compiler.TokensLabel(tokens, null)
    } else {
      var head = tokens[0]
      var colonIndex = head.indexOf(":")

      // if no colon in head
      if (colonIndex <= 0) {
        return new compiler.TokensLabel(tokens, null)
      }
      // if head contains only a label
      else if (colonIndex == head.length - 1) {
        var label = head.substr(0, head.length - 1)
        var newTokens = _.rest(tokens)
        return new compiler.TokensLabel(newTokens, label)
      }
      // if head contains a label and another token
      else {
        var label = head.substr(0, colonIndex)
        var newHead = head.substr(colonIndex + 1, head.length)
        // asert newHead.length > 0
        tokens[0] = newHead
        return new compiler.TokensLabel(tokens, label)
      }
    }
  }

  /**
   * Functions for compiling specific instructions
   ****************************************************************************/

  // Returns an Instruction object
  compiler.compileMove = function(tokens) {

    PuzzleCode.assert("tokens[0] must == 'move'", function(){
      return tokens[0] == "move"
    })

    var instruction = {
      opcode: compiler.Opcode.MOVE,
      error: false
    }

    if (tokens.length != 1) {
      instruction.error = true
      instruction.comment = compiler.Error.MALFORMED_MOVE
    }

    return instruction
  }

  // Returns an Instruction object
  compiler.compileTurn = function(tokens) {

    PuzzleCode.assert("tokens[0] must == 'turn'", function(){
      return tokens[0] == "turn"
    })

    var instruction = {
      opcode: compiler.Opcode.TURN,
      error: false
    }

    if (tokens.length == 1) {
      instruction.comment = compiler.Error.TURN_WITHOUT_DIRECTION
      instruction.error = true
    } else if (tokens.length > 2) {
      instruction.comment = compiler.Error.MALFORMED_TURN
      instruction.error = true
    } else {
      var direction = tokens[1]
      if (direction == "left") {
        instruction.data = PuzzleCode.direction.LEFT
      } else if (direction == "right") {
        instruction.data = PuzzleCode.direction.RIGHT
      } else {
        instruction.comment = compiler.Error.turnWithBadDirection(direction)
        instruction.error = true
      }
    }

    return instruction
  }

  // Returns an Instruction object
  compiler.compileGoto = function(tokens) {

    PuzzleCode.assert("tokens[0] must == 'goto'", function(){
      return tokens[0] == "goto"
    })

    var instruction = {
      opcode: compiler.Opcode.GOTO,
      error: false
    }

    if (tokens.length == 1) {
      instruction.comment = compiler.Error.GOTO_WITHOUT_LABEL
      instruction.error = true
    } else if (tokens.length > 2) {
      instruction.comment = compiler.Error.MALFORMED_GOTO
      instruction.error = true
    } else {
      label = tokens[1]
      if (compiler.isValidLabel(label)) {
        instruction.data = label
      } else {
        instruction.comment = compiler.Error.gotoWithInvalidLabel(label)
        instruction.error = true
      }
    }

    return instruction
  }

  /**
   * Returns an Instruction object.
   *
   * @param line a string line from a program
   * @param labels map from label-string to instruction pointer for that label
   */
  compiler.compileLine = function(line, labels) {
    
    var tokens = compiler.tokenize(line)
    tokens = compiler.removeComment(tokens)
    var tokensLabel = compiler.removeLabel(tokens)
    tokens = tokensLabel.tokens
    var label = tokensLabel.label

    var instruction = {
      error: false
    } 

    // check for invalid labels
    if (label != null) {
      if (!compiler.isValidLabel(label)) {
        return {
          comment: compiler.Error.instructionWithInvalidLabel(label),
          error: true
        }
      } else if (label in labels) {
        return {
          comment: compiler.Error.duplicateLabel(label),
          error: true
        }
      } else {
        instruction.label = label
      }
    }

    // if the line is blank
    if (tokens.length == 0 || (tokens.length == 1 && tokens[0] == "")) {
      return instruction
    }

    var opcode = tokens[0]
    if (opcode == "move") {
      instruction = _.merge(instruction, compiler.compileMove(tokens))
    } else if (opcode == "turn") {
      instruction = _.merge(instruction, compiler.compileTurn(tokens))
    } else if (opcode == "goto") {
      instruction = _.merge(instruction, compiler.compileGoto(tokens))
    } else {
      instruction.comment = compiler.Error.invalidOpcode(opcode)
      instruction.error = true
    }
    
    return instruction
  }

  return compiler
})()
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

var FILENAME = undefined
var TEST = undefined

function test(testCase, bool) {
  if (!bool) {
    console.error("Failed test in " + FILENAME + ":" + TEST)
    console.dir(testCase)
  }
}
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

FILENAME = "direction_test.js"

var direction = PuzzleCode.direction

/******************************************************************************/
TEST = "PuzzleCode.direction.rotateLeft"
var cases = [
	{
		direction: 			direction.UP,
		expectedOutput: direction.LEFT
	},
	{
		direction: 			direction.LEFT,
		expectedOutput: direction.DOWN
	},
	{
		direction: 			direction.DOWN,
		expectedOutput: direction.RIGHT
	},
	{
		direction: 			direction.RIGHT,
		expectedOutput: direction.UP
	},
]

_(cases).forEach(function(tc){
	tc.output = direction.rotateLeft(tc.direction)
	test(tc, _.isEqual(tc.output, tc.expectedOutput))
})

/******************************************************************************/
TEST = "PuzzleCode.direction.rotateRight"
var cases = [
	{
		direction: 			direction.UP,
		expectedOutput: direction.RIGHT
	},
	{
		direction: 			direction.RIGHT,
		expectedOutput: direction.DOWN
	},
	{
		direction: 			direction.DOWN,
		expectedOutput: direction.LEFT
	},
	{
		direction: 			direction.LEFT,
		expectedOutput: direction.UP
	},
]

_(cases).forEach(function(tc){
	tc.output = direction.rotateRight(tc.direction)
	test(tc, _.isEqual(tc.output, tc.expectedOutput))
})

/******************************************************************************/
TEST = "PuzzleCode.direction.rotateDirection"
var cases = [
	{
		oldFacing:        direction.UP,
		rotateDirection: 	direction.RIGHT,
		expectedOutput: 	direction.RIGHT
	},
	{
		oldFacing:        direction.LEFT,
		rotateDirection: 	direction.LEFT,
		expectedOutput: 	direction.DOWN
	},
]

_(cases).forEach(function(tc){
	tc.output = direction.rotateDirection(tc.oldFacing, tc.rotateDirection)
	test(tc, _.isEqual(tc.output, tc.expectedOutput))
})

/******************************************************************************/
TEST = "PuzzleCode.direction.oppositeDirection"
var cases = [
	{
		direction: 			direction.UP,
		expectedOutput: direction.DOWN
	},
	{
		direction: 			direction.DOWN,
		expectedOutput: direction.UP
	},
	{
		direction: 			direction.LEFT,
		expectedOutput: direction.RIGHT
	},
	{
		direction: 			direction.RIGHT,
		expectedOutput: direction.LEFT
	}
]

_(cases).forEach(function(tc){
	tc.output = direction.oppositeDirection(tc.direction)
	test(tc, _.isEqual(tc.output, tc.expectedOutput))
})
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

FILENAME = "compiler_test.js"

var compiler = PuzzleCode.compiler

/******************************************************************************/
TEST = "PuzzleCode.compiler.tokenize"
var cases = [
	{
		line: "",
		expectedOutput: []
	},
	{
		line: "  ",
		expectedOutput: []
	},
	{
		line: "test",
		expectedOutput: ["test"]
	},
	{
		line: "this is a test",
		expectedOutput: ["this", "is", "a", "test"]
	},
	{
		line: "  this   is  \t a test ",
		expectedOutput: ["this", "is", "a", "test"]
	}
]

_(cases).forEach(function(tc){
	tc.output = compiler.tokenize(tc.line)
	test(tc, _.isEqual(tc.output, tc.expectedOutput))
})

/******************************************************************************/
TEST = "PuzzleCode.compiler.removeComment"
var cases = [
	{
		tokens: 				["this", "is", "a", "test"],
		expectedOutput: ["this", "is", "a", "test"]
	},
	{
		tokens: 				["test", "//", "blah"],
		expectedOutput: ["test"]
	},
	{
		tokens: 				["test//blah"],
		expectedOutput: ["test"]
	},
	{
		tokens: 				["test", "//blah"],
		expectedOutput: ["test"]
	},
	{
		tokens: 				["//blah"],
		expectedOutput: []
	},
	{
		tokens: 				["//", "blah"],
		expectedOutput: []
	},
]

_(cases).forEach(function(tc){
	tc.output = compiler.removeComment(tc.tokens)
	test(tc, _.isEqual(tc.output, tc.expectedOutput))
})

/******************************************************************************/
TEST = "PuzzleCode.compiler.removeLabel"
var cases = [
	{
		tokens: 				[],
		expectedOutput: new compiler.TokensLabel([], null)
	},
	{
		tokens: 				["1"],
		expectedOutput: new compiler.TokensLabel(["1"], null)
	},
	{
		tokens: 				["a:"],
		expectedOutput: new compiler.TokensLabel([], "a")
	},
	{
		tokens: 				["1", "2", "3"],
		expectedOutput: new compiler.TokensLabel(["1", "2", "3"], null)
	},
	{
		tokens: 				["a:", "1", "2", "3"],
		expectedOutput: new compiler.TokensLabel(["1", "2", "3"], "a")
	},
	{
		tokens: 				["a:1", "2", "3"],
		expectedOutput: new compiler.TokensLabel(["1", "2", "3"], "a")
	},
	{
		tokens: 				[":", "2", "3"],
		expectedOutput: new compiler.TokensLabel([":", "2", "3"], null)
	},
]

_(cases).forEach(function(tc){
	tc.output = compiler.removeLabel(tc.tokens)
	test(tc, _.isEqual(tc.output, tc.expectedOutput))
})

/******************************************************************************/
TEST = "PuzzleCode.compiler.isValidLabel"

var LONGEST_TOKEN = _(compiler.MAX_TOKEN_LENGTH)
	.times()
	.map(function(){return 'x'})
	.join("")

var cases = [
	{ expectedOutput: true, label: "x" },
	{ expectedOutput: true, label: "x1" },
	{ expectedOutput: true, label: "foo" },
	{ expectedOutput: true, label: "foo" },
	{ expectedOutput: true, label: LONGEST_TOKEN },
	{ expectedOutput: false, label: "" },
	{ expectedOutput: false, label: "goto" },
	{ expectedOutput: false, label: "move" },
	{ expectedOutput: false, label: "1x" },
	{ expectedOutput: false, label: "x-1" },
	{ expectedOutput: false, label: LONGEST_TOKEN + "x" },
]

_(cases).forEach(function(tc){
	tc.output = compiler.isValidLabel(tc.label)
	test(tc, _.isEqual(tc.output, tc.expectedOutput))
})

/******************************************************************************/
TEST = "PuzzleCode.compiler.compileMove"
var cases = [
	{
		tokens: ["move"],
		expectedOutput: {
			opcode: compiler.Opcode.MOVE,
			error: false
		}
	},
	{
		tokens: ["move", "foo"],
		expectedOutput: {
			opcode: compiler.Opcode.MOVE,
			error: true,
			comment: compiler.Error.MALFORMED_MOVE
		}
	},
]

_(cases).forEach(function(tc){
	tc.output = compiler.compileMove(tc.tokens)
	test(tc, tv4.validate(tc.output, compiler.InstructionSchema))
	test(tc, _.isEqual(tc.output, tc.expectedOutput))
})

/******************************************************************************/
TEST = "PuzzleCode.compiler.compileTurn"
var cases = [
	{
		tokens: ["turn", "left"],
		expectedOutput: {
			opcode: compiler.Opcode.TURN,
			data: PuzzleCode.direction.LEFT,
			error: false,
		}
	},
	{
		tokens: ["turn", "right"],
		expectedOutput: {
			opcode: compiler.Opcode.TURN,
			data: PuzzleCode.direction.RIGHT,
			error: false,
		}
	},
	{
		tokens: ["turn"],
		expectedOutput: {
			opcode: compiler.Opcode.TURN,
			comment: compiler.Error.TURN_WITHOUT_DIRECTION,
			error: true,
		}
	},
	{
		tokens: ["turn", "left", "right"],
		expectedOutput: {
			opcode: compiler.Opcode.TURN,
			comment: compiler.Error.MALFORMED_TURN,
			error: true,
		}
	},
	{
		tokens: ["turn", "foo"],
		expectedOutput: {
			opcode: compiler.Opcode.TURN,
			comment: compiler.Error.turnWithBadDirection("foo"),
			error: true,
		}
	},
]

_(cases).forEach(function(tc){
	tc.output = compiler.compileTurn(tc.tokens)
	test(tc, tv4.validate(tc.output, compiler.InstructionSchema))
	test(tc, _.isEqual(tc.output, tc.expectedOutput))
})

/******************************************************************************/
TEST = "PuzzleCode.compiler.compileGoto"
var cases = [
	{
		tokens: ["goto", "bar"],
		expectedOutput: {
			opcode: compiler.Opcode.GOTO,
			data: "bar",
			error: false,
		}
	},
	{
		tokens: ["goto"],
		expectedOutput: {
			opcode: compiler.Opcode.GOTO,
			comment: compiler.Error.GOTO_WITHOUT_LABEL,
			error: true,
		}
	},
	{
		tokens: ["goto", "foo", "bar"],
		expectedOutput: {
			opcode: compiler.Opcode.GOTO,
			comment: compiler.Error.MALFORMED_GOTO,
			error: true,
		}
	},
	{
		tokens: ["goto", "1x"],
		expectedOutput: {
			opcode: compiler.Opcode.GOTO,
			comment: compiler.Error.gotoWithInvalidLabel("1x"),
			error: true,
		}
	},
]

_(cases).forEach(function(tc){
	tc.output = compiler.compileGoto(tc.tokens)
	test(tc, tv4.validate(tc.output, compiler.InstructionSchema))
	test(tc, _.isEqual(tc.output, tc.expectedOutput))
})

/******************************************************************************/
TEST = "PuzzleCode.compiler.compileLine"
var cases = [
	{
		line: "move",
		labels: {},
		expectedOutput: {
			opcode: compiler.Opcode.MOVE,
			error: false,
		}
	},
	{
		line: "  move  // foo bar baz",
		labels: {},
		expectedOutput: {
			opcode: compiler.Opcode.MOVE,
			error: false,
		}
	},
	{
		line: "foo:  move  // foo bar baz",
		labels: {},
		expectedOutput: {
			opcode: compiler.Opcode.MOVE,
			error: false,
			label: "foo"
		}
	},
	{
		line: "goto:  move  // foo bar baz",
		labels: {},
		expectedOutput: {
			error: true,
			comment: compiler.Error.instructionWithInvalidLabel("goto")
		}
	},
	{
		line: "foo: move",
		labels: {"foo": 0},
		expectedOutput: {
			error: true,
			comment: compiler.Error.duplicateLabel("foo")
		}
	},
	{
		line: "    ",
		labels: {},
		expectedOutput: {
			error: false,
		}
	},
	{
		line: "  foo:  ",
		labels: {},
		expectedOutput: {
			error: false,
			label: "foo"
		}
	},
	{
		line: "xyz left",
		labels: {},
		expectedOutput: {
			error: true,
			comment: compiler.Error.invalidOpcode("xyz")
		}
	},
	{
		line: "turn left",
		lineIndex: 1,
		labels: {},
		expectedOutput: {
			opcode: compiler.Opcode.TURN,
			data: PuzzleCode.direction.LEFT,
			error: false,
		}
	},
	{
		line: "bar: goto foo",
		lineIndex: 1,
		labels: {},
		expectedOutput: {
			opcode: compiler.Opcode.GOTO,
			data: "foo",
			label: "bar",
			error: false,
		}
	},
]

_(cases).forEach(function(tc){
	tc.output = compiler.compileLine(tc.line, tc.labels)
	test(tc, tv4.validate(tc.output, compiler.InstructionSchema))
	test(tc, _.isEqual(tc.output, tc.expectedOutput))
})
