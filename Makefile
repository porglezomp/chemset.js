chemset.min.js: chemset.pre.min.js
	uglifyjs chemset.pre.min.js -b beautify=false,ascii-only=true -o chemset.min.js -m sort=true,toplevel=true

chemset.pre.min.js: chemset.js
	python pre_minify.py

chemset.js: chemset.in.js eqn_detect_generator.py
	python eqn_detect_generator.py | cat - chemset.in.js > chemset.js

clean:
	rm chemset.pre.min.js
	rm chemset.min.js
	rm chemset.js