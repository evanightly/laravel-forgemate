#!/usr/bin/env node
const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

// Get the version type from command line arguments: patch, minor, or major
const versionType = process.argv[2] || 'patch';
const validTypes = ['patch', 'minor', 'major', 'prepatch', 'preminor', 'premajor', 'prerelease'];

if (!validTypes.includes(versionType)) {
  console.error(`Error: Version type must be one of: ${validTypes.join(', ')}`);
  process.exit(1);
}

try {
  console.log(`Bumping ${versionType} version...`);
  
  // Use npm version to update package.json and create git tag
  const newVersion = execSync(`npm version ${versionType} --no-git-tag-version`).toString().trim().replace('v', '');
  console.log(`Version updated to: ${newVersion}`);
  
  // Update package-lock.json automatically
  execSync('npm install --package-lock-only');
  console.log('Updated package-lock.json');
  
  // Stage the changes
  execSync('git add package.json package-lock.json');
  
  // Commit the changes
  execSync(`git commit -m "Bump version to ${newVersion}"`);
  
  // Create the tag
  execSync(`git tag v${newVersion}`);
  console.log(`Created git tag: v${newVersion}`);
  
  console.log('To push the changes and tag, run:');
  console.log(`  git push && git push --tags`);
  
} catch (error) {
  console.error('Error during version bump:', error.message);
  process.exit(1);
}
