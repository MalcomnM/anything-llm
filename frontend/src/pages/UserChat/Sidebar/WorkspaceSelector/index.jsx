import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CaretDown, Gear, SquaresFour } from "@phosphor-icons/react";
import paths from "@/utils/paths";
import { useTranslation } from "react-i18next";

export default function WorkspaceSelector({ workspaces, currentWorkspace }) {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const handleWorkspaceChange = (workspace) => {
    if (workspace.slug !== slug) {
      navigate(paths.chat.workspace(workspace.slug));
    }
    setIsOpen(false);
  };

  if (!workspaces || workspaces.length === 0) {
    return (
      <div className="w-full p-3 bg-theme-bg-secondary rounded-lg border border-theme-sidebar-border">
        <div className="flex items-center gap-2 text-theme-text-secondary">
          <SquaresFour className="w-5 h-5" />
          <span className="text-sm">No workspaces available</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-3 bg-theme-bg-secondary rounded-lg border border-theme-sidebar-border hover:bg-theme-bg-primary transition-colors duration-200 flex items-center justify-between"
      >
        <div className="flex items-center gap-2 flex-grow min-w-0">
          <SquaresFour className="w-5 h-5 text-theme-text-primary flex-shrink-0" />
          <div className="flex flex-col items-start min-w-0 flex-grow">
            <span className="text-sm font-medium text-theme-text-primary truncate w-full">
              {currentWorkspace?.name || "Select Workspace"}
            </span>
            {currentWorkspace && (
              <span className="text-xs text-theme-text-secondary truncate w-full">
                {currentWorkspace.slug}
              </span>
            )}
          </div>
        </div>
        <CaretDown 
          className={`w-4 h-4 text-theme-text-secondary transition-transform duration-200 flex-shrink-0 ${
            isOpen ? "rotate-180" : ""
          }`} 
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-theme-bg-secondary border border-theme-sidebar-border rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
          {workspaces.map((workspace) => (
            <button
              key={workspace.id}
              onClick={() => handleWorkspaceChange(workspace)}
              className={`w-full p-3 text-left hover:bg-theme-bg-primary transition-colors duration-200 flex items-center gap-2 ${
                workspace.slug === slug ? "bg-theme-bg-primary" : ""
              }`}
            >
              <SquaresFour className="w-4 h-4 text-theme-text-secondary flex-shrink-0" />
              <div className="flex flex-col min-w-0 flex-grow">
                <span className="text-sm font-medium text-theme-text-primary truncate">
                  {workspace.name}
                </span>
                <span className="text-xs text-theme-text-secondary truncate">
                  {workspace.slug}
                </span>
              </div>
              {workspace.slug === slug && (
                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
