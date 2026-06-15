const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

const getRelativePath = (fromFile, toDir) => {
    const fromDir = path.dirname(fromFile);
    let relPath = path.relative(fromDir, toDir).replace(/\\/g, '/');
    if (!relPath.startsWith('.')) relPath = './' + relPath;
    return relPath;
};

let filesChanged = 0;

walkDir(srcDir, (filePath) => {
    if (!filePath.endsWith('.js')) return;

    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if Alert.alert is used
    if (!content.includes('Alert.alert(')) {
        // Just in case it imports Alert but doesn't use Alert.alert
        // we can leave it or clean it up. Let's just focus on files using Alert.alert.
        return;
    }

    console.log(`Processing ${filePath}`);

    // Replace Alert.alert with CustomAlert.alert
    content = content.replace(/Alert\.alert\(/g, 'CustomAlert.alert(');

    // Remove Alert from react-native imports
    // Regex to match `Alert,` or `, Alert` or just `Alert` inside import { ... } from 'react-native'
    // It's tricky because of multiline imports.
    // Let's use a simpler approach: replace 'Alert,' with '' and ', Alert' with '' and 'Alert' with '' inside the react-native import block
    
    // Find the react-native import statement
    const rnImportMatch = content.match(/import\s+{([^}]*)}\s+from\s+['"]react-native['"];/m);
    if (rnImportMatch) {
        let imports = rnImportMatch[1];
        if (imports.includes('Alert')) {
            // Remove Alert from the list
            imports = imports.split(',').map(s => s.trim()).filter(s => s !== 'Alert' && s !== '').join(', ');
            
            if (imports.length === 0) {
                // Remove the entire import if it was only Alert
                content = content.replace(rnImportMatch[0], '');
            } else {
                // Replace with the updated list
                // To keep formatting, we'll just replace the inner part if possible, 
                // but formatting might get slightly messed up. It's fine for now.
                content = content.replace(rnImportMatch[0], `import { ${imports} } from 'react-native';`);
            }
        }
    }

    // Add import { CustomAlert } from '...';
    if (!content.includes('import { CustomAlert }')) {
        const componentsDir = path.join(__dirname, 'src', 'components');
        const relPath = getRelativePath(filePath, componentsDir);
        const importStatement = `import { CustomAlert } from '${relPath}/CustomAlert';\n`;
        
        // Find a good place to insert. E.g., after the first import
        const firstImportIdx = content.indexOf('import ');
        if (firstImportIdx !== -1) {
            const endOfFirstImport = content.indexOf(';', firstImportIdx) + 1;
            content = content.slice(0, endOfFirstImport) + '\n' + importStatement + content.slice(endOfFirstImport);
        } else {
            content = importStatement + content;
        }
    }

    fs.writeFileSync(filePath, content, 'utf8');
    filesChanged++;
});

console.log(`Done. Changed ${filesChanged} files.`);
