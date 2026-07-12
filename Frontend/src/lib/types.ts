export type AssetStatus =
  | "available"
  | "allocated"
  | "maintenance"
  | "retired"
  | "reserved";

export interface Department {
  id: string;
  name: string;
  code: string;
  head: string;
  employeeCount: number;
  parent?: string;
  status: "active" | "inactive";
}

export interface AssetCategory {
  id: string;
  name: string;
  code: string;
  description: string;
  assetCount: number;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: "admin" | "manager" | "employee" | "technician" | "auditor";
  department: string;
  title: string;
  avatar: string;
  status: "active" | "inactive";
  joinedAt: string;
}

export interface Asset {
  id: string;
  tag: string;
  name: string;
  serial: string;
  category: string;
  department: string;
  location: string;
  status: AssetStatus;
  assignedTo?: string;
  purchaseDate: string;
  purchasePrice: number;
  condition: "excellent" | "good" | "fair" | "poor";
  image?: string;
}

export interface Booking {
  id: string;
  resource: string;
  resourceType: "meeting-room" | "vehicle" | "equipment";
  bookedBy: string;
  start: string;
  end: string;
  status: "confirmed" | "pending" | "cancelled" | "completed";
  purpose: string;
}

export interface MaintenanceRequest {
  id: string;
  asset: string;
  assetTag: string;
  requester: string;
  technician?: string;
  priority: "low" | "medium" | "high" | "critical";
  status: "pending" | "approved" | "assigned" | "in-progress" | "resolved";
  issue: string;
  createdAt: string;
}

export interface Transfer {
  id: string;
  asset: string;
  assetTag: string;
  fromEmployee: string;
  toEmployee: string;
  requestedBy: string;
  status: "pending" | "approved" | "rejected" | "completed";
  reason: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  priority: "low" | "medium" | "high";
  read: boolean;
  type: "asset" | "maintenance" | "booking" | "audit" | "system";
  createdAt: string;
}

export interface ActivityEvent {
  id: string;
  actor: string;
  action: string;
  target: string;
  timestamp: string;
  type: "create" | "update" | "assign" | "maintenance" | "audit" | "transfer";
}
