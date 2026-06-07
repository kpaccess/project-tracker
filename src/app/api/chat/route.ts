import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';
import { getProjects, getFeaturesByProject, addFeature } from '@/lib/db';

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

const TEXT_EXTENSIONS = [
  '.txt', '.md', '.json', '.js', '.jsx', '.ts', '.tsx', '.swift', 
  '.kt', '.java', '.xml', '.yml', '.yaml', '.gradle', '.properties', 
  '.css', '.html', '.mjs', '.cjs', '.sh', '.mdx', '.h', '.m'
];

const tools: any = [{
  functionDeclarations: [
    {
      name: 'list_projects',
      description: 'Lists all projects, their platforms, and their local directory paths.',
      parameters: {
        type: 'OBJECT',
        properties: {}
      }
    },
    {
      name: 'list_features',
      description: 'Lists all features currently registered for a specific project.',
      parameters: {
        type: 'OBJECT',
        properties: {
          projectId: { type: 'STRING', description: 'The unique ID of the project (e.g., "burpeepacers", "chainhabit")' }
        },
        required: ['projectId']
      }
    },
    {
      name: 'list_directory',
      description: 'Lists files and folders inside a project\'s workspace directory (excluding node_modules, .git, Pods, etc.).',
      parameters: {
        type: 'OBJECT',
        properties: {
          projectId: { type: 'STRING', description: 'The project ID' },
          subpath: { type: 'STRING', description: 'Optional relative path within the project to browse' }
        },
        required: ['projectId']
      }
    },
    {
      name: 'read_file',
      description: 'Reads the content of a text-based code file (Swift, Kotlin, TypeScript, etc.) inside a project\'s directory.',
      parameters: {
        type: 'OBJECT',
        properties: {
          projectId: { type: 'STRING', description: 'The project ID' },
          filePath: { type: 'STRING', description: 'Relative path to the file inside the project directory' }
        },
        required: ['projectId', 'filePath']
      }
    },
    {
      name: 'add_feature_to_backlog',
      description: 'Adds a new feature card directly to the project\'s Backlog column.',
      parameters: {
        type: 'OBJECT',
        properties: {
          projectId: { type: 'STRING', description: 'The project ID' },
          title: { type: 'STRING', description: 'Title of the feature' },
          description: { type: 'STRING', description: 'Detailed explanation of what to implement, files to touch, etc.' },
          platform: { type: 'STRING', description: 'Platform, e.g., "iOS", "Android", "Web", "watchOS", "All"' },
          priority: { type: 'STRING', description: 'Priority: "low", "medium", or "high"' }
        },
        required: ['projectId', 'title', 'description', 'platform', 'priority']
      }
    }
  ]
}];

