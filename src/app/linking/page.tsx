"use client"
import React, { useState, useEffect } from 'react';

// Types based on your DTOs - replace with your actual types
interface LinkRule {
  id: number;
  ruleName: string;
  description?: string;
  sourceCategoryId: number;
  targetCategoryId: number;
  linkType: string;
  conditions: LinkCondition[];
  enabled: boolean;
  createdAt: string;
  createdBy: string;
}



interface Category {
  id: number;
  name: string;
}

interface DocumentLink {
  id: number;
  sourceDocumentId: number;
  sourceDocumentName: string;
  targetDocumentId: number;
  targetDocumentName: string;
  linkType: string;
  isAutomatic: boolean;
  ruleName?: string;
  createdAt: string;
}

// Mock data functions - replace with your actual API calls
const mockFetchRules = async (): Promise<LinkRule[]> => {
  return [
    {
      id: 1,
      ruleName: "Same Project Documents",
      description: "Links documents from same project",
      sourceCategoryId: 1,
      targetCategoryId: 1,
      linkType: "RELATED",
      enabled: true,
      createdAt: "2024-01-15T10:30:00Z",
      createdBy: "user@example.com",
      conditions: [
        {
          id: 1,
          sourceMetadataKey: "project_id",
          targetMetadataKey: "project_id",
          operator: "EQUALS",
          caseSensitive: false
        }
      ]
    },
    {
      id: 2,
      ruleName: "Version Chain",
      description: "Links document versions",
      sourceCategoryId: 2,
      targetCategoryId: 2,
      linkType: "SUPERSEDES",
      enabled: false,
      createdAt: "2024-01-10T14:20:00Z",
      createdBy: "admin@example.com",
      conditions: [
        {
          id: 2,
          sourceMetadataKey: "document_number",
          targetMetadataKey: "previous_version",
          operator: "EQUALS",
          caseSensitive: true
        }
      ]
    }
  ];
};

const mockFetchCategories = async (): Promise<Category[]> => {
  return [
    { id: 1, name: "Project Documents" },
    { id: 2, name: "Technical Specifications" },
    { id: 3, name: "Meeting Minutes" },
    { id: 4, name: "Contracts" }
  ];
};

const mockFetchDocumentLinks = async (documentId: number): Promise<DocumentLink[]> => {
  return [
    {
      id: 1,
      sourceDocumentId: documentId,
      sourceDocumentName: "Project Plan v1.0",
      targetDocumentId: 101,
      targetDocumentName: "Requirements Spec",
      linkType: "RELATED",
      isAutomatic: true,
      ruleName: "Same Project Documents",
      createdAt: "2024-01-20T09:15:00Z"
    },
    {
      id: 2,
      sourceDocumentId: documentId,
      sourceDocumentName: "Project Plan v1.0",
      targetDocumentId: 102,
      targetDocumentName: "Technical Design",
      linkType: "REFERENCES",
      isAutomatic: false,
      createdAt: "2024-01-19T16:45:00Z"
    }
  ];
};

const LinkRulesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'rules' | 'manual' | 'links'>('rules');
  const [rules, setRules] = useState<LinkRule[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [documentLinks, setDocumentLinks] = useState<DocumentLink[]>([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [showCreateRule, setShowCreateRule] = useState(false);
  const [showCreateLink, setShowCreateLink] = useState(false);

  // Replace these with your actual API functions
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [rulesData, categoriesData, linksData] = await Promise.all([
          mockFetchRules(),
          mockFetchCategories(),
          mockFetchDocumentLinks(selectedDocumentId)
        ]);
        setRules(rulesData);
        setCategories(categoriesData);
        setDocumentLinks(linksData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedDocumentId]);

  // Replace with your actual API calls
  const handleCreateRule = async (ruleData: Omit<LinkRule, 'id' | 'createdAt' | 'createdBy'>) => {
    console.log('Creating rule:', ruleData);
    // Replace with: await createAutoLinkRule(ruleData);
    setShowCreateRule(false);
  };

  const handleCreateManualLink = async (linkData: any) => {
    console.log('Creating manual link:', linkData);
    // Replace with: await createManualLink(linkData);
    setShowCreateLink(false);
  };

  const handleToggleRule = async (ruleId: number, enabled: boolean) => {
    console.log(`Toggling rule ${ruleId} to ${enabled}`);
    // Replace with: enabled ? await enableRule(ruleId) : await disableRule(ruleId);
  };

  const handleDeleteRule = async (ruleId: number) => {
    console.log('Deleting rule:', ruleId);
    // Replace with: await deleteRule(ruleId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading link rules...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-card-foreground">Document Link Rules</h1>
              <p className="text-muted-foreground mt-2">
                Manage automatic linking rules and manual document relationships
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowCreateLink(true)}
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg border border-border hover:bg-accent transition-colors"
              >
                Create Manual Link
              </button>
              <button
                onClick={() => setShowCreateRule(true)}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary-dark transition-colors"
              >
                Create Auto Rule
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { id: 'rules', name: 'Automatic Rules', count: rules.length },
              { id: 'manual', name: 'Manual Links', count: documentLinks.filter(l => !l.isAutomatic).length },
              { id: 'links', name: 'All Links', count: documentLinks.length }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.name}
                <span className="ml-2 bg-secondary text-secondary-foreground rounded-full px-2 py-1 text-xs">
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'rules' && <RulesTab rules={rules} onToggleRule={handleToggleRule} onDeleteRule={handleDeleteRule} categories={[]} onEditRule={function (id: number, data: LinkRuleFormData): void {
          throw new Error('Function not implemented.');
        } } />}
        {activeTab === 'manual' && <ManualLinksTab links={documentLinks.filter(l => !l.isAutomatic)} />}
        {activeTab === 'links' && <AllLinksTab links={documentLinks} />}
      </main>

      {/* Modals */}
      {showCreateRule && (
        <CreateRuleModal
          categories={categories}
          onSubmit={handleCreateRule}
          onClose={() => setShowCreateRule(false)}
        />
      )}

      {showCreateLink && (
        <CreateManualLinkModal
          onSubmit={handleCreateManualLink}
          onClose={() => setShowCreateLink(false)}
        />
      )}
    </div>
  );
};

