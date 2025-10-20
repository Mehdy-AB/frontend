# Rule Execution Features

## Overview
This document describes the new rule execution features added to the link rule system. These features provide comprehensive rule execution, statistics tracking, and cache management capabilities.

## New Types (`frontend/src/types/api.ts`)

### Rule Execution Types
```typescript
export interface RuleExecutionRequest {
  ruleId: number;
  documentId?: number; // Optional: execute rule for specific document
  forceRevalidation?: boolean;
}

export interface RuleExecutionResponse {
  ruleId: number;
  documentsProcessed: number;
  linksCreated: number;
  executionTime: number;
  success: boolean;
  message?: string;
}

export interface RuleStatistics {
  ruleId: number;
  ruleName: string;
  totalExecutions: number;
  lastExecutedAt?: string;
  linksCreated: number;
  successRate: number;
  averageExecutionTime: number;
}

export interface BulkRuleExecutionRequest {
  ruleIds: number[];
  documentId?: number;
  forceRevalidation?: boolean;
}

export interface BulkRuleExecutionResponse {
  totalRules: number;
  successfulRules: number;
  failedRules: number;
  totalLinksCreated: number;
  executionTime: number;
  results: RuleExecutionResponse[];
}

export interface LinkRuleCacheStatistics {
  totalCachedLinks: number;
  activeRules: number;
  lastRevalidation: string;
  cacheHitRate: number;
}
```

## New API Endpoints (`frontend/src/api/client.ts`)

### Rule Execution Endpoints
```typescript
// Execute a specific link rule
async executeRule(request: RuleExecutionRequest): Promise<RuleExecutionResponse>

// Execute multiple link rules in bulk
async executeBulkRules(request: BulkRuleExecutionRequest): Promise<BulkRuleExecutionResponse>

// Revalidate all link rules
async revalidateAllRules(): Promise<{ message: string; rulesProcessed: number }>

// Revalidate a specific link rule
async revalidateRule(ruleId: number): Promise<RuleExecutionResponse>

// Get rule execution statistics
async getRuleStatistics(ruleId: number): Promise<RuleStatistics>

// Get all rule statistics
async getAllRuleStatistics(): Promise<RuleStatistics[]>

// Get link rule cache statistics
async getLinkRuleCacheStatistics(): Promise<LinkRuleCacheStatistics>

// Clear cache for a specific document
async clearDocumentCache(documentId: number): Promise<void>

// Clear cache for a specific rule
async clearRuleCache(ruleId: number): Promise<void>

// Clear all link rule cache
async clearAllRuleCache(): Promise<void>
```

## Notification Client Integration (`frontend/src/api/notificationClient.ts`)

All rule execution methods are wrapped with appropriate notifications:

### Rule Execution Operations
```typescript
// Execute rule with notifications
async executeRule(request: RuleExecutionRequest, options?: ApiNotificationOptions)

// Execute bulk rules with notifications
async executeBulkRules(request: BulkRuleExecutionRequest, options?: ApiNotificationOptions)

// Revalidate operations with notifications
async revalidateAllRules(options?: ApiNotificationOptions)
async revalidateRule(ruleId: number, options?: ApiNotificationOptions)

// Statistics operations are silent
async getRuleStatistics(ruleId: number, options?: ApiNotificationOptions)
async getAllRuleStatistics(options?: ApiNotificationOptions)
async getLinkRuleCacheStatistics(options?: ApiNotificationOptions)

// Cache operations with notifications
async clearDocumentCache(documentId: number, options?: ApiNotificationOptions)
async clearRuleCache(ruleId: number, options?: ApiNotificationOptions)
async clearAllRuleCache(options?: ApiNotificationOptions)
```

## Document Service Integration (`frontend/src/api/services/documentService.ts`)

All rule execution methods are exposed through the document service:

```typescript
export class DocumentService {
  // Rule Execution Operations
  static async executeRule(request: RuleExecutionRequest, options?: any): Promise<RuleExecutionResponse>
  static async executeBulkRules(request: BulkRuleExecutionRequest, options?: any): Promise<BulkRuleExecutionResponse>
  static async revalidateAllRules(options?: any): Promise<{ message: string; rulesProcessed: number }>
  static async revalidateRule(ruleId: number, options?: any): Promise<RuleExecutionResponse>
  
  // Statistics Operations
  static async getRuleStatistics(ruleId: number, options?: any): Promise<RuleStatistics>
  static async getAllRuleStatistics(options?: any): Promise<RuleStatistics[]>
  static async getLinkRuleCacheStatistics(options?: any): Promise<LinkRuleCacheStatistics>
  
  // Cache Management Operations
  static async clearDocumentCache(documentId: number, options?: any): Promise<void>
  static async clearRuleCache(ruleId: number, options?: any): Promise<void>
  static async clearAllRuleCache(options?: any): Promise<void>
}
```

## Usage Examples

### 1. Execute a Single Rule
```typescript
import { DocumentService } from '../api/services/documentService';
import { RuleExecutionRequest } from '../types/api';

// Execute a specific rule
const executionRequest: RuleExecutionRequest = {
  ruleId: 123,
  forceRevalidation: true
};

const result = await DocumentService.executeRule(executionRequest);
console.log(`Rule executed: ${result.success}`);
console.log(`Links created: ${result.linksCreated}`);
console.log(`Execution time: ${result.executionTime}ms`);
```

