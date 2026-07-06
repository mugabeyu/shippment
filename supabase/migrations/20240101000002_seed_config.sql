-- ============================================
-- La Grande Marque Shipping Admin
-- Seed app_config (key/value JSON). Idempotent.
-- Drives the sidebar nav, branding, breadcrumbs, shipment statuses, etc.
-- ============================================

INSERT INTO app_config (key, value, type, description) VALUES
  (
    'navigation',
    '[
      {"path":"/dashboard","label":"Dashboard","icon":"LayoutDashboard"},
      {"path":"/shipments","label":"Shipments","icon":"Truck"},
      {"path":"/customers","label":"Customers","icon":"Users"},
      {"path":"/categories","label":"Categories","icon":"Tags"},
      {"path":"/offers","label":"Offers","icon":"Gift"},
      {"path":"/reports","label":"Reports","icon":"BarChart3"},
      {"path":"/notifications","label":"Activity","icon":"Bell"},
      {"path":"/loyalty","label":"Loyalty","icon":"Star"},
      {"path":"/receipts","label":"Receipts","icon":"Receipt"},
      {"path":"/audit","label":"Audit Logs","icon":"FileSearch"},
      {"path":"/settings","label":"Settings","icon":"Settings"},
      {"path":"/staff","label":"Staff","icon":"UserPlus"}
    ]'::jsonb,
    'json',
    'Sidebar navigation items'
  ),
  (
    'branding',
    '{"companyName":"LA GRANDE MARQUE","tagline":"SHIPPING ADMIN"}'::jsonb,
    'json',
    'Company branding'
  ),
  (
    'breadcrumbs',
    '{"shipments":"Shipments","customers":"Customers","staff":"Staff","categories":"Categories","offers":"Offers","reports":"Reports","notifications":"Notifications","loyalty":"Loyalty","receipts":"Receipts","audit":"Audit Logs","settings":"Settings","profile":"Profile"}'::jsonb,
    'json',
    'Breadcrumb labels by route segment'
  ),
  (
    'shipment_statuses',
    '["Pending","Packed","Ready","Loaded","In Transit","Arrived","Ready for Pickup","Delivered","Cancelled"]'::jsonb,
    'json',
    'Allowed shipment statuses'
  ),
  (
    'defaults',
    '{"origin":"","destination":"","currency":"MGA","paymentMethods":["Cash","Bank Transfer","Mobile Money"],"loyaltyTargetKg":25}'::jsonb,
    'json',
    'Default form values'
  )
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = NOW();
