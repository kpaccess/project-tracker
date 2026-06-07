import fs from 'fs';
import path from 'path';

export interface Project {
  id: string;
  name: string;
  description?: string;
  platforms: string[];
  path?: string;
  createdAt: string;
}

export type FeatureStatus = 'backlog' | 'started' | 'review' | 'ready_to_test' | 'completed';
export type FeaturePriority = 'low' | 'medium' | 'high';

export interface Feature {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  platform: string; // e.g., 'Web', 'iOS', 'Android', 'All'
  status: FeatureStatus;
  priority: FeaturePriority;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface DatabaseSchema {
  projects: Project[];
  features: Feature[];
}

const DB_FILE_PATH = path.join(process.cwd(), 'db.json');

const INITIAL_DATA: DatabaseSchema = {
  projects: [
    {
      id: 'burpeepacers',
      name: 'BurpeePacers',
      description: 'A fitness pacing app designed to help users maintain a consistent tempo for burpees and workouts.',
      platforms: ['Web', 'iOS', 'Android', 'watchOS'],
      path: '/Users/krishnapradhan/projects/burpee-pacers',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'chainhabit',
      name: 'ChainHabit',
      description: 'A habit tracking app focused on building chains and streaks to form long-term routines.',
      platforms: ['iOS', 'Android'],
      createdAt: new Date().toISOString(),
    },
  ],
  features: [
    {
      id: 'bp-feat-1',
      projectId: 'burpeepacers',
      title: 'Sound Cues & Voice Prompts',
      description: 'Add customizable audio cues for down, up, and rest states.',
      platform: 'iOS',
      status: 'completed',
      priority: 'high',
      createdBy: 'Krishna',
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
      updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'bp-feat-2',
      projectId: 'burpeepacers',
      title: 'Sync Workouts to Cloud',
      description: 'Allow users to back up their workout statistics and paced sets across devices.',
      platform: 'Web',
      status: 'started',
      priority: 'medium',
      createdBy: 'Developer',
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'bp-feat-3',
      projectId: 'burpeepacers',
      title: 'Bluetooth Heart Rate Monitor Integration',
      description: 'Connect to external BLE heart rate bands to record real-time heart rate stats.',
      platform: 'Android',
      status: 'review',
      priority: 'high',
      createdBy: 'Krishna',
      createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'bp-feat-4',
      projectId: 'burpeepacers',
      title: 'Apple Watch & HealthKit Integration',
      description: 'Add watchOS app featuring WatchConnectivity timer sync, HealthKit Functional Strength Training recording, and direct rep control actions.',
      platform: 'watchOS',
      status: 'backlog',
      priority: 'high',
      createdBy: 'Krishna',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'bp-feat-5',
      projectId: 'burpeepacers',
      title: 'Age-Bracket Extension (60s, 70s, 80+)',
      description: 'Extend iOS AgeBracket beyond 50+ to support older athletes (60s, 70s, 80+) with joint-friendly, scalable strength finishers. Update Models.swift, FinisherDatabase.swift, and AccountSettingsView.swift, and update WORKOUT_SPECIFICATION.md §5 first.',
      platform: 'iOS',
      status: 'backlog',
      priority: 'medium',
      createdBy: 'Krishna',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'bp-feat-6',
      projectId: 'burpeepacers',
      title: 'Smart Scale & Health Data Integration',
      description: 'Integrate smart scale and weighing app data (via Apple HealthKit or direct Bluetooth BLE scale connection) to automatically sync and update user body weight and other health/body composition metrics.',
      platform: 'iOS',
      status: 'backlog',
      priority: 'medium',
      createdBy: 'Krishna',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'ch-feat-1',
      projectId: 'chainhabit',
      title: 'Port UI and Navigation to Android',
      description: 'Port the Swift UI/UIKit design components to Kotlin and Jetpack Compose.',
      platform: 'Android',
      status: 'started',
      priority: 'high',
      createdBy: 'Krishna',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'ch-feat-2',
      projectId: 'chainhabit',
      title: 'Interactive Home Screen Widgets',
      description: 'Add iOS 17 home screen interactive widgets for quick-checking habits.',
      platform: 'iOS',
      status: 'ready_to_test',
      priority: 'medium',
      createdBy: 'Krishna',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
};

function readDb(): DatabaseSchema {
  try {
    if (!fs.existsSync(DB_FILE_PATH)) {
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(INITIAL_DATA, null, 2), 'utf-8');
      return INITIAL_DATA;
    }
    const data = fs.readFileSync(DB_FILE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading database file:', error);
    return { projects: [], features: [] };
  }
}

function writeDb(data: DatabaseSchema): void {
  try {
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing database file:', error);
  }
}

export function getProjects(): Project[] {
  const db = readDb();
  return db.projects;
}

export function addProject(project: Omit<Project, 'id' | 'createdAt'>): Project {
  const db = readDb();
  const newProject: Project = {
    ...project,
    id: project.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `proj-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  
  // Ensure ID is unique
  let finalId = newProject.id;
  let counter = 1;
  while (db.projects.some(p => p.id === finalId)) {
    finalId = `${newProject.id}-${counter++}`;
  }
  newProject.id = finalId;

  db.projects.push(newProject);
  writeDb(db);
  return newProject;
}

export function deleteProject(projectId: string): void {
  const db = readDb();
  db.projects = db.projects.filter(p => p.id !== projectId);
  db.features = db.features.filter(f => f.projectId !== projectId); // cascade delete features
  writeDb(db);
}

export function getFeatures(): Feature[] {
  const db = readDb();
  return db.features;
}

export function getFeaturesByProject(projectId: string): Feature[] {
  const db = readDb();
  return db.features.filter(f => f.projectId === projectId);
}

export function addFeature(feature: Omit<Feature, 'id' | 'createdAt' | 'updatedAt'>): Feature {
  const db = readDb();
  const now = new Date().toISOString();
  const newFeature: Feature = {
    ...feature,
    id: `feat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: now,
    updatedAt: now,
  };
  db.features.push(newFeature);
  writeDb(db);
  return newFeature;
}

export function updateFeatureStatus(featureId: string, status: FeatureStatus): Feature | null {
  const db = readDb();
  const index = db.features.findIndex(f => f.id === featureId);
  if (index === -1) return null;

  db.features[index].status = status;
  db.features[index].updatedAt = new Date().toISOString();
  writeDb(db);
  return db.features[index];
}

export function updateFeature(featureId: string, updatedFields: Partial<Omit<Feature, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>>): Feature | null {
  const db = readDb();
  const index = db.features.findIndex(f => f.id === featureId);
  if (index === -1) return null;

  db.features[index] = {
    ...db.features[index],
    ...updatedFields,
    updatedAt: new Date().toISOString(),
  };
  writeDb(db);
  return db.features[index];
}

export function deleteFeature(featureId: string): void {
  const db = readDb();
  db.features = db.features.filter(f => f.id !== featureId);
  writeDb(db);
}