### 2. Execute Rules for a Specific Document
```typescript
// Execute rule for a specific document
const documentExecutionRequest: RuleExecutionRequest = {
  ruleId: 123,
  documentId: 456,
  forceRevalidation: false
};

const result = await DocumentService.executeRule(documentExecutionRequest);
```

### 3. Bulk Rule Execution
```typescript
import { BulkRuleExecutionRequest } from '../types/api';

// Execute multiple rules
const bulkRequest: BulkRuleExecutionRequest = {
  ruleIds: [123, 124, 125],
  forceRevalidation: true
};

const bulkResult = await DocumentService.executeBulkRules(bulkRequest);
console.log(`Total rules: ${bulkResult.totalRules}`);
console.log(`Successful: ${bulkResult.successfulRules}`);
console.log(`Failed: ${bulkResult.failedRules}`);
console.log(`Total links created: ${bulkResult.totalLinksCreated}`);
```

### 4. Rule Revalidation
```typescript
// Revalidate all rules
const revalidateAllResult = await DocumentService.revalidateAllRules();
console.log(`Rules processed: ${revalidateAllResult.rulesProcessed}`);

// Revalidate a specific rule
const revalidateResult = await DocumentService.revalidateRule(123);
console.log(`Rule revalidated: ${revalidateResult.success}`);
```

### 5. Rule Statistics
```typescript
// Get statistics for a specific rule
const ruleStats = await DocumentService.getRuleStatistics(123);
console.log(`Rule: ${ruleStats.ruleName}`);
console.log(`Total executions: ${ruleStats.totalExecutions}`);
console.log(`Success rate: ${ruleStats.successRate}%`);
console.log(`Links created: ${ruleStats.linksCreated}`);
console.log(`Average execution time: ${ruleStats.averageExecutionTime}ms`);

// Get statistics for all rules
const allStats = await DocumentService.getAllRuleStatistics();
allStats.forEach(stat => {
  console.log(`${stat.ruleName}: ${stat.successRate}% success rate`);
});
```

### 6. Cache Management
```typescript
// Get cache statistics
const cacheStats = await DocumentService.getLinkRuleCacheStatistics();
console.log(`Total cached links: ${cacheStats.totalCachedLinks}`);
console.log(`Active rules: ${cacheStats.activeRules}`);
console.log(`Cache hit rate: ${cacheStats.cacheHitRate}%`);

// Clear cache for specific document
await DocumentService.clearDocumentCache(456);

// Clear cache for specific rule
await DocumentService.clearRuleCache(123);

// Clear all rule cache
await DocumentService.clearAllRuleCache();
```

### 7. Using Direct API Client
```typescript
import { apiClient } from '../api/client';

// Direct API calls without notifications
const result = await apiClient.executeRule(executionRequest);
const stats = await apiClient.getRuleStatistics(123);
const cacheStats = await apiClient.getLinkRuleCacheStatistics();
```

### 8. Using Notification Client
```typescript
import { notificationApiClient } from '../api/notificationClient';

// With custom notification messages
const result = await notificationApiClient.executeRule(executionRequest, {
  successMessage: 'Rule executed successfully!',
  errorMessage: 'Failed to execute rule'
});

// Silent operation (no notifications)
const stats = await notificationApiClient.getRuleStatistics(123, { silent: true });
```

## Key Features

### 1. **Rule Execution**
- Execute individual rules or bulk operations
- Support for document-specific rule execution
- Force revalidation option
- Comprehensive execution results

### 2. **Statistics Tracking**
- Individual rule performance metrics
- Success rates and execution times
- Links created tracking
- Historical execution data

### 3. **Cache Management**
- Cache statistics and monitoring
- Document-specific cache clearing
- Rule-specific cache clearing
- Global cache management

### 4. **Rule Revalidation**
- Revalidate all rules at once
- Revalidate specific rules
- Force revalidation option
- Comprehensive revalidation results

### 5. **Bulk Operations**
- Execute multiple rules simultaneously
- Bulk execution results tracking
- Efficient batch processing
- Comprehensive bulk operation feedback

## Benefits

### 1. **Performance Monitoring**
- Track rule execution performance
- Monitor success rates and execution times
- Identify problematic rules
- Optimize rule configurations

### 2. **Cache Optimization**
- Monitor cache performance
- Clear cache when needed
- Optimize cache hit rates
- Manage memory usage

### 3. **Rule Management**
- Execute rules on demand
- Revalidate rule configurations
- Bulk rule operations
- Comprehensive rule monitoring

### 4. **System Maintenance**
- Clear cache for maintenance
- Revalidate rules after changes
- Monitor system performance
- Optimize rule execution

## Use Cases

### 1. **Administrative Operations**
- System administrators can execute rules manually
- Monitor rule performance and health
- Clear cache for maintenance
- Revalidate rules after configuration changes

### 2. **Performance Optimization**
- Track rule execution metrics
- Identify slow or failing rules
- Optimize rule configurations
- Monitor cache performance

### 3. **Debugging and Troubleshooting**
- Execute rules for specific documents
- Force revalidation for testing
- Clear cache to resolve issues
- Monitor rule execution results

### 4. **Bulk Operations**
- Execute multiple rules efficiently
- Process large document sets
- Manage rule execution at scale
- Monitor bulk operation results

This comprehensive rule execution system provides powerful tools for managing, monitoring, and optimizing link rule performance in the DMS application.



