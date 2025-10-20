'use client';

import React, { useState, useEffect } from 'react';
import { 
  Palette, 
  Save, 
  RefreshCw, 
  Upload, 
  Download, 
  Eye, 
  Settings, 
  Monitor, 
  Smartphone, 
  Tablet,
  Sun,
  Moon,
  Monitor as Desktop,
  Globe,
  Languages,
  Type,
  Image,
  Layout,
  Grid3X3,
  List,
  Maximize,
  Minimize,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useLanguage } from '../../../../contexts/LanguageContext';

// Mock data for demonstration
const mockThemes = [
  {
    id: 'default',
    name: 'Default Theme',
    description: 'Clean and professional default theme',
    primaryColor: '#3b82f6',
    secondaryColor: '#64748b',
    backgroundColor: '#ffffff',
    textColor: '#1e293b',
    isActive: true,
    isCustom: false,
    preview: '/themes/default-preview.png'
  },
  {
    id: 'dark',
    name: 'Dark Theme',
    description: 'Modern dark theme for low-light environments',
    primaryColor: '#8b5cf6',
    secondaryColor: '#a78bfa',
    backgroundColor: '#0f172a',
    textColor: '#f1f5f9',
    isActive: false,
    isCustom: false,
    preview: '/themes/dark-preview.png'
  },
  {
    id: 'corporate',
    name: 'Corporate Theme',
    description: 'Professional theme for business environments',
    primaryColor: '#1e40af',
    secondaryColor: '#3b82f6',
    backgroundColor: '#f8fafc',
    textColor: '#1e293b',
    isActive: false,
    isCustom: false,
    preview: '/themes/corporate-preview.png'
  },
  {
    id: 'custom-1',
    name: 'My Custom Theme',
    description: 'Custom theme created by admin',
    primaryColor: '#059669',
    secondaryColor: '#10b981',
    backgroundColor: '#f0fdf4',
    textColor: '#064e3b',
    isActive: false,
    isCustom: true,
    preview: '/themes/custom-1-preview.png'
  }
];

const mockBranding = {
  logo: {
    light: '/logos/logo-light.png',
    dark: '/logos/logo-dark.png',
    favicon: '/favicon.ico',
    alt: 'Company Logo'
  },
  companyName: 'AebDMS',
  tagline: 'Advanced Document Management System',
  colors: {
    primary: '#3b82f6',
    secondary: '#64748b',
    accent: '#f59e0b',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444'
  },
  fonts: {
    primary: 'Inter',
    secondary: 'Roboto',
    mono: 'JetBrains Mono'
  }
};

const mockLayoutSettings = {
  sidebar: {
    collapsed: false,
    position: 'left',
    width: 280,
    showLogo: true,
    showUserInfo: true
  },
  header: {
    height: 64,
    showBreadcrumbs: true,
    showSearch: true,
    showNotifications: true,
    showUserMenu: true
  },
  content: {
    maxWidth: 'full',
    padding: 'medium',
    showPageTitle: true,
    showPageDescription: true
  },
  footer: {
    show: true,
    showCopyright: true,
    showVersion: true,
    showLinks: true
  }
};

const mockUIPreferences = {
  language: 'en',
  timezone: 'UTC',
  dateFormat: 'MM/DD/YYYY',
  timeFormat: '12h',
  currency: 'USD',
  numberFormat: 'US',
  theme: 'system',
  animations: true,
  sounds: true,
  notifications: {
    email: true,
    browser: true,
    desktop: false
  },
  accessibility: {
    highContrast: false,
    reducedMotion: false,
    screenReader: false,
    fontSize: 'medium'
  }
};

