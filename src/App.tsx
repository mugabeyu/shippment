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
import { Staff } from './pages/Staff';
import { CustomerDetail } from './pages/CustomerDetail';
import { ShipmentDetail } from './pages/ShipmentDetail';
import { Profile } from './pages/Profile';
import { AuditLogs } from './pages/AuditLogs';
import { Notifications } from './pages/Notifications';
import { Receipts } from './pages/Receipts';
import { StaffRegister } from './pages/StaffRegister';
import { useScreenInit } from './useScreenInit';
function AppContent() {
  useScreenInit();
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<StaffRegister />} />
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
        path="/shipments/:id"
        element={
        <Layout>
            <ShipmentDetail />
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
        path="/customers/:id"
        element={
        <Layout>
            <CustomerDetail />
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
      <Route
        path="/staff"
        element={
        <Layout>
            <Staff />
          </Layout>
        } />
      <Route
        path="/profile"
        element={
        <Layout>
            <Profile />
          </Layout>
        } />
      <Route
        path="/audit"
        element={
        <Layout>
            <AuditLogs />
          </Layout>
        } />
      <Route
        path="/notifications"
        element={
        <Layout>
            <Notifications />
          </Layout>
        } />
      <Route
        path="/receipts"
        element={
        <Layout>
            <Receipts />
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