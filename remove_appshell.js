const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir(path.join(__dirname, 'src', 'app'), function(filePath) {
  if (filePath.endsWith('page.tsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Remove the AppShell import
    content = content.replace(/import\s*\{\s*AppShell\s*\}\s*from\s*['"]@\/components\/layout\/AppShell['"];?\r?\n?/g, '');
    
    // Replace <AppShell> with <> and </AppShell> with </>
    content = content.replace(/<AppShell>/g, '<>');
    content = content.replace(/<\/AppShell>/g, '</>');
    
    fs.writeFileSync(filePath, content, 'utf8');
  }
});

console.log('AppShell removed from all pages successfully.');
