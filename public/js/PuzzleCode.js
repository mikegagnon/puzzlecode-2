




var PuzzleCode = {


 DEBUG: true



}
// yields a new width*height matrix
// if defaultValue is a function then matrix[x][y] = defaultValue(x, y)
// else matrix[x][y] = defaultValue
PuzzleCode.newMatrix = function(width, height, defaultValue) {
  "use strict"
  return _.times(width, function(x) {
    if (typeof defaultValue == "function") {
      return _.times(height, function(y){
        return defaultValue(x,y)
      })
    } else {
      return _.times(height, function(){
        return defaultValue
      })
    }
  })
}
// removes a leading '#' from id, if it exists 
PuzzleCode.chomp = function(id) {
  return id.replace(/^#/, '')
}
PuzzleCode.HELP_URL_TEMPLATE = "http://puzzlecode.org?keyword={{{urlKeyword}}}"
PuzzleCode.JSON_SCHEMA = "http://json-schema.org/draft-04/schema#"
PuzzleCode.assert = function(message, func) {
  "use strict"
  if (PuzzleCode.DEBUG && !func()) {
    alert(message)
    console.error(message)
  }
}
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
 direction.dxdy = function(dir) {
  var result = {dx: 0, dy: 0}
  if (dir == direction.UP) {
     result.dy = -1
   } else if (dir == direction.DOWN) {
     result.dy = 1
   } else if (dir == direction.LEFT) {
     result.dx = -1
   } else if (dir == direction.RIGHT) {
     result.dx = 1
   } else {
     PuzzleCode.assert("this code shoudln't be reachable: dxdy",
      function(){ return false })
   }
   return result
 }
 return direction
})()
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
PuzzleCode.bot = (function(){
  "use strict"
  var bot = {}
  bot.Color = {
    BLUE: 0,
    RED: 1
  }
 /**
   * Schemas for JSON objects
   ****************************************************************************/
  // A BotConfig object describes the configuration for a single bot
  bot.BotConfigSchema = {
    $schema: PuzzleCode.JSON_SCHEMA,
    type: "object",
    properties: {
      x: {type: "integer"},
      y: {type: "integer"},
     color: {enum: _.values(bot.Color) },
      facing: {enum: PuzzleCode.direction.diretions },
      programText: {type: "string"},
      constraints: {type: "object"}
    },
    required: ["x", "y", "color", "facing", "programText", "constraints"]
  }
 return bot
})()
// yields a new width*height matrix
// if defaultValue is a function then matrix[x][y] = defaultValue(x, y)
// else matrix[x][y] = defaultValue
PuzzleCode.newMatrix = function(width, height, defaultValue) {
  "use strict"
  return _.times(width, function(x) {
    if (typeof defaultValue == "function") {
      return _.times(height, function(y){
        return defaultValue(x,y)
      })
    } else {
      return _.times(height, function(){
        return defaultValue
      })
    }
  })
}
// removes a leading '#' from id, if it exists 
PuzzleCode.chomp = function(id) {
  return id.replace(/^#/, '')
}
PuzzleCode.board = (function(){
  "use strict"
  var board = {}
  board.PlayState = {
    /**
     * The difference between PAUSED and INITIAL_STATE_PAUSED is that 
     * INITIAL_STATE_PAUSED denotes that the simulation has NOT yet begun.
     * Therefore it is OK to do things like edit the program.
     */
    INITIAL_STATE_PAUSED: 0,
    PAUSED: 1,
    STEPPING: 2, // the animation for a single step is currently under way
    PLAYING: 3
  }
  board.getBot = function(board, botId) {
    return _.find(board.state.bots, function(b){return b.id == botId})
  }
  // ensure the all the board invariants hold
  board.check = function(board) {
    if (!PuzzleCode.DEBUG) {
      return
    }
    PuzzleCode.assert("malformed board.config", function(){
      return tv4.validate(board.config, PuzzleCode.board.BoardConfigSchema)
    })
    PuzzleCode.assert("board.bots does not match board.state", function(){
      var matrixBots = []
      _.times(board.config.width, function(x){
        _.times(board.config.height, function(y){
          if ("bot" in board.state.matrix[x][y]) {
            var bot = board.state.matrix[x][y].bot
            PuzzleCode.assert("bot / matrix disagree for bot.x",
              function(){return bot.x == x})
            PuzzleCode.assert("bot / matrix disagree for bot.y",
              function(){return bot.y == y})
            matrixBots.push(bot)
          }
        })
      })
      matrixBots = _.sortBy(matrixBots, function(bot){ return bot.id })
      var match = _.isEqual(board.state.bots, matrixBots)
      if (!match) {
        console.error("board.state.bots")
        console.dir(board.state.bots)
        console.error("matrixBots")
        console.dir(matrixBots)
      }
      return match
    })
  }
  board.isEmptyCell = function(board, x, y) {
    var cell = board.state.matrix[x][y]
    if ("bot" in cell) {
      return false
    } else {
      return true
    }
  }
  board.newState = function(boardConfig) {
    var state = {
      error: false
    }
    state.playState = board.PlayState.INITIAL_STATE_PAUSED
    // Create matrix
    state.matrix = PuzzleCode.newMatrix(boardConfig.width, boardConfig.height,
      function(){ return {} })
    // Initialize bots
    state.bots = _.cloneDeep(boardConfig.bots)
    _(state.bots).forEach(function(bot, id){
      // Every bot has UUID (unique relative to the board object)
      bot.id = id
      // instruction pointer into the bot's program (index into instructions)
      bot.ip = 0
      var program = PuzzleCode.compiler.compile(bot.programText, bot.constraints)
      bot.program = program
      state.error = state.error || program.error
      PuzzleCode.assert("newState: bot.x bad", function(){
        return bot.x >=0 && bot.x < boardConfig.width
      })
      PuzzleCode.assert("newState: bot.y bad", function(){
        return bot.y >=0 && bot.y < boardConfig.height
      })
      state.matrix[bot.x][bot.y].bot = bot
    })
    return state
  }
  board.DEFAULT_CONFIG = {
    animationStyle: "Normal",
    width: 10,
  height: 5,
  cellSize: 32,
    buttons: [],
    bots: [],
    editors: []
 }
 /**
   * Schemas for JSON objects
   ****************************************************************************/
  // A BoardConfig object
  board.BoardConfigSchema = {
    $schema: PuzzleCode.JSON_SCHEMA,
    type: "object",
    properties: {
      animationStyle: {enum: ["Normal"] },
      width: {type: "integer"},
     height: {type: "integer"},
     cellSize: {type: "integer"},
      buttons: {
        type: "array",
        items: {enum: ["playpause", "reset", "step", "editor_reset"] }
      },
      bots: {
        type: "array",
        items: PuzzleCode.bot.BotConfigSchema
      },
      // editors == array of bot ids that have editors
      editors: {
        type: "array",
        items: "integer"
      }
    },
    required: ["height", "width", "cellSize", "bots"]
  }
 return board
})()
/**
 * A board may have zero or more editors; each editor is associated with
 * exactly one bot.
 */
PuzzleCode.editor = (function(){
  "use strict"
  var editor = {}
  /**
   * One time, global initialization code
   ****************************************************************************/
  // Define a syntax highlighter for the PuzzleCode language
  CodeMirror.defineMIME("text/x-puzzlecode", {
    name: "clike",
    keywords: PuzzleCode.compiler.RESERVED_WORDS,
    blockKeywords: {},
    atoms: {},
    hooks: {
      "@": function(stream) {
        stream.eatWhile(/[\w\$_]/);
        return "meta";
      }
    }
  })
  editor.getAreaDomId = function(board, editorId) {
    return board.divId + "-editor-area-" + editorId
  }
  editor.getDomId = function(board, editorId) {
    return board.divId + "-editor-" + editorId
  }
  editor.getToolbarDomId = function(board, editorId) {
    return board.divId + "-editor-toolbar-" + editorId
  }
  editor.getToolbarButtonsDomId = function(board, editorId) {
    return board.divId + "-editor-toolbar-buttons-" + editorId
  }
  editor.getButtonId = function(board, editorId, buttonName) {
    return board.divId + "-editor-" + editorId + "-button-" + buttonName
  }
  editor.buttonTemplate = "    <button type='button' class='btn btn-default btn-sm'     id='{{{buttonId}}}'     onclick=\"PuzzleCode.click('{{{buttonName}}}',                                '{{{boardDivId}}}',                                 {{{editorId}}})\" >     <span class='glyphicon {{{glyph}}}'></span>     </button>"
  editor.drawButtons = function(board, editorId) {
    var toolbarId = editor.getToolbarDomId(board, editorId)
    var buttonsId = editor.getToolbarButtonsDomId(board, editorId)
    $(toolbarId).append(
      "<div " +
      "id='" + PuzzleCode.chomp(buttonsId) + "' " +
      "class='btn-group'>" +
      "</div>")
    var buttonOrder = [
      "editor_reset",
    ]
    _(buttonOrder).forEach(function(buttonName){
      if (_.contains(board.config.buttons, buttonName)) {
        $(buttonsId).append(
          Mustache.render(editor.buttonTemplate, {
            buttonId: PuzzleCode.chomp(editor.getButtonId(board, editorId, buttonName)),
            buttonName: buttonName,
            glyph: PuzzleCode.buttons[buttonName].glyph,
            boardDivId: board.divId,
            editorId: editorId
          }))
      }
    })
    // a hidden button, to ensure that whitespace is always the same, even
    // if there are no buttons
    $(toolbarId).append(
      "<div " +
      "class='btn-group'>" +
      "<button type='button' class='btn btn-default btn-sm' style='visibility: hidden'>" +
      "<span class='glyphicon glyphicon-refresh'></span>" +
      "</button>" +
      "</div>")
  }
  editor.undoHighlightLine = function(editorObject, lineIndex, css) {
    var lineHandle = editorObject.cm.getLineHandle(lineIndex)
    editorObject.cm.removeLineClass(lineHandle, "background", css);
  }
  editor.highlightLine = function(editorObject, lineIndex, css) {
    var lineHandle = editorObject.cm.getLineHandle(lineIndex)
    editorObject.cm.addLineClass(lineHandle, "background", css)
  }
  editor.getPreElement = function(editorObject, lineIndex) {
    var editorDomId = editor.getDomId(editorObject.board, editorObject.editorId)
    return $(editorDomId + " pre").eq(+lineIndex + 1)
  }
  editor.errorPopoverTemplate = '    <p>       {{{message}}}     </p>     <a href="{{{url}}}" class="btn btn-info btn-sm">    Help page for this error</button>     '
  editor.errorBootstrapTemplate = '<div class="popover panel panel-warning">      <div class="arrow"></div>      <h3 class="popover-title panel-heading"></h3>      <div class="popover-content panel-body"></div>    </div>'
  editor.showError = function(editorObject, lineIndex, comment) {
    // Only show error if it's not already showing
    if (!(lineIndex in editorObject.comments)) {
      var preElement = editor.getPreElement(editorObject, lineIndex)
      editorObject.comments[lineIndex] = preElement
      var url = Mustache.render(PuzzleCode.HELP_URL_TEMPLATE, {
          urlKeyword: comment.urlKeyword
        })
      var content = Mustache.render(editor.errorPopoverTemplate, {
          message: comment.message,
          url: url
        })
      preElement.popover({
        placement: "right",
        container: "body",
        html: true,
        title: "<strong>Error</strong>",
        content: content,
        template: editor.errorBootstrapTemplate
      })
      preElement.popover('show')
      editor.highlightLine(editorObject, lineIndex, "error-line")
    }
  }
  editor.removeError = function(editorObject, lineIndex) {
    PuzzleCode.assert("lineIndex not in editorObject.comments", function(){
      return lineIndex in editorObject.comments
    })
    var preElement = editorObject.comments[lineIndex]
    delete editorObject.comments[lineIndex]
    preElement.popover('destroy')
    editor.undoHighlightLine(editorObject, lineIndex, "error-line")
  }
  editor.removeObsoleteErrors = function(editorObject, program) {
    _.forOwn(editorObject.comments, function(comment, lineIndex) {
      // if the line has a popover, but no corresponding comment in program
      if (!(lineIndex in program.comments)) {
        editor.removeError(editorObject, lineIndex)
      }
    })
  }
  editor.newEditor = function(board, botId, editorId) {
    var settings = {
      gutters: ["note-gutter", "CodeMirror-linenumbers"],
      mode: "text/x-puzzlecode",
      theme: "eclipse",
      smartIndent: false,
      lineNumbers: true,
      height: 50
    }
    /*<div id="codeMirrorEdit"></div>*/
    var areaId = editor.getAreaDomId(board, editorId)
    $(board.divId).append(
      "<div " +
      "class='editor-area' " +
      "id='" + PuzzleCode.chomp(areaId) + "'>" +
      "</div>")
    var toolbarId = editor.getToolbarDomId(board, editorId)
    $(areaId).append(
      "<div " +
      "id='" + PuzzleCode.chomp(toolbarId) + "' " +
      "class='btn-toolbar'></div>")
    editor.drawButtons(board, editorId)
    var editorDomId = editor.getDomId(board, editorId)
    var editorElement = $(areaId).append(
      "<div " +
      "class='editor-wrapper' " +
      "id='" + PuzzleCode.chomp(editorDomId) + "'>" +
      "</div>")
    var cm = CodeMirror(document.getElementById(PuzzleCode.chomp(editorDomId)),
                        settings)
    var editorObject = {
      board: board,
      editorId: editorId,
      botId: botId,
      cm: cm,
      comments: {}
    }
    cm.setSize("100%", "170px")
    var bot = PuzzleCode.board.getBot(board, botId)
    cm.setValue(bot.programText)
    // Monitor the editor for changes
    cm._oldLine = 0
    cm.on("cursorActivity", function(cm) {
      if (board.state.playState == PuzzleCode.board.PlayState.INITIAL_STATE_PAUSED) {
        var newLine = cm.getCursor().line
        // Only __add__ errors if the curser moves onto a new line
        if (cm._oldLine != newLine) {
          // TODO: incremental compiler if this is too expensive
          var program = PuzzleCode.compiler.compile(cm.getValue(), {})
          cm._oldLine = newLine
          editor.removeObsoleteErrors(editorObject, program)
          if (program.error) {
            _.forOwn(program.comments, function(comment, lineIndex){
              editor.showError(editorObject, +lineIndex, comment)
            })
          }
        }
        // but always try to remove errors, if any exist
        else if (!_.isEmpty(editorObject.comments)) {
          var program = PuzzleCode.compiler.compile(cm.getValue(), {})
          editor.removeObsoleteErrors(editorObject, program)
        }
      }
    })
    // You cannot edit the program, unless it is in the reset state
    cm.on("beforeChange", function(cm, change) {
      if (board.state.playState != PuzzleCode.board.PlayState.INITIAL_STATE_PAUSED) {
        change.cancel()
      }
    })
    return editorObject
  }
  return editor
})()
PuzzleCode.viz = (function(){
  "use strict"
  var direction = PuzzleCode.direction
  var viz = {}
  viz.AnimationSpeed = {
   "Normal": {
    duration: 400,
    delay: 600,
    easing: "cubic-in-out"
   }
  }
 viz.drawBoardContainer = function(board) {
   var h = board.config.heightPixels =
    board.viz.xScale(board.config.height)
   var w = board.config.widthPixels =
    board.viz.yScale(board.config.width)
   board.d3 = d3.select(board.svgId)
     .attr("height", h)
     .attr("width", w)
 }
 viz.drawCells = function(board) {
  var hlines = _.range(1, board.config.height)
  var vlines = _.range(1, board.config.width)
  board.d3.selectAll(".hline")
   .data(hlines)
   .enter().append("svg:line")
   .attr("x1", 0)
   .attr("y1", board.viz.yScale)
   .attr("x2", board.config.widthPixels)
   .attr("y2", board.viz.yScale)
   .attr("class", "pc-grid-line")
  board.d3.selectAll(".vline")
   .data(vlines)
   .enter().append("svg:line")
   .attr("x1", board.viz.xScale)
   .attr("y1", 0)
   .attr("x2", board.viz.xScale)
   .attr("y2", board.config.heightPixels)
   .attr("class", "pc-grid-line")
 }
 viz.directionToAngle = function(dir) {
   if (dir == direction.UP) {
     return 0
   } else if (dir == direction.DOWN) {
     return 180
   } else if (dir == direction.LEFT) {
     return -90
   } else if (dir == direction.RIGHT) {
     return 90
   } else {
     PuzzleCode.assert("directionToAngle bad direction: " + direction,
      function(){ return false })
   }
 }
 // Returns an svg translation command to update the bot's __pixel__ position on
 // the board and it's direction
 viz.botTransformPixels = function(board, x, y, facing) {
  var halfCell = board.config.cellSize / 2
   return "translate(" + x + ", " + y + ") " +
     "rotate("
      + viz.directionToAngle(facing) + " "
      + halfCell + " " + halfCell +")"
 }
 // Like botTransformPixels, except using __cell__ position instead of __pixel__
 viz.botTransform = function(board, bot) {
   var x = board.viz.xScale(bot.x)
   var y = board.viz.yScale(bot.y)
   return viz.botTransformPixels(board, x, y, bot.facing)
 }
 viz.botId = function(board, bot) {
   return board.svgId + "_bot_" + bot.id
 }
 viz.drawBots = function(board){
   board.d3.selectAll(".bot")
     .data(board.state.bots)
     .enter().append("svg:image")
     .attr("class", "board-item")
     .attr("id", function(bot){ return PuzzleCode.chomp(viz.botId(board, bot)) })
     .attr("xlink:href", "img/bluebot.svg")
     .attr("height", board.config.cellSize)
     .attr("width", board.config.cellSize)
     .attr("transform", function(bot){ return viz.botTransform(board, bot) })
 }
 viz.drawButtons = function(board) {
  $(board.toolbarId)
   .append("<div " +
          "id='" + PuzzleCode.chomp(board.playbackButtonsId) + "' " +
       "class='btn-group'></div>")
  var buttonTemplate =
   "<button type='button' class='btn btn-default btn-sm' " +
   "id='{{{buttonId}}}' " +
   "onclick=\"PuzzleCode.click('{{{buttonName}}}', '{{{boardDivId}}}')\" >" +
   "<span class='glyphicon {{{glyph}}}'></span>" +
   "</button>"
  var buttonOrder = [
   "reset",
   "step",
   "playpause"
  ]
  _(buttonOrder).forEach(function(buttonName){
   if (_.contains(board.config.buttons, buttonName)) {
    $(board.playbackButtonsId)
     .append(Mustache.render(buttonTemplate, {
      buttonId: PuzzleCode.chomp(PuzzleCode.buttons.getId(board, buttonName)),
      buttonName: buttonName,
      glyph: PuzzleCode.buttons[buttonName].glyph,
      boardDivId: board.divId
     }))
   }
  })
 }
 /**
	 * Returns a lodash collection containing "viz objects" for bots
	 * that have the visualizeKey. A "viz object" is an object like: {
	 *    viz: board.visualize.step.bot[bot.id][visualizeKey] 
	 *    bot: the bot
	 * }
	 */
 viz.getViz = function(animationSpec, board, visualizeKey) {
   var x = _(board.state.bots)
     .filter(function(bot){
       return bot.id in animationSpec.bot &&
         visualizeKey in animationSpec.bot[bot.id]
     })
     .map(function(bot) {
       return {
         viz: animationSpec.bot[bot.id][visualizeKey],
         bot: bot
       }
     })
   return x
 }
 /**
	 * For each bot with the specified visualization, execute:
	 *    fn(viz, bot)
	 * where:
	 *   viz == board.visualize.step.bot[bot.id][visualizeKey]
	 */
 viz.visualizeBot = function(animationSpec, board, visualizeKey, fn) {
   viz.getViz(animationSpec, board, visualizeKey)
     .forEach(function(v) {
       fn(v.viz, v.bot)
     })
 }
 /**
	 * For each bot with the specified visualization, execute:
	 *    fn(transition, viz, bot)
	 * where:
	 *   transition is a d3 transition with only that bot selected
	 *   viz == board.visualize.step.bot[bot.id][visualizeKey]
	 * IMPORTANT NOTE: It seems that there can only be ONE transition on a bot
	 * at a time, due to D3. Even if two transitions produce completely different
	 * effects, it seems that merely selecting the same bot twice causes trouble.
	 * Only use transitionBot if you are sure it is for an exclusive animation of
	 * the bot. You can use visualizeBot() to evade this limitation.
	 */
 viz.transitionBot = function(animationSpec, board, visualizeKey, fn) {
   viz.visualizeBot(animationSpec, board, visualizeKey, function(vizz, bot) {
     var transition = d3.select(viz.botId(board, bot)).transition()
     fn(transition, vizz, bot)
   })
 }
  viz.animateMoveNonTorus = function(animationSpec, board) {
   viz.transitionBot(animationSpec, board, "nonTorusMove", function(transition) {
     transition
       .attr("transform", function(bot){
        return viz.botTransform(board, bot)
       })
       .ease(board.viz.animationSpeed.easing)
       .duration(board.viz.animationSpeed.duration)
   })
  }
 viz.animateMoveTorus = function(animationSpec, board) {
   viz.transitionBot(animationSpec, board, "torusMove", function(transition, torusMove, bot) {
     var cloneBotId = viz.botId(board, bot) + "_clone"
     // Step 1: clone the bot and slide it out of view
     // TODO: for some reason this works with selectAll but not select
     board.d3.selectAll(cloneBotId)
       .data([bot])
       .enter()
       .append("svg:image")
       .attr("class", "board-item")
       .attr("id", PuzzleCode.chomp(cloneBotId))
       .attr("class", "bot")
      .attr("xlink:href", "img/bluebot.svg")
      .attr("height", board.config.cellSize)
      .attr("width", board.config.cellSize)
      .attr("transform", function(bot) {
         return viz.botTransform(board, {
             x: torusMove.prevX,
             y: torusMove.prevY,
             facing: bot.facing
           })
       })
       .transition()
       // the clone slides out of view
       .attr("transform", function(bot) {
         return viz.botTransform(board, {
             x: torusMove.oobNextX,
             y: torusMove.oobNextY,
             facing: bot.facing
           })
       })
       .ease(board.viz.animationSpeed.easing)
       .duration(board.viz.animationSpeed.duration)
       // garbage collect the bot clone
       .each("end", function() {
         d3.select(this).remove()
       })
     // Step 2: move the original bot to the other side of the screen, and
     // slide it into view
     transition
       // First, immediately move the bot to the other side of the board (out
       // of bounds)
       .attr("transform", function(bot) {
         return viz.botTransform(board, {
           x: torusMove.oobPrevX,
           y: torusMove.oobPrevY,
           facing: bot.facing
         })
       })
       .ease(board.viz.animationSpeed.easing)
       .duration(0)
       // once the bot is on the other side of the screen, move it like normal
       .each("end", function() {
         d3.select(this).transition()
           .attr("transform", function(bot){
          return viz.botTransform(board, bot)
         })
         .ease(board.viz.animationSpeed.easing)
         .duration(board.viz.animationSpeed.duration)
       })
   })
 }
  // percentage of a cell that the bot moves forward before stopping
 viz.FAIL_MOVE_DEPTH = 0.33
 viz.animateFailMove = function(animationSpec, board) {
  var move_pixels = Math.round(board.config.cellSize * viz.FAIL_MOVE_DEPTH)
   viz.transitionBot(animationSpec, board, "failMove", function(transition, failMove, bot) {
     transition
       // First, move the bot forward MOVE_DEPTH pixels
       .attr("transform", function(bot) {
         // dx == number of pixels bot will move in x direction
         var dx = 0
         // similar for dy
         var dy = 0
         if (bot.x != failMove.destX) {
           var diff = failMove.destX - bot.x
           // assert(diff == 0 || Math.abs(diff) == 1, "X: diff == 0 || diff == 1")
           dx = diff * move_pixels
         }
         if (bot.y != failMove.destY) {
           var diff = failMove.destY - bot.y
           // assert(diff == 0 || Math.abs(diff) == 1, "Y: diff == 0 || diff == 1")
           dy = diff * move_pixels
         }
         var x = bot.x * board.config.cellSize + dx
         var y = bot.y * board.config.cellSize + dy
         return viz.botTransformPixels(board, x, y, bot.facing)
       })
       .ease("cubic")
     .duration(board.viz.animationSpeed.duration / 2)
       .each("end", function() {
         // now back the bot up to where it was before
         d3.select(this).transition()
           .attr("transform", function(bot){
          return viz.botTransform(board, bot)
         })
       })
       .ease("cubic")
     .duration(board.viz.animationSpeed.duration / 2)
   })
 }
 viz.animateProgramDone = function(animationSpec, board) {
   viz.visualizeBot(animationSpec, board, "programDone", function(programDone, bot) {
     var progDoneId = "programDone_" + PuzzleCode.chomp(viz.botId(board, bot))
     board.d3.selectAll("#" + progDoneId)
       .data([bot])
       .enter()
       .append("svg:image")
       .attr("class", "board-item")
       .attr("id", progDoneId)
      .attr("xlink:href", "img/x.svg")
      .attr("height", board.config.cellSize)
      .attr("width", board.config.cellSize)
       .attr("transform", function(bot){
        return viz.botTransform(board, bot)
       })
       .attr("opacity", "0.0")
     .transition()
       .attr("opacity", "0.75")
       .delay(board.viz.animationSpeed.duration)
       .ease(board.viz.animationSpeed.easing)
       .duration(board.viz.animationSpeed.duration / 2)
   })
  }
 viz.animateStep = function(animationSpec, board) {
  viz.animateFailMove(animationSpec, board)
  viz.animateMoveNonTorus(animationSpec, board)
  viz.animateMoveTorus(animationSpec, board)
  viz.animateProgramDone(animationSpec, board)
 }
 viz.initItems = function(board) {
  // first, delete any existing board items
  board.d3
   .selectAll(".board-item")
   .data([]).exit().remove()
  viz.drawBots(board)
 }
 viz.drawEditors = function(board) {
  board.viz.editors = _.map(board.config.editors, function(botId, editorId){
   return PuzzleCode.editor.newEditor(board, botId, editorId)
  })
 }
 viz.init = function(board) {
  var cellSize = board.config.cellSize
  var width = board.config.width
  var height = board.config.height
  board.viz = {}
  board.viz.animationSpeed = viz.AnimationSpeed[board.config.animationStyle]
  // translates column-number to the x-pixel of the left edge of that column
  board.viz.xScale = d3.scale.linear()
   .domain([0, width])
   .range([0, width * cellSize])
  board.viz.yScale = d3.scale.linear()
   .domain([0, height])
   .range([0, height * cellSize])
  board.toolbarId = board.divId + "_toolbar"
  board.playAreaId = board.divId + "_playarea"
  board.playbackButtonsId = board.divId + "_playback_buttons"
  board.svgId = board.divId + "_svg"
  $(board.divId)
   .addClass("pc-board")
   // the play area holds the grid and the buttons for controlling the
   // simulation
   .append("<div "+
     "class='pc-play-area' " +
     "id='" + PuzzleCode.chomp(board.playAreaId) + "'></div>")
  $(board.playAreaId)
   .append("<div " +
          "id='" + PuzzleCode.chomp(board.toolbarId) + "' " +
        "class='btn-toolbar'></div>")
   .append("<svg " +
       "class='pc-svg-board' "+
       "id='" + PuzzleCode.chomp(board.svgId) + "' class='svgBoard' " +
       "xmlns='http://www.w3.org/2000/svg'></svg>")
  viz.drawButtons(board)
  viz.drawBoardContainer(board)
  viz.drawEditors(board)
   viz.drawCells(board)
   viz.initItems(board)
 }
  return viz
})()
PuzzleCode.buttons = (function(){
 "use strict"
 var buttons = {}
 buttons.getId = function(board, buttonName) {
  return board.divId + "-button-" + buttonName
 }
 buttons.setGlyph = function(board, buttonName, glyph) {
  var spanId = buttons.getId(board, buttonName) + ">span"
  $(spanId)
   .removeClass()
   .addClass("glyphicon " + glyph)
 }
 buttons.stopPlaying = function(board) {
  if (board.state.playState == PuzzleCode.board.PlayState.PLAYING) {
   board.state.playState = PuzzleCode.board.PlayState.PAUSED
   buttons.setGlyph(board, "playpause", "glyphicon-play")
   clearInterval(board.state.playInterval)
  }
 }
 buttons.playpause = {
  glyph: "glyphicon-play",
  fn: function(board) {
   if (board.state.playState == PuzzleCode.board.PlayState.INITIAL_STATE_PAUSED ||
     board.state.playState == PuzzleCode.board.PlayState.PAUSED) {
    board.state.playState = PuzzleCode.board.PlayState.PLAYING
    buttons.setGlyph(board, "playpause", "glyphicon-pause")
    var playStep = function() {
     var animationSpec = PuzzleCode.sim.step(board)
     PuzzleCode.viz.animateStep(animationSpec, board)
    }
    playStep()
    var cycleTime = board.viz.animationSpeed.duration +
            board.viz.animationSpeed.delay
    board.state.playInterval = setInterval(playStep, cycleTime)
   } else if (board.state.playState == PuzzleCode.board.PlayState.PLAYING) {
    buttons.stopPlaying(board)
   }
  }
 }
 buttons.step = {
  glyph: "glyphicon-step-forward",
  fn: function(board) {
   if (board.state.playState == PuzzleCode.board.PlayState.INITIAL_STATE_PAUSED ||
     board.state.playState == PuzzleCode.board.PlayState.PAUSED) {
    board.state.playState = PuzzleCode.board.PlayState.STEPPING
    var animationSpec = PuzzleCode.sim.step(board)
    PuzzleCode.viz.animateStep(animationSpec, board)
    var stepDone = function() {
     board.state.playState = PuzzleCode.board.PlayState.PAUSED
    }
    setTimeout(stepDone, board.viz.animationSpeed.duration)
   }
  }
 }
 buttons.reset = {
  glyph: "glyphicon-refresh",
  fn: function(board) {
   buttons.stopPlaying(board)
   board.state = PuzzleCode.board.newState(board.config)
   PuzzleCode.viz.initItems(board)
  }
 }
 buttons.editor_reset = {
  glyph: "glyphicon-refresh",
  fn: function(board, editorId) {
   console.dir(board)
   console.dir(editorId)
  }
 }
 return buttons
})()
// divMap[divId] == the board object for that div
PuzzleCode.divMap = {}
/**
 * Creates and returns new Board object.
 *
 * @param boardConfig should be a BoardConfig object
 * @param divId should be the HTML id for an empty div. The visualization for
 * the board will be inserted into this div object. It should already include
 * the "#"
 */
PuzzleCode.init = function(boardConfig, divId) {
  "use strict"
  PuzzleCode.assert("board " + divId + " already exists", function(){
    return !(divId in PuzzleCode.divMap)
  })
 var defaultConfig = _.cloneDeep(PuzzleCode.board.DEFAULT_CONFIG)
 var config = _.merge(defaultConfig, boardConfig)
 var board = {
  config: config,
  divId: divId,
  // All elements in board are immutable, except for the state element
  state: PuzzleCode.board.newState(config)
 }
  PuzzleCode.divMap[divId] = board
  PuzzleCode.board.check(board)
  PuzzleCode.viz.init(board)
  return board
}
/**
 * Testing
 ******************************************************************************/
var config = {
  buttons: ["playpause", "reset", "step", "editor_reset"],
  editors: [0],
 bots: [
    {
      color: PuzzleCode.bot.Color.BLUE,
      x: 2,
      y: 1,
      facing: PuzzleCode.direction.RIGHT,
      programText: "move",
      constraints: {}
    },
    {
      color: PuzzleCode.bot.Color.BLUE,
      x: 2,
      y: 3,
      facing: PuzzleCode.direction.UP,
      programText: "move\nmove\nmove\nmove",
      constraints: {}
    },
    {
      color: PuzzleCode.bot.Color.BLUE,
      x: 0,
      y: 0,
      facing: PuzzleCode.direction.LEFT,
      programText: "move\nmove\nmove",
      constraints: {}
    },
  ],
}
var board1 = PuzzleCode.init(config, "#board1")
var config = {
  buttons: ["playpause", "step"],
  width: 5,
  height: 3,
  cellSize: 16,
 bots: [
    {
      color: PuzzleCode.bot.Color.BLUE,
      x: 0,
      y: 0,
      facing: PuzzleCode.direction.UP,
      programText: "move\nmove",
      constraints: {}
    },
    {
      color: PuzzleCode.bot.Color.BLUE,
      x: 3,
      y: 2,
      facing: PuzzleCode.direction.LEFT,
      programText: "move",
      constraints: {}
    },
    {
      color: PuzzleCode.bot.Color.BLUE,
      x: 2,
      y: 2,
      facing: PuzzleCode.direction.LEFT,
      programText: "",
      constraints: {}
    },
  ],
}
var board2 = PuzzleCode.init(config, "#board2")
PuzzleCode.click = function(buttonName, divId, extraArgs) {
  "use strict"
  var board = PuzzleCode.divMap[divId]
  var fn = PuzzleCode.buttons[buttonName].fn
  fn(board, extraArgs);
}
PuzzleCode.sim = (function(){
  "use strict"
  var sim = {}
 /**
	 * assumes relatively sane values for increment
	 *
	 * returns {
	 *	value: (value + increment), wrapped around the torus if need be,
	 *  torus: true iff the value wrapped around the edge
	 * }
	 *
	 */
 sim.wrapAdd = function(value, increment, outOfBounds) {
   value += increment
   if (value >= outOfBounds) {
     return {
      value: value % outOfBounds,
      torus: true
     }
   } else if (value < 0) {
     return {
      value: outOfBounds + value,
      torus: true
     }
   } else {
     return {
      value: value,
      torus: false
     }
   }
 }
 /**
	 * executes the 'move' instruciton on the bot
	 * updates the bot and board state
	 * When a bot moves, it deposits two markers:
	 *  - at the head in the old cell
	 *  - at the tail in the new cell
	 */
 sim.executeMove = function(result, board, bot) {
   var prevX = bot.x
   var prevY = bot.y
   var delta = PuzzleCode.direction.dxdy(bot.facing)
   var xResult = sim.wrapAdd(bot.x, delta.dx, board.config.width)
   var yResult = sim.wrapAdd(bot.y, delta.dy, board.config.height)
   var destX = xResult.value
   var destY = yResult.value
   var xTorus = xResult.torus
   var yTorus = yResult.torus
   // if the movement is blocked by an obstacle
   if (!PuzzleCode.board.isEmptyCell(board, destX, destY)) {
     result.viz.failMove = {
       destX: bot.x + delta.dx,
       destY: bot.y + delta.dy
     }
   }
   // if the movement is NOT blocked
   else {
    delete board.state.matrix[prevX][prevY].bot
    board.state.matrix[destX][destY].bot = bot
     bot.x = destX
     bot.y = destY
     if (!xTorus && !yTorus) {
       result.viz.nonTorusMove = true
     } else {
       result.viz.torusMove = {
         prevX: prevX,
         prevY: prevY,
         oobPrevX: destX - delta.dx,
         oobPrevY: destY - delta.dy,
         oobNextX: prevX + delta.dx,
         oobNextY: prevY + delta.dy
       }
     }
   }
   return result
 }
  sim.botDone = function(result, animationSpec, board, bot) {
    bot.program.done = true
    result.viz.programDone = true
    // TODO only set encourage_reset if it's sensible.
    // Right now, if any bot's program finishes encourage_reset will be
    // activated.
    // Perhaps the best thing is have each puzzle define a function that
    // analyzes the board and determines whether or not a reset should be
    // encouraged
    animationSpec.general.encourage_reset = true
  }
 // a sub-step in the simulation
 sim.dubstep = function(animationSpec, board, bot) {
   // make sure this bot hasn't finished
   if ("done" in bot.program) {
     return
   }
    /**
     * the executeFoo(...) functions return a result object that has two
     * properties:
     *    viz:      an object describing the visualizations for this bot that
     *              result from the execution of the instruction
     *    markers:  array of markers deposited by the bot
     */
    var result = {viz: {}}
    // if the bot has an empty program
    if (bot.program.instructions.length == 0) {
      sim.botDone(result, animationSpec, board, bot)
    } else {
      PuzzleCode.assert(
        "dubstep: bot.ip >= 0 && bot.ip < bot.program.instructions.length",
        function() {
          return bot.ip >= 0 && bot.ip < bot.program.instructions.length
        })
      var instruction = bot.program.instructions[bot.ip]
      // NOTE: executing the goto instruction (and others) may modify the ip
      bot.ip = bot.ip + 1
      if (instruction.opcode == PuzzleCode.compiler.Opcode.MOVE) {
        sim.executeMove(result, board, bot)
      }
      result.viz.lineIndex = instruction.lineIndex
      if (bot.ip < bot.program.instructions.length) {
        var nextInstruction = bot.program.instructions[bot.ip]
        result.viz.nextLineIndex = nextInstruction.lineIndex
      }
      // if the bot has reached the end of its program
      if (bot.ip >= bot.program.instructions.length) {
        sim.botDone(result, animationSpec, board, bot)
      }
    }
   animationSpec.bot[bot.id] = result.viz
 }
  // Make one step in the simulation
 sim.step = function(board) {
   // contains all data needed to visualize this step of the simulation
   var animationSpec = {
     // visualizations associated with the board, but not any particular bot
     general: {},
     // bots[bot.id] == an object containing all visualizations for that bot
     // e.g. bot[1].lineIndex == the index of the line currently being
     // executed for that bot with bot.id == 1
     bot: {}
   }
   _(board.state.bots).forEach(function(bot) {
     sim.dubstep(animationSpec, board, bot)
   })
    return animationSpec
 }
 return sim
})()
var FILENAME = undefined
var TEST = undefined
function test(testCase, bool) {
  if (!bool) {
    console.error("Failed test in " + FILENAME + ":" + TEST)
    console.dir(testCase)
  }
}
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
  tokens: ["this", "is", "a", "test"],
  expectedOutput: ["this", "is", "a", "test"]
 },
 {
  tokens: ["test", "//", "blah"],
  expectedOutput: ["test"]
 },
 {
  tokens: ["test//blah"],
  expectedOutput: ["test"]
 },
 {
  tokens: ["test", "//blah"],
  expectedOutput: ["test"]
 },
 {
  tokens: ["//blah"],
  expectedOutput: []
 },
 {
  tokens: ["//", "blah"],
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
  tokens: [],
  expectedOutput: {
   tokens: []
  }
 },
 {
  tokens: ["1"],
  expectedOutput: {
   tokens: ["1"]
  }
 },
 {
  tokens: ["a:"],
  expectedOutput: {
   tokens: [],
   label: "a"
  }
 },
 {
  tokens: ["1", "2", "3"],
  expectedOutput: {
   tokens: ["1", "2", "3"]
  }
 },
 {
  tokens: ["a:", "1", "2", "3"],
  expectedOutput: {
   tokens: ["1", "2", "3"],
   label: "a"
  }
 },
 {
  tokens: ["a:1", "2", "3"],
  expectedOutput: {
   tokens: ["1", "2", "3"],
   label: "a"
  }
 },
 {
  tokens: [":", "2", "3"],
  expectedOutput: {
   tokens: [":", "2", "3"],
  }
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
/******************************************************************************/
TEST = "PuzzleCode.compiler.compile"
var cases = [
 {
  programText: "move",
  constraints: {},
  expectedOutput: {
   programText: "move",
   instructions: [
    {
     opcode: compiler.Opcode.MOVE,
     error: false,
     lineIndex: 0
    }
   ],
      comments: {},
      constraintViolation: false,
      error: false,
    }
 },
 {
  programText: "\n\nmove\n\n",
  constraints: {},
  expectedOutput: {
   programText: "\n\nmove\n\n",
   instructions: [
    {
     opcode: compiler.Opcode.MOVE,
     error: false,
     lineIndex: 2
    }
   ],
      comments: {},
      constraintViolation: false,
      error: false,
    }
 },
 {
  programText: "mov",
  constraints: {},
  expectedOutput: {
   programText: "mov",
      comments: {
       0: compiler.Error.invalidOpcode("mov")
      },
      constraintViolation: false,
      error: true,
    }
 },
 {
  programText: "\nmove\nmov",
  constraints: {},
  expectedOutput: {
   programText: "\nmove\nmov",
      comments: {
       2: compiler.Error.invalidOpcode("mov")
      },
      constraintViolation: false,
      error: true,
    }
 },
 {
  programText: "move\nfoo:move\ngoto foo",
  constraints: {},
  expectedOutput: {
   programText: "move\nfoo:move\ngoto foo",
      comments: {},
      constraintViolation: false,
      error: false,
      instructions: [
    {
     opcode: compiler.Opcode.MOVE,
     error: false,
     lineIndex: 0
    },
    {
     label: "foo",
     opcode: compiler.Opcode.MOVE,
     error: false,
     lineIndex: 1
    },
    {
     opcode: compiler.Opcode.GOTO,
     data: 1,
     error: false,
     lineIndex: 2
    },
   ],
    }
 },
 {
  programText: "\nmove\nmove",
  constraints: {
   max_instructions: 2
  },
  expectedOutput: {
   programText: "\nmove\nmove",
      comments: {},
      constraintViolation: false,
      error: false,
      instructions: [
        {
     opcode: compiler.Opcode.MOVE,
     error: false,
     lineIndex: 1
    },
    {
     opcode: compiler.Opcode.MOVE,
     error: false,
     lineIndex: 2
    },
   ]
    }
 },
 {
  programText: "\nmove\nmove\n\nmove",
  constraints: {
   max_instructions: 1
  },
  expectedOutput: {
   programText: "\nmove\nmove\n\nmove",
      comments: {
       2: compiler.Error.TOO_MANY_INSTRUCTIONS,
       4: compiler.Error.TOO_MANY_INSTRUCTIONS,
      },
      constraintViolation: true,
      error: true,
    }
 },
]
_(cases).forEach(function(tc){
 tc.output = compiler.compile(tc.programText, tc.constraints)
 test(tc, tv4.validate(tc.output, compiler.ProgramSchema))
 test(tc, _.isEqual(tc.output, tc.expectedOutput))
})
FILENAME = "direction_test.js"
var direction = PuzzleCode.direction
/******************************************************************************/
TEST = "PuzzleCode.direction.rotateLeft"
var cases = [
 {
  direction: direction.UP,
  expectedOutput: direction.LEFT
 },
 {
  direction: direction.LEFT,
  expectedOutput: direction.DOWN
 },
 {
  direction: direction.DOWN,
  expectedOutput: direction.RIGHT
 },
 {
  direction: direction.RIGHT,
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
  direction: direction.UP,
  expectedOutput: direction.RIGHT
 },
 {
  direction: direction.RIGHT,
  expectedOutput: direction.DOWN
 },
 {
  direction: direction.DOWN,
  expectedOutput: direction.LEFT
 },
 {
  direction: direction.LEFT,
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
  oldFacing: direction.UP,
  rotateDirection: direction.RIGHT,
  expectedOutput: direction.RIGHT
 },
 {
  oldFacing: direction.LEFT,
  rotateDirection: direction.LEFT,
  expectedOutput: direction.DOWN
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
  direction: direction.UP,
  expectedOutput: direction.DOWN
 },
 {
  direction: direction.DOWN,
  expectedOutput: direction.UP
 },
 {
  direction: direction.LEFT,
  expectedOutput: direction.RIGHT
 },
 {
  direction: direction.RIGHT,
  expectedOutput: direction.LEFT
 }
]
_(cases).forEach(function(tc){
 tc.output = direction.oppositeDirection(tc.direction)
 test(tc, _.isEqual(tc.output, tc.expectedOutput))
})
var sim = PuzzleCode.sim
/******************************************************************************/
TEST = "PuzzleCode.sim.wrapAdd"
var cases = [
 {
  value: 1,
  increment: 1,
  outOfBounds: 3,
  expectedOutput: {
   value: 2,
   torus: false
  }
 },
 {
  value: 2,
  increment: 1,
  outOfBounds: 3,
  expectedOutput: {
   value: 0,
   torus: true
  }
 },
 {
  value: 0,
  increment: -1,
  outOfBounds: 3,
  expectedOutput: {
   value: 2,
   torus: true
  }
 },
]
_(cases).forEach(function(tc){
 tc.output = sim.wrapAdd(tc.value, tc.increment, tc.outOfBounds)
 test(tc, _.isEqual(tc.output, tc.expectedOutput))
})
/******************************************************************************/
TEST = "PuzzleCode.sim.executeMove"
var config = {
 width: 5,
 height: 3,
 bots: [
    {
      color: PuzzleCode.bot.Color.BLUE,
      x: 0,
      y: 0,
      facing: PuzzleCode.direction.RIGHT,
      programText: "move",
      constraints: {}
    },
    {
      color: PuzzleCode.bot.Color.BLUE,
      x: 2,
      y: 0,
      facing: PuzzleCode.direction.UP,
      programText: "move",
      constraints: {}
    },
    {
      color: PuzzleCode.bot.Color.BLUE,
      x: 4,
      y: 0,
      facing: PuzzleCode.direction.RIGHT,
      programText: "move",
      constraints: {}
    },
  ],
}
var board = PuzzleCode.init(config, "")
var cases = [
 {
  board: _.cloneDeep(board),
  bot: _.cloneDeep(board.state.matrix[0][0].bot),
  prevX: 0,
  prevY: 0,
  destX: 1,
  destY: 0,
  expectedOutput: {
   viz: {
    nonTorusMove: true,
   },
  }
 },
 {
  board: _.cloneDeep(board),
  bot: _.cloneDeep(board.state.matrix[2][0].bot),
  prevX: 2,
  prevY: 0,
  destX: 2,
  destY: 2,
  expectedOutput: {
   viz: {
    torusMove: {
         prevX: 2,
         prevY: 0,
         oobPrevX: 2,
         oobPrevY: 3,
         oobNextX: 2,
         oobNextY: -1
       }
     }
  }
 },
 {
  board: _.cloneDeep(board),
  bot: _.cloneDeep(board.state.matrix[4][0].bot),
  prevX: 4,
  prevY: 0,
  destX: 4,
  destY: 0,
  expectedOutput: {
   viz: {
    failMove: {
        destX: 5,
        destY: 0
      }
     }
  }
 },
]
_(cases).forEach(function(tc){
  var result = {viz:{}}
 tc.output = sim.executeMove(result, tc.board, tc.bot)
 test(tc, _.isEqual(tc.bot.x, tc.destX))
 test(tc, _.isEqual(tc.bot.y, tc.destY))
 test(tc, _.isEqual(tc.board.state.matrix[tc.bot.x][tc.bot.y].bot, tc.bot))
 if (!(tc.prevX == tc.destX && tc.prevY == tc.destY)) {
  test(tc, _.isEqual(tc.board.state.matrix[tc.prevX][tc.prevY], {}))
 }
 test(tc, _.isEqual(tc.output, tc.expectedOutput))
})
// yields a new width*height matrix
// if defaultValue is a function then matrix[x][y] = defaultValue(x, y)
// else matrix[x][y] = defaultValue
PuzzleCode.newMatrix = function(width, height, defaultValue) {
  "use strict"
  return _.times(width, function(x) {
    if (typeof defaultValue == "function") {
      return _.times(height, function(y){
        return defaultValue(x,y)
      })
    } else {
      return _.times(height, function(){
        return defaultValue
      })
    }
  })
}
// removes a leading '#' from id, if it exists 
PuzzleCode.chomp = function(id) {
  return id.replace(/^#/, '')
}
/******************************************************************************/
TEST = "PuzzleCode.newMatrix"
var cases = [
 {
  width: 3,
  height: 2,
  defaultValue: "a",
  expectedOutput: [["a", "a"], ["a", "a"], ["a", "a"]]
 },
]
_(cases).forEach(function(tc){
 tc.output = PuzzleCode.newMatrix(tc.width, tc.height, tc.defaultValue)
 test(tc, _.isEqual(tc.output, tc.expectedOutput))
})
