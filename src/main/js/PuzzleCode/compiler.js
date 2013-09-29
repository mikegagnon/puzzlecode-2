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
   * Data structures
   ****************************************************************************/
  compiler.Instruction = function (
      // value must be in the Opcode enum
      opcode,
      // data object, whose type is determined by opcode
      data,
      // from program text
      comment,
      error,      
      label,
      lineIndex
      ) {
    this.opcode = opcode
    this.data = data
    this.comment = comment
    this.error = error
    this.label = label
    this.lineIndex = lineIndex
  }

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
      url) {
    this.message = message
    this.url = url
  }

  /**
   * Constants
   ****************************************************************************/
  compiler.Opcode = {
    MOVE: 0,
    TURN: 1,
    GOTO: 2
  }

  // map of reserved words
  compiler.ReservedWords = {
    "move": true,
    "turn": true,
    "left": true,
    "right": true,
    "goto": true
  }

  compiler.Error = {
    MALFORMED_MOVE: new compiler.ErrorMessage(
      "Malformed 'move' instruction",
      PuzzleCode.HELP_URL + "malformed_move"),
    TURN_WITHOUT_DIRECTION: new compiler.ErrorMessage(
      "The 'turn' instruction is missing a direction",
      PuzzleCode.HELP_URL + "turn_without_direction"),
    MALFORMED_TURN: new compiler.ErrorMessage(
      "Malformed 'turn' instruction",
      PuzzleCode.HELP_URL + "malformed_turn")
  }

  /**
   * Functions for generating specific error messages
   ****************************************************************************/

  compiler.errorTurnWithBadDirection = function(direction) {
    return new compiler.ErrorMessage(
      "'" + direction + "' is not a valid direction",
      PuzzleCode.HELP_URL + "turn_with_bad_direction")
  }

  /**
   * Functions for tokenizing text and operating on tokens
   ****************************************************************************/

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

    var instruction = null
    var comment = null
    var error = false

    if (tokens.length == 1) {
      comment = null
    } else {
      error = true
      comment = compiler.Error.MALFORMED_MOVE
    }

    return new compiler.Instruction(compiler.Opcode.MOVE, null, comment, error)
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
        comment = compiler.errorTurnWithBadDirection(direction)
        error = true
      }
    }

    return new compiler.Instruction(compiler.Opcode.TURN, data, comment, error)
  }


  return compiler
})()
