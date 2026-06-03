const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function getAllFiles(dir, ext, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getAllFiles(filePath, ext, fileList);
    } else if (filePath.endsWith(ext)) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const vueFiles = getAllFiles(srcDir, '.vue');

let allCss = '';
for (const file of vueFiles) {
  const content = fs.readFileSync(file, 'utf-8');
  const styleMatch = content.match(/<style[^>]*>([\s\S]*?)<\/style>/g);
  if (styleMatch) {
    allCss += styleMatch.map(m => m.replace(/<style[^>]*>|<\/style>/g, '')).join('\n') + '\n';
  }
}

const colorRegex = /#([a-fA-F0-9]{3}|[a-fA-F0-9]{6})\b|rgba\([^)]+\)/g;
const colors = allCss.match(colorRegex) || [];
const colorCounts = {};
for (const c of colors) {
  const color = c.toLowerCase();
  colorCounts[color] = (colorCounts[color] || 0) + 1;
}

const sortedColors = Object.entries(colorCounts).sort((a, b) => b[1] - a[1]);
console.log("Most common colors:");
console.log(sortedColors.slice(0, 30).map(c => `${c[0]}: ${c[1]}`).join('\n'));

console.log("\nFound " + vueFiles.length + " vue files.");
