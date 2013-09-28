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
   **********************************************************************************/
  compiler.Opcode = {
    MOVE: 0,
    TURN: 1,
    GOTO: 2
  };

  /**
   * Data structures
   **********************************************************************************/
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
   **********************************************************************************/

  compiler.tokenize = function(line) {
    return line
      .replace(/\s+/g, " ")
      .replace(/(^\s+)|(\s+$)/g, "")
      .split(" ")
  }

  compiler.removeComment = function(tokens) {
    var commentToken = -1
    for (var i = 0; i < tokens.length; i++) {
      var token = tokens[i]
      var commentCharIndex = token.indexOf("//")
      if (commentCharIndex == 0) {
        // completely exclude this token
        return tokens.slice(0, i)
      } else if (commentCharIndex > 0) {
        // trim this token and exclude the rest
        tokens[i] = token.substr(0, commentCharIndex)
        return tokens.slice(0, i + 1)
      }
    }
    return tokens
  }


  return compiler
})()
/**
 * Usage: assign appropriate values to TC_NAME, TC, RESULT, and TEST_FILENAME
 * The test fails if bool == false
 */

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

function test(testCase, bool) {
  if (!bool) {
    alert("Failed test. See console logs for error messages.")
    console.error("Failed test in " + FILENAME)
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

var FILENAME = "compiler_test.js"

/**
 * PuzzleCode.compiler.tokenize
 ******************************************************************************/
var tokenize = [
	{
		line: "this is a test",
		expectedOutput: ["this", "is", "a", "test"]
	},
	{
		line: "  this   is  \t a test ",
		expectedOutput: ["this", "is", "a", "test"]
	}
]

_(tokenize).forEach(function(tc){
	var output = PuzzleCode.compiler.tokenize(tc.line)
	test(tc, _.isEqual(output, tc.expectedOutput))
})
