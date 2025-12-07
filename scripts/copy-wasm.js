const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'node_modules', '@litertjs', 'core', 'wasm');
const destDir = path.join(__dirname, '..', 'public', 'wasm');

// Ensure destination directory exists
if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
}

// Check if source exists
if (fs.existsSync(srcDir)) {
    try {
        const files = fs.readdirSync(srcDir);

        files.forEach(file => {
            const srcFile = path.join(srcDir, file);
            const destFile = path.join(destDir, file);

            // Copy file
            fs.copyFileSync(srcFile, destFile);
            console.log(`Copied ${file} to public/wasm/`);
        });
        console.log('WASM files copied successfully.');
    } catch (err) {
        console.error('Error copying WASM files:', err);
        // Don't fail the build if copy fails (matching original script behavior || true)
    }
} else {
    console.log('LiteRT WASM source directory not found (skipping copy).');
}
