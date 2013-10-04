




var PuzzleCode = {




 DEBUG: false

}
PuzzleCode.HELP_URL = "http://puzzlecode.org/help/"
PuzzleCode.JSON_SCHEMA = "http://json-schema.org/draft-04/schema#"
PuzzleCode.assert = function(message, func) {
  if (PuzzleCode.DEBUG && !func()) {
    alert(message)
    console.error(message)
  }
}
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
  /**
   * Compilation errors
   ****************************************************************************/
  compiler.Error = {
    MALFORMED_MOVE: {
      message: "Malformed 'move' instruction",
      urlKeyword: "malformed_move"
    },
    TURN_WITHOUT_DIRECTION: {
      message: "The 'turn' instruction is missing a direction",
      urlKeyword: "turn_without_direction"
    },
    MALFORMED_TURN: {
      message: "Malformed 'turn' instruction",
      urlKeyword: "malformed_turn"
    },
    turnWithBadDirection: function(direction) {
      return {
        message: "'" + compiler.trim(direction) + "' is not a valid direction",
        urlKeyword: "turn_with_bad_direction"
      }
    },
    GOTO_WITHOUT_LABEL: {
      message: "The 'goto' instruction is missing a label",
      urlKeyword: "goto_without_label"
    },
    MALFORMED_GOTO: {
      message: "Malformed 'goto' instruction",
      urlKeyword: "malformed_goto"
    },
    gotoWithInvalidLabel: function(label) {
      return {
        message: "'" + compiler.trim(label) + "' is not a valid label",
        urlKeyword: "goto_with_invalid_label"
      }
    },
    instructionWithInvalidLabel: function(label) {
      return {
        message: "'" + compiler.trim(label) + "' is not a valid label",
        urlKeyword: "instruction_with_invalid_label"
      }
    },
    duplicateLabel: function(label) {
      return {
        message: "The label '" + compiler.trim(label) + "' is already defined",
        urlKeyword: "duplicate_label"
      }
    },
    invalidOpcode: function(opcode) {
      return {
        message: "'" + compiler.trim(opcode) + "' is not an instruction",
        urlKeyword: "invalid_opcode"
      }
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
   * If tokens contains a label, then returns: {
   *     tokens: [tokens but without the label],
   *     label: [the label extracted from tokens]
   *   }
   * Otherwise returns: {tokens: [original tokens] }
   */
  compiler.removeLabel = function(tokens) {
    if (tokens.length == 0) {
      return {tokens: tokens}
    } else {
      var head = tokens[0]
      var colonIndex = head.indexOf(":")

      // if no colon in head
      if (colonIndex <= 0) {
        return {tokens: tokens}
      }
      // if head contains only a label
      else if (colonIndex == head.length - 1) {
        return {
          label: head.substr(0, head.length - 1),
          tokens: _.rest(tokens)
        }
      }
      // if head contains a label and another token
      else {
        var newHead = head.substr(colonIndex + 1, head.length)
        tokens[0] = newHead
        return {
          label: head.substr(0, colonIndex),
          tokens: tokens
        }
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
