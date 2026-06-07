import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { getProjects } from '@/lib/db';

const execAsync = promisify(exec);

// Map platforms to their directories in the codebase
const PLATFORM_DIR_MAPPING: Record<string, string> = {
  ios: 'ios',
  android: 'android',
  web: 'web',
  watchos: 'ios', // watchOS lives in the ios folder
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const platform = searchParams.get('platform');

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

    const repoPath = path.resolve(project.path);
    
    // Safety check: Make sure we are operating inside a git repository
    if (!fs.existsSync(path.join(repoPath, '.git'))) {
      return NextResponse.json({ error: 'Path is not a git repository' }, { status: 400 });
    }

    // Determine target sub-directory path for git queries
    let gitTargetFolder = '';
    if (platform) {
      const folderName = PLATFORM_DIR_MAPPING[platform.toLowerCase()];
      if (folderName) {
        gitTargetFolder = folderName;
      }
    }

    // Execute git commands
    // 1. Current Branch
    let branch = 'unknown';
    try {
      const { stdout } = await execAsync('git branch --show-current', { cwd: repoPath });
      branch = stdout.trim();
    } catch (err) {
      console.warn('Failed to get current branch:', err);
    }

    // 2. Git Status (Check for uncommitted files in target directory)
    let statusText = '';
    let hasLocalChanges = false;
    try {
      const targetPathFilter = gitTargetFolder ? ` -- "${gitTargetFolder}"` : '';
      const { stdout } = await execAsync(`git status --porcelain${targetPathFilter}`, { cwd: repoPath });
      statusText = stdout.trim();
      hasLocalChanges = statusText.length > 0;
    } catch (err) {
      console.warn('Failed to get git status:', err);
    }

    // 3. Git Log (Recent commits in target directory)
    interface CommitInfo {
      hash: string;
      author: string;
      date: string;
      subject: string;
    }
    const commits: CommitInfo[] = [];
    try {
      const targetPathFilter = gitTargetFolder ? ` -- "${gitTargetFolder}"` : '';
      // Format: hash|author|relative-date|subject
      const { stdout } = await execAsync(`git log -n 5 --pretty=format:"%h|%an|%ar|%s"${targetPathFilter}`, { cwd: repoPath });
      
      if (stdout.trim()) {
        const lines = stdout.trim().split('\n');
        for (const line of lines) {
          const [hash, author, date, subject] = line.split('|');
          commits.push({ hash, author, date, subject });
        }
      }
    } catch (err) {
      console.warn('Failed to get git log:', err);
    }

    return NextResponse.json({
      repoPath,
      branch,
      hasLocalChanges,
      statusCount: statusText ? statusText.split('\n').length : 0,
      commits,
    });

  } catch (error) {
    console.error('Git API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
