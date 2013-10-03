#ifndef __COMPILER_TEST_JS__
#define __COMPILER_TEST_JS__

#include "main/js/PuzzleCode/compiler.js"
#include "test/js/PuzzleCode/header.js"

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

#endif
