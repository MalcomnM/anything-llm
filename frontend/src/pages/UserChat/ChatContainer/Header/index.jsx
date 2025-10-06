import React, { useState, useEffect } from "react";
import { Brain, Gear } from "@phosphor-icons/react";
import System from "@/models/system";
import Workspace from "@/models/workspace";
import { useTranslation } from "react-i18next";

export default function UserChatHeader({ workspace }) {
  const { t } = useTranslation();
  const [currentModel, setCurrentModel] = useState("");
  const [currentProvider, setCurrentProvider] = useState("");

  useEffect(() => {
    async function fetchModelInfo() {
      if (!workspace) return;
      
      try {
        const systemSettings = await System.keys();
        const provider = workspace.chatProvider ?? systemSettings.LLMProvider;
        const model = workspace.chatModel ?? systemSettings.LLMModel;
        
        setCurrentProvider(provider || "Not configured");
        setCurrentModel(model || "Not configured");
      } catch (error) {
        console.error("Failed to fetch model info:", error);
        setCurrentProvider("Error loading");
        setCurrentModel("Error loading");
      }
    }
    
    fetchModelInfo();
  }, [workspace]);

  if (!workspace) {
    return (
      <div className="w-full h-16 bg-theme-bg-primary border-b border-theme-sidebar-border flex items-center justify-center">
        <span className="text-theme-text-secondary">Loading workspace...</span>
      </div>
    );
  }

  return (
    <div className="w-full h-16 bg-theme-bg-primary border-b border-theme-sidebar-border flex items-center justify-between px-6">
      {/* Workspace Info */}
      <div className="flex items-center gap-3">
        <div className="flex flex-col">
          <h1 className="text-lg font-semibold text-theme-text-primary">
            {workspace.name}
          </h1>
          <div className="flex items-center gap-2 text-sm text-theme-text-secondary">
            <Brain className="w-4 h-4" />
            <span>
              {currentProvider} {currentModel && `• ${currentModel}`}
            </span>
          </div>
        </div>
      </div>

      {/* Model Info Badge */}
      <div className="flex items-center gap-2 px-3 py-1 bg-theme-bg-secondary rounded-full border border-theme-sidebar-border">
        <Brain className="w-4 h-4 text-blue-400" />
        <span className="text-sm text-theme-text-primary font-medium">
          {currentProvider}
        </span>
        {currentModel && (
          <>
            <span className="text-theme-text-secondary">•</span>
            <span className="text-sm text-theme-text-secondary">
              {currentModel}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
