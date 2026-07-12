import type {
  ActivityEvent,
  Asset,
  AssetCategory,
  Booking,
  Department,
  Employee,
  MaintenanceRequest,
  Notification,
  Transfer,
} from "./types";

export const departments: Department[] = [
  { id: "d1", name: "Engineering", code: "ENG", head: "Rushikesh Rathod", employeeCount: 42, status: "active" },
  { id: "d2", name: "Product Design", code: "PDN", head: "Pranav Raut", employeeCount: 18, parent: "d1", status: "active" },
  { id: "d3", name: "Finance", code: "FIN", head: "Nitish Sahu", employeeCount: 12, status: "active" },
  { id: "d4", name: "Human Resources", code: "HR", head: "Ojas Kulkarni", employeeCount: 9, status: "active" },
];

export const categories: AssetCategory[] = [
  { id: "c1", name: "Laptops", code: "LAP", description: "Portable workstations", assetCount: 14 },
  { id: "c2", name: "Monitors", code: "MON", description: "External displays", assetCount: 9 },
  { id: "c3", name: "Mobile Devices", code: "MOB", description: "Phones and tablets", assetCount: 6 },
  { id: "c4", name: "Networking", code: "NET", description: "Routers, switches, APs", assetCount: 4 },
  { id: "c5", name: "Furniture", code: "FUR", description: "Desks and chairs", assetCount: 3 },
  { id: "c6", name: "Vehicles", code: "VEH", description: "Company fleet", assetCount: 2 },
  { id: "c7", name: "Tools", code: "TLS", description: "Hardware and tools", assetCount: 2 },
];

export const employees: Employee[] = [
  {
    id: "e1",
    name: "Rushikesh Rathod",
    email: "rushikesh.rathod@assetflow.co",
    role: "admin",
    department: "Engineering",
    title: "Head of Engineering",
    avatar: "https://api.dicebear.com/9.x/notionists/svg?seed=RushikeshRathod",
    status: "active",
    joinedAt: "2023-01-15"
  },
  {
    id: "e2",
    name: "Pranav Raut",
    email: "pranav.raut@assetflow.co",
    role: "manager",
    department: "Product Design",
    title: "Head of Product Design",
    avatar: "https://api.dicebear.com/9.x/notionists/svg?seed=PranavRaut",
    status: "active",
    joinedAt: "2023-02-10"
  },
  {
    id: "e3",
    name: "Nitish Sahu",
    email: "nitish.sahu@assetflow.co",
    role: "manager",
    department: "Finance",
    title: "Head of Finance",
    avatar: "https://api.dicebear.com/9.x/notionists/svg?seed=NitishSahu",
    status: "active",
    joinedAt: "2023-03-05"
  },
  {
    id: "e4",
    name: "Ojas Kulkarni",
    email: "ojas.kulkarni@assetflow.co",
    role: "manager",
    department: "Human Resources",
    title: "Head of HR",
    avatar: "https://api.dicebear.com/9.x/notionists/svg?seed=OjasKulkarni",
    status: "active",
    joinedAt: "2023-04-20"
  }
];

const assetNames = [
  "MacBook Pro 16\"","MacBook Air M3","Dell XPS 15","ThinkPad X1 Carbon","Surface Laptop 5",
  "LG UltraFine 27\"","Dell UltraSharp 32\"","Apple Studio Display","Samsung Odyssey G9",
  "iPhone 15 Pro","iPad Pro 12.9\"","Pixel 8 Pro","Galaxy Tab S9",
  "Cisco Catalyst 9200","Ubiquiti UDM Pro","Aruba AP-635","Meraki MX85",
  "Herman Miller Aeron","Steelcase Leap","Standing Desk Pro",
  "Ford Transit Custom","Tesla Model Y",
  "DeWalt Drill Kit","Bosch Impact Driver",
];
const locations = ["HQ · Floor 3","HQ · Floor 4","Warehouse A","Warehouse B","Remote — NYC","Remote — Berlin","Field Office · Austin","Data Center · East"];
const statuses: Asset["status"][] = ["available","allocated","maintenance","reserved","available","allocated","allocated"];