export default function SystemCustomizationPage() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('themes');
  const [themes, setThemes] = useState(mockThemes);
  const [branding, setBranding] = useState(mockBranding);
  const [layoutSettings, setLayoutSettings] = useState(mockLayoutSettings);
  const [uiPreferences, setUiPreferences] = useState(mockUIPreferences);
  const [customTheme, setCustomTheme] = useState({
    name: '',
    primaryColor: '#3b82f6',
    secondaryColor: '#64748b',
    backgroundColor: '#ffffff',
    textColor: '#1e293b'
  });

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('Settings saved:', { themes, branding, layoutSettings, uiPreferences });
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateCustomTheme = () => {
    if (!customTheme.name.trim()) return;
    
    const newTheme = {
      id: `custom-${Date.now()}`,
      name: customTheme.name,
      description: 'Custom theme created by admin',
      primaryColor: customTheme.primaryColor,
      secondaryColor: customTheme.secondaryColor,
      backgroundColor: customTheme.backgroundColor,
      textColor: customTheme.textColor,
      isActive: false,
      isCustom: true,
      preview: '/themes/custom-preview.png'
    };
    
    setThemes(prev => [...prev, newTheme]);
    setCustomTheme({
      name: '',
      primaryColor: '#3b82f6',
      secondaryColor: '#64748b',
      backgroundColor: '#ffffff',
      textColor: '#1e293b'
    });
  };

  const handleApplyTheme = (themeId: string) => {
    setThemes(prev => prev.map(theme => ({
      ...theme,
      isActive: theme.id === themeId
    })));
  };

  const handleDeleteCustomTheme = (themeId: string) => {
    setThemes(prev => prev.filter(theme => theme.id !== themeId));
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">System Customization</h1>
          <p className="text-muted-foreground">Customize the appearance and behavior of your DMS</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Reset to Default
          </Button>
          <Button onClick={handleSaveSettings} disabled={saving} className="gap-2">
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="themes" className="gap-2">
            <Palette className="h-4 w-4" />
            Themes
          </TabsTrigger>
          <TabsTrigger value="branding" className="gap-2">
            <Image className="h-4 w-4" />
            Branding
          </TabsTrigger>
          <TabsTrigger value="layout" className="gap-2">
            <Layout className="h-4 w-4" />
            Layout
          </TabsTrigger>
          <TabsTrigger value="preferences" className="gap-2">
            <Settings className="h-4 w-4" />
            Preferences
          </TabsTrigger>
        </TabsList>

        {/* Themes Tab */}
        <TabsContent value="themes" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {themes.map((theme) => (
              <Card key={theme.id} className={`cursor-pointer transition-all hover:shadow-md ${theme.isActive ? 'ring-2 ring-primary' : ''}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                        style={{ backgroundColor: theme.primaryColor }}
                      />
                      <div>
                        <CardTitle className="text-lg">{theme.name}</CardTitle>
                        <CardDescription>{theme.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {theme.isActive && <Badge variant="default">Active</Badge>}
                      {theme.isCustom && <Badge variant="secondary">Custom</Badge>}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Color Preview */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Primary</Label>
                        <div 
                          className="h-8 rounded border"
                          style={{ backgroundColor: theme.primaryColor }}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Secondary</Label>
                        <div 
                          className="h-8 rounded border"
                          style={{ backgroundColor: theme.secondaryColor }}
                        />
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleApplyTheme(theme.id)}
                        disabled={theme.isActive}
                      >
                        {theme.isActive ? 'Active' : 'Apply'}
                      </Button>
                      {theme.isCustom && (
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleDeleteCustomTheme(theme.id)}
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Create Custom Theme */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Create Custom Theme
              </CardTitle>
              <CardDescription>Create your own custom theme with personalized colors</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="theme-name">Theme Name</Label>
                  <Input
                    id="theme-name"
                    placeholder="Enter theme name"
                    value={customTheme.name}
                    onChange={(e) => setCustomTheme(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Primary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={customTheme.primaryColor}
                      onChange={(e) => setCustomTheme(prev => ({ ...prev, primaryColor: e.target.value }))}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      value={customTheme.primaryColor}
                      onChange={(e) => setCustomTheme(prev => ({ ...prev, primaryColor: e.target.value }))}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Secondary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={customTheme.secondaryColor}
                      onChange={(e) => setCustomTheme(prev => ({ ...prev, secondaryColor: e.target.value }))}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      value={customTheme.secondaryColor}
                      onChange={(e) => setCustomTheme(prev => ({ ...prev, secondaryColor: e.target.value }))}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Background Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={customTheme.backgroundColor}
                      onChange={(e) => setCustomTheme(prev => ({ ...prev, backgroundColor: e.target.value }))}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      value={customTheme.backgroundColor}
                      onChange={(e) => setCustomTheme(prev => ({ ...prev, backgroundColor: e.target.value }))}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
              <Button onClick={handleCreateCustomTheme} disabled={!customTheme.name.trim()}>
                Create Theme
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Branding Tab */}
        <TabsContent value="branding" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Logo Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="h-5 w-5" />
                  Logo & Branding
                </CardTitle>
                <CardDescription>Upload and configure your company logo and branding</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Company Name</Label>
                  <Input
                    value={branding.companyName}
                    onChange={(e) => setBranding(prev => ({ ...prev, companyName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tagline</Label>
                  <Input
                    value={branding.tagline}
                    onChange={(e) => setBranding(prev => ({ ...prev, tagline: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Logo (Light Theme)</Label>
                  <div className="flex gap-2">
                    <Input
                      value={branding.logo.light}
                      onChange={(e) => setBranding(prev => ({ 
                        ...prev, 
                        logo: { ...prev.logo, light: e.target.value }
                      }))}
                    />
                    <Button variant="outline" size="sm">
                      <Upload className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Logo (Dark Theme)</Label>
                  <div className="flex gap-2">
                    <Input
                      value={branding.logo.dark}
                      onChange={(e) => setBranding(prev => ({ 
                        ...prev, 
                        logo: { ...prev.logo, dark: e.target.value }
                      }))}
                    />
                    <Button variant="outline" size="sm">
                      <Upload className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Favicon</Label>
                  <div className="flex gap-2">
                    <Input
                      value={branding.logo.favicon}
                      onChange={(e) => setBranding(prev => ({ 
                        ...prev, 
                        logo: { ...prev.logo, favicon: e.target.value }
                      }))}
                    />
                    <Button variant="outline" size="sm">
                      <Upload className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Color Scheme */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Color Scheme
                </CardTitle>
                <CardDescription>Configure your brand colors</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(branding.colors).map(([key, value]) => (
                  <div key={key} className="space-y-2">
                    <Label className="capitalize">{key} Color</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={value}
                        onChange={(e) => setBranding(prev => ({
                          ...prev,
                          colors: { ...prev.colors, [key]: e.target.value }
                        }))}
                        className="w-16 h-10 p-1"
                      />
                      <Input
                        value={value}
                        onChange={(e) => setBranding(prev => ({
                          ...prev,
                          colors: { ...prev.colors, [key]: e.target.value }
                        }))}
                        className="flex-1"
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Typography */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Type className="h-5 w-5" />
                  Typography
                </CardTitle>
                <CardDescription>Configure fonts and text styling</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Primary Font</Label>
                  <Select 
                    value={branding.fonts.primary}
                    onValueChange={(value) => setBranding(prev => ({
                      ...prev,
                      fonts: { ...prev.fonts, primary: value }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Inter">Inter</SelectItem>
                      <SelectItem value="Roboto">Roboto</SelectItem>
                      <SelectItem value="Open Sans">Open Sans</SelectItem>
                      <SelectItem value="Lato">Lato</SelectItem>
                      <SelectItem value="Montserrat">Montserrat</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Secondary Font</Label>
                  <Select 
                    value={branding.fonts.secondary}
                    onValueChange={(value) => setBranding(prev => ({
                      ...prev,
                      fonts: { ...prev.fonts, secondary: value }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Roboto">Roboto</SelectItem>
                      <SelectItem value="Inter">Inter</SelectItem>
                      <SelectItem value="Open Sans">Open Sans</SelectItem>
                      <SelectItem value="Lato">Lato</SelectItem>
                      <SelectItem value="Montserrat">Montserrat</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Monospace Font</Label>
                  <Select 
                    value={branding.fonts.mono}
                    onValueChange={(value) => setBranding(prev => ({
                      ...prev,
                      fonts: { ...prev.fonts, mono: value }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="JetBrains Mono">JetBrains Mono</SelectItem>
                      <SelectItem value="Fira Code">Fira Code</SelectItem>
                      <SelectItem value="Source Code Pro">Source Code Pro</SelectItem>
                      <SelectItem value="Consolas">Consolas</SelectItem>
                      <SelectItem value="Monaco">Monaco</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Layout Tab */}
        <TabsContent value="layout" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sidebar Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layout className="h-5 w-5" />
                  Sidebar Configuration
                </CardTitle>
                <CardDescription>Configure sidebar appearance and behavior</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Collapsed by Default</Label>
                  <Switch
                    checked={layoutSettings.sidebar.collapsed}
                    onCheckedChange={(checked) => setLayoutSettings(prev => ({
                      ...prev,
                      sidebar: { ...prev.sidebar, collapsed: checked }
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Position</Label>
                  <Select 
                    value={layoutSettings.sidebar.position}
                    onValueChange={(value) => setLayoutSettings(prev => ({
                      ...prev,
                      sidebar: { ...prev.sidebar, position: value }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">Left</SelectItem>
                      <SelectItem value="right">Right</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Width (px)</Label>
                  <Input
                    type="number"
                    value={layoutSettings.sidebar.width}
                    onChange={(e) => setLayoutSettings(prev => ({
                      ...prev,
                      sidebar: { ...prev.sidebar, width: parseInt(e.target.value) }
                    }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Show Logo</Label>
                  <Switch
                    checked={layoutSettings.sidebar.showLogo}
                    onCheckedChange={(checked) => setLayoutSettings(prev => ({
                      ...prev,
                      sidebar: { ...prev.sidebar, showLogo: checked }
                    }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Show User Info</Label>
                  <Switch
                    checked={layoutSettings.sidebar.showUserInfo}
                    onCheckedChange={(checked) => setLayoutSettings(prev => ({
                      ...prev,
                      sidebar: { ...prev.sidebar, showUserInfo: checked }
                    }))}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Header Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  Header Configuration
                </CardTitle>
                <CardDescription>Configure header appearance and features</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Height (px)</Label>
                  <Input
                    type="number"
                    value={layoutSettings.header.height}
                    onChange={(e) => setLayoutSettings(prev => ({
                      ...prev,
                      header: { ...prev.header, height: parseInt(e.target.value) }
                    }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Show Breadcrumbs</Label>
                  <Switch
                    checked={layoutSettings.header.showBreadcrumbs}
                    onCheckedChange={(checked) => setLayoutSettings(prev => ({
                      ...prev,
                      header: { ...prev.header, showBreadcrumbs: checked }
                    }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Show Search</Label>
                  <Switch
                    checked={layoutSettings.header.showSearch}
                    onCheckedChange={(checked) => setLayoutSettings(prev => ({
                      ...prev,
                      header: { ...prev.header, showSearch: checked }
                    }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Show Notifications</Label>
                  <Switch
                    checked={layoutSettings.header.showNotifications}
                    onCheckedChange={(checked) => setLayoutSettings(prev => ({
                      ...prev,
                      header: { ...prev.header, showNotifications: checked }
                    }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Show User Menu</Label>
                  <Switch
                    checked={layoutSettings.header.showUserMenu}
                    onCheckedChange={(checked) => setLayoutSettings(prev => ({
                      ...prev,
                      header: { ...prev.header, showUserMenu: checked }
                    }))}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Content Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Grid3X3 className="h-5 w-5" />
                  Content Configuration
                </CardTitle>
                <CardDescription>Configure content area appearance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Max Width</Label>
                  <Select 
                    value={layoutSettings.content.maxWidth}
                    onValueChange={(value) => setLayoutSettings(prev => ({
                      ...prev,
                      content: { ...prev.content, maxWidth: value }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sm">Small</SelectItem>
                      <SelectItem value="md">Medium</SelectItem>
                      <SelectItem value="lg">Large</SelectItem>
                      <SelectItem value="xl">Extra Large</SelectItem>
                      <SelectItem value="full">Full Width</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Padding</Label>
                  <Select 
                    value={layoutSettings.content.padding}
                    onValueChange={(value) => setLayoutSettings(prev => ({
                      ...prev,
                      content: { ...prev.content, padding: value }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <Label>Show Page Title</Label>
                  <Switch
                    checked={layoutSettings.content.showPageTitle}
                    onCheckedChange={(checked) => setLayoutSettings(prev => ({
                      ...prev,
                      content: { ...prev.content, showPageTitle: checked }
                    }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Show Page Description</Label>
                  <Switch
                    checked={layoutSettings.content.showPageDescription}
                    onCheckedChange={(checked) => setLayoutSettings(prev => ({
                      ...prev,
                      content: { ...prev.content, showPageDescription: checked }
                    }))}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Footer Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layout className="h-5 w-5" />
                  Footer Configuration
                </CardTitle>
                <CardDescription>Configure footer appearance and content</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Show Footer</Label>
                  <Switch
                    checked={layoutSettings.footer.show}
                    onCheckedChange={(checked) => setLayoutSettings(prev => ({
                      ...prev,
                      footer: { ...prev.footer, show: checked }
                    }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Show Copyright</Label>
                  <Switch
                    checked={layoutSettings.footer.showCopyright}
                    onCheckedChange={(checked) => setLayoutSettings(prev => ({
                      ...prev,
                      footer: { ...prev.footer, showCopyright: checked }
                    }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Show Version</Label>
                  <Switch
                    checked={layoutSettings.footer.showVersion}
                    onCheckedChange={(checked) => setLayoutSettings(prev => ({
                      ...prev,
                      footer: { ...prev.footer, showVersion: checked }
                    }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Show Links</Label>
                  <Switch
                    checked={layoutSettings.footer.showLinks}
                    onCheckedChange={(checked) => setLayoutSettings(prev => ({
                      ...prev,
                      footer: { ...prev.footer, showLinks: checked }
                    }))}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* General Preferences */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  General Preferences
                </CardTitle>
                <CardDescription>Configure general system preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Language</Label>
                  <Select 
                    value={uiPreferences.language}
                    onValueChange={(value) => setUiPreferences(prev => ({ ...prev, language: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                      <SelectItem value="ar">Arabic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Timezone</Label>
                  <Select 
                    value={uiPreferences.timezone}
                    onValueChange={(value) => setUiPreferences(prev => ({ ...prev, timezone: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="EST">Eastern Time</SelectItem>
                      <SelectItem value="PST">Pacific Time</SelectItem>
                      <SelectItem value="GMT">Greenwich Mean Time</SelectItem>
                      <SelectItem value="CET">Central European Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Date Format</Label>
                  <Select 
                    value={uiPreferences.dateFormat}
                    onValueChange={(value) => setUiPreferences(prev => ({ ...prev, dateFormat: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                      <SelectItem value="DD MMM YYYY">DD MMM YYYY</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Time Format</Label>
                  <Select 
                    value={uiPreferences.timeFormat}
                    onValueChange={(value) => setUiPreferences(prev => ({ ...prev, timeFormat: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12h">12 Hour</SelectItem>
                      <SelectItem value="24h">24 Hour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select 
                    value={uiPreferences.currency}
                    onValueChange={(value) => setUiPreferences(prev => ({ ...prev, currency: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                      <SelectItem value="JPY">JPY (¥)</SelectItem>
                      <SelectItem value="CAD">CAD (C$)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Display Preferences */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  Display Preferences
                </CardTitle>
                <CardDescription>Configure display and visual preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Theme</Label>
                  <Select 
                    value={uiPreferences.theme}
                    onValueChange={(value) => setUiPreferences(prev => ({ ...prev, theme: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <Label>Enable Animations</Label>
                  <Switch
                    checked={uiPreferences.animations}
                    onCheckedChange={(checked) => setUiPreferences(prev => ({ ...prev, animations: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Enable Sounds</Label>
                  <Switch
                    checked={uiPreferences.sounds}
                    onCheckedChange={(checked) => setUiPreferences(prev => ({ ...prev, sounds: checked }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Font Size</Label>
                  <Select 
                    value={uiPreferences.accessibility.fontSize}
                    onValueChange={(value) => setUiPreferences(prev => ({
                      ...prev,
                      accessibility: { ...prev.accessibility, fontSize: value }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                      <SelectItem value="extra-large">Extra Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Notification Preferences */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>Configure notification settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Email Notifications</Label>
                  <Switch
                    checked={uiPreferences.notifications.email}
                    onCheckedChange={(checked) => setUiPreferences(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, email: checked }
                    }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Browser Notifications</Label>
                  <Switch
                    checked={uiPreferences.notifications.browser}
                    onCheckedChange={(checked) => setUiPreferences(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, browser: checked }
                    }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Desktop Notifications</Label>
                  <Switch
                    checked={uiPreferences.notifications.desktop}
                    onCheckedChange={(checked) => setUiPreferences(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, desktop: checked }
                    }))}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Accessibility Preferences */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Accessibility
                </CardTitle>
                <CardDescription>Configure accessibility options</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>High Contrast Mode</Label>
                  <Switch
                    checked={uiPreferences.accessibility.highContrast}
                    onCheckedChange={(checked) => setUiPreferences(prev => ({
                      ...prev,
                      accessibility: { ...prev.accessibility, highContrast: checked }
                    }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Reduce Motion</Label>
                  <Switch
                    checked={uiPreferences.accessibility.reducedMotion}
                    onCheckedChange={(checked) => setUiPreferences(prev => ({
                      ...prev,
                      accessibility: { ...prev.accessibility, reducedMotion: checked }
                    }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Screen Reader Support</Label>
                  <Switch
                    checked={uiPreferences.accessibility.screenReader}
                    onCheckedChange={(checked) => setUiPreferences(prev => ({
                      ...prev,
                      accessibility: { ...prev.accessibility, screenReader: checked }
                    }))}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

