#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

// Files and directories to copy
const filesToCopy = [
  'index.html',
  'style.css',
  'app.js',
  'calculations.js',
  'ev-models.js',
  'manifest.json',
  'service-worker.js'
];

const directoriesToCopy = [
  'assets'
];

// Destination directory
const wwwDir = path.join(projectRoot, 'www');

// Function to remove directory recursively
function removeDirectory(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
    console.log(`✓ Removed ${dirPath}`);
  }
}

// Function to copy file
function copyFile(src, dest) {
  const destDir = path.dirname(dest);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  fs.copyFileSync(src, dest);
  console.log(`  ✓ Copied ${path.relative(projectRoot, src)}`);
}

// Function to copy directory recursively
function copyDirectory(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const files = fs.readdirSync(src, { withFileTypes: true });

  for (const file of files) {
    const srcPath = path.join(src, file.name);
    const destPath = path.join(dest, file.name);

    if (file.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
  console.log(`  ✓ Copied directory ${path.relative(projectRoot, src)}`);
}

try {
  // Step 1: Remove and recreate www directory
  console.log('Preparing native web assets...\n');
  removeDirectory(wwwDir);
  fs.mkdirSync(wwwDir, { recursive: true });
  console.log(`✓ Created ${wwwDir}\n`);

  // Step 2: Check and copy files
  console.log('Copying required files:');
  for (const file of filesToCopy) {
    const srcPath = path.join(projectRoot, file);
    if (!fs.existsSync(srcPath)) {
      throw new Error(`Missing required file: ${file}`);
    }
    const destPath = path.join(wwwDir, file);
    copyFile(srcPath, destPath);
  }
  console.log();

  // Step 3: Copy directories
  console.log('Copying required directories:');
  for (const dir of directoriesToCopy) {
    const srcPath = path.join(projectRoot, dir);
    if (!fs.existsSync(srcPath)) {
      throw new Error(`Missing required directory: ${dir}`);
    }
    const destPath = path.join(wwwDir, dir);
    copyDirectory(srcPath, destPath);
  }
  console.log();

  console.log('✓ Native web structure prepared successfully!\n');
  process.exit(0);
} catch (error) {
  console.error(`✗ Error: ${error.message}\n`);
  process.exit(1);
}
