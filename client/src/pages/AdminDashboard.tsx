import { useState } from "react";
import { Sidebar } from "@/components/admin/Sidebar";
import { TopNavbar } from "@/components/admin/TopNavbar";
import { DashboardCards } from "@/components/admin/DashboardCards";
import { UserTable } from "@/components/admin/UserTable";

const mockUsers = [
  {
    id: 1,
    name: "John Doe",
    email: "john@example.com",
    playlist: "React for Beginners",
    dueDate: "2025-12-01",
    amountPaid: "₹500",
    invoiceUrl: "#",
    status: "Active",
    videos: [
      { id: 1, title: "Introduction to React", duration: "15:30" },
      { id: 2, title: "Components and Props", duration: "20:45" },
      { id: 3, title: "State and Lifecycle", duration: "18:20" },
    ],
    progress: 65,
  },
  {
    id: 2,
    name: "Jane Smith",
    email: "jane@example.com",
    playlist: "Python Basics",
    dueDate: "2025-11-15",
    amountPaid: "₹750",
    invoiceUrl: "#",
    status: "Expired",
    videos: [
      { id: 1, title: "Python Fundamentals", duration: "25:00" },
      { id: 2, title: "Data Types", duration: "30:15" },
    ],
    progress: 100,
  },
  {
    id: 3,
    name: "Mike Johnson",
    email: "mike@example.com",
    playlist: "JavaScript Advanced",
    dueDate: "2026-01-20",
    amountPaid: "₹1200",
    invoiceUrl: "#",
    status: "Active",
    videos: [
      { id: 1, title: "ES6 Features", duration: "22:30" },
      { id: 2, title: "Async/Await", duration: "28:45" },
      { id: 3, title: "Promises", duration: "19:20" },
      { id: 4, title: "Modules", duration: "16:10" },
    ],
    progress: 45,
  },
  {
    id: 4,
    name: "Sarah Williams",
    email: "sarah@example.com",
    playlist: "Node.js Fundamentals",
    dueDate: "2025-12-15",
    amountPaid: "₹900",
    invoiceUrl: "#",
    status: "Active",
    videos: [
      { id: 1, title: "Setting up Node", duration: "12:30" },
      { id: 2, title: "Express.js Basics", duration: "35:00" },
      { id: 3, title: "REST APIs", duration: "40:15" },
    ],
    progress: 30,
  },
  {
    id: 5,
    name: "Tom Brown",
    email: "tom@example.com",
    playlist: "TypeScript Mastery",
    dueDate: "2025-11-20",
    amountPaid: "₹850",
    invoiceUrl: "#",
    status: "Expired",
    videos: [
      { id: 1, title: "TypeScript Basics", duration: "18:45" },
      { id: 2, title: "Interfaces and Types", duration: "22:30" },
    ],
    progress: 80,
  },
  {
    id: 6,
    name: "Emily Davis",
    email: "emily@example.com",
    playlist: "CSS Grid & Flexbox",
    dueDate: "2026-02-10",
    amountPaid: "₹600",
    invoiceUrl: "#",
    status: "Active",
    videos: [
      { id: 1, title: "Flexbox Fundamentals", duration: "20:00" },
      { id: 2, title: "Grid Layout", duration: "25:30" },
      { id: 3, title: "Responsive Design", duration: "30:45" },
    ],
    progress: 50,
  },
  {
    id: 7,
    name: "David Miller",
    email: "david@example.com",
    playlist: "React Hooks Deep Dive",
    dueDate: "2025-12-25",
    amountPaid: "₹1100",
    invoiceUrl: "#",
    status: "Active",
    videos: [
      { id: 1, title: "useState Hook", duration: "15:20" },
      { id: 2, title: "useEffect Hook", duration: "22:40" },
      { id: 3, title: "Custom Hooks", duration: "28:15" },
      { id: 4, title: "useContext", duration: "18:30" },
    ],
    progress: 25,
  },
  {
    id: 8,
    name: "Lisa Anderson",
    email: "lisa@example.com",
    playlist: "Vue.js Essentials",
    dueDate: "2025-11-30",
    amountPaid: "₹700",
    invoiceUrl: "#",
    status: "Expired",
    videos: [
      { id: 1, title: "Vue Components", duration: "19:00" },
      { id: 2, title: "Vuex State Management", duration: "32:20" },
    ],
    progress: 90,
  },
  {
    id: 9,
    name: "Chris Wilson",
    email: "chris@example.com",
    playlist: "MongoDB Basics",
    dueDate: "2026-03-05",
    amountPaid: "₹950",
    invoiceUrl: "#",
    status: "Active",
    videos: [
      { id: 1, title: "Introduction to MongoDB", duration: "16:45" },
      { id: 2, title: "CRUD Operations", duration: "28:00" },
      { id: 3, title: "Aggregation", duration: "35:30" },
    ],
    progress: 40,
  },
  {
    id: 10,
    name: "Amy Taylor",
    email: "amy@example.com",
    playlist: "GraphQL Complete Guide",
    dueDate: "2025-12-30",
    amountPaid: "₹1300",
    invoiceUrl: "#",
    status: "Active",
    videos: [
      { id: 1, title: "GraphQL Basics", duration: "20:15" },
      { id: 2, title: "Queries and Mutations", duration: "25:40" },
      { id: 3, title: "Subscriptions", duration: "22:30" },
      { id: 4, title: "Schema Design", duration: "30:00" },
    ],
    progress: 55,
  },
  {
    id: 11,
    name: "Robert Garcia",
    email: "robert@example.com",
    playlist: "Docker Fundamentals",
    dueDate: "2025-11-25",
    amountPaid: "₹800",
    invoiceUrl: "#",
    status: "Expired",
    videos: [
      { id: 1, title: "Getting Started with Docker", duration: "18:00" },
      { id: 2, title: "Docker Compose", duration: "26:45" },
    ],
    progress: 75,
  },
  {
    id: 12,
    name: "Jessica Martinez",
    email: "jessica@example.com",
    playlist: "AWS Cloud Basics",
    dueDate: "2026-01-15",
    amountPaid: "₹1400",
    invoiceUrl: "#",
    status: "Active",
    videos: [
      { id: 1, title: "EC2 Instances", duration: "24:30" },
      { id: 2, title: "S3 Storage", duration: "20:15" },
      { id: 3, title: "Lambda Functions", duration: "28:40" },
      { id: 4, title: "RDS Databases", duration: "32:20" },
    ],
    progress: 35,
  },
];

