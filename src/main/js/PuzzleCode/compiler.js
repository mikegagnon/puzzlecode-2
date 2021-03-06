#ifndef __COMPILER_JS__
#define __COMPILER_JS__

#include "main/js/PuzzleCode/header.js"
#include "main/js/PuzzleCode/constants.js"
#include "main/js/PuzzleCode/debug.js"
#include "main/js/PuzzleCode/direction.js"

PuzzleCode.compiler = (function(){
  "use strict"

  var compiler = {}

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

#ifdef __DEBUG__

  /**
   * Schemas for JSON objects
   ****************************************************************************/

  /**
   * A Comment object represents a compiler-generated comment for an
   * instruction --- most commonly error messages. 
   */
  compiler.CommentSchema = {
    $schema: PuzzleCode.JSON_SCHEMA,
    type: "object",
    properties: {

        // The message for the comment
        message: {type: "string"},
        
        // If the message should be hyperlinked, the urlKeyword specifies
        // the "keyword" part of the hyperlink
        urlKeyword: {type: "string"},
    },
    required: ["message"]
  }

  // Instruction objects
  compiler.InstructionSchema = {
    $schema: PuzzleCode.JSON_SCHEMA,
    type: "object",
    properties: {

        // opcode must be either absent or a value from the Opcode enum
        // if opcode is absent, then it represents a NOOP
        opcode: {enum: _.values(compiler.Opcode) },

        // Some instructions have data associated with the opcode.
        // For example, the TURN instruction has the turn-direction as the data.
        // The interpretation of data depends on opcode.
        data: {},

        // A compilter-generated comment associated with the instruction
        comment: compiler.CommentSchema,

        // true iff there was an error compiling the instruction
        error: {type: "boolean"},

        // the label for this instruction
        label: {type: "string"},

        // the index of the line from the program text
        lineIndex: {type: "integer"},
    },
    required: ["error"]
  }

  /**
   * A Program object holds a compiled program
   */
  compiler.ProgramSchema = {
    $schema: PuzzleCode.JSON_SCHEMA,
    type: "object",
    properties: {

      // the entire text of the program
      programText: {type: "string"},
      
      // if there was an error compiling programText, then instructions is
      // absent.
      // if compilation succeeded, then instructions is an array of Instruction
      // objects, where each instruction object has .error = false
      instructions: {
        type: "array",
        items: compiler.InstructionSchema
      },
      
      // comments maps line indexes (from programText) to Comment objects 
      comments: {
        type: "object",
        patternProperties: {
          "^[0-9]+$": compiler.CommentSchema
        },
        additionalProperties: false
      },

      // true iff the program violates a constraint
      constraintViolation: {type: "boolean"},

      error: {type: "boolean"}
    },
    required: ["programText", "comments", "constraintViolation", "error"]
  }

#endif // #ifdef __DEBUG__

  /**
   * Compilation errors
   ****************************************************************************/
  compiler.Error = {
    MALFORMED_MOVE: {
      message: "Malformed <code>move</code> instruction",
      urlKeyword: "malformed_move"
    },
    TURN_WITHOUT_DIRECTION: {
      message: "The <code>turn</code> instruction is missing a direction",
      urlKeyword: "turn_without_direction"
    },
    MALFORMED_TURN: {
      message: "Malformed <code>turn</code> instruction",
      urlKeyword: "malformed_turn"
    },
    turnWithBadDirection: function(direction) {
      return {
        message: "'" + compiler.trim(direction) + "' is not a valid direction",
        urlKeyword: "turn_with_bad_direction"
      }
    },
    GOTO_WITHOUT_LABEL: {
      message: "The <code>goto</code> instruction is missing a label",
      urlKeyword: "goto_without_label"
    },
    MALFORMED_GOTO: {
      message: "Malformed <codoe>goto</code> instruction",
      urlKeyword: "malformed_goto"
    },
    gotoWithInvalidLabel: function(label) {
      return {
        message: "<code>" + compiler.trim(label) + "</code> is not a valid label",
        urlKeyword: "goto_with_invalid_label"
      }
    },
    instructionWithInvalidLabel: function(label) {
      return {
        message: "<code>" + compiler.trim(label) + "</code> is not a valid label",
        urlKeyword: "instruction_with_invalid_label"
      }
    },
    duplicateLabel: function(label) {
      return {
        message: "The label <code>" + compiler.trim(label) + "</code> is already defined",
        urlKeyword: "duplicate_label"
      }
    },
    invalidOpcode: function(opcode) {
      return {
        message: "<code>" + compiler.trim(opcode) + "</code> is not an instruction",
        urlKeyword: "invalid_opcode"
      }
    },
    TOO_MANY_INSTRUCTIONS: {
      message: "Too many instructions",
      urlKeyword: "too_many_instructions"
    },
    labelDoesNotExist: function(label) {
      return {
        message: "The label <code>" + compiler.trim(label) + "</code> does not exist",
        urlKeyword: "label_does_not_exist"
      }
    },
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
      var label = tokens[1]
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

  /**
   *
   ****************************************************************************/

  // Compiles a programText into a Program object
  compiler.compile = function(programText, constraints) {

    var lines = programText.split("\n")

    var instructions = []
    var comments = {}

    // map from label-string to instruction-index
    var labels = {}

    var error = false
    var constraintViolation = false

    // first pass: do everything except finalize GOTO statements
    _(lines).forEach(function(line, i) {

      var instr = compiler.compileLine(line, labels)
      instr.lineIndex = i

      error = error || instr.error

      if ("comment" in instr) {
        comments[i] = instr.comment
      }

      if (!instr.error) {
        if ("label" in instr) {
          labels[instr.label] = instructions.length
        }
        if ("opcode" in instr) {
          instructions.push(instr)
        }
      }

    })

    // ensure max_instructions is not exceeded
    if (!error && "max_instructions" in constraints) {
      var max_instructions = constraints.max_instructions
      if (instructions.length > max_instructions) {
        error = true
        constraintViolation = true
        // add an error message at each instruction past the limit
        _.range(max_instructions, instructions.length).map(function(i){
          var instr = instructions[i]
          comments[instr.lineIndex] = compiler.Error.TOO_MANY_INSTRUCTIONS
        })
      }
    }

    // second pass: finalize GOTO statements
    _(instructions).forEach(function(instr){
      if (instr.opcode == compiler.Opcode.GOTO) {
        var label = instr.data
        if (label in labels) {
          // replace string label with numeric label
          instr.data = labels[label]
        } else {
          error = true
          comments[instr.lineIndex] = compiler.Error.labelDoesNotExist(label)
        }
      }
    })

    var program = {
      programText: programText,
      comments: comments,
      constraintViolation: constraintViolation,
      error: error
    }

    if (!error) {
      program.instructions = instructions
    }

    return program
  }

  return compiler
})()

#endif
