#
# Copyright 2013 Michael N. Gagnon
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#

# Compiles puzzlecode.js from its constituent components


js_main=src/main/js
js_test=src/test/js
dest=public/js

puzzlecode_js=$(dest)/PuzzleCode.js
puzzlecode_header=$(js_main)/header.js
definitions=$(js_main)/PuzzleCode/*.js

tests=$(js_test)/PuzzleCode/*.js
test_header=$(js_test)/header.js
tmp_file=/tmp/puzzlecode_tmp

all: test

# Compiles a special version of PuzzleCode.js that also runs a bunch of js
# tests. To run the tests, just open public/index.html. If there are no alerts,
# everything passed
test: puzzlecode $(tests)
	@cat $(puzzlecode_js) $(test_header) $(tests) > $(tmp_file)
	@mv $(tmp_file) $(puzzlecode_js)
	@echo created TEST version of $(puzzlecode_js)

puzzlecode: $(puzzlecode_header) $(definitions)
	@cat $(puzzlecode_header) $(definitions) > $(puzzlecode_js)
	@echo created $(puzzlecode_js)
	