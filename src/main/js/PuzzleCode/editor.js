#ifndef __EDITOR_JS__
#define __EDITOR_JS__

#include "main/js/PuzzleCode/header.js"
#include "main/js/PuzzleCode/board.js"
#include "main/js/PuzzleCode/compiler.js"

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

  editor.getDomId = function(board, editorId) {
    return board.divId + "-editor-" + editorId
  }

  editor.newEditor = function(board, botId, editorId) {

    var settings = {
      gutters: ["note-gutter", "CodeMirror-linenumbers"],
      mode:  "text/x-puzzlecode",
      theme: "eclipse",
      smartIndent: false,
      lineNumbers: true,
      height: 50
    }

    /*<div id="codeMirrorEdit"></div>*/

    var editorDomId = PuzzleCode.chomp(editor.getDomId(board, editorId))
    var editorElement = $(board.divId)
      .append("<div " +
              "class='editor-wrapper' " +
              "id='" + editorDomId + "'>" +
              "</div>")

    console.dir(document.getElementById(editorDomId), editorElement)

    var cm = CodeMirror(document.getElementById(editorDomId), settings)
    cm.setSize("100%", "250px")

    //  TODO: put the cursorActivity function in seperate file
    /*var line = 0
    cm.on("cursorActivity", function(cm) {
      var newLine = cm.getCursor().line
      if (PLAY_STATUS == PlayStatus.INITAL_STATE_PAUSED) {
        if (line != newLine) {
          compile()
        }
        line = newLine
      }
    })

    // You cannot edit the program, unless it is in the reset state
    cm.on("beforeChange", function(cm, change) {
      if (PLAY_STATUS != PlayStatus.INITAL_STATE_PAUSED) {
        change.cancel()
      }
    })*/

    return {
      editorId: editorId,
      botId: botId,
      cm: cm
    }
  }

  return editor
})()

#endif