export default function AdminDashboard() {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-background">
      <Sidebar 
        activeSection={activeSection} 
        setActiveSection={setActiveSection}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNavbar toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        
        <main className="flex-1 overflow-y-auto p-6">
          {activeSection === "dashboard" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold" data-testid="text-admin-dashboard-title">Admin Dashboard</h1>
                <p className="text-muted-foreground mt-1">Monitor and manage your learning platform</p>
              </div>
              
              <DashboardCards users={mockUsers} />
              
              <UserTable users={mockUsers} />
            </div>
          )}
          
          {activeSection === "users" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold" data-testid="text-users-title">Users Management</h1>
                <p className="text-muted-foreground mt-1">View and manage all users</p>
              </div>
              <UserTable users={mockUsers} />
            </div>
          )}
          
          {activeSection === "subscriptions" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold" data-testid="text-subscriptions-title">Subscriptions</h1>
                <p className="text-muted-foreground mt-1">Manage subscription plans and billing</p>
              </div>
              <div className="bg-card rounded-lg border p-8 text-center">
                <p className="text-muted-foreground">Subscriptions management coming soon...</p>
              </div>
            </div>
          )}
          
          {activeSection === "invoices" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold" data-testid="text-invoices-title">Invoices</h1>
                <p className="text-muted-foreground mt-1">View and download invoices</p>
              </div>
              <div className="bg-card rounded-lg border p-8 text-center">
                <p className="text-muted-foreground">Invoices management coming soon...</p>
              </div>
            </div>
          )}
          
          {activeSection === "settings" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold" data-testid="text-settings-title">Settings</h1>
                <p className="text-muted-foreground mt-1">Configure your admin preferences</p>
              </div>
              <div className="bg-card rounded-lg border p-8 text-center">
                <p className="text-muted-foreground">Settings panel coming soon...</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
