import { NextResponse } from 'next/server';
import { deleteProject } from '@/lib/db';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Await params to support both Next.js 15+ async params and standard sync params
    const resolvedParams = await params;
    const { id } = resolvedParams;
    deleteProject(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}