export const assets: Asset[] = Array.from({ length: 42 }, (_, i) => {
  const cat = categories[i % categories.length];
  const status = statuses[i % statuses.length];
  const assigned = status === "allocated" ? employees[i % employees.length].name : undefined;
  return {
    id: `a${i + 1}`,
    tag: `AF-${String(1000 + i)}`,
    name: assetNames[i % assetNames.length],
    serial: `SN-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
    category: cat.name,
    department: departments[i % departments.length].name,
    location: locations[i % locations.length],
    status,
    assignedTo: assigned,
    purchaseDate: `2024-${String((i % 12) + 1).padStart(2, "0")}-${String((i % 27) + 1).padStart(2, "0")}`,
    purchasePrice: 500 + ((i * 137) % 4500),
    condition: (["excellent","good","good","fair","poor"] as const)[i % 5],
  };
});

const resources = ["Aurora Meeting Room","Nebula Boardroom","Comet Huddle","Focus Pod 1","Focus Pod 2","Fleet Van #3","Projector Kit A","Recording Studio"];
export const bookings: Booking[] = Array.from({ length: 20 }, (_, i) => {
  const day = new Date();
  day.setDate(day.getDate() + (i - 5));
  day.setHours(9 + (i % 8), 0, 0, 0);
  const end = new Date(day);
  end.setHours(day.getHours() + 1 + (i % 3));
  return {
    id: `b${i + 1}`,
    resource: resources[i % resources.length],
    resourceType: i % 5 === 0 ? "vehicle" : i % 3 === 0 ? "equipment" : "meeting-room",
    bookedBy: employees[i % employees.length].name,
    start: day.toISOString(),
    end: end.toISOString(),
    status: (["confirmed","confirmed","pending","completed","cancelled"] as const)[i % 5],
    purpose: ["Team sync","Client demo","1:1","Strategy review","Onboarding","Interview","Deep work"][i % 7],
  };
});

const issues = ["Won't power on","Screen flickering","Battery drains fast","Fan noise","Keyboard sticky","Overheating","Network drops","Cracked screen"];
export const maintenance: MaintenanceRequest[] = Array.from({ length: 15 }, (_, i) => ({
  id: `m${i + 1}`,
  asset: assets[i % assets.length].name,
  assetTag: assets[i % assets.length].tag,
  requester: employees[i % employees.length].name,
  technician: i % 3 === 0 ? undefined : employees[(i + 5) % employees.length].name,
  priority: (["low","medium","high","critical"] as const)[i % 4],
  status: (["pending","approved","assigned","in-progress","resolved"] as const)[i % 5],
  issue: issues[i % issues.length],
  createdAt: `2025-11-${String((i % 28) + 1).padStart(2, "0")}`,
}));

export const transfers: Transfer[] = Array.from({ length: 10 }, (_, i) => ({
  id: `t${i + 1}`,
  asset: assets[i % assets.length].name,
  assetTag: assets[i % assets.length].tag,
  fromEmployee: employees[i % employees.length].name,
  toEmployee: employees[(i + 3) % employees.length].name,
  requestedBy: employees[(i + 1) % employees.length].name,
  status: (["pending","pending","approved","completed","rejected"] as const)[i % 5],
  reason: ["Team change","Role transition","Project reassignment","Return to pool"][i % 4],
  createdAt: `2025-12-${String((i % 28) + 1).padStart(2, "0")}`,
}));

export const notifications: Notification[] = Array.from({ length: 12 }, (_, i) => ({
  id: `n${i + 1}`,
  title: [
    "Asset AF-1023 returned",
    "New maintenance request",
    "Booking confirmed",
    "Transfer awaiting approval",
    "Audit cycle started",
    "Overdue asset alert",
  ][i % 6],
  message: [
    "The asset has been returned to inventory.",
    "MacBook Pro 16\" flagged with critical priority.",
    "Aurora Meeting Room booked for tomorrow 10:00.",
    "Transfer of AF-1041 requires your approval.",
    "Q4 audit for Engineering department has begun.",
    "AF-1015 is 5 days overdue.",
  ][i % 6],
  priority: (["low","medium","high"] as const)[i % 3],
  read: i > 4,
  type: (["asset","maintenance","booking","audit","system"] as const)[i % 5],
  createdAt: new Date(Date.now() - i * 3600_000 * 5).toISOString(),
}));

export const activity: ActivityEvent[] = Array.from({ length: 10 }, (_, i) => ({
  id: `ac${i + 1}`,
  actor: employees[i % employees.length].name,
  action: ["registered","allocated","returned","requested maintenance for","approved transfer of","audited"][i % 6],
  target: assets[i % assets.length].tag,
  timestamp: new Date(Date.now() - i * 3600_000 * 3).toISOString(),
  type: (["create","assign","update","maintenance","transfer","audit"] as const)[i % 6],
}));

// Dashboard KPIs derived from mock data
export function kpis() {
  return {
    available: assets.filter(a => a.status === "available").length,
    allocated: assets.filter(a => a.status === "allocated").length,
    maintenance: assets.filter(a => a.status === "maintenance").length,
    reserved: assets.filter(a => a.status === "reserved").length,
    activeBookings: bookings.filter(b => b.status === "confirmed").length,
    pendingTransfers: transfers.filter(t => t.status === "pending").length,
    overdue: 3,
    total: assets.length,
  };
}
