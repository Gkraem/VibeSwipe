import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import AuthPage from "@/pages/AuthPage";
import Home from "@/pages/Home";
import SettingsPage from "@/pages/SettingsPage";
import AdminPanel from "@/pages/AdminPanel";
import PlaylistsPage from "@/pages/PlaylistsPage";


function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isAuthenticated ? (
        <>
          <Route path="/" component={Home} />
          <Route path="/playlists" component={PlaylistsPage} />
          <Route path="/settings" component={SettingsPage} />
          <Route path="/admin" component={AdminPanel} />
          <Route path="/auth" component={() => { window.location.href = '/'; return null; }} />
        </>
      ) : (
        <>
          <Route path="/" component={Landing} />
          <Route path="/auth" component={AuthPage} />
        </>
      )}

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
