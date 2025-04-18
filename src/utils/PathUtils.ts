import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Get project root from config or workspace
 * Handles both absolute and relative paths
 * 
 * @param customPath Custom path from configuration (can be relative or absolute)
 * @param validateLaravelProject Optional function to validate if the path is a Laravel project
 * @returns The resolved project root path
 * @throws Error if the path cannot be resolved or validated
 */
export function getProjectRoot(
  customPath: string, 
  validateLaravelProject?: (path: string) => void
): string {
  if (customPath) {
    // Handle relative paths
    if (!path.isAbsolute(customPath)) {
      // Get workspace folder as the base for relative paths
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        throw new Error('Cannot resolve relative path: No workspace folder is open');
      }
      
      // Join workspace path with the relative path
      const resolvedPath = path.join(workspaceFolders[0].uri.fsPath, customPath);
      if (fs.existsSync(resolvedPath)) {
        if (validateLaravelProject) {
          validateLaravelProject(resolvedPath);
        }
        return resolvedPath;
      }
      throw new Error(`The relative path "${customPath}" could not be resolved from the current workspace`);
    }
    
    // For absolute paths, check if they exist
    if (fs.existsSync(customPath)) {
      if (validateLaravelProject) {
        validateLaravelProject(customPath);
      }
      return customPath;
    }
    throw new Error(`The path "${customPath}" does not exist`);
  }
  
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    throw new Error('No workspace folder or Laravel project path found');
  }
  
  const projectRoot = workspaceFolders[0].uri.fsPath;
  
  // Validate Laravel project if validation function is provided
  if (validateLaravelProject) {
    validateLaravelProject(projectRoot);
  }
  
  return projectRoot;
}

/**
 * Default Laravel project validation function
 * Checks for key Laravel files/directories
 * 
 * @param projectRoot Path to validate as a Laravel project
 * @throws Error if the path is not a valid Laravel project
 */
export function validateLaravelProject(projectRoot: string): void {
  // Check for key Laravel files/directories
  const artisanPath = path.join(projectRoot, 'artisan');
  const appDirPath = path.join(projectRoot, 'app');
  const configDirPath = path.join(projectRoot, 'config');
  
  if (!fs.existsSync(artisanPath) || !fs.existsSync(appDirPath) || !fs.existsSync(configDirPath)) {
    throw new Error(`The directory at "${projectRoot}" does not appear to be a valid Laravel project`);
  }
}

/**
 * Get project root without validation, used for cases where
 * we just need a path but don't care if it's a Laravel project
 * 
 * @param customPath Custom path from configuration
 * @returns The resolved path or null if it can't be resolved
 */
export function getProjectRootOrNull(customPath: string): string | null {
  try {
    return getProjectRoot(customPath);
  } catch (error) {
    return null;
  }
}