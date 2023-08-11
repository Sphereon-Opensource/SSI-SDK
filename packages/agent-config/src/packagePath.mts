import * as fs from 'fs/promises';

interface PackageJSON {
  exports?: {
    '.': {
      import: string;
      require: string;
    };
  };
  module?: string;
  main?: string;
}

export async function extractPathFromPackageJSON(packageJsonPath: string): Promise<string | null> {
  try {
    // Read package.json file
    const packageJsonContent = await fs.readFile(packageJsonPath, 'utf8');
    const packageData: PackageJSON = JSON.parse(packageJsonContent);

    // Check exports
    if (packageData.exports && packageData.exports['.']) {
      const { import: importPath, require: requirePath } = packageData.exports['.'];
      if (importPath) {
        return importPath;
      } else if (requirePath) {
        return requirePath;
      }
    }

    // Check module field
    if (packageData.module) {
      return packageData.module;
    }

    // Check main field
    if (packageData.main) {
      return packageData.main;
    }

    // If no path was found
    return null;
  } catch (error) {
    throw new Error(`Error parsing or reading package.json: ${error}`);
  }
}