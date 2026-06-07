import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getProjects } from '@/lib/db';

const PLATFORM_DIR_MAPPING: Record<string, string> = {
  ios: 'ios',
  android: 'android',
  web: 'web',
  watchos: 'ios', // watchOS lives in the ios folder
};

// Folders to exclude from file listing
const EXCLUDED_FOLDERS = new Set([
  '.git',
  'node_modules',
  '.next',
  '.claude',
  '.agents',
  'Pods',
  'DerivedData',
  '.gradle',
  'build',
  'bin',
  'obj',
]);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const platform = searchParams.get('platform');
    const subpath = searchParams.get('subpath') || '';

    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }

    const projects = getProjects();
    const project = projects.find(p => p.id === projectId);

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (!project.path || !fs.existsSync(project.path)) {
      return NextResponse.json({ 
        error: 'Project path not configured or directory does not exist',
        notConfigured: true 
      });
    }

    const projectRoot = path.resolve(project.path);
    
    // Resolve target platform subdirectory
    let baseDir = projectRoot;
    if (platform) {
      const folderName = PLATFORM_DIR_MAPPING[platform.toLowerCase()];
      if (folderName) {
        baseDir = path.join(projectRoot, folderName);
      }
    }

    // Resolve target path safely
    const targetPath = path.resolve(path.join(baseDir, subpath));

    // Security check: Ensure the path is inside the project root
    if (!targetPath.startsWith(projectRoot)) {
      return NextResponse.json({ error: 'Access denied: Directory traversal detected' }, { status: 403 });
    }

    if (!fs.existsSync(targetPath)) {
      return NextResponse.json({ error: 'File or directory does not exist' }, { status: 404 });
    }

    const stats = fs.statSync(targetPath);

    if (stats.isDirectory()) {
      const files = fs.readdirSync(targetPath);
      const entries = files
        .filter(file => !EXCLUDED_FOLDERS.has(file))
        .map(file => {
          const filePath = path.join(targetPath, file);
          let fileStats;
          try {
            fileStats = fs.statSync(filePath);
          } catch {
            return null;
          }

          return {
            name: file,
            isDir: fileStats.isDirectory(),
            sizeBytes: fileStats.isFile() ? fileStats.size : 0,
            relativePath: path.relative(baseDir, filePath),
          };
        })
        .filter(entry => entry !== null);

      return NextResponse.json({
        type: 'dir',
        path: path.relative(projectRoot, targetPath) || '.',
        entries: entries.sort((a, b) => {
          // Directories first, then alphabetical
          if (a.isDir && !b.isDir) return -1;
          if (!a.isDir && b.isDir) return 1;
          return a.name.localeCompare(b.name);
        }),
      });
    } else {
      // It's a file
      const sizeBytes = stats.size;
      
      // Limit file read size (150KB)
      if (sizeBytes > 150 * 1024) {
        return NextResponse.json({
          type: 'file',
          name: path.basename(targetPath),
          path: path.relative(projectRoot, targetPath),
          tooLarge: true,
          sizeBytes,
        });
      }

      // Check if it's text based on common extensions
      const ext = path.extname(targetPath).toLowerCase();
      const textExtensions = [
        '.txt', '.md', '.json', '.js', '.jsx', '.ts', '.tsx', '.swift', 
        '.kt', '.java', '.xml', '.yml', '.yaml', '.gradle', '.properties', 
        '.css', '.html', '.mjs', '.cjs', '.sh', '.mdx', '.h', '.m'
      ];
      
      const isText = textExtensions.includes(ext);

      if (!isText) {
        return NextResponse.json({
          type: 'file',
          name: path.basename(targetPath),
          path: path.relative(projectRoot, targetPath),
          isBinary: true,
          sizeBytes,
        });
      }

      const content = fs.readFileSync(targetPath, 'utf-8');
      
      return NextResponse.json({
        type: 'file',
        name: path.basename(targetPath),
        path: path.relative(projectRoot, targetPath),
        content,
        sizeBytes,
        extension: ext,
      });
    }
  } catch (error) {
    console.error('Files API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
