import React, { useEffect, useState } from "react";
import Workspace from "@/models/workspace";
import LoadingChat from "@/components/WorkspaceChat/LoadingChat";
import ChatContainer from "@/components/WorkspaceChat/ChatContainer";
import { UserChatSidebarMobile } from "../Sidebar";
import { DnDFileUploaderProvider } from "@/components/WorkspaceChat/ChatContainer/DnDWrapper";
import { WarningCircle } from "@phosphor-icons/react";
import {
  TTSProvider,
  useWatchForAutoPlayAssistantTTSResponse,
} from "@/components/contexts/TTSProvider";
import UserChatHeader from "./Header";

export default function UserChatContainer({ loading, workspace, workspaces, isMobile }) {
  useWatchForAutoPlayAssistantTTSResponse();
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    async function getHistory() {
      if (loading) return;
      if (!workspace?.slug) {
        setLoadingHistory(false);
        return false;
      }

      const chatHistory = await Workspace.chatHistory(workspace.slug);
      setHistory(chatHistory);
      setLoadingHistory(false);
    }
    getHistory();
  }, [workspace, loading]);

  if (loadingHistory) return <LoadingChat />;
  if (!loading && !loadingHistory && !workspace) {
    return (
      <div className="w-full h-full flex items-center justify-center flex-col gap-y-2">
        <WarningCircle className="h-16 w-16 text-red-400" />
        <p className="text-red-400 text-lg">
          Workspace not found.
        </p>
      </div>
    );
  }

  return (
    <TTSProvider>
      <DnDFileUploaderProvider>
        <div className="flex flex-col w-full h-full bg-theme-bg-secondary">
          {isMobile && (
            <UserChatSidebarMobile 
              workspaces={workspaces}
              currentWorkspace={workspace}
            />
          )}
          
          {/* Header with workspace/model selector */}
          <UserChatHeader workspace={workspace} />
          
          {/* Chat Container */}
          <div className="flex-grow overflow-hidden">
            <ChatContainer
              workspace={workspace}
              knownHistory={history}
            />
          </div>
        </div>
      </DnDFileUploaderProvider>
    </TTSProvider>
  );
}
