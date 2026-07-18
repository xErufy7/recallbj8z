const fs = require('fs');
let code = fs.readFileSync('/app/applet/data/constants.ts', 'utf8');
code = code.replace(/\s*'AI_STORY':\s*\{\s*name:\s*'AI生成小说模式',\s*description:\s*'由Gemini生成每一步的剧情和选项，完全自由的探索体验！',\s*stats:\s*\{\s*health:\s*100,\s*mindset:\s*100,\s*efficiency:\s*100,\s*money:\s*1000,\s*luck:\s*50,\s*romance:\s*0\s*\}\s*\},/, '');
fs.writeFileSync('/app/applet/data/constants.ts', code);
