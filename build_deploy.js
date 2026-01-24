import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Starting Vercel Build Process...');

const clientDir = path.join(__dirname, 'client');
const publicDir = path.join(__dirname, 'public');
const clientDist = path.join(clientDir, 'dist');

try {
    // 1. Install Client Dependencies
    console.log('📦 Installing client dependencies...');
    execSync('npm install', { cwd: clientDir, stdio: 'inherit', shell: true });

    // 2. Build Client
    console.log('🏗️  Building client...');
    execSync('npm run build', { cwd: clientDir, stdio: 'inherit', shell: true });

    // 3. Prepare Root Public & Dist Directories
    console.log('📂 Preparing deployment directories...');
    const publicDir = path.join(__dirname, 'public'); 
    const distDir = path.join(__dirname, 'dist');

    if (fs.existsSync(publicDir)) fs.rmSync(publicDir, { recursive: true, force: true });
    if (fs.existsSync(distDir)) fs.rmSync(distDir, { recursive: true, force: true });
    
    // 4. Move Files (Robust Copy to both locations to satisfy Vercel defaults)
    console.log('🚚 Moving build artifacts to /public and /dist...');
    
    if (fs.cpSync) {
        fs.cpSync(clientDist, publicDir, { recursive: true });
        fs.cpSync(clientDist, distDir, { recursive: true });
    } else {
        copyDir(clientDist, publicDir);
        copyDir(clientDist, distDir);
    }

    console.log('✅ Build Complete! Ready for Vercel deployment.');

} catch (error) {
    console.error('❌ Build Failed:', error.message);
    process.exit(1);
}

// Fallback copy function
function copyDir(src, dest) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}