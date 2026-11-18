"use client";

import React from "react";
import Sidebar from "./Sidebar";
import TopNavbar from "./TopNavbar";
import AccessGate from "./AccessGate";
import WorkspaceProvider from "@/components/WorkspaceProvider";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AccessGate>
      <WorkspaceProvider>
        <div className="flex h-screen overflow-hidden bg-bg-primary app-shell">
          {/* Sidebar */}
          <Sidebar />

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {/* Top Navbar */}
            <TopNavbar />

            {/* Page Content */}
            <main className="flex-1 overflow-y-auto overflow-x-hidden">
              <div className="relative min-h-full grid-pattern noise-overlay">
                <div className="relative z-10 p-4 md:p-7 max-w-[1800px] mx-auto">
                  {children}
                </div>
              </div>
            </main>
          </div>
        </div>
      </WorkspaceProvider>
    </AccessGate>
  );
}
