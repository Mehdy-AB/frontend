// utils/adminUtils.ts

/**
 * Simple admin detection utility
 * You can modify this logic based on your authentication system
 */

export const isAdmin = (): boolean => {
  // For now, we'll use a simple check
  // You can implement your own logic here based on:
  // - localStorage/sessionStorage
  // - JWT token claims
  // - API call to check user permissions
  // - Environment variables
  
  // Example implementations:
  
  // 1. Check localStorage for admin flag
  // return localStorage.getItem('isAdmin') === 'true';
  
  // 2. Check for specific user email
  // const userEmail = localStorage.getItem('userEmail');
  // return userEmail === 'admin@aeb-dms.com';
  
  // 3. Check for admin role in user data
  // const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  // return userData.roles?.includes('admin') || userData.roles?.includes('ADMIN');
  
  // For now, return true to show admin features
  // Change this to false to hide admin features for regular users
  return true;
};

export const getUserInfo = () => {
  // You can implement this to return user information
  // from localStorage, sessionStorage, or API
  return {
    id: '1',
    email: 'admin@aeb-dms.com',
    name: 'Admin User',
    roles: ['admin']
  };
};






