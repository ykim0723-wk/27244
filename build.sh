#!/bin/sh
# Inline src/nodes.js (+ src/nodes-ui.js at /*UI*/) into app.html between the NODES markers.
python3 - <<'PY'
s=open('app.html').read();n=open('src/nodes.js').read().replace('/*UI*/',open('src/nodes-ui.js').read())
a=s.index('<!--NODES-->')+len('<!--NODES-->');b=s.index('<!--/NODES-->')
s=s[:a]+'<script>\n'+n+'\n</script>'+s[b:]
open('app.html','w').write(s)
PY
