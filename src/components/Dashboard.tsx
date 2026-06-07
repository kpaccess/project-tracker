'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  Checkbox,
  FormGroup,
  FormControlLabel,
  Chip,
  Tabs,
  Tab,
  LinearProgress,
  InputAdornment,
  Tooltip,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Apple as AppleIcon,
  Android as AndroidIcon,
  Language as WebIcon,
  MoreVert as MoreIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  PlayArrow as StartedIcon,
  CheckCircle as CompletedIcon,
  RateReview as ReviewIcon,
  BugReport as TestIcon,
  Assignment as BacklogIcon,
  Code as LogoIcon,
  Refresh as RefreshIcon,
  Layers as ProjectIcon,
  Watch as WatchIcon,
  Chat as ChatIcon,
} from '@mui/icons-material';
import { Project, Feature, FeatureStatus, FeaturePriority } from '@/lib/db';

const STATUS_COLUMNS: { id: FeatureStatus; title: string; icon: React.ReactNode; color: string }[] = [
  { id: 'backlog', title: 'Backlog', icon: <BacklogIcon fontSize="small" />, color: '#94a3b8' },
  { id: 'started', title: 'In Progress', icon: <StartedIcon fontSize="small" />, color: '#3b82f6' },
  { id: 'review', title: 'In Review', icon: <ReviewIcon fontSize="small" />, color: '#f59e0b' },
  { id: 'ready_to_test', title: 'Ready to Test', icon: <TestIcon fontSize="small" />, color: '#10b981' },
  { id: 'completed', title: 'Completed', icon: <CompletedIcon fontSize="small" />, color: '#8b5cf6' },
];

