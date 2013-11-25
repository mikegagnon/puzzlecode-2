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

  editor.buttonTemplate = "\
    <button type='button' class='btn btn-default btn-sm' \
    id='{{{buttonId}}}' \
    onclick=\"PuzzleCode.click('{{{buttonName}}}', \
                               '{{{boardDivId}}}', \
                                {{{editorId}}})\" > \
    <span class='glyphicon {{{glyph}}}'></span> \
    </button>"

  editor.drawButtons = function(board, editorId) {

    var toolbarId = editor.getToolbarDomId(board, editorId)
    var buttonsId = editor.getToolbarButtonsDomId(board, editorId)

    $(toolbarId).append(
      "<div " +
      "id='" +  PuzzleCode.chomp(buttonsId) + "' " +
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

  editor.getPreElement = function(editorObject, lineIndex) {
    var editorDomId = editor.getDomId(editorObject.board, editorObject.editorId)
    return $(editorDomId + " pre").eq(+lineIndex + 1)
  }

  editor.errorPopoverTemplate = '\
    <p> \
      {{{message}}} \
    </p> \
    <a href="{{{url}}}" class="btn btn-info btn-sm">\
    Help page for this error</button> \
    '

  editor.errorBootstrapTemplate = '<div class="popover panel panel-warning">\
      <div class="arrow"></div>\
      <h3 class="popover-title panel-heading"></h3>\
      <div class="popover-content panel-body"></div>\
    </div>'

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
    }
  }

  editor.removeError = function(editorObject, lineIndex) {
    console.log("removeError: " + lineIndex)
    PuzzleCode.assert("lineIndex not in editorObject.comments", function(){
      return lineIndex in editorObject.comments
    })
    var preElement = editorObject.comments[lineIndex]
    delete editorObject.comments[lineIndex]
    preElement.popover('destroy')
  }

  editor.removeObsoleteErrors = function(editorObject, program) {
    console.log("removeObsoleteErrors begin")
    _.forOwn(editorObject.comments, function(comment, lineIndex) {
      console.dir(comment)
      console.dir(lineIndex)
      // if the line has a popover, but no corresponding comment in program
      if (!(lineIndex in program.comments)) {
        console.log("removing")
        editor.removeError(editorObject, lineIndex)
      }
    })
    console.log("removeObsoleteErrors end")   
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
    cm.oldLine = 0
    cm.on("cursorActivity", function(cm) {
      if (board.state.playState == PuzzleCode.board.PlayState.INITIAL_STATE_PAUSED) {
        var newLine = cm.getCursor().line
         
        // Only __add__ errors if the curser moves onto a new line
        if (cm.oldLine != newLine) {

          // TODO: incremental compiler if this is too expensive
          var program = PuzzleCode.compiler.compile(cm.getValue(), {})

          cm.oldLine = newLine
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

#endif