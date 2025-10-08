'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { notificationApiClient } from '@/api/notificationClient'

export default function ApiNotificationTest() {
  const [testData, setTestData] = useState({
    folderName: 'Test Folder',
    userName: 'Test User',
    userEmail: 'test@example.com',
    roleName: 'Test Role',
    groupName: 'Test Group'
  })

  const [loading, setLoading] = useState<string | null>(null)

  const handleTest = async (testType: string, testFunction: () => Promise<any>) => {
    setLoading(testType)
    try {
      await testFunction()
    } catch (error) {
      console.error(`${testType} test failed:`, error)
    } finally {
      setLoading(null)
    }
  }

  const testFolderOperations = () => (
    <Card>
      <CardHeader>
        <CardTitle>Folder Operations</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="folderName">Folder Name</Label>
            <Input
              id="folderName"
              value={testData.folderName}
              onChange={(e) => setTestData(prev => ({ ...prev, folderName: e.target.value }))}
            />
          </div>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={() => handleTest('createFolder', () => 
              notificationApiClient.createFolder({
                name: testData.folderName,
                description: 'Test folder created via notification system',
                parentId: 1,
                typeShareAccess: 'PRIVATE'
              })
            )}
            disabled={loading === 'createFolder'}
          >
            {loading === 'createFolder' ? 'Creating...' : 'Create Folder'}
          </Button>
          
          <Button
            onClick={() => handleTest('getFolders', () => 
              notificationApiClient.getRepository({ page: 0, size: 10 }, { silent: true })
            )}
            disabled={loading === 'getFolders'}
            variant="outline"
          >
            {loading === 'getFolders' ? 'Loading...' : 'Get Folders'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  const testUserOperations = () => (
    <Card>
      <CardHeader>
        <CardTitle>User Operations</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="userName">User Name</Label>
            <Input
              id="userName"
              value={testData.userName}
              onChange={(e) => setTestData(prev => ({ ...prev, userName: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="userEmail">User Email</Label>
            <Input
              id="userEmail"
              type="email"
              value={testData.userEmail}
              onChange={(e) => setTestData(prev => ({ ...prev, userEmail: e.target.value }))}
            />
          </div>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={() => handleTest('createUser', () => 
              notificationApiClient.createUser({
                username: testData.userName.toLowerCase().replace(' ', '.'),
                email: testData.userEmail,
                firstName: testData.userName.split(' ')[0],
                lastName: testData.userName.split(' ')[1] || '',
                enabled: true
              })
            )}
            disabled={loading === 'createUser'}
          >
            {loading === 'createUser' ? 'Creating...' : 'Create User'}
          </Button>
          
          <Button
            onClick={() => handleTest('getUsers', () => 
              notificationApiClient.getAllUsers({ page: 0, size: 10 }, { silent: true })
            )}
            disabled={loading === 'getUsers'}
            variant="outline"
          >
            {loading === 'getUsers' ? 'Loading...' : 'Get Users'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  const testRoleOperations = () => (
    <Card>
      <CardHeader>
        <CardTitle>Role Operations</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="roleName">Role Name</Label>
            <Input
              id="roleName"
              value={testData.roleName}
              onChange={(e) => setTestData(prev => ({ ...prev, roleName: e.target.value }))}
            />
          </div>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={() => handleTest('createRole', () => 
              notificationApiClient.createRole({
                name: testData.roleName,
                description: 'Test role created via notification system'
              })
            )}
            disabled={loading === 'createRole'}
          >
            {loading === 'createRole' ? 'Creating...' : 'Create Role'}
          </Button>
          
          <Button
            onClick={() => handleTest('getRoles', () => 
              notificationApiClient.getAllRoles({ page: 0, size: 10 }, { silent: true })
            )}
            disabled={loading === 'getRoles'}
            variant="outline"
          >
            {loading === 'getRoles' ? 'Loading...' : 'Get Roles'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  const testGroupOperations = () => (
    <Card>
      <CardHeader>
        <CardTitle>Group Operations</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="groupName">Group Name</Label>
            <Input
              id="groupName"
              value={testData.groupName}
              onChange={(e) => setTestData(prev => ({ ...prev, groupName: e.target.value }))}
            />
          </div>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={() => handleTest('createGroup', () => 
              notificationApiClient.createGroup({
                name: testData.groupName,
                path: `/test/${testData.groupName.toLowerCase()}`,
                description: 'Test group created via notification system'
              })
            )}
            disabled={loading === 'createGroup'}
          >
            {loading === 'createGroup' ? 'Creating...' : 'Create Group'}
          </Button>
          
          <Button
            onClick={() => handleTest('getGroups', () => 
              notificationApiClient.getAllGroups({ page: 0, size: 10 }, { silent: true })
            )}
            disabled={loading === 'getGroups'}
            variant="outline"
          >
            {loading === 'getGroups' ? 'Loading...' : 'Get Groups'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  const testErrorHandling = () => (
    <Card>
      <CardHeader>
        <CardTitle>Error Handling Tests</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600">
          These tests will intentionally fail to demonstrate error notifications
        </p>
        
        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={() => handleTest('invalidFolder', () => 
              notificationApiClient.createFolder({
                name: '', // Invalid empty name
                description: 'This should fail',
                parentId: 1,
                typeShareAccess: 'PRIVATE'
              })
            )}
            disabled={loading === 'invalidFolder'}
            variant="destructive"
          >
            {loading === 'invalidFolder' ? 'Testing...' : 'Test Invalid Folder'}
          </Button>
          
          <Button
            onClick={() => handleTest('invalidUser', () => 
              notificationApiClient.createUser({
                username: '', // Invalid empty username
                email: 'invalid-email', // Invalid email format
                firstName: '',
                lastName: '',
                enabled: true
              })
            )}
            disabled={loading === 'invalidUser'}
            variant="destructive"
          >
            {loading === 'invalidUser' ? 'Testing...' : 'Test Invalid User'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">API Notification System Test</h2>
        <p className="text-gray-600">
          Test the notification system with real API calls. Success and error notifications will appear automatically.
        </p>
      </div>
      
      <div className="grid gap-6">
        {testFolderOperations()}
        {testUserOperations()}
        {testRoleOperations()}
        {testGroupOperations()}
        {testErrorHandling()}
      </div>
      
      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">How it works:</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• All API calls now automatically show success/error notifications</li>
          <li>• GET operations are silent by default (no notifications)</li>
          <li>• POST/PUT/DELETE operations show success/error notifications</li>
          <li>• Notifications appear in the top-right corner and auto-dismiss after 5 seconds</li>
          <li>• You can manually dismiss notifications by clicking the X button</li>
        </ul>
      </div>
    </div>
  )
}
