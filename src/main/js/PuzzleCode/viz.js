#ifndef __VIS_JS__
#define __VIS_JS__

#include "main/js/PuzzleCode/header.js"
#include "main/js/PuzzleCode/board.js"
#include "main/js/PuzzleCode/direction.js"

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
  	return board.svgId.replace(/^#/, "") + "_bot_" + bot.id
	}

	viz.drawBots = function(board){
	  board.d3.selectAll(".bot")
	    .data(board.state.bots)
	    .enter().append("svg:image")
	    .attr("id", function(bot){ return viz.botId(board, bot) })
	    .attr("xlink:href", "img/bluebot.svg")
	    .attr("height", board.config.cellSize)
	    .attr("width", board.config.cellSize)
	    .attr("transform", function(bot){ return viz.botTransform(board, bot) })
	}

	viz.drawButtons = function(board) {

		var buttonTemplate =
			"<button type='button' class='btn btn-default' " +
			"onclick=\"PuzzleCode.click('{{{buttonName}}}', '{{{boardDivId}}}')\" >" +
			"<span class='glyphicon glyphicon-{{{glyph}}}'></span>"  +
			"</button>"

		var buttonOrder = [
			"reset",
			"step",
			"play"
		]

		_(buttonOrder).forEach(function(buttonName){
			if (_.contains(board.config.buttons, buttonName)) {
				$(board.playbackButtonsId)
					.append(Mustache.render(buttonTemplate, {
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
	    var transition = d3.select("#" + viz.botId(board, bot)).transition()
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
	    board.d3.selectAll("#" + cloneBotId)
	      .data([bot])
	      .enter()
	      .append("svg:image")
	      .attr("id", cloneBotId)
	      .attr("class", "bot")
		    .attr("xlink:href", "img/bluebot.svg")
		    .attr("height", board.config.cellSize)
		    .attr("width", board.config.cellSize)
		    //.attr("transform", function(bot){ return viz.botTransform(board, bot) })
		    .attr("transform", function(bot) {
	        return viz.botTransform(board, {
	            x: torusMove.prevX,
	            y: torusMove.prevY,
	            facing: bot.facing
	          })
	      })
	      /*.append("svg:use")
	      // The clone starts at the previous location of the bot
	      .attr("id", cloneBotId)
	      .attr("class", "bot")
	      .attr("xlink:href", "#botTemplate")
	      .attr("transform", function(bot) {
	        return botTransform({
	            cellX: torusMove.prevX,
	            cellY: torusMove.prevY,
	            facing: bot.facing
	          })
	      })*/
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


	viz.animateProgramDone = function(animationSpec, board) {

	  viz.visualizeBot(animationSpec, board, "programDone", function(programDone, bot) {

	    var progDoneId = "programDone_" + viz.botId(board, bot)
	    board.d3.selectAll("#" + progDoneId)
	      .data([bot])
	      .enter()
	      .append("svg:image")
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
		viz.animateMoveNonTorus(animationSpec, board)
		viz.animateMoveTorus(animationSpec, board)
		viz.animateProgramDone(animationSpec, board)
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
		board.playbackButtonsId = board.divId + "_playback_buttons"
		board.svgId = board.divId + "_svg"

		$(board.divId)
			.addClass("pc-board")
			.append("<div " +
				      "id='" +  board.toolbarId.replace(/^#/, '') + "' " +
						  "class='btn-toolbar'></div>")
			.append("<svg " +
							"class='pc-svg-board' "+
							"id='" + board.svgId.replace(/^#/,'') + "' class='svgBoard' " +
							"xmlns='http://www.w3.org/2000/svg'></svg>")

		$(board.toolbarId)
			.append("<div " +
				      "id='" +  board.playbackButtonsId.replace(/^#/, '') + "' " +
							"class='btn-group'></div>")

		viz.drawButtons(board)
		viz.drawBoardContainer(board)
  	viz.drawCells(board)
  	viz.drawBots(board)
	}

  return viz
})()

#endif