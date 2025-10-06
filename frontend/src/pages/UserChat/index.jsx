import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { isMobile } from "react-device-detect";
import Workspace from "@/models/workspace";
import PasswordModal, { usePasswordModal } from "@/components/Modals/Password";
import { FullScreenLoader } from "@/components/Preloader";
import UserChatSidebar from "./Sidebar";
import UserChatContainer from "./ChatContainer";
import paths from "@/utils/paths";
import useUser from "@/hooks/useUser";

export default function UserChat() {
  const { loading, requiresAuth, mode } = usePasswordModal();
  const { user } = useUser();
  const navigate = useNavigate();

  // Redirect admin users to the main interface
  useEffect(() => {
    if (user && user.role === "admin") {
      navigate(paths.home());
    }
  }, [user, navigate]);

  if (loading) return <FullScreenLoader />;
  if (requiresAuth !== false) {
    return <>{requiresAuth !== null && <PasswordModal mode={mode} />}</>;
  }

  return <ShowUserChat />;
}

function ShowUserChat() {
  const { slug, threadSlug } = useParams();
  const [workspace, setWorkspace] = useState(null);
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasRedirected, setHasRedirected] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function getWorkspaces() {
      try {
        const allWorkspaces = await Workspace.all();
        setWorkspaces(allWorkspaces);
        
        // If no workspace is selected and we have workspaces, redirect to the first one
        if (!slug && allWorkspaces.length > 0 && !hasRedirected) {
          setHasRedirected(true);
          navigate(paths.chat.workspace(allWorkspaces[0].slug), { replace: true });
          return;
        }

        // If we have a slug, load the specific workspace
        if (slug) {
          const _workspace = await Workspace.bySlug(slug);
          if (!_workspace) {
            console.error(`Workspace with slug "${slug}" not found`);
            setLoading(false);
            return;
          }
          
          try {
            const suggestedMessages = await Workspace.getSuggestedMessages(slug);
            const pfpUrl = await Workspace.fetchPfp(slug);
            setWorkspace({
              ..._workspace,
              suggestedMessages,
              pfpUrl,
            });
          } catch (error) {
            console.error("Error loading workspace details:", error);
            // Still set the workspace even if additional data fails
            setWorkspace(_workspace);
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error loading workspaces:", error);
        setLoading(false);
      }
    }
    getWorkspaces();
  }, [slug, navigate, hasRedirected]);

  // Show loading screen while fetching data
  if (loading) {
    return <FullScreenLoader />;
  }

  // Show message if no workspaces exist
  if (workspaces.length === 0) {
    return (
      <div className="w-screen h-screen overflow-hidden bg-theme-bg-container flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-theme-text-primary mb-4">
            No Workspaces Available
          </h1>
          <p className="text-theme-text-secondary">
            Please contact your administrator to create a workspace.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen overflow-hidden bg-theme-bg-container flex">
      {!isMobile && (
        <UserChatSidebar 
          workspaces={workspaces}
          currentWorkspace={workspace}
          threadSlug={threadSlug}
        />
      )}
      <UserChatContainer 
        loading={false} 
        workspace={workspace} 
        workspaces={workspaces}
        isMobile={isMobile}
      />
    </div>
  );
}
