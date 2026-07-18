const fs = require('fs');
let code = fs.readFileSync('/app/applet/index.html', 'utf8');
code = code.replace(/<head>/, '<head><script>window.addEventListener("error", function(e) { console.error("GLOBAL ERROR:", e.error); });</script>');
fs.writeFileSync('/app/applet/index.html', code);
