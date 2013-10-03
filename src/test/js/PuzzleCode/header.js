#ifndef __TEST_HEADER_JS__
#define __TEST_HEADER_JS__

var FILENAME = undefined
var TEST = undefined

function test(testCase, bool) {
  if (!bool) {
    console.error("Failed test in " + FILENAME + ":" + TEST)
    console.dir(testCase)
  }
}

#endif
