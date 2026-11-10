#!/bin/sh
# Inline src/nodes.js into app.html between the NODES markers.
python3 - <<'PY'
s=open('app.html').read();n=open('src/nodes.js').read()
a=s.index('<!--NODES-->')+len('<!--NODES-->');b=s.index('<!--/NODES-->')
s=s[:a]+'<script>\n'+n+'\n</script>'+s[b:]
open('app.html','w').write(s)
PY
