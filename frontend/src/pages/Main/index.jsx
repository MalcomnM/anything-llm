import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PasswordModal, { usePasswordModal } from "@/components/Modals/Password";
import { FullScreenLoader } from "@/components/Preloader";
import Home from "./Home";
import DefaultChatContainer from "@/components/DefaultChat";
import { isMobile } from "react-device-detect";
import Sidebar, { SidebarMobileHeader } from "@/components/Sidebar";
import { userFromStorage } from "@/utils/request";
import paths from "@/utils/paths";

export default function Main() {
  const { loading, requiresAuth, mode } = usePasswordModal();
  const navigate = useNavigate();

  useEffect(() => {
    const user = userFromStorage();
    // Redirect non-admin users to the new chat interface
    if (!!user && user?.role !== "admin") {
      navigate(paths.chat.home());
    }
  }, [navigate]);

  if (loading) return <FullScreenLoader />;
  if (requiresAuth !== false)
    return <>{requiresAuth !== null && <PasswordModal mode={mode} />}</>;

  const user = userFromStorage();
  
  // Non-admin users should be redirected, but show loading while redirecting
  if (!!user && user?.role !== "admin") {
    return <FullScreenLoader />;
  }

  return (
    <div className="w-screen h-screen overflow-hidden bg-theme-bg-container flex">
      {!isMobile ? <Sidebar /> : <SidebarMobileHeader />}
      <Home />
    </div>
  );
}
