import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { List, Plus, Brain } from "@phosphor-icons/react";
import useLogo from "@/hooks/useLogo";
import useUser from "@/hooks/useUser";
import Workspace from "@/models/workspace";
import paths from "@/utils/paths";
import { useTranslation } from "react-i18next";
import WorkspaceSelector from "./WorkspaceSelector";
import ChatHistory from "./ChatHistory";

export default function UserChatSidebar({ workspaces, currentWorkspace, threadSlug }) {
  const { user } = useUser();
  const { logo } = useLogo();
  const { t } = useTranslation();
  const [showSidebar, setShowSidebar] = useState(true);

  return (
    <>
      <div
        style={{
          width: showSidebar ? "320px" : "0px",
          paddingLeft: showSidebar ? "0px" : "16px",
        }}
        className="transition-all duration-500"
      >
        <div
          className="relative rounded-[16px] bg-theme-bg-sidebar border-[2px] border-theme-sidebar-border light:border-none min-w-[300px] p-[16px] h-full"
        >
          <div className="flex flex-col h-full overflow-x-hidden">
            {/* Header with Logo */}
            <div className="flex shrink-0 w-full justify-center mb-4">
              <img
                src={logo}
                alt="Logo"
                className="rounded max-h-[32px] object-contain"
              />
            </div>

            {/* Workspace Selector */}
            <div className="mb-4">
              <WorkspaceSelector 
                workspaces={workspaces}
                currentWorkspace={currentWorkspace}
              />
            </div>

            {/* Chat History */}
            <div className="flex-grow flex flex-col min-h-0">
              <div className="flex-grow overflow-y-auto">
                <ChatHistory 
                  workspace={currentWorkspace}
                  threadSlug={threadSlug}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-theme-sidebar-border">
              <div className="flex items-center justify-between text-xs text-theme-text-secondary">
                <span>User: {user?.username || 'Guest'}</span>
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4" />
                  <span>AI Chat</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export function UserChatSidebarMobile({ workspaces, currentWorkspace, threadSlug }) {
  const { logo } = useLogo();
  const sidebarRef = useRef(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showBgOverlay, setShowBgOverlay] = useState(false);
  const { user } = useUser();
  const { t } = useTranslation();

  useEffect(() => {
    function handleBg() {
      if (showSidebar) {
        setTimeout(() => {
          setShowBgOverlay(true);
        }, 300);
      } else {
        setShowBgOverlay(false);
      }
    }
    handleBg();
  }, [showSidebar]);

  return (
    <>
      <div
        aria-label="Show sidebar"
        className="fixed top-0 left-0 right-0 z-10 flex justify-between items-center px-4 py-2 bg-theme-bg-sidebar light:bg-white text-slate-200 shadow-lg h-16"
      >
        <button
          onClick={() => setShowSidebar(true)}
          className="rounded-md p-2 flex items-center justify-center text-theme-text-secondary"
        >
          <List className="h-6 w-6" />
        </button>
        <div className="flex items-center justify-center flex-grow">
          <img
            src={logo}
            alt="Logo"
            className="block mx-auto h-6 w-auto"
            style={{ maxHeight: "40px", objectFit: "contain" }}
          />
        </div>
        <div className="w-12"></div>
      </div>
      <div
        style={{
          transform: showSidebar ? `translateX(0vw)` : `translateX(-100vw)`,
        }}
        className={`z-99 fixed top-0 left-0 transition-all duration-500 w-[100vw] h-[100vh]`}
      >
        <div
          className={`${
            showBgOverlay
              ? "transition-all opacity-1"
              : "transition-none opacity-0"
          }  duration-500 fixed top-0 left-0 bg-theme-bg-secondary bg-opacity-75 w-screen h-screen`}
          onClick={() => setShowSidebar(false)}
        />
        <div
          ref={sidebarRef}
          className="relative h-[100vh] fixed top-0 left-0 rounded-r-[26px] bg-theme-bg-sidebar w-[80%] p-[18px]"
        >
          <div className="w-full h-full flex flex-col overflow-x-hidden items-between">
            {/* Header Information */}
            <div className="flex w-full items-center justify-between gap-x-4 mb-4">
              <div className="flex shrink-1 w-fit items-center justify-start">
                <img
                  src={logo}
                  alt="Logo"
                  className="rounded w-full max-h-[40px]"
                  style={{ objectFit: "contain" }}
                />
              </div>
            </div>

            {/* Workspace Selector */}
            <div className="mb-4">
              <WorkspaceSelector 
                workspaces={workspaces}
                currentWorkspace={currentWorkspace}
              />
            </div>

            {/* Chat History */}
            <div className="flex-grow flex flex-col min-h-0">
              <div className="flex-grow overflow-y-auto">
                <ChatHistory 
                  workspace={currentWorkspace}
                  threadSlug={threadSlug}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-theme-sidebar-border">
              <div className="flex items-center justify-between text-xs text-theme-text-secondary">
                <span>User: {user?.username || 'Guest'}</span>
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4" />
                  <span>AI Chat</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