// Tool execution handlers
async function executeTool(name: string, args: any): Promise<any> {
  console.log(`AI invoking tool ${name} with args:`, args);
  try {
    switch (name) {
      case 'list_projects': {
        const projects = getProjects();
        return { projects: projects.map(p => ({ id: p.id, name: p.name, platforms: p.platforms, path: p.path })) };
      }

      case 'list_features': {
        const { projectId } = args;
        const features = getFeaturesByProject(projectId);
        return { features };
      }

      case 'list_directory': {
        const { projectId, subpath = '' } = args;
        const projects = getProjects();
        const project = projects.find(p => p.id === projectId);
        if (!project || !project.path) return { error: `Project not found or path not configured` };

        const root = path.resolve(project.path);
        const target = path.resolve(path.join(root, subpath));

        if (!target.startsWith(root)) return { error: 'Access denied: Directory traversal detected' };
        if (!fs.existsSync(target)) return { error: 'Directory does not exist' };
        
        const stat = fs.statSync(target);
        if (!stat.isDirectory()) return { error: 'Path is not a directory' };

        const items = fs.readdirSync(target)
          .filter(item => !EXCLUDED_FOLDERS.has(item))
          .map(item => {
            const itemPath = path.join(target, item);
            let isDir = false;
            try { isDir = fs.statSync(itemPath).isDirectory(); } catch {}
            return { name: item, isDir, relativePath: path.relative(root, itemPath) };
          });

        return { path: path.relative(root, target) || '.', entries: items };
      }

      case 'read_file': {
        const { projectId, filePath } = args;
        const projects = getProjects();
        const project = projects.find(p => p.id === projectId);
        if (!project || !project.path) return { error: `Project not found or path not configured` };

        const root = path.resolve(project.path);
        const target = path.resolve(path.join(root, filePath));

        if (!target.startsWith(root)) return { error: 'Access denied: Directory traversal detected' };
        if (!fs.existsSync(target)) return { error: 'File does not exist' };

        const stat = fs.statSync(target);
        if (!stat.isFile()) return { error: 'Path is not a file' };
        if (stat.size > 150 * 1024) return { error: 'File size exceeds 150KB limit' };

        const ext = path.extname(target).toLowerCase();
        if (!TEXT_EXTENSIONS.includes(ext)) return { error: 'File format is not supported for text previews' };

        const content = fs.readFileSync(target, 'utf-8');
        return { filePath, content };
      }

      case 'add_feature_to_backlog': {
        const { projectId, title, description, platform, priority } = args;
        const projects = getProjects();
        const project = projects.find(p => p.id === projectId);
        if (!project) return { error: `Project ${projectId} not found` };

        const newFeature = addFeature({
          projectId,
          title,
          description,
          platform,
          priority: priority.toLowerCase() as any,
          status: 'backlog',
          createdBy: 'AI Chat Assistant'
        });

        return { success: true, message: `Feature successfully added to ${projectId} backlog`, feature: newFeature };
      }

      default:
        return { error: `Unknown tool ${name}` };
    }
  } catch (err: any) {
    console.error(`Tool execution error:`, err);
    return { error: err.message || 'Unknown tool execution error' };
  }
}

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({
      error: 'GEMINI_API_KEY is not configured',
      needsConfig: true,
      message: 'Please set the GEMINI_API_KEY environment variable in your .env.local file to enable the AI Chat Assistant.'
    }, { status: 400 });
  }

  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 });
    }

    const ai = new GoogleGenAI({ apiKey });

    // Format chat history for Gemini API
    const contents: any[] = messages.map((m: any) => {
      let role = m.role;
      if (role === 'assistant') role = 'model';
      
      const parts: any[] = [];
      if (m.content) {
        parts.push({ text: m.content });
      }

      // Handle past function calls/responses stored in history
      if (m.functionCalls) {
        parts.push(...m.functionCalls.map((fc: any) => ({ functionCall: fc })));
      }
      if (m.functionResponses) {
        role = 'tool';
        parts.push(...m.functionResponses.map((fr: any) => ({ functionResponse: fr })));
      }

      return { role, parts };
    });

    const systemInstruction = `You are the DevSprint Project Tracker AI Assistant. Your goal is to help developers analyze their codebases, evaluate the feasibility of implementing features, and directly add new features to the project backlog.

When a user suggests a feature:
1. Identify the relevant project (e.g., BurpeePacers, ChainHabit). If they don't specify, call 'list_projects' or ask them to clarify.
2. If a local directory path is configured for the project, use 'list_directory' and 'read_file' to search and read relevant code files. Analyze the existing codebase to determine where and how this feature would be implemented.
3. Perform a concrete feasibility study: List which classes, files, databases, or view components will need modification. Discuss architectural patterns or migration issues (e.g., if changing database schemas or settings classes).
4. Summarize your feasibility analysis and code findings in a clear, concise manner.
5. Invoke 'add_feature_to_backlog' to automatically register the feature in the backlog with appropriate title, detailed description (detailing which files to touch), platform, and priority.
6. Provide a final response explaining that the feature has been added, and recap the implementation guide.

Be highly technical and direct. Suggest architectural edits, specify exact file names, and keep your explanations professional and concise.`;

    let loop = true;
    let iterations = 0;
    const maxIterations = 5;
    let finalResponseText = '';
    const pendingFunctionCalls: any[] = [];
    const pendingFunctionResponses: any[] = [];

    while (loop && iterations < maxIterations) {
      iterations++;
      console.log(`Running agent loop iteration ${iterations}...`);

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents,
        config: {
          systemInstruction,
          tools,
        }
      });

      const candidate = response.candidates?.[0];
      const modelParts = candidate?.content?.parts || [];
      const functionCalls = modelParts.filter((p: any) => p.functionCall).map((p: any) => p.functionCall);
      const textPart = modelParts.find((p: any) => p.text);
      const text = textPart?.text || '';

      if (text) {
        finalResponseText = text;
      }

      if (functionCalls.length > 0) {
        // Record function calls returned by the model
        contents.push({
          role: 'model',
          parts: functionCalls.map(fc => ({ functionCall: fc }))
        });
        
        // Execute all function calls
        const responses = await Promise.all(
          functionCalls.map(async (call) => {
            const toolResult = await executeTool(call.name, call.args);
            return {
              name: call.name,
              response: { result: toolResult }
            };
          })
        );

        // Record function responses
        contents.push({
          role: 'tool',
          parts: responses.map(r => ({ functionResponse: r }))
        });

        // Record details to return to the client
        pendingFunctionCalls.push(...functionCalls);
        pendingFunctionResponses.push(...responses);
      } else {
        loop = false;
      }
    }

    return NextResponse.json({
      role: 'assistant',
      content: finalResponseText || "Feature processed.",
      functionCalls: pendingFunctionCalls.length > 0 ? pendingFunctionCalls : undefined,
      functionResponses: pendingFunctionResponses.length > 0 ? pendingFunctionResponses : undefined,
    });

  } catch (error: any) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
