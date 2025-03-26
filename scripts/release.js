#!/usr/bin/env node

/**
 * Automated Release Script for Laravel Forgemate
 *
 * This script automates the version update process by:
 * 1. Updating the version in package.json and package-lock.json
 * 2. Creating a git commit with these changes
 * 3. Creating and pushing a git tag matching the new version
 *
 * Usage:
 * node scripts/release.js [patch|minor|major|x.y.z]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get the root directory of the project
const rootDir = path.resolve(__dirname, '..');

/**
 * Read and parse a JSON file
 * @param {string} filePath - Path to the JSON file
 * @returns {Object} Parsed JSON object
 */
function readJsonFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(content);
}

/**
 * Write an object to a JSON file
 * @param {string} filePath - Path to the JSON file
 * @param {Object} data - Data to write
 */
function writeJsonFile(filePath, data) {
  const content = JSON.stringify(data, null, 2);
  fs.writeFileSync(filePath, content);
}

/**
 * Execute a command and return its output
 * @param {string} command - Command to execute
 * @returns {string} Command output
 */
function execCommand(command) {
  try {
    return execSync(command, { encoding: 'utf8', stdio: 'pipe' });
  } catch (error) {
    console.error(`Error executing command: ${command}`);
    console.error(error.message);
    process.exit(1);
  }
}

/**
 * Check if a file is tracked by Git
 * @param {string} filePath - Path to file
 * @returns {boolean} - True if file is tracked, false otherwise
 */
function isFileTracked(filePath) {
  try {
    const result = execSync(`git ls-files --error-unmatch "${filePath}"`, { 
      encoding: 'utf8', 
      stdio: 'pipe' 
    });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Bump the version number based on the specified type
 * @param {string} currentVersion - Current version string
 * @param {string} bumpType - Type of bump (patch, minor, major) or specific version
 * @returns {string} New version
 */
function bumpVersion(currentVersion, bumpType) {
  // If the bumpType is a valid semver, use it directly
  if (/^\d+\.\d+\.\d+$/.test(bumpType)) {
    return bumpType;
  }

  const [major, minor, patch] = currentVersion.split('.').map(Number);

  switch (bumpType) {
    case 'patch':
      return `${major}.${minor}.${patch + 1}`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'major':
      return `${major + 1}.0.0`;
    default:
      console.error(`Invalid bump type: ${bumpType}. Use 'patch', 'minor', 'major', or a specific version.`);
      process.exit(1);
  }
}

/**
 * Update the changelog with the new version
 * @param {string} version - New version
 */
function updateChangelog(version) {
  const changelogPath = path.join(rootDir, 'CHANGELOG.md');
  
  if (!fs.existsSync(changelogPath)) {
    console.log('Creating new CHANGELOG.md file');
    fs.writeFileSync(changelogPath, '# Changelog\n\n');
  }
  
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0]; // Format: YYYY-MM-DD
  const changelogContent = fs.readFileSync(changelogPath, 'utf8');
  
  if (changelogContent.includes(`## [${version}]`)) {
    console.log(`Version ${version} already exists in the changelog`);
    return;
  }

  const newEntry = `## [${version}] - ${dateStr}\n\n### Added\n- [Please fill in]\n\n### Changed\n- [Please fill in]\n\n### Fixed\n- [Please fill in]\n\n`;
  const updatedChangelog = changelogContent.replace('# Changelog\n\n', `# Changelog\n\n${newEntry}`);
  
  fs.writeFileSync(changelogPath, updatedChangelog);
  console.log(`Updated CHANGELOG.md with version ${version}`);
}

/**
 * Main function to execute the release process
 */
function main() {
  // Check if the working directory is clean
  try {
    execSync('git diff --quiet HEAD', { stdio: 'pipe' });
  } catch (error) {
    console.warn('Warning: You have uncommitted changes in your working directory.');
    console.warn('These changes will be included in the version commit.\n');
  }
  
  // Get the bump type from command line arguments
  const bumpType = process.argv[2] || 'patch';
  console.log(`Bump type: ${bumpType}`);

  // Read package.json
  const packageJsonPath = path.join(rootDir, 'package.json');
  const packageJson = readJsonFile(packageJsonPath);
  const currentVersion = packageJson.version;
  console.log(`Current version: ${currentVersion}`);

  // Calculate the new version
  const newVersion = bumpVersion(currentVersion, bumpType);
  console.log(`New version: ${newVersion}`);

  // Update package.json
  packageJson.version = newVersion;
  writeJsonFile(packageJsonPath, packageJson);
  console.log(`Updated package.json to version ${newVersion}`);

  // Update package-lock.json
  const packageLockPath = path.join(rootDir, 'package-lock.json');
  const packageLock = readJsonFile(packageLockPath);
  packageLock.version = newVersion;
  if (packageLock.packages && packageLock.packages['']) {
    packageLock.packages[''].version = newVersion;
  }
  writeJsonFile(packageLockPath, packageLock);
  console.log(`Updated package-lock.json to version ${newVersion}`);

  // Update the changelog
  updateChangelog(newVersion);

  // Make sure the release.js script is tracked in git if it isn't already
  const releaseScriptPath = path.join(__dirname, 'release.js');
  const releaseScriptRelPath = path.relative(rootDir, releaseScriptPath);

  if (!isFileTracked(releaseScriptRelPath)) {
    console.log(`Adding previously untracked release script to git`);
    execCommand(`git add "${releaseScriptRelPath}"`);
  }

  // Create a git commit with all changes
  console.log('Adding all changes to git...');
  execCommand('git add -A');
  execCommand(`git commit -m "chore: bump version to ${newVersion}"`);
  console.log(`Created git commit for version ${newVersion}`);

  // Create a git tag
  execCommand(`git tag v${newVersion}`);
  console.log(`Created git tag v${newVersion}`);

  console.log('\nNext steps:');
  console.log(`1. Update the changelog at CHANGELOG.md with your specific changes`);
  console.log(`2. Push the changes: git push origin main`);
  console.log(`3. Push the tag: git push origin v${newVersion}`);
  console.log('4. The GitHub Action should now run and publish the new version');
}

main();
