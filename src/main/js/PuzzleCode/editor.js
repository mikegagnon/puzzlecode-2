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

  editor.drawButtons = function(board, editorId) {

    var toolbarId = editor.getToolbarDomId(board, editorId)
    var buttonsId = editor.getToolbarButtonsDomId(board, editorId)



    $(toolbarId).append(
      "<div " +
      "id='" +  PuzzleCode.chomp(buttonsId) + "' " +
      "class='btn-group'>" +
      "</div>")

    var buttonTemplate =
      "<button type='button' class='btn btn-default' " +
      "id='{{{buttonId}}}' " +
      "onclick=\"PuzzleCode.click('{{{buttonName}}}', " +
                                 "'{{{boardDivId}}}', " +
                                 "{{{editorId}}})\" >" +
      "<span class='glyphicon {{{glyph}}}'></span>"  +
      "</button>"

    var buttonOrder = [
      "editor_reset",
    ]

    _(buttonOrder).forEach(function(buttonName){
      if (_.contains(board.config.buttons, buttonName)) {
        $(buttonsId).append(
          Mustache.render(buttonTemplate, {
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
      "<button type='button' class='btn btn-default' style='visibility: hidden'>" +
      "<span class='glyphicon glyphicon-refresh'></span>" +
      "</button>" +
      "</div>")

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
    cm.setSize("100%", "170px")

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