#ifndef __UTIL_JS__
#define __UITL_JS__

#include "main/js/PuzzleCode/header.js"

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



#endif