export default function Dashboard() {
  // Data State
  const [projects, setProjects] = useState<Project[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter State
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [platformFilter, setPlatformFilter] = useState<string>('All');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Drag and Drop Visual Feedback State
  const [draggedOverColumn, setDraggedOverColumn] = useState<FeatureStatus | null>(null);

  // Modal State
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [featureModalOpen, setFeatureModalOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState<Feature | null>(null);

  // Form States - Project
  const [newProjName, setNewProjName] = useState('');
  const [newProjDesc, setNewProjDesc] = useState('');
  const [newProjPath, setNewProjPath] = useState('');
  const [newProjPlatforms, setNewProjPlatforms] = useState({
    Web: false,
    iOS: false,
    Android: false,
    watchOS: false,
  });

  // Form States - Feature
  const [featProjectId, setFeatProjectId] = useState('');
  const [featTitle, setFeatTitle] = useState('');
  const [featDesc, setFeatDesc] = useState('');
  const [featPlatform, setFeatPlatform] = useState('All');
  const [featPriority, setFeatPriority] = useState<FeaturePriority>('medium');
  const [featStatus, setFeatStatus] = useState<FeatureStatus>('backlog');
  const [featCreatedBy, setFeatCreatedBy] = useState('');

  // Codebase Explorer & Git Status States
  const [activeTab, setActiveTab] = useState(0);
  const [explorerFiles, setExplorerFiles] = useState<any[]>([]);
  const [explorerPath, setExplorerPath] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<any | null>(null);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [fileContentLoading, setFileContentLoading] = useState(false);
  const [gitInfo, setGitInfo] = useState<any | null>(null);
  const [loadingGit, setLoadingGit] = useState(false);

  // AI Chat States
  const [chatMessages, setChatMessages] = useState<any[]>([
    {
      role: 'assistant',
      content: "Hello! I am your AI Development Assistant. Suggest any features you'd like to implement, and I will analyze the codebase, check feasibility, and automatically add them to the project backlog for you."
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [needsApiKey, setNeedsApiKey] = useState(false);

  // Fetch functions for Codebase & Git Status
  const fetchGitInfo = async (projId: string, platform: string) => {
    setLoadingGit(true);
    try {
      const res = await fetch(`/api/git?projectId=${projId}&platform=${platform}`);
      const data = await res.json();
      if (!data.error) {
        setGitInfo(data);
      } else {
        setGitInfo(null);
      }
    } catch (err) {
      console.error(err);
      setGitInfo(null);
    } finally {
      setLoadingGit(false);
    }
  };

  const fetchFiles = async (projId: string, platform: string, subpath: string) => {
    setLoadingFiles(true);
    try {
      const res = await fetch(`/api/files?projectId=${projId}&platform=${platform}&subpath=${encodeURIComponent(subpath)}`);
      const data = await res.json();
      if (!data.error && data.type === 'dir') {
        setExplorerFiles(data.entries);
      } else {
        setExplorerFiles([]);
      }
    } catch (err) {
      console.error(err);
      setExplorerFiles([]);
    } finally {
      setLoadingFiles(false);
    }
  };

  const fetchFileContent = async (projId: string, platform: string, relativeFilePath: string) => {
    setFileContentLoading(true);
    try {
      const res = await fetch(`/api/files?projectId=${projId}&platform=${platform}&subpath=${encodeURIComponent(relativeFilePath)}`);
      const data = await res.json();
      if (!data.error && data.type === 'file') {
        setSelectedFile(data);
      } else {
        setSelectedFile(null);
      }
    } catch (err) {
      console.error(err);
      setSelectedFile(null);
    } finally {
      setFileContentLoading(false);
    }
  };

  const handleSendChatMessage = async (customMessage?: string) => {
    const textToSend = customMessage || chatInput;
    if (!textToSend.trim() || chatLoading) return;

    const newMessages = [...chatMessages, { role: 'user', content: textToSend }];
    setChatMessages(newMessages);
    setChatInput('');
    setChatLoading(true);
    setNeedsApiKey(false);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.needsConfig) {
          setNeedsApiKey(true);
        }
        setChatMessages(prev => [
          ...prev,
          { role: 'assistant', content: `Error: ${data.message || data.error || 'Failed to get response'}` }
        ]);
        return;
      }

      setChatMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: data.content,
          functionCalls: data.functionCalls,
          functionResponses: data.functionResponses,
        }
      ]);
      
      const ranAddFeature = data.functionCalls?.some((fc: any) => fc.name === 'add_feature_to_backlog');
      if (ranAddFeature) {
        fetchData();
      }

    } catch (err: any) {
      console.error(err);
      setChatMessages(prev => [
        ...prev,
        { role: 'assistant', content: `Network Error: ${err.message || 'Could not connect to AI service'}` }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  // Reset explorer states when project or platform changes
  useEffect(() => {
    setExplorerPath('');
    setSelectedFile(null);
    setExplorerFiles([]);
    setGitInfo(null);
  }, [selectedProjectId, platformFilter]);

  // Fetch Git and Files on changes
  useEffect(() => {
    if (selectedProjectId !== 'all') {
      const plat = platformFilter === 'All' ? '' : platformFilter;
      fetchGitInfo(selectedProjectId, plat);
      fetchFiles(selectedProjectId, plat, explorerPath);
    }
  }, [selectedProjectId, platformFilter, explorerPath]);

  // Action Menu State (for individual cards)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuFeature, setMenuFeature] = useState<Feature | null>(null);

  // Fetch Data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [projRes, featRes] = await Promise.all([
        fetch('/api/projects'),
        fetch('/api/features'),
      ]);
      const projData = await projRes.json();
      const featData = await featRes.json();
      
      if (Array.isArray(projData)) setProjects(projData);
      if (Array.isArray(featData)) setFeatures(featData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Update specific feature status (used for drag and drop & menus)
  const handleStatusChange = async (featureId: string, newStatus: FeatureStatus) => {
    try {
      // Optimistic Update
      setFeatures(prev =>
        prev.map(f => (f.id === featureId ? { ...f, status: newStatus, updatedAt: new Date().toISOString() } : f))
      );

      const res = await fetch(`/api/features/${featureId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        throw new Error('Failed to update status');
      }
    } catch (error) {
      console.error('Failed to update feature status:', error);
      fetchData(); // Rollback
    }
  };

  // Delete project handler
  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project? This will delete all its features!')) return;
    try {
      // Optimistic Update
      setProjects(prev => prev.filter(p => p.id !== projectId));
      setFeatures(prev => prev.filter(f => f.projectId !== projectId));
      if (selectedProjectId === projectId) {
        setSelectedProjectId('all');
      }

      await fetch(`/api/projects/${projectId}`, { method: 'DELETE' });
    } catch (error) {
      console.error('Failed to delete project:', error);
      fetchData();
    }
  };

  // Submit Project Form
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName.trim()) return;

    const selectedPlats = Object.keys(newProjPlatforms).filter(
      k => newProjPlatforms[k as keyof typeof newProjPlatforms]
    );

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProjName,
          description: newProjDesc,
          platforms: selectedPlats,
          path: newProjPath,
        }),
      });

      if (res.ok) {
        const created = await res.json();
        setProjects(prev => [...prev, created]);
        setSelectedProjectId(created.id);
        
        // Reset states
        setNewProjName('');
        setNewProjDesc('');
        setNewProjPath('');
        setNewProjPlatforms({ Web: false, iOS: false, Android: false, watchOS: false });
        setProjectModalOpen(false);
      }
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  // Open Feature Modal (either new or editing)
  const openFeatureModal = (feature: Feature | null = null) => {
    if (feature) {
      setEditingFeature(feature);
      setFeatProjectId(feature.projectId);
      setFeatTitle(feature.title);
      setFeatDesc(feature.description || '');
      setFeatPlatform(feature.platform);
      setFeatPriority(feature.priority);
      setFeatStatus(feature.status);
      setFeatCreatedBy(feature.createdBy);
    } else {
      setEditingFeature(null);
      // Auto-select current project if not 'all'
      setFeatProjectId(selectedProjectId !== 'all' ? selectedProjectId : (projects[0]?.id || ''));
      setFeatTitle('');
      setFeatDesc('');
      setFeatPlatform('All');
      setFeatPriority('medium');
      setFeatStatus('backlog');
      setFeatCreatedBy('');
    }
    setFeatureModalOpen(true);
  };

  // Submit Feature Form
  const handleSaveFeature = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!featTitle.trim() || !featProjectId) return;

    const payload = {
      projectId: featProjectId,
      title: featTitle,
      description: featDesc,
      platform: featPlatform,
      priority: featPriority,
      status: featStatus,
      createdBy: featCreatedBy.trim() || 'Krishna',
    };

    try {
      if (editingFeature) {
        // Edit Mode
        const res = await fetch(`/api/features/${editingFeature.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const updated = await res.json();
          setFeatures(prev => prev.map(f => (f.id === updated.id ? updated : f)));
          setFeatureModalOpen(false);
        }
      } else {
        // Create Mode
        const res = await fetch('/api/features', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const created = await res.json();
          setFeatures(prev => [...prev, created]);
          setFeatureModalOpen(false);
        }
      }
    } catch (error) {
      console.error('Failed to save feature:', error);
    }
  };

  // Delete Feature Handler
  const handleDeleteFeature = async (featureId: string) => {
    if (!confirm('Are you sure you want to delete this feature?')) return;
    try {
      // Optimistic Update
      setFeatures(prev => prev.filter(f => f.id !== featureId));
      await fetch(`/api/features/${featureId}`, { method: 'DELETE' });
    } catch (error) {
      console.error('Failed to delete feature:', error);
      fetchData();
    }
  };

  // Card Options Menu Handlers
  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>, feature: Feature) => {
    setAnchorEl(event.currentTarget);
    setMenuFeature(feature);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuFeature(null);
  };

  const handleMenuEdit = () => {
    if (menuFeature) {
      openFeatureModal(menuFeature);
    }
    handleMenuClose();
  };

  const handleMenuDelete = () => {
    if (menuFeature) {
      handleDeleteFeature(menuFeature.id);
    }
    handleMenuClose();
  };

  // HTML5 Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, columnId: FeatureStatus) => {
    e.preventDefault();
    if (draggedOverColumn !== columnId) {
      setDraggedOverColumn(columnId);
    }
  };

  const handleDragLeave = () => {
    setDraggedOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, targetStatus: FeatureStatus) => {
    e.preventDefault();
    setDraggedOverColumn(null);
    const featureId = e.dataTransfer.getData('text/plain');
    if (featureId) {
      handleStatusChange(featureId, targetStatus);
    }
  };

  // Get platforms options for form depending on selected project
  const getPlatformsForSelectedProject = () => {
    const proj = projects.find(p => p.id === (featProjectId || selectedProjectId));
    if (!proj) return ['Web', 'iOS', 'Android', 'All'];
    return [...proj.platforms, 'All'];
  };

  // Filter Features
  const filteredFeatures = features.filter(feature => {
    // Project filter
    if (selectedProjectId !== 'all' && feature.projectId !== selectedProjectId) return false;
    
    // Platform filter
    if (platformFilter !== 'All' && feature.platform !== platformFilter && feature.platform !== 'All') return false;

    // Priority filter
    if (priorityFilter !== 'All' && feature.priority !== priorityFilter.toLowerCase()) return false;

    // Search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const titleMatch = feature.title.toLowerCase().includes(query);
      const descMatch = feature.description?.toLowerCase().includes(query) || false;
      const authorMatch = feature.createdBy.toLowerCase().includes(query);
      return titleMatch || descMatch || authorMatch;
    }

    return true;
  });

  // Calculate statistics
  const currentProject = projects.find(p => p.id === selectedProjectId);
  const projectFeatures = features.filter(f => selectedProjectId === 'all' || f.projectId === selectedProjectId);
  const totalCount = projectFeatures.length;
  const completedCount = projectFeatures.filter(f => f.status === 'completed').length;
  const reviewCount = projectFeatures.filter(f => f.status === 'review' || f.status === 'ready_to_test').length;
  const progressCount = projectFeatures.filter(f => f.status === 'started').length;
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Platforms count
  const iosCount = projectFeatures.filter(f => f.platform === 'iOS').length;
  const androidCount = projectFeatures.filter(f => f.platform === 'Android').length;
  const webCount = projectFeatures.filter(f => f.platform === 'Web').length;
  const watchosCount = projectFeatures.filter(f => f.platform === 'watchOS').length;

  const renderPlatformIcon = (platform: string, size: 'small' | 'medium' = 'small') => {
    switch (platform.toLowerCase()) {
      case 'ios':
        return <AppleIcon fontSize={size} sx={{ color: '#94a3b8' }} />;
      case 'android':
        return <AndroidIcon fontSize={size} sx={{ color: '#10b981' }} />;
      case 'web':
        return <WebIcon fontSize={size} sx={{ color: '#0ea5e9' }} />;
      case 'watchos':
        return <WatchIcon fontSize={size} sx={{ color: '#ec4899' }} />;
      default:
        return <Chip label="All" size="small" variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} />;
    }
  };

  const getPriorityColor = (priority: FeaturePriority) => {
    switch (priority) {
      case 'high':
        return { bg: 'rgba(239, 68, 68, 0.15)', text: '#f87171', border: 'rgba(239, 68, 68, 0.3)' };
      case 'medium':
        return { bg: 'rgba(245, 158, 11, 0.15)', text: '#fbbf24', border: 'rgba(245, 158, 11, 0.3)' };
      case 'low':
        return { bg: 'rgba(59, 130, 246, 0.15)', text: '#60a5fa', border: 'rgba(59, 130, 246, 0.3)' };
    }
  };

  return (
    <Container maxWidth="xl" sx={{ pt: 3, pb: 6 }}>
      {/* Header Panel */}
      <Box
        className="glass-panel"
        sx={{
          p: { xs: 2, md: 3 },
          borderRadius: '16px',
          mb: 4,
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', md: 'center' },
          gap: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              p: 1.5,
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #6366f1 0%, #14b8a6 100%)',
              color: '#ffffff',
              boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)',
            }}
          >
            <LogoIcon fontSize="large" />
          </Box>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 850, letterSpacing: '-0.03em', display: 'flex', alignItems: 'center', gap: 1 }}>
              DevSprint
              <Chip label="Beta" size="small" color="secondary" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700 }} />
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Cross-Platform Project Feature Pipeline
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, width: { xs: '100%', md: 'auto' } }}>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => setProjectModalOpen(true)}
            sx={{ flex: 1 }}
          >
            New Project
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => openFeatureModal(null)}
            sx={{ flex: 1 }}
          >
            Add Feature
          </Button>
          <IconButton onClick={fetchData} sx={{ border: '1px solid #1e293b', borderRadius: '10px' }}>
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Metrics Row */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ p: 1 }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {currentProject ? `${currentProject.name} Progress` : 'Total Project Suite Progress'}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                <Typography variant="h3" sx={{ fontWeight: 750 }}>
                  {completionPercentage}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {completedCount} of {totalCount} Features
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={completionPercentage}
                color={completionPercentage === 100 ? 'success' : 'primary'}
                sx={{ height: 8, borderRadius: '4px', bgcolor: 'rgba(255,255,255,0.05)' }}
              />
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card sx={{ p: 1 }}>
            <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Active Pipeline
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 750, color: '#f59e0b' }}>
                  {progressCount + reviewCount}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {progressCount} In-Progress • {reviewCount} Review/Test
                </Typography>
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  gap: 1.5,
                  p: 1.5,
                  borderRadius: '12px',
                  bgcolor: 'rgba(245, 158, 11, 0.1)',
                  border: '1px solid rgba(245, 158, 11, 0.15)',
                }}
              >
                <StartedIcon sx={{ color: '#f59e0b' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card sx={{ p: 1 }}>
            <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Platform Distribution
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {renderPlatformIcon('ios', 'small')}
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>{iosCount}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {renderPlatformIcon('android', 'small')}
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>{androidCount}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {renderPlatformIcon('web', 'small')}
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>{webCount}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {renderPlatformIcon('watchos', 'small')}
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>{watchosCount}</Typography>
                  </Box>
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                  Target distributions across codebase
                </Typography>
              </Box>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: '12px',
                  bgcolor: 'rgba(20, 184, 166, 0.1)',
                  border: '1px solid rgba(20, 184, 166, 0.15)',
                }}
              >
                <ProjectIcon sx={{ color: '#14b8a6' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tab Navigation */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, val) => setActiveTab(val)} textColor="secondary" indicatorColor="secondary">
          <Tab label="Kanban Board" />
          <Tab label="Codebase & Git Explorer" />
          <Tab icon={<ChatIcon sx={{ fontSize: '1rem', mr: 0.5 }} />} iconPosition="start" label="AI Chat Assistant" />
        </Tabs>
      </Box>

      {/* Main Workspace Layout */}
      <Grid container spacing={4}>
        {/* Left Sidebar - Projects list */}
        <Grid size={{ xs: 12, lg: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <ProjectIcon color="primary" fontSize="small" />
            Projects
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* "All Projects" selection card */}
            <Card
              onClick={() => setSelectedProjectId('all')}
              sx={{
                cursor: 'pointer',
                borderColor: selectedProjectId === 'all' ? '#6366f1' : '#1e293b',
                background: selectedProjectId === 'all' ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(18, 24, 41, 0.9) 100%)' : '#121829',
                boxShadow: selectedProjectId === 'all' ? '0 0 15px rgba(99, 102, 241, 0.15)' : 'none',
              }}
            >
              <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                <Typography variant="h5" color="text.primary" gutterBottom sx={{ fontWeight: 700 }}>
                  All Projects
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Showing consolidated feature tracks from all active applications.
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                  <Chip label={`${features.length} Features`} size="small" variant="outlined" />
                  <Chip label={`${projects.length} Apps`} size="small" color="primary" variant="outlined" />
                </Box>
              </CardContent>
            </Card>

            {/* Loop through projects */}
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress size={24} />
              </Box>
            ) : (
              projects.map(project => (
                <Card
                  key={project.id}
                  onClick={() => setSelectedProjectId(project.id)}
                  sx={{
                    cursor: 'pointer',
                    borderColor: selectedProjectId === project.id ? '#6366f1' : '#1e293b',
                    background: selectedProjectId === project.id ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(18, 24, 41, 0.9) 100%)' : '#121829',
                    boxShadow: selectedProjectId === project.id ? '0 0 15px rgba(99, 102, 241, 0.15)' : 'none',
                    position: 'relative',
                    '&:hover .delete-proj-btn': { opacity: 1 },
                  }}
                >
                  <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Typography variant="h5" color="text.primary" sx={{ fontWeight: 700 }}>
                        {project.name}
                      </Typography>
                      {/* Delete button (hidden by default, shown on card hover) */}
                      <IconButton
                        className="delete-proj-btn"
                        size="small"
                        color="error"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteProject(project.id);
                        }}
                        sx={{
                          opacity: 0,
                          transition: 'opacity 0.2s',
                          p: 0.5,
                          mt: -0.5,
                          mr: -0.5,
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mb: 2,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        height: 40,
                      }}
                    >
                      {project.description || 'No description provided.'}
                    </Typography>
                    
                    <Divider sx={{ mb: 2 }} />

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {project.platforms.map(p => (
                          <Tooltip key={p} title={`${project.name} ${p} Client`}>
                            <Box
                              sx={{
                                display: 'inline-flex',
                                p: 0.75,
                                borderRadius: '8px',
                                bgcolor: 'rgba(255,255,255,0.03)',
                                border: '1px solid #1e293b',
                              }}
                            >
                              {renderPlatformIcon(p, 'small')}
                            </Box>
                          </Tooltip>
                        ))}
                      </Box>
                      <Chip
                        label={`${features.filter(f => f.projectId === project.id).length} Features`}
                        size="small"
                        variant="outlined"
                        sx={{ borderColor: '#1e293b' }}
                      />
                    </Box>
                  </CardContent>
                </Card>
              ))
            )}
          </Box>
        </Grid>

        {/* Right Area - Filters and Kanban Board */}
        <Grid size={{ xs: 12, lg: 9 }}>
          {activeTab === 0 ? (
            <>
              {/* Filters Area */}
              <Box
                className="glass-panel"
                sx={{
                  p: 2,
                  borderRadius: '12px',
                  mb: 3,
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 2,
                  alignItems: 'center',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FilterIcon fontSize="small" color="secondary" />
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                    Filters:
                  </Typography>
                </Box>

                {/* Platform Filter */}
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel id="platform-filter-label">Platform</InputLabel>
                  <Select
                    labelId="platform-filter-label"
                    value={platformFilter}
                    label="Platform"
                    onChange={(e) => setPlatformFilter(e.target.value)}
                  >
                    <MenuItem value="All">All Platforms</MenuItem>
                    <MenuItem value="iOS">iOS</MenuItem>
                    <MenuItem value="Android">Android</MenuItem>
                    <MenuItem value="Web">Web</MenuItem>
                    <MenuItem value="watchOS">watchOS</MenuItem>
                  </Select>
                </FormControl>

                {/* Priority Filter */}
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel id="priority-filter-label">Priority</InputLabel>
                  <Select
                    labelId="priority-filter-label"
                    value={priorityFilter}
                    label="Priority"
                    onChange={(e) => setPriorityFilter(e.target.value)}
                  >
                    <MenuItem value="All">All Priorities</MenuItem>
                    <MenuItem value="High">High</MenuItem>
                    <MenuItem value="Medium">Medium</MenuItem>
                    <MenuItem value="Low">Low</MenuItem>
                  </Select>
                </FormControl>

                {/* Search Input */}
                <TextField
                  size="small"
                  placeholder="Search features..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  sx={{ flexGrow: 1, minWidth: 200 }}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Box>

              {/* Kanban Board Container */}
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    md: 'repeat(3, 1fr)',
                    xl: 'repeat(5, 1fr)',
                  },
                  gap: 2,
                  overflowX: 'auto',
                  pb: 2,
                }}
              >
                {STATUS_COLUMNS.map(column => {
                  const columnFeatures = filteredFeatures.filter(f => f.status === column.id);
                  const isDraggedOver = draggedOverColumn === column.id;

                  return (
                    <Box
                      key={column.id}
                      className="kanban-column"
                      onDragOver={(e) => handleDragOver(e, column.id)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, column.id)}
                      sx={{
                        borderColor: isDraggedOver ? '#14b8a6' : 'rgba(30, 41, 59, 0.5)',
                        boxShadow: isDraggedOver ? '0 0 15px rgba(20, 184, 166, 0.2)' : 'none',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {/* Column Header */}
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box
                            sx={{
                              display: 'inline-flex',
                              p: 0.5,
                              borderRadius: '6px',
                              bgcolor: 'rgba(255,255,255,0.03)',
                              border: '1px solid rgba(255,255,255,0.05)',
                              color: column.color,
                            }}
                          >
                            {column.icon}
                          </Box>
                          <Typography variant="body1" sx={{ fontWeight: 700 }}>
                            {column.title}
                          </Typography>
                        </Box>
                        <Chip
                          label={columnFeatures.length}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            bgcolor: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                          }}
                        />
                      </Box>

                      {/* Column Cards (Scrollable area) */}
                      <Box
                        sx={{
                          flexGrow: 1,
                          overflowY: 'auto',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 2,
                          pr: 0.5,
                        }}
                      >
                        {columnFeatures.length === 0 ? (
                          <Box
                            sx={{
                              border: '2px dashed rgba(30, 41, 59, 0.5)',
                              borderRadius: '12px',
                              p: 3,
                              textAlign: 'center',
                              color: 'text.secondary',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'center',
                              alignItems: 'center',
                              height: 100,
                              mt: 1,
                            }}
                          >
                            <Typography variant="caption" sx={{ fontStyle: 'italic' }}>
                              Drop features here
                            </Typography>
                          </Box>
                        ) : (
                          columnFeatures.map(feature => {
                            const pri = getPriorityColor(feature.priority);
                            const project = projects.find(p => p.id === feature.projectId);
                            
                            return (
                              <Card
                                key={feature.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, feature.id)}
                                className="glow-card"
                                sx={{
                                  cursor: 'grab',
                                  '&:active': { cursor: 'grabbing' },
                                  bgcolor: '#121829',
                                }}
                              >
                                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                  {/* Card Top Details */}
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                                    <Chip
                                      label={feature.priority.toUpperCase()}
                                      size="small"
                                      sx={{
                                        height: 18,
                                        fontSize: '0.65rem',
                                        fontWeight: 700,
                                        bgcolor: pri.bg,
                                        color: pri.text,
                                        border: `1px solid ${pri.border}`,
                                      }}
                                    />
                                    
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                      {renderPlatformIcon(feature.platform)}
                                      <IconButton
                                        size="small"
                                        onClick={(e) => handleMenuOpen(e, feature)}
                                        sx={{ p: 0.2, color: 'text.secondary' }}
                                      >
                                        <MoreIcon fontSize="small" />
                                      </IconButton>
                                    </Box>
                                  </Box>

                                  {/* Title and Project */}
                                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5, fontSize: '0.95rem', lineHeight: 1.3 }}>
                                    {feature.title}
                                  </Typography>

                                  {selectedProjectId === 'all' && project && (
                                    <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', mb: 1, color: '#6366f1' }}>
                                      {project.name}
                                    </Typography>
                                  )}

                                  {/* Description */}
                                  {feature.description && (
                                    <Typography
                                      variant="body2"
                                      color="text.secondary"
                                      sx={{
                                        mb: 1.5,
                                        display: '-webkit-box',
                                        WebkitLineClamp: 3,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden',
                                        fontSize: '0.825rem',
                                      }}
                                    >
                                      {feature.description}
                                    </Typography>
                                  )}

                                  {/* Card Footer */}
                                  <Divider sx={{ mb: 1, borderStyle: 'dashed' }} />
                                  
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="caption" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                                      By {feature.createdBy}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                      {new Date(feature.updatedAt).toLocaleDateString([], {
                                        month: 'short',
                                        day: 'numeric',
                                      })}
                                    </Typography>
                                  </Box>
                                </CardContent>
                              </Card>
                            );
                          })
                        )}
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </>
          ) : activeTab === 1 ? (
            /* Codebase & Git Explorer view */
            selectedProjectId === 'all' ? (
              <Box
                className="glass-panel"
                sx={{
                  p: 6,
                  borderRadius: '16px',
                  textAlign: 'center',
                  color: 'text.secondary',
                  border: '2px dashed rgba(30, 41, 59, 0.5)',
                }}
              >
                <ProjectIcon sx={{ fontSize: 60, mb: 2, color: 'primary.main' }} />
                <Typography variant="h5" color="text.primary" sx={{ fontWeight: 700, mb: 1 }}>
                  Select a Project
                </Typography>
                <Typography variant="body1">
                  Please select a specific project from the sidebar (e.g. BurpeePacers) to browse its git commits, branch status, and files.
                </Typography>
              </Box>
            ) : gitInfo?.notConfigured ? (
              <Box
                className="glass-panel"
                sx={{
                  p: 6,
                  borderRadius: '16px',
                  textAlign: 'center',
                  color: 'text.secondary',
                  border: '2px dashed rgba(239, 68, 68, 0.3)',
                }}
              >
                <Typography variant="h5" color="error.main" sx={{ fontWeight: 700, mb: 1 }}>
                  Codebase Directory Not Configured
                </Typography>
                <Typography variant="body1">
                  The local directory path for <strong>{projects.find(p => p.id === selectedProjectId)?.name}</strong> is not configured or does not exist on your computer.
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={3}>
                {/* File Explorer */}
                <Grid size={{ xs: 12, md: 8 }}>
                  <Card sx={{ height: '650px', display: 'flex', flexDirection: 'column' }}>
                    <CardContent sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {/* Breadcrumbs */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: 'rgba(255,255,255,0.02)', p: 1.5, borderRadius: '8px', border: '1px solid #1e293b' }}>
                        <Button 
                          size="small" 
                          onClick={() => setExplorerPath('')}
                          sx={{ p: '2px 8px', minWidth: 'auto', textTransform: 'uppercase', fontSize: '0.75rem' }}
                        >
                          Root
                        </Button>
                        {explorerPath && explorerPath.split('/').map((folder, index, arr) => {
                          const relPath = arr.slice(0, index + 1).join('/');
                          return (
                            <React.Fragment key={relPath}>
                              <Typography variant="body2" color="text.secondary">/</Typography>
                              <Button 
                                size="small"
                                onClick={() => setExplorerPath(relPath)}
                                sx={{ p: '2px 8px', minWidth: 'auto', fontSize: '0.75rem' }}
                              >
                                {folder}
                              </Button>
                            </React.Fragment>
                          );
                        })}
                      </Box>

                      {/* File Split Workspace */}
                      <Box sx={{ flexGrow: 1, display: 'flex', minHeight: 0, gap: 2 }}>
                        {/* File browser panel (35% width) */}
                        <Box sx={{ width: '35%', borderRight: '1px solid #1e293b', pr: 2, overflowY: 'auto' }}>
                          {loadingFiles ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                              <CircularProgress size={24} />
                            </Box>
                          ) : explorerFiles.length === 0 ? (
                            <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
                              Empty Directory
                            </Typography>
                          ) : (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                              {/* Parent folder link */}
                              {explorerPath && (
                                <Button
                                  size="small"
                                  onClick={() => {
                                    const parts = explorerPath.split('/');
                                    parts.pop();
                                    setExplorerPath(parts.join('/'));
                                  }}
                                  sx={{ 
                                    justifyContent: 'flex-start', 
                                    color: 'text.secondary', 
                                    py: 0.75, 
                                    textAlign: 'left',
                                    fontSize: '0.85rem'
                                  }}
                                >
                                  📁 .. (Parent directory)
                                </Button>
                              )}
                              
                              {/* File entries */}
                              {explorerFiles.map(entry => (
                                <Button
                                  key={entry.relativePath}
                                  size="small"
                                  onClick={() => {
                                    if (entry.isDir) {
                                      setExplorerPath(entry.relativePath);
                                    } else {
                                      fetchFileContent(selectedProjectId, platformFilter === 'All' ? '' : platformFilter, entry.relativePath);
                                    }
                                  }}
                                  sx={{
                                    justifyContent: 'flex-start',
                                    textAlign: 'left',
                                    py: 0.75,
                                    fontSize: '0.85rem',
                                    color: entry.isDir ? 'secondary.main' : 'text.primary',
                                    bgcolor: selectedFile?.path === entry.relativePath ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                                    '&:hover': {
                                      bgcolor: 'rgba(255,255,255,0.03)',
                                    }
                                  }}
                                >
                                  {entry.isDir ? '📁 ' : '📄 '}
                                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>
                                    {entry.name}
                                  </span>
                                </Button>
                              ))}
                            </Box>
                          )}
                        </Box>

                        {/* File viewer panel (65% width) */}
                        <Box sx={{ width: '65%', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                          {fileContentLoading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                              <CircularProgress size={32} />
                            </Box>
                          ) : selectedFile ? (
                            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, pb: 1, borderBottom: '1px solid #1e293b' }}>
                                <Box>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                    {selectedFile.name}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {selectedFile.path} • {(selectedFile.sizeBytes / 1024).toFixed(1)} KB
                                  </Typography>
                                </Box>
                              </Box>

                              {selectedFile.tooLarge ? (
                                <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
                                  <Typography variant="body2">
                                    File is too large to display in preview (limit 150KB).
                                  </Typography>
                                </Box>
                              ) : selectedFile.isBinary ? (
                                <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
                                  <Typography variant="body2">
                                    Binary or unsupported format (preview not available).
                                  </Typography>
                                </Box>
                              ) : (
                                <Box 
                                  component="pre" 
                                  sx={{ 
                                    flexGrow: 1, 
                                    p: 2, 
                                    borderRadius: '8px', 
                                    bgcolor: 'rgba(13, 18, 35, 0.8)', 
                                    border: '1px solid #1e293b', 
                                    overflowX: 'auto',
                                    fontSize: '0.8rem',
                                    fontFamily: 'var(--font-geist-mono), monospace',
                                    color: '#e2e8f0',
                                    whiteSpace: 'pre-wrap',
                                    maxHeight: '500px',
                                  }}
                                >
                                  {selectedFile.content}
                                </Box>
                              )}
                            </Box>
                          ) : (
                            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'text.secondary', opacity: 0.7 }}>
                              <Typography variant="body2">
                                Select a source file to view its code content.
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Git Status Sidebar */}
                <Grid size={{ xs: 12, md: 4 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {/* Branch & Status Card */}
                    <Card>
                      <CardContent sx={{ p: 2.5 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                          Repository Status
                        </Typography>
                        
                        {loadingGit ? (
                          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                            <CircularProgress size={20} />
                          </Box>
                        ) : gitInfo ? (
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="body2" color="text.secondary">
                                Active Branch
                              </Typography>
                              <Chip 
                                label={gitInfo.branch} 
                                size="small" 
                                sx={{ fontWeight: 700, bgcolor: 'rgba(20, 184, 166, 0.15)', color: '#2dd4bf', border: '1px solid rgba(20, 184, 166, 0.3)' }}
                              />
                            </Box>

                            <Divider />

                            <Box>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                Working Directory
                              </Typography>
                              {gitInfo.hasLocalChanges ? (
                                <Box sx={{ p: 1.5, borderRadius: '8px', bgcolor: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                                  <Typography variant="caption" sx={{ color: '#fbbf24', fontWeight: 600, display: 'block' }}>
                                    ⚠️ Uncommitted Changes
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {gitInfo.statusCount} modified path(s) detected.
                                  </Typography>
                                </Box>
                              ) : (
                                <Box sx={{ p: 1.5, borderRadius: '8px', bgcolor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                                  <Typography variant="caption" sx={{ color: '#34d399', fontWeight: 600, display: 'block' }}>
                                    ✓ Repository Clean
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    Working directory matches remote branch.
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            Failed to read git info.
                          </Typography>
                        )}
                      </CardContent>
                    </Card>

                    {/* Git commits timeline */}
                    <Card sx={{ flexGrow: 1 }}>
                      <CardContent sx={{ p: 2.5 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                          {platformFilter === 'All' ? 'Recent Commits' : `Commits in /${platformFilter}`}
                        </Typography>

                        {loadingGit ? (
                          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                            <CircularProgress size={24} />
                          </Box>
                        ) : gitInfo?.commits && gitInfo.commits.length > 0 ? (
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {gitInfo.commits.map((commit: any) => (
                              <Box key={commit.hash} sx={{ bgcolor: 'rgba(255,255,255,0.01)', p: 1.5, borderRadius: '8px', border: '1px solid #1e293b' }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                  <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 700, color: '#818cf8' }}>
                                    {commit.hash}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {commit.date}
                                  </Typography>
                                </Box>
                                <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.3, mb: 0.5, color: '#f8fafc' }}>
                                  {commit.subject}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  by {commit.author}
                                </Typography>
                              </Box>
                            ))}
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                            No commits found in this directory.
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Box>
                </Grid>
              </Grid>
            )
          ) : (
            /* AI Chat Assistant view */
            <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 280px)', minHeight: '550px' }}>
              <Box 
                className="glass-panel" 
                sx={{ 
                  p: 2.5, 
                  borderRadius: '12px 12px 0 0', 
                  borderBottom: '1px solid #1e293b', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center' 
                }}
              >
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                    🤖 AI Backlog Assistant
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Analyzing codebases, checking feasibility, and auto-adding backlog cards.
                  </Typography>
                </Box>
                <Button 
                  size="small" 
                  variant="outlined" 
                  color="secondary" 
                  onClick={() => setChatMessages([{
                    role: 'assistant',
                    content: "Hello! I am your AI Development Assistant. Suggest any features you'd like to implement, and I will analyze the codebase, check feasibility, and automatically add them to the project backlog for you."
                  }])}
                  sx={{ borderRadius: '8px' }}
                >
                  Clear History
                </Button>
              </Box>

              {/* API Key Warning Panel if not configured */}
              {needsApiKey && (
                <Box 
                  sx={{ 
                    p: 2, 
                    m: 2.5, 
                    borderRadius: '8px', 
                    bgcolor: 'rgba(239, 68, 68, 0.1)', 
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#fca5a5'
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>
                    ⚠️ GEMINI_API_KEY Missing
                  </Typography>
                  <Typography variant="caption" sx={{ display: 'block' }}>
                    Please add your Gemini API Key to a `.env.local` file in the project root:
                  </Typography>
                  <Box 
                    component="pre" 
                    sx={{ 
                      mt: 1, 
                      p: 1, 
                      bgcolor: 'rgba(0,0,0,0.3)', 
                      borderRadius: '4px', 
                      fontFamily: 'monospace', 
                      fontSize: '0.85rem' 
                    }}
                  >
                    GEMINI_API_KEY=your_key_here
                  </Box>
                  <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                    Get a key from <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" style={{ color: '#6366f1', textDecoration: 'underline' }}>Google AI Studio</a>.
                  </Typography>
                </Box>
              )}

              {/* Chat Window */}
              <Box 
                sx={{ 
                  flexGrow: 1, 
                  overflowY: 'auto', 
                  p: 2.5, 
                  bgcolor: 'rgba(18, 24, 41, 0.4)', 
                  borderLeft: '1px solid #1e293b',
                  borderRight: '1px solid #1e293b',
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: 2 
                }}
              >
                {chatMessages.map((msg, idx) => (
                  <Box 
                    key={idx} 
                    sx={{ 
                      alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                      maxWidth: '80%',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 0.5
                    }}
                  >
                    <Card 
                      sx={{ 
                        bgcolor: msg.role === 'user' ? 'rgba(99, 102, 241, 0.12)' : 'rgba(30, 41, 59, 0.35)',
                        borderColor: msg.role === 'user' ? 'rgba(99, 102, 241, 0.3)' : '#1e293b',
                        borderRadius: msg.role === 'user' ? '12px 12px 0 12px' : '12px 12px 12px 0',
                        boxShadow: 'none'
                      }}
                    >
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            whiteSpace: 'pre-wrap', 
                            lineHeight: 1.5, 
                            color: '#f8fafc'
                          }}
                        >
                          {msg.content}
                        </Typography>

                        {/* If the AI ran tools, show a nice small summary log */}
                        {msg.functionCalls && msg.functionCalls.length > 0 && (
                          <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                            <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, mb: 1, color: '#10b981' }}>
                              ⚡ AI executed actions:
                            </Typography>
                            {msg.functionCalls.map((fc: any, fIdx: number) => {
                              const resp = msg.functionResponses?.[fIdx]?.response?.result;
                              const isSuccess = resp && !resp.error;
                              
                              return (
                                <Box key={fIdx} sx={{ mb: 1, pl: 1, borderLeft: '2px solid', borderColor: isSuccess ? '#10b981' : '#f59e0b' }}>
                                  <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#cbd5e1' }}>
                                    {fc.name}({Object.keys(fc.args || {}).map(k => `${k}: "${fc.args[k]}"`).join(', ')} )
                                  </Typography>
                                  {resp?.success && (
                                    <Typography variant="caption" sx={{ display: 'block', color: '#10b981', mt: 0.5 }}>
                                      ✅ Card Created: "{resp.feature?.title}" ({resp.feature?.platform})
                                    </Typography>
                                  )}
                                  {resp?.error && (
                                    <Typography variant="caption" sx={{ display: 'block', color: '#ef4444', mt: 0.5 }}>
                                      ❌ Error: {resp.error}
                                    </Typography>
                                  )}
                                </Box>
                              );
                            })}
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                    <Typography variant="caption" color="text.secondary" sx={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', px: 1 }}>
                      {msg.role === 'user' ? 'You' : 'AI Assistant'}
                    </Typography>
                  </Box>
                ))}

                {chatLoading && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pl: 1 }}>
                    <CircularProgress size={16} color="secondary" />
                    <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                      AI is analyzing codebase and thinking...
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* Suggestions Panel */}
              <Box 
                sx={{ 
                  p: 2, 
                  bgcolor: 'rgba(18, 24, 41, 0.6)', 
                  borderLeft: '1px solid #1e293b', 
                  borderRight: '1px solid #1e293b', 
                  borderTop: '1px solid #1e293b',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 1
                }}
              >
                <Typography variant="caption" color="text.secondary" sx={{ width: '100%', mb: 0.5, display: 'block', fontWeight: 600 }}>
                  Suggestions:
                </Typography>
                <Chip 
                  label="Suggest a new feature for BurpeePacers iOS" 
                  size="small" 
                  onClick={() => handleSendChatMessage("Suggest a new feature for BurpeePacers iOS")} 
                  disabled={chatLoading}
                  sx={{ bgcolor: 'rgba(255,255,255,0.02)', borderColor: '#1e293b', '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' } }}
                />
                <Chip 
                  label="Analyze feasibility of adding Apple Health weight integration to BurpeePacers iOS" 
                  size="small" 
                  onClick={() => handleSendChatMessage("Analyze feasibility of adding Apple Health weight integration to BurpeePacers iOS")} 
                  disabled={chatLoading}
                  sx={{ bgcolor: 'rgba(255,255,255,0.02)', borderColor: '#1e293b', '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' } }}
                />
                <Chip 
                  label="Suggest a port of ChainHabit UI to Android" 
                  size="small" 
                  onClick={() => handleSendChatMessage("Suggest a port of ChainHabit UI to Android")} 
                  disabled={chatLoading}
                  sx={{ bgcolor: 'rgba(255,255,255,0.02)', borderColor: '#1e293b', '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' } }}
                />
              </Box>

              {/* Chat Input */}
              <Box sx={{ p: 2, bgcolor: '#121829', borderRadius: '0 0 12px 12px', border: '1px solid #1e293b', display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Describe a feature (e.g. 'Integrate Apple Health weight sync into BurpeePacers iOS')..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSendChatMessage();
                    }
                  }}
                  disabled={chatLoading}
                  slotProps={{
                    input: {
                      sx: { bgcolor: 'rgba(255,255,255,0.01)', borderRadius: '8px' }
                    }
                  }}
                />
                <Button 
                  variant="contained" 
                  color="secondary" 
                  onClick={() => handleSendChatMessage()}
                  disabled={chatLoading || !chatInput.trim()}
                  sx={{ borderRadius: '8px', px: 3 }}
                >
                  Send
                </Button>
              </Box>
            </Box>
          )}
        </Grid>
      </Grid>

      {/* Floating Card Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        slotProps={{
          paper: {
            sx: {
              bgcolor: '#121829',
              border: '1px solid #1e293b',
              boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
            },
          },
        }}
      >
        <MenuItem onClick={handleMenuEdit} sx={{ gap: 1 }}>
          <EditIcon fontSize="small" /> Edit details
        </MenuItem>
        <Divider sx={{ my: 0.5 }} />
        {STATUS_COLUMNS.map(col => {
          if (menuFeature?.status === col.id) return null;
          return (
            <MenuItem
              key={col.id}
              onClick={() => {
                if (menuFeature) {
                  handleStatusChange(menuFeature.id, col.id);
                }
                handleMenuClose();
              }}
              sx={{ gap: 1, fontSize: '0.85rem' }}
            >
              Move to {col.title}
            </MenuItem>
          );
        })}
        <Divider sx={{ my: 0.5 }} />
        <MenuItem onClick={handleMenuDelete} sx={{ gap: 1, color: 'error.main' }}>
          <DeleteIcon fontSize="small" /> Delete Feature
        </MenuItem>
      </Menu>

      {/* Dialog: Create Project */}
      <Dialog
        open={projectModalOpen}
        onClose={() => setProjectModalOpen(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: {
            className: 'glass-panel',
            sx: {
              borderRadius: '16px',
              bgcolor: '#121829',
              backgroundImage: 'none',
            },
          },
        }}
      >
        <form onSubmit={handleCreateProject}>
          <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>Start New App Project</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Project Name"
              type="text"
              fullWidth
              variant="outlined"
              required
              value={newProjName}
              onChange={(e) => setNewProjName(e.target.value)}
              placeholder="e.g. FitTracker, WorkLog"
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="Description"
              type="text"
              fullWidth
              multiline
              rows={3}
              variant="outlined"
              value={newProjDesc}
              onChange={(e) => setNewProjDesc(e.target.value)}
              placeholder="Provide a brief summary of the application..."
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              label="Local Directory Path"
              type="text"
              fullWidth
              variant="outlined"
              value={newProjPath}
              onChange={(e) => setNewProjPath(e.target.value)}
              placeholder="e.g. /Users/name/projects/my-app"
              sx={{ mb: 2 }}
            />
            
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 1, mt: 1 }}>
              Target Platforms:
            </Typography>
            <FormGroup row>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={newProjPlatforms.Web}
                    onChange={(e) => setNewProjPlatforms({ ...newProjPlatforms, Web: e.target.checked })}
                    color="primary"
                  />
                }
                label="Web"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={newProjPlatforms.iOS}
                    onChange={(e) => setNewProjPlatforms({ ...newProjPlatforms, iOS: e.target.checked })}
                    color="primary"
                  />
                }
                label="iOS"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={newProjPlatforms.Android}
                    onChange={(e) => setNewProjPlatforms({ ...newProjPlatforms, Android: e.target.checked })}
                    color="primary"
                  />
                }
                label="Android"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={newProjPlatforms.watchOS}
                    onChange={(e) => setNewProjPlatforms({ ...newProjPlatforms, watchOS: e.target.checked })}
                    color="primary"
                  />
                }
                label="watchOS"
              />
            </FormGroup>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setProjectModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary">
              Initialize Project
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Dialog: Create/Edit Feature */}
      <Dialog
        open={featureModalOpen}
        onClose={() => setFeatureModalOpen(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            className: 'glass-panel',
            sx: {
              borderRadius: '16px',
              bgcolor: '#121829',
              backgroundImage: 'none',
            },
          },
        }}
      >
        <form onSubmit={handleSaveFeature}>
          <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>
            {editingFeature ? 'Edit Feature Details' : 'Add New Feature'}
          </DialogTitle>
          <DialogContent>
            {/* Project Select Dropdown */}
            <FormControl fullWidth margin="normal" disabled={!!editingFeature}>
              <InputLabel id="feature-project-select-label">Project</InputLabel>
              <Select
                labelId="feature-project-select-label"
                value={featProjectId}
                label="Project"
                required
                onChange={(e) => {
                  setFeatProjectId(e.target.value);
                  // Reset platform when project changes
                  setFeatPlatform('All');
                }}
              >
                {projects.map(p => (
                  <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              margin="dense"
              label="Feature Title"
              type="text"
              fullWidth
              variant="outlined"
              required
              value={featTitle}
              onChange={(e) => setFeatTitle(e.target.value)}
              placeholder="e.g. Implement Apple HealthKit integration"
              sx={{ mb: 2, mt: 1 }}
            />

            <TextField
              margin="dense"
              label="Description"
              type="text"
              fullWidth
              multiline
              rows={3}
              variant="outlined"
              value={featDesc}
              onChange={(e) => setFeatDesc(e.target.value)}
              placeholder="Detail what needs to be done, requirements, edge cases..."
              sx={{ mb: 2 }}
            />

            <Grid container spacing={2}>
              {/* Platform */}
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormControl fullWidth margin="dense">
                  <InputLabel id="feature-platform-label">Platform</InputLabel>
                  <Select
                    labelId="feature-platform-label"
                    value={featPlatform}
                    label="Platform"
                    onChange={(e) => setFeatPlatform(e.target.value)}
                  >
                    {getPlatformsForSelectedProject().map(plat => (
                      <MenuItem key={plat} value={plat}>
                        {plat}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Priority */}
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormControl fullWidth margin="dense">
                  <InputLabel id="feature-priority-label">Priority</InputLabel>
                  <Select
                    labelId="feature-priority-label"
                    value={featPriority}
                    label="Priority"
                    onChange={(e) => setFeatPriority(e.target.value as FeaturePriority)}
                  >
                    <MenuItem value="low">Low</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Initial Status */}
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormControl fullWidth margin="dense">
                  <InputLabel id="feature-status-label">Status</InputLabel>
                  <Select
                    labelId="feature-status-label"
                    value={featStatus}
                    label="Status"
                    onChange={(e) => setFeatStatus(e.target.value as FeatureStatus)}
                  >
                    {STATUS_COLUMNS.map(col => (
                      <MenuItem key={col.id} value={col.id}>{col.title}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <TextField
              margin="dense"
              label="Created By"
              type="text"
              fullWidth
              variant="outlined"
              value={featCreatedBy}
              onChange={(e) => setFeatCreatedBy(e.target.value)}
              placeholder="Your name (defaults to Krishna)"
              sx={{ mt: 2 }}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setFeatureModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary">
              {editingFeature ? 'Save Changes' : 'Create Feature'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
}
