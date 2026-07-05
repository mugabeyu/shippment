export const manifest = {
  screens: {
    scr_xiuu4j: { name: "Login", route: "/", position: { "x": 160, "y": 220 } },
    scr_lubwhu: { name: "Dashboard", route: "/dashboard", position: { "x": 160, "y": 2200 } },
    scr_r2g5mg: { name: "Shipments", route: "/shipments", position: { "x": 160, "y": 4180 } },
    scr_2yhe24: { name: "Customers", route: "/customers", position: { "x": 1560, "y": 4180 } },
    scr_fwvw37: { name: "Categories", route: "/categories", position: { "x": 2960, "y": 4180 } },
    scr_njf4l8: { name: "Loyalty & Offers", route: "/loyalty", position: { "x": 4360, "y": 4180 } },
    scr_0bhb14: { name: "Reports", route: "/reports", position: { "x": 5760, "y": 4180 } },
    scr_iv2a0o: { name: "Settings", route: "/settings", position: { "x": 160, "y": 6160 } }
  },
  sections: {
    sec_v2ldu4: { name: "Auth & Entry", x: 0, y: 0, width: 1520, height: 1180 },
    sec_s32ye8: { name: "Main Dashboard", x: 0, y: 1980, width: 1520, height: 1180 },
    sec_qn3rvo: { name: "Business Operations", x: 0, y: 3960, width: 7120, height: 1180 },
    sec_qsttbq: { name: "System Settings", x: 0, y: 5940, width: 1520, height: 1180 }
  },
  layers: [
  { kind: "section", id: "sec_v2ldu4", children: [
    { kind: "screen", id: "scr_xiuu4j" }]
  },
  { kind: "section", id: "sec_s32ye8", children: [
    { kind: "screen", id: "scr_lubwhu" }]
  },
  { kind: "section", id: "sec_qn3rvo", children: [
    { kind: "screen", id: "scr_r2g5mg" },
    { kind: "screen", id: "scr_2yhe24" },
    { kind: "screen", id: "scr_fwvw37" },
    { kind: "screen", id: "scr_njf4l8" },
    { kind: "screen", id: "scr_0bhb14" }]
  },
  { kind: "section", id: "sec_qsttbq", children: [
    { kind: "screen", id: "scr_iv2a0o" }]
  }]

};