// Component for Manual Links Tab
const ManualLinksTab: React.FC<{ links: DocumentLink[] }> = ({ links }) => {
  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <table className="min-w-full divide-y divide-border">
        <thead className="bg-muted">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Source Document
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Target Document
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Link Type
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Created
            </th>
          </tr>
        </thead>
        <tbody className="bg-card divide-y divide-border">
          {links.map((link) => (
            <tr key={link.id} className="hover:bg-accent transition-colors">
              <td className="px-6 py-4 whitespace-nowrap text-sm text-card-foreground">
                {link.sourceDocumentName}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-card-foreground">
                {link.targetDocumentName}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-light text-primary-dark">
                  {link.linkType}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                {new Date(link.createdAt).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {links.length === 0 && (
        <div className="text-center py-12">
          <div className="text-muted-foreground">No manual links created yet.</div>
        </div>
      )}
    </div>
  );
};

// Component for All Links Tab
const AllLinksTab: React.FC<{ links: DocumentLink[] }> = ({ links }) => {
  return (
    <div className="space-y-6">
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Source Document
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Target Document
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Link Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Rule
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Created
              </th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {links.map((link) => (
              <tr key={link.id} className="hover:bg-accent transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-card-foreground">
                  {link.sourceDocumentName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-card-foreground">
                  {link.targetDocumentName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-light text-primary-dark">
                    {link.linkType}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      link.isAutomatic
                        ? 'bg-chart-2 text-white'
                        : 'bg-chart-3 text-white'
                    }`}
                  >
                    {link.isAutomatic ? 'Auto' : 'Manual'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                  {link.ruleName || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                  {new Date(link.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {links.length === 0 && (
          <div className="text-center py-12">
            <div className="text-muted-foreground">No document links found.</div>
          </div>
        )}
      </div>
    </div>
  );
};


const CreateManualLinkModal: React.FC<{
  onSubmit: (data: any) => void;
  onClose: () => void;
}> = ({ onSubmit, onClose }) => {
  // Implementation for create manual link modal
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-card rounded-lg max-w-md w-full p-6">
        <h2 className="text-xl font-bold mb-4">Create Manual Link</h2>
        {/* Form implementation here */}
        <div className="flex justify-end space-x-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-muted-foreground hover:text-foreground">
            Cancel
          </button>
          <button onClick={() => onSubmit({})} className="px-4 py-2 bg-primary text-primary-foreground rounded">
            Create Link
          </button>
        </div>
      </div>
    </div>
  );
};

export default LinkRulesPage;
// Enhanced types
interface LinkRuleFormData {
  ruleName: string;
  description: string;
  sourceCategoryId: number | null;
  targetCategoryId: number | null;
  linkType: string;
  conditions: LinkCondition[];
  enabled: boolean;
}

interface LinkCondition {
  id?: number;
  sourceMetadataKey: string;
  targetMetadataKey: string;
  operator: string;
  value?: string;
  minValue?: number;
  maxValue?: number;
  caseSensitive: boolean;
}

// Create Rule Modal
const CreateRuleModal: React.FC<{
  categories: Category[];
  onSubmit: (data: LinkRuleFormData) => void;
  onClose: () => void;
}> = ({ categories, onSubmit, onClose }) => {
  const [formData, setFormData] = useState<LinkRuleFormData>({
    ruleName: '',
    description: '',
    sourceCategoryId: null,
    targetCategoryId: null,
    linkType: 'RELATED',
    conditions: [
      {
        sourceMetadataKey: '',
        targetMetadataKey: '',
        operator: 'EQUALS',
        caseSensitive: false
      }
    ],
    enabled: true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const linkTypes = [
    'RELATED',
    'SUPERSEDES',
    'REFERENCES',
    'CONTAINS',
    'LINKED_TO',
    'DUPLICATE'
  ];

  const operators = [
    { value: 'EQUALS', label: 'Equals' },
    { value: 'CONTAINS', label: 'Contains' },
    { value: 'REGEX', label: 'Regular Expression' },
    { value: 'GREATER_THAN', label: 'Greater Than' },
    { value: 'LESS_THAN', label: 'Less Than' },
    { value: 'RANGE', label: 'In Range' }
  ];

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.ruleName.trim()) {
      newErrors.ruleName = 'Rule name is required';
    }

    if (!formData.sourceCategoryId) {
      newErrors.sourceCategoryId = 'Source category is required';
    }

    if (!formData.targetCategoryId) {
      newErrors.targetCategoryId = 'Target category is required';
    }

    if (formData.conditions.length === 0) {
      newErrors.conditions = 'At least one condition is required';
    }

    formData.conditions.forEach((condition, index) => {
      if (!condition.sourceMetadataKey.trim()) {
        newErrors[`condition-${index}-source`] = 'Source metadata key is required';
      }
      if (!condition.targetMetadataKey.trim()) {
        newErrors[`condition-${index}-target`] = 'Target metadata key is required';
      }
      if (['EQUALS', 'CONTAINS', 'REGEX'].includes(condition.operator) && !condition.value?.trim()) {
        newErrors[`condition-${index}-value`] = 'Value is required for this operator';
      }
      if (condition.operator === 'RANGE' && (condition.minValue === undefined || condition.maxValue === undefined)) {
        newErrors[`condition-${index}-range`] = 'Both min and max values are required for range';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const addCondition = () => {
    setFormData(prev => ({
      ...prev,
      conditions: [
        ...prev.conditions,
        {
          sourceMetadataKey: '',
          targetMetadataKey: '',
          operator: 'EQUALS',
          caseSensitive: false
        }
      ]
    }));
  };

  const removeCondition = (index: number) => {
    setFormData(prev => ({
      ...prev,
      conditions: prev.conditions.filter((_, i) => i !== index)
    }));
  };

  const updateCondition = (index: number, field: keyof LinkCondition, value: any) => {
    setFormData(prev => ({
      ...prev,
      conditions: prev.conditions.map((condition, i) =>
        i === index ? { ...condition, [field]: value } : condition
      )
    }));
  };

  const updateFormField = (field: keyof LinkRuleFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const renderConditionInputs = (condition: LinkCondition, index: number) => {
    const showValueInput = ['EQUALS', 'CONTAINS', 'REGEX'].includes(condition.operator);
    const showRangeInputs = condition.operator === 'RANGE';
    const showSingleNumberInput = ['GREATER_THAN', 'LESS_THAN'].includes(condition.operator);

    return (
      <div key={index} className="bg-muted rounded-lg p-4 mb-4">
        <div className="flex justify-between items-center mb-3">
          <h4 className="font-medium text-card-foreground">Condition {index + 1}</h4>
          {formData.conditions.length > 1 && (
            <button
              type="button"
              onClick={() => removeCondition(index)}
              className="text-destructive hover:text-red-700 text-sm"
            >
              Remove
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-card-foreground mb-1">
              Source Metadata Key *
            </label>
            <input
              type="text"
              value={condition.sourceMetadataKey}
              onChange={(e) => updateCondition(index, 'sourceMetadataKey', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${
                errors[`condition-${index}-source`] ? 'border-destructive' : 'border-border'
              }`}
              placeholder="e.g., project_id, version"
            />
            {errors[`condition-${index}-source`] && (
              <p className="text-destructive text-sm mt-1">{errors[`condition-${index}-source`]}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-card-foreground mb-1">
              Target Metadata Key *
            </label>
            <input
              type="text"
              value={condition.targetMetadataKey}
              onChange={(e) => updateCondition(index, 'targetMetadataKey', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${
                errors[`condition-${index}-target`] ? 'border-destructive' : 'border-border'
              }`}
              placeholder="e.g., project_id, previous_version"
            />
            {errors[`condition-${index}-target`] && (
              <p className="text-destructive text-sm mt-1">{errors[`condition-${index}-target`]}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-card-foreground mb-1">
              Operator *
            </label>
            <select
              value={condition.operator}
              onChange={(e) => updateCondition(index, 'operator', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {operators.map(op => (
                <option key={op.value} value={op.value}>{op.label}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={condition.caseSensitive}
                onChange={(e) => updateCondition(index, 'caseSensitive', e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary"
              />
              <span className="ml-2 text-sm text-card-foreground">Case Sensitive</span>
            </label>
          </div>
        </div>

        {showValueInput && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-card-foreground mb-1">
              Value *
            </label>
            <input
              type="text"
              value={condition.value || ''}
              onChange={(e) => updateCondition(index, 'value', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${
                errors[`condition-${index}-value`] ? 'border-destructive' : 'border-border'
              }`}
              placeholder="Enter comparison value"
            />
            {errors[`condition-${index}-value`] && (
              <p className="text-destructive text-sm mt-1">{errors[`condition-${index}-value`]}</p>
            )}
          </div>
        )}

        {showRangeInputs && (
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1">
                Min Value *
              </label>
              <input
                type="number"
                value={condition.minValue || ''}
                onChange={(e) => updateCondition(index, 'minValue', parseFloat(e.target.value))}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${
                  errors[`condition-${index}-range`] ? 'border-destructive' : 'border-border'
                }`}
                placeholder="Minimum value"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1">
                Max Value *
              </label>
              <input
                type="number"
                value={condition.maxValue || ''}
                onChange={(e) => updateCondition(index, 'maxValue', parseFloat(e.target.value))}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${
                  errors[`condition-${index}-range`] ? 'border-destructive' : 'border-border'
                }`}
                placeholder="Maximum value"
              />
            </div>
            {errors[`condition-${index}-range`] && (
              <p className="text-destructive text-sm mt-1 col-span-2">{errors[`condition-${index}-range`]}</p>
            )}
          </div>
        )}

        {showSingleNumberInput && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-card-foreground mb-1">
              {condition.operator === 'GREATER_THAN' ? 'Min Value *' : 'Max Value *'}
            </label>
            <input
              type="number"
              value={condition.operator === 'GREATER_THAN' ? condition.minValue || '' : condition.maxValue || ''}
              onChange={(e) => {
                const value = parseFloat(e.target.value);
                if (condition.operator === 'GREATER_THAN') {
                  updateCondition(index, 'minValue', value);
                } else {
                  updateCondition(index, 'maxValue', value);
                }
              }}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder={condition.operator === 'GREATER_THAN' ? 'Minimum value' : 'Maximum value'}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-card rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-bold text-card-foreground">Create Automatic Link Rule</h2>
          <p className="text-muted-foreground mt-1">
            Define rules to automatically link documents based on metadata conditions
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1">
                Rule Name *
              </label>
              <input
                type="text"
                value={formData.ruleName}
                onChange={(e) => updateFormField('ruleName', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${
                  errors.ruleName ? 'border-destructive' : 'border-border'
                }`}
                placeholder="Enter rule name"
              />
              {errors.ruleName && (
                <p className="text-destructive text-sm mt-1">{errors.ruleName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1">
                Link Type *
              </label>
              <select
                value={formData.linkType}
                onChange={(e) => updateFormField('linkType', e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {linkTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-card-foreground mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => updateFormField('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Describe what this rule does..."
            />
          </div>

          {/* Categories */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1">
                Source Category *
              </label>
              <select
                value={formData.sourceCategoryId || ''}
                onChange={(e) => updateFormField('sourceCategoryId', e.target.value ? parseInt(e.target.value) : null)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${
                  errors.sourceCategoryId ? 'border-destructive' : 'border-border'
                }`}
              >
                <option value="">Select source category</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
              {errors.sourceCategoryId && (
                <p className="text-destructive text-sm mt-1">{errors.sourceCategoryId}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1">
                Target Category *
              </label>
              <select
                value={formData.targetCategoryId || ''}
                onChange={(e) => updateFormField('targetCategoryId', e.target.value ? parseInt(e.target.value) : null)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${
                  errors.targetCategoryId ? 'border-destructive' : 'border-border'
                }`}
              >
                <option value="">Select target category</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
              {errors.targetCategoryId && (
                <p className="text-destructive text-sm mt-1">{errors.targetCategoryId}</p>
              )}
            </div>
          </div>

          {/* Conditions */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-card-foreground">Conditions</h3>
              <button
                type="button"
                onClick={addCondition}
                className="px-3 py-1 bg-secondary text-secondary-foreground rounded text-sm hover:bg-accent transition-colors"
              >
                Add Condition
              </button>
            </div>

            {formData.conditions.map((condition, index) => 
              renderConditionInputs(condition, index)
            )}

            {errors.conditions && (
              <p className="text-destructive text-sm mt-2">{errors.conditions}</p>
            )}
          </div>

          {/* Status */}
          <div className="flex items-center mb-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.enabled}
                onChange={(e) => updateFormField('enabled', e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary"
              />
              <span className="ml-2 text-sm text-card-foreground">Enable this rule immediately</span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary-dark transition-colors"
            >
              Create Rule
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Edit Rule Modal
const EditRuleModal: React.FC<{
  rule: LinkRule;
  categories: Category[];
  onSubmit: (data: LinkRuleFormData) => void;
  onClose: () => void;
}> = ({ rule, categories, onSubmit, onClose }) => {
  const [formData, setFormData] = useState<LinkRuleFormData>({
    ruleName: rule.ruleName,
    description: rule.description || '',
    sourceCategoryId: rule.sourceCategoryId,
    targetCategoryId: rule.targetCategoryId,
    linkType: rule.linkType,
    conditions: rule.conditions.map(cond => ({
      ...cond,
      id: cond.id
    })),
    enabled: rule.enabled
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reuse the same configuration and functions from CreateRuleModal
  const linkTypes = [
    'RELATED',
    'SUPERSEDES',
    'REFERENCES',
    'CONTAINS',
    'LINKED_TO',
    'DUPLICATE'
  ];

  const operators = [
    { value: 'EQUALS', label: 'Equals' },
    { value: 'CONTAINS', label: 'Contains' },
    { value: 'REGEX', label: 'Regular Expression' },
    { value: 'GREATER_THAN', label: 'Greater Than' },
    { value: 'LESS_THAN', label: 'Less Than' },
    { value: 'RANGE', label: 'In Range' }
  ];

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.ruleName.trim()) {
      newErrors.ruleName = 'Rule name is required';
    }

    if (!formData.sourceCategoryId) {
      newErrors.sourceCategoryId = 'Source category is required';
    }

    if (!formData.targetCategoryId) {
      newErrors.targetCategoryId = 'Target category is required';
    }

    if (formData.conditions.length === 0) {
      newErrors.conditions = 'At least one condition is required';
    }

    formData.conditions.forEach((condition, index) => {
      if (!condition.sourceMetadataKey.trim()) {
        newErrors[`condition-${index}-source`] = 'Source metadata key is required';
      }
      if (!condition.targetMetadataKey.trim()) {
        newErrors[`condition-${index}-target`] = 'Target metadata key is required';
      }
      if (['EQUALS', 'CONTAINS', 'REGEX'].includes(condition.operator) && !condition.value?.trim()) {
        newErrors[`condition-${index}-value`] = 'Value is required for this operator';
      }
      if (condition.operator === 'RANGE' && (condition.minValue === undefined || condition.maxValue === undefined)) {
        newErrors[`condition-${index}-range`] = 'Both min and max values are required for range';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const addCondition = () => {
    setFormData(prev => ({
      ...prev,
      conditions: [
        ...prev.conditions,
        {
          sourceMetadataKey: '',
          targetMetadataKey: '',
          operator: 'EQUALS',
          caseSensitive: false
        }
      ]
    }));
  };

  const removeCondition = (index: number) => {
    setFormData(prev => ({
      ...prev,
      conditions: prev.conditions.filter((_, i) => i !== index)
    }));
  };

  const updateCondition = (index: number, field: keyof LinkCondition, value: any) => {
    setFormData(prev => ({
      ...prev,
      conditions: prev.conditions.map((condition, i) =>
        i === index ? { ...condition, [field]: value } : condition
      )
    }));
  };

  const updateFormField = (field: keyof LinkRuleFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const renderConditionInputs = (condition: LinkCondition, index: number) => {
    const showValueInput = ['EQUALS', 'CONTAINS', 'REGEX'].includes(condition.operator);
    const showRangeInputs = condition.operator === 'RANGE';
    const showSingleNumberInput = ['GREATER_THAN', 'LESS_THAN'].includes(condition.operator);

    return (
      <div key={index} className="bg-muted rounded-lg p-4 mb-4">
        <div className="flex justify-between items-center mb-3">
          <h4 className="font-medium text-card-foreground">Condition {index + 1}</h4>
          {formData.conditions.length > 1 && (
            <button
              type="button"
              onClick={() => removeCondition(index)}
              className="text-destructive hover:text-red-700 text-sm"
            >
              Remove
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-card-foreground mb-1">
              Source Metadata Key *
            </label>
            <input
              type="text"
              value={condition.sourceMetadataKey}
              onChange={(e) => updateCondition(index, 'sourceMetadataKey', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${
                errors[`condition-${index}-source`] ? 'border-destructive' : 'border-border'
              }`}
              placeholder="e.g., project_id, version"
            />
            {errors[`condition-${index}-source`] && (
              <p className="text-destructive text-sm mt-1">{errors[`condition-${index}-source`]}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-card-foreground mb-1">
              Target Metadata Key *
            </label>
            <input
              type="text"
              value={condition.targetMetadataKey}
              onChange={(e) => updateCondition(index, 'targetMetadataKey', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${
                errors[`condition-${index}-target`] ? 'border-destructive' : 'border-border'
              }`}
              placeholder="e.g., project_id, previous_version"
            />
            {errors[`condition-${index}-target`] && (
              <p className="text-destructive text-sm mt-1">{errors[`condition-${index}-target`]}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-card-foreground mb-1">
              Operator *
            </label>
            <select
              value={condition.operator}
              onChange={(e) => updateCondition(index, 'operator', e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {operators.map(op => (
                <option key={op.value} value={op.value}>{op.label}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={condition.caseSensitive}
                onChange={(e) => updateCondition(index, 'caseSensitive', e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary"
              />
              <span className="ml-2 text-sm text-card-foreground">Case Sensitive</span>
            </label>
          </div>
        </div>

        {showValueInput && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-card-foreground mb-1">
              Value *
            </label>
            <input
              type="text"
              value={condition.value || ''}
              onChange={(e) => updateCondition(index, 'value', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${
                errors[`condition-${index}-value`] ? 'border-destructive' : 'border-border'
              }`}
              placeholder="Enter comparison value"
            />
            {errors[`condition-${index}-value`] && (
              <p className="text-destructive text-sm mt-1">{errors[`condition-${index}-value`]}</p>
            )}
          </div>
        )}

        {showRangeInputs && (
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1">
                Min Value *
              </label>
              <input
                type="number"
                value={condition.minValue || ''}
                onChange={(e) => updateCondition(index, 'minValue', parseFloat(e.target.value))}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${
                  errors[`condition-${index}-range`] ? 'border-destructive' : 'border-border'
                }`}
                placeholder="Minimum value"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1">
                Max Value *
              </label>
              <input
                type="number"
                value={condition.maxValue || ''}
                onChange={(e) => updateCondition(index, 'maxValue', parseFloat(e.target.value))}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${
                  errors[`condition-${index}-range`] ? 'border-destructive' : 'border-border'
                }`}
                placeholder="Maximum value"
              />
            </div>
            {errors[`condition-${index}-range`] && (
              <p className="text-destructive text-sm mt-1 col-span-2">{errors[`condition-${index}-range`]}</p>
            )}
          </div>
        )}

        {showSingleNumberInput && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-card-foreground mb-1">
              {condition.operator === 'GREATER_THAN' ? 'Min Value *' : 'Max Value *'}
            </label>
            <input
              type="number"
              value={condition.operator === 'GREATER_THAN' ? condition.minValue || '' : condition.maxValue || ''}
              onChange={(e) => {
                const value = parseFloat(e.target.value);
                if (condition.operator === 'GREATER_THAN') {
                  updateCondition(index, 'minValue', value);
                } else {
                  updateCondition(index, 'maxValue', value);
                }
              }}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder={condition.operator === 'GREATER_THAN' ? 'Minimum value' : 'Maximum value'}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-card rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-bold text-card-foreground">Edit Automatic Link Rule</h2>
          <p className="text-muted-foreground mt-1">
            Update the rule configuration and conditions
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1">
                Rule Name *
              </label>
              <input
                type="text"
                value={formData.ruleName}
                onChange={(e) => updateFormField('ruleName', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${
                  errors.ruleName ? 'border-destructive' : 'border-border'
                }`}
                placeholder="Enter rule name"
              />
              {errors.ruleName && (
                <p className="text-destructive text-sm mt-1">{errors.ruleName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1">
                Link Type *
              </label>
              <select
                value={formData.linkType}
                onChange={(e) => updateFormField('linkType', e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {linkTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-card-foreground mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => updateFormField('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Describe what this rule does..."
            />
          </div>

          {/* Categories */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1">
                Source Category *
              </label>
              <select
                value={formData.sourceCategoryId || ''}
                onChange={(e) => updateFormField('sourceCategoryId', e.target.value ? parseInt(e.target.value) : null)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${
                  errors.sourceCategoryId ? 'border-destructive' : 'border-border'
                }`}
              >
                <option value="">Select source category</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
              {errors.sourceCategoryId && (
                <p className="text-destructive text-sm mt-1">{errors.sourceCategoryId}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1">
                Target Category *
              </label>
              <select
                value={formData.targetCategoryId || ''}
                onChange={(e) => updateFormField('targetCategoryId', e.target.value ? parseInt(e.target.value) : null)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${
                  errors.targetCategoryId ? 'border-destructive' : 'border-border'
                }`}
              >
                <option value="">Select target category</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
              {errors.targetCategoryId && (
                <p className="text-destructive text-sm mt-1">{errors.targetCategoryId}</p>
              )}
            </div>
          </div>

          {/* Conditions */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-card-foreground">Conditions</h3>
              <button
                type="button"
                onClick={addCondition}
                className="px-3 py-1 bg-secondary text-secondary-foreground rounded text-sm hover:bg-accent transition-colors"
              >
                Add Condition
              </button>
            </div>

            {formData.conditions.map((condition, index) => 
              renderConditionInputs(condition, index)
            )}

            {errors.conditions && (
              <p className="text-destructive text-sm mt-2">{errors.conditions}</p>
            )}
          </div>

          {/* Status */}
          <div className="flex items-center mb-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.enabled}
                onChange={(e) => updateFormField('enabled', e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary"
              />
              <span className="ml-2 text-sm text-card-foreground">Enable this rule</span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary-dark transition-colors"
            >
              Update Rule
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Update the RulesTab component to include edit functionality
const RulesTab: React.FC<{
  rules: LinkRule[];
  categories: Category[];
  onToggleRule: (id: number, enabled: boolean) => void;
  onDeleteRule: (id: number) => void;
  onEditRule: (id: number, data: LinkRuleFormData) => void;
}> = ({ rules, categories, onToggleRule, onDeleteRule, onEditRule }) => {
  const [editingRule, setEditingRule] = useState<LinkRule | null>(null);

  return (
    <div className="space-y-6">
      {/* Edit Modal */}
      {editingRule && (
        <EditRuleModal
          rule={editingRule}
          categories={categories}
          onSubmit={(data) => {
            onEditRule(editingRule.id, data);
            setEditingRule(null);
          }}
          onClose={() => setEditingRule(null)}
        />
      )}

      <div className="grid gap-6">
        {rules.map((rule) => (
          <div key={rule.id} className="bg-card rounded-lg border border-border p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-card-foreground">{rule.ruleName}</h3>
                {rule.description && (
                  <p className="text-muted-foreground mt-1">{rule.description}</p>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    rule.enabled
                      ? 'bg-success text-white'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {rule.enabled ? 'Active' : 'Inactive'}
                </span>
                <button
                  onClick={() => setEditingRule(rule)}
                  className="px-3 py-1 bg-secondary text-secondary-foreground rounded text-sm hover:bg-accent transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => onToggleRule(rule.id, !rule.enabled)}
                  className={`px-3 py-1 rounded text-sm ${
                    rule.enabled
                      ? 'bg-warning text-white hover:bg-orange-600'
                      : 'bg-primary text-primary-foreground hover:bg-primary-dark'
                  } transition-colors`}
                >
                  {rule.enabled ? 'Disable' : 'Enable'}
                </button>
                <button
                  onClick={() => onDeleteRule(rule.id)}
                  className="px-3 py-1 bg-destructive text-destructive-foreground rounded text-sm hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              <div>
                <span className="text-muted-foreground">Link Type:</span>
                <span className="ml-2 text-card-foreground">{rule.linkType}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Created:</span>
                <span className="ml-2 text-card-foreground">
                  {new Date(rule.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <h4 className="font-medium text-card-foreground mb-2">Conditions:</h4>
              <div className="space-y-2">
                {rule.conditions.map((condition) => (
                  <div key={condition.id} className="text-sm bg-muted rounded px-3 py-2">
                    <code>
                      {condition.sourceMetadataKey} {condition.operator} {condition.targetMetadataKey}
                      {condition.value && ` with value: ${condition.value}`}
                      {condition.minValue !== undefined && ` min: ${condition.minValue}`}
                      {condition.maxValue !== undefined && ` max: ${condition.maxValue}`}
                      {condition.caseSensitive && ' (case sensitive)'}
                    </code>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {rules.length === 0 && (
        <div className="text-center py-12">
          <div className="text-muted-foreground">
            No automatic link rules configured yet.
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Create your first rule to automatically link documents based on metadata.
          </p>
        </div>
      )}
    </div>
  );
};

// Update the main component to handle edit functionality
// Add this to your main component's state and functions
const [editingRule, setEditingRule] = useState<LinkRule | null>(null);

// Add the edit handler function
const handleEditRule = async (ruleId: number, ruleData: LinkRuleFormData) => {
  console.log('Editing rule:', ruleId, ruleData);
  // Replace with: await updateRule(ruleId, ruleData);
  setEditingRule(null);
};

// Update the modal rendering in main component
{editingRule && (
  <EditRuleModal
    rule={editingRule}
    categories={categories}
    onSubmit={(data) => handleEditRule(editingRule.id, data)}
    onClose={() => setEditingRule(null)}
  />
)}
