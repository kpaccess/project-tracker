import { NextResponse } from 'next/server';
import { getFeatures, addFeature } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const features = getFeatures();
    if (projectId) {
      return NextResponse.json(features.filter(f => f.projectId === projectId));
    }
    return NextResponse.json(features);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch features' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.projectId || !body.title || !body.status || !body.priority || !body.platform) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const newFeature = addFeature({
      projectId: body.projectId,
      title: body.title,
      description: body.description || '',
      platform: body.platform,
      status: body.status,
      priority: body.priority,
      createdBy: body.createdBy || 'Anonymous',
    });
    return NextResponse.json(newFeature, { status: 201 });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to create feature' }, { status: 500 });
  }
}
