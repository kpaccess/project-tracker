import { NextResponse } from 'next/server';
import { getProjects, addProject } from '@/lib/db';

export async function GET() {
  try {
    const projects = getProjects();
    return NextResponse.json(projects);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.name) {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
    }
    const newProject = addProject({
      name: body.name,
      description: body.description || '',
      platforms: body.platforms || [],
      path: body.path || '',
    });
    return NextResponse.json(newProject, { status: 201 });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}
