import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Plus, ChatCircle, Trash, DotsThree } from "@phosphor-icons/react";
import Workspace from "@/models/workspace";
import paths from "@/utils/paths";
import showToast from "@/utils/toast";
import { useTranslation } from "react-i18next";

export default function ChatHistory({ workspace, threadSlug }) {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchThreads() {
      if (!workspace?.slug) {
        setLoading(false);
        return;
      }
      
      try {
        const { threads } = await Workspace.threads.all(workspace.slug);
        setThreads(threads || []);
      } catch (error) {
        console.error("Failed to fetch threads:", error);
        setThreads([]);
      }
      setLoading(false);
    }
    fetchThreads();
  }, [workspace?.slug]);

  const createNewThread = async () => {
    if (!workspace?.slug) return;
    
    try {
      const { thread, error } = await Workspace.threads.new(workspace.slug);
      if (error) {
        showToast(`Could not create thread - ${error}`, "error", { clear: true });
        return;
      }
      navigate(paths.chat.thread(workspace.slug, thread.slug));
    } catch (error) {
      showToast("Failed to create new thread", "error", { clear: true });
    }
  };

  const deleteThread = async (thread) => {
    if (!workspace?.slug || !thread.slug) return;
    
    try {
      await Workspace.threads.delete(workspace.slug, thread.slug);
      setThreads(prev => prev.filter(t => t.slug !== thread.slug));
      
      // If we're currently in the deleted thread, navigate to main chat
      if (threadSlug === thread.slug) {
        navigate(paths.chat.workspace(workspace.slug));
      }
      
      showToast("Thread deleted successfully", "success", { clear: true });
    } catch (error) {
      showToast("Failed to delete thread", "error", { clear: true });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col space-y-2">
        <div className="h-4 bg-theme-bg-secondary rounded animate-pulse"></div>
        <div className="h-4 bg-theme-bg-secondary rounded animate-pulse"></div>
        <div className="h-4 bg-theme-bg-secondary rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-theme-text-primary">
          Chat History
        </h3>
        <button
          onClick={createNewThread}
          className="p-1 rounded hover:bg-theme-bg-primary transition-colors duration-200"
          title="New Chat"
        >
          <Plus className="w-4 h-4 text-theme-text-secondary" />
        </button>
      </div>

      {/* Thread List */}
      <div className="flex-grow overflow-y-auto space-y-1">
        {/* Default/Main Chat */}
        <ThreadItem
          thread={{ slug: null, name: "Main Chat" }}
          isActive={!threadSlug}
          workspace={workspace}
          onDelete={null} // Can't delete main chat
        />

        {/* Individual Threads */}
        {threads.map((thread) => (
          <ThreadItem
            key={thread.slug}
            thread={thread}
            isActive={threadSlug === thread.slug}
            workspace={workspace}
            onDelete={() => deleteThread(thread)}
          />
        ))}

        {threads.length === 0 && (
          <div className="text-center py-8 text-theme-text-secondary">
            <ChatCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No chat history yet</p>
            <p className="text-xs">Start a conversation to see it here</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ThreadItem({ thread, isActive, workspace, onDelete }) {
  const navigate = useNavigate();
  const [showOptions, setShowOptions] = useState(false);

  const handleClick = () => {
    if (!workspace?.slug) return;
    
    const path = thread.slug 
      ? paths.chat.thread(workspace.slug, thread.slug)
      : paths.chat.workspace(workspace.slug);
    
    navigate(path);
  };

  return (
    <div className="relative group">
      <button
        onClick={handleClick}
        className={`w-full p-2 rounded-lg text-left transition-colors duration-200 flex items-center gap-2 ${
          isActive 
            ? "bg-theme-bg-primary text-theme-text-primary" 
            : "hover:bg-theme-bg-secondary text-theme-text-secondary hover:text-theme-text-primary"
        }`}
      >
        <ChatCircle className="w-4 h-4 flex-shrink-0" />
        <span className="text-sm truncate flex-grow">
          {thread.name || "Untitled Chat"}
        </span>
        
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowOptions(!showOptions);
            }}
            className={`p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-theme-bg-primary ${
              showOptions ? "opacity-100" : ""
            }`}
          >
            <DotsThree className="w-3 h-3" />
          </button>
        )}
      </button>

      {/* Options Menu */}
      {showOptions && onDelete && (
        <div className="absolute right-0 top-full mt-1 bg-theme-bg-secondary border border-theme-sidebar-border rounded-lg shadow-lg z-50 min-w-[120px]">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
              setShowOptions(false);
            }}
            className="w-full p-2 text-left hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors duration-200 flex items-center gap-2 text-sm"
          >
            <Trash className="w-3 h-3" />
            Delete
          </button>
        </div>
      )}

      {/* Click outside to close options */}
      {showOptions && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowOptions(false)}
        />
      )}
    </div>
  );
}
