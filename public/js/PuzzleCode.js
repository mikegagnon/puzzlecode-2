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

var PuzzleCode = {}
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
   * Enums
   ****************************************************************************/
  compiler.Opcode = {
    MOVE: 0,
    TURN: 1,
    GOTO: 2
  };

  /**
   * Data structures
   ****************************************************************************/
  compiler.Instruction = function (
      // value must be in the Opcode enum
      opcode,
      // data object, whose type is determined by opcode
      data,
      // from program text
      lineIndex,
      comment,
      error,
      label
      ) {
    this.opcode = opcode
    this.data = data
    this.lineIndex = lineIndex
    this.comment = comment
    this.error = error
    this.label = label
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

  compiler.TokensLabel = function(tokens, label) {
    this.tokens = tokens
    this.label = label
  }

  /**
   * Functions
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

  return compiler
})()
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

var FILENAME = undefined
var TEST = undefined

function test(testCase, bool) {
  if (!bool) {
    console.error("Failed test in " + FILENAME + ":" + TEST)
    console.dir(testCase)
  }
}
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

FILENAME = "compiler_test.js"

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
	tc.output = PuzzleCode.compiler.tokenize(tc.line)
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
	tc.output = PuzzleCode.compiler.removeComment(tc.tokens)
	test(tc, _.isEqual(tc.output, tc.expectedOutput))
})

/******************************************************************************/
TEST = "PuzzleCode.compiler.removeLabel"
var cases = [
	{
		tokens: 				[],
		expectedOutput: new PuzzleCode.compiler.TokensLabel([], null)
	},
	{
		tokens: 				["1"],
		expectedOutput: new PuzzleCode.compiler.TokensLabel(["1"], null)
	},
	{
		tokens: 				["a:"],
		expectedOutput: new PuzzleCode.compiler.TokensLabel([], "a")
	},
	{
		tokens: 				["1", "2", "3"],
		expectedOutput: new PuzzleCode.compiler.TokensLabel(["1", "2", "3"], null)
	},
	{
		tokens: 				["a:", "1", "2", "3"],
		expectedOutput: new PuzzleCode.compiler.TokensLabel(["1", "2", "3"], "a")
	},
	{
		tokens: 				["a:1", "2", "3"],
		expectedOutput: new PuzzleCode.compiler.TokensLabel(["1", "2", "3"], "a")
	},
	{
		tokens: 				[":", "2", "3"],
		expectedOutput: new PuzzleCode.compiler.TokensLabel([":", "2", "3"], null)
	},
]

_(cases).forEach(function(tc){
	tc.output = PuzzleCode.compiler.removeLabel(tc.tokens)
	test(tc, _.isEqual(tc.output, tc.expectedOutput))
})