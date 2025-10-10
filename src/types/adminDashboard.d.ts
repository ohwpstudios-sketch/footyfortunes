// src/types/adminDashboard.d.ts
import React from 'react';

type Role = 'user' | 'admin';

export interface AdminDashboardUser {
  email: string;
  role: Role;
}

export interface AdminDashboardProps {
  user: AdminDashboardUser;
  darkMode: boolean;
}

// Tell TypeScript what `./components/AdminDashboard` exports
declare module './components/AdminDashboard' {
  const AdminDashboard: React.FC<AdminDashboardProps>;
  export default AdminDashboard;
}