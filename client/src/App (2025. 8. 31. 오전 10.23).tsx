import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar } from "@/components/sidebar";
import Dashboard from "@/pages/dashboard";
import AutoTrading from "@/pages/auto-trading";
import UltraTrading from "@/pages/ultra-trading";
import Trading from "@/pages/trading";
import History from "@/pages/history";
import Settings from "@/pages/settings";
import LoginPage from "@/pages/login";
import AdminPage from "@/pages/admin";
import NotFound from "@/pages/not-found";
import { useAuth } from "@/hooks/useAuth";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();

  // 디버깅용 로그
  console.log("App Router 상태:", { isAuthenticated, isLoading, user });

  // 로딩 중 표시
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p>인증 상태 확인 중...</p>
        </div>
      </div>
    );
  }

  // 로그인하지 않은 사용자는 로그인 페이지로
  if (!isAuthenticated) {
    console.log("인증되지 않음, 로그인 페이지 표시");
    return <LoginPage />;
  }

  // 인증된 사용자는 메인 앱 UI
  return (
    <div className="flex h-screen overflow-hidden bg-slate-950">
      <Sidebar />
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/auto-trading" component={AutoTrading} />
        <Route path="/ultra-trading" component={UltraTrading} />
        <Route path="/trading" component={Trading} />
        <Route path="/history" component={History} />
        <Route path="/settings" component={Settings} />
        <Route path="/admin" component={AdminPage} />
        <Route component={NotFound} />
      </Switch>
    </div>
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
