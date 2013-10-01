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

  // Returns an Instruction object populated with: opcode, data, comment, error 
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

  // Returns an Instruction object populated with: opcode, data, comment, error
  compiler.compileTurn = function(tokens) {

    PuzzleCode.assert("tokens[0] must == 'turn'", function(){
      return tokens[0] == "turn"
    })

    var comment = null
    var error = false
    var data = null

    if (tokens.length == 1) {
      comment = compiler.Error.TURN_WITHOUT_DIRECTION
      error = true
    } else if (tokens.length > 2) {
      comment = compiler.Error.MALFORMED_TURN
      error = true
    } else {
      var direction = tokens[1]
      if (direction == "left") {
        data = PuzzleCode.direction.LEFT
      } else if (direction == "right") {
        data = PuzzleCode.direction.RIGHT
      } else {
        comment = compiler.Error.turnWithBadDirection(direction)
        error = true
      }
    }

    return new compiler.Instruction(compiler.Opcode.TURN, data, comment, error)
  }

  // Returns an Instruction object populated with: opcode, data, comment, error
  compiler.compileGoto = function(tokens) {

    PuzzleCode.assert("tokens[0] must == 'goto'", function(){
      return tokens[0] == "goto"
    })

    var label = null
    var comment = null
    var error = false

    if (tokens.length == 1) {
      comment = compiler.Error.GOTO_WITHOUT_LABEL
      error = true
    } else if (tokens.length > 2) {
      comment = compiler.Error.MALFORMED_GOTO
      error = true
    } else {
      label = tokens[1]
      if (!compiler.isValidLabel(label)) {
        comment = compiler.Error.gotoWithInvalidLabel(label)
        label = null
        error = true
      }
    }

    return new compiler.Instruction(compiler.Opcode.GOTO, label, comment, error)
  }

  /**
   * Returns an Instruction object populated with: opcode, data, comment, error,
   * label, and lineIndex.
   *
   * @param line a string line from a program
   * @param lineIndex the index of this line (from the array of program lines)
   * @param labels map from label-string to instruction pointer for that label
   */
  compiler.compileLine = function(line, lineIndex, labels) {
    
    var tokens = compiler.tokenize(line)
    tokens = compiler.removeComment(tokens)
    var tokensLabel = compiler.removeLabel(tokens)
    tokens = tokensLabel.tokens
    var label = tokensLabel.label

    // check for invalid labels
    if (label != null) {
      if (!compiler.isValidLabel(label)) {
        var comment = compiler.Error.instructionWithInvalidLabel(label)
        return new compiler.Instruction(null, null, comment, true, null,
          lineIndex)
      } else if (label in labels) {
        var comment = compiler.Error.duplicateLabel(label)
        return new compiler.Instruction(null, null, comment, true, null,
          lineIndex)
      }
    }

    // if the line is blank
    if (tokens.length == 0 || (tokens.length == 1 && tokens[0] == "")) {
      return new compiler.Instruction(null, null, null, false, label,
          lineIndex)
    }

    var opcode = tokens[0]
    var instruction = undefined
    if (opcode == "move") {
      instruction = compiler.compileMove(tokens)
    } else if (opcode == "turn") {
      instruction = compiler.compileTurn(tokens)
    } else if (opcode == "goto") {
      instruction = compiler.compileGoto(tokens)
    } else {
      comment = compiler.Error.invalidOpcode(opcode)
      return new compiler.Instruction(null, null, comment, true, label,
          lineIndex)
    }
    
    instruction.label = label
    instruction.lineIndex = lineIndex
    
    return instruction
  }

  return compiler
})()
