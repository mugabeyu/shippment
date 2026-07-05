import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate } from
'react-router-dom';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Shipments } from './pages/Shipments';
import { Customers } from './pages/Customers';
import { Categories } from './pages/Categories';
import { Loyalty } from './pages/Loyalty';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { useScreenInit } from './useScreenInit';
function AppContent() {
  useScreenInit();
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route
        path="/dashboard"
        element={
        <Layout>
            <Dashboard />
          </Layout>
        } />
      
      <Route
        path="/shipments"
        element={
        <Layout>
            <Shipments />
          </Layout>
        } />
      
      <Route
        path="/customers"
        element={
        <Layout>
            <Customers />
          </Layout>
        } />
      
      <Route
        path="/categories"
        element={
        <Layout>
            <Categories />
          </Layout>
        } />
      
      <Route
        path="/loyalty"
        element={
        <Layout>
            <Loyalty />
          </Layout>
        } />
      
      <Route
        path="/reports"
        element={
        <Layout>
            <Reports />
          </Layout>
        } />
      
      <Route
        path="/settings"
        element={
        <Layout>
            <Settings />
          </Layout>
        } />
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>);

}
export function App() {
  return (
    <Router>
      <AppContent />
    </Router>);

}