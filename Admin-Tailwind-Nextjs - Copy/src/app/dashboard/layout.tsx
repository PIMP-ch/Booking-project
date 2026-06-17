"use client";
import React from "react";
import Sidebar from "./layout/vertical/sidebar/Sidebar";
import Header from "./layout/vertical/header/Header";
import { SidebarProvider, useSidebar } from "./layout/vertical/sidebar/useSidebar";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarProvider>
      <LayoutInner>{children}</LayoutInner>
    </SidebarProvider>
  );
}

function LayoutInner({ children }: { children: React.ReactNode }) {
  const { open } = useSidebar();
  return (
    <div
      className="flex w-full min-h-screen bg-transparent"
      data-sidebar-type={open ? "mini-sidebar" : undefined}
    >
      <Sidebar />
      {/* spacer หาย-ปรากฏตาม sidebar */}
      <div className={`hidden xl:block shrink-0 transition-all duration-200 ${open ? "w-0" : "w-72"}`} />
      <div className="w-full">
        <Header />
        {/* Body Content */}
        <div className="container mx-auto py-30">
          {children}
        </div>
        <ToastContainer position="top-right" autoClose={3000} />
      </div>
    </div>
  );
}
