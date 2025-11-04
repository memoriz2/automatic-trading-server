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
import BacktestPage from "@/pages/backtest";
import { RecommendedStrategies } from "@/components/RecommendedStrategies";
import { useAuth } from "@/hooks/useAuth";
import { useActivityTracker } from "@/hooks/useActivityTracker";
import { useWebSocket } from "@/hooks/use-websocket";
import LegacyAutoTradingPage from "@/pages/legacy-auto-trading";
import { useEffect } from "react";
import { Provider } from "react-redux";
import { store } from "@/store";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  // 🔐 WebSocket 연결 (세션 무효화 알림 수신용)
  // 모든 페이지에서 WebSocket을 활성화하여 실시간 세션 무효화 메시지를 받을 수 있도록 함
  useWebSocket();

  // 활동 추적기 활성화 (로그인된 사용자만)
  useActivityTracker({
    interval: 30000, // 30초마다 하트비트
    debounceTime: 1000 // 1초 디바운스
  });

  // 인증 실패 이벤트 감지 - 인증 상태 클리어
  useEffect(() => {
    const handleAuthFailed = () => {
      console.log('🚨 auth-failed 이벤트 수신');

      // 세션스토리지에 사용자 정보가 있으면 무시 (로그인 직후)
      const storedUser = sessionStorage.getItem('user');
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          if (parsed && parsed.id) {
            return;
          }
        } catch {}
      }

      // 세션 스토리지 정리
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('authToken');
      localStorage.removeItem('authToken');

      // 로그인 페이지로 리다이렉트 (토스트는 useWebSocket에서 이미 표시됨)
      // 루트 경로로 이동하면 !isAuthenticated 조건에 의해 자동으로 LoginPage 표시됨
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    };

    window.addEventListener('auth-failed', handleAuthFailed);
    return () => {
      window.removeEventListener('auth-failed', handleAuthFailed);
    };
  }, []);

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
    return <LoginPage />;
  }

  // 인증된 사용자는 메인 앱 UI
  return (
    <div className="flex h-screen overflow-hidden bg-slate-950">
      <Sidebar />
      <main className="flex-1 overflow-auto lg:ml-0">
        <div className="lg:hidden h-16"></div> {/* 모바일에서 햄버거 버튼 공간 확보 */}
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/legacy-auto-trading" component={LegacyAutoTradingPage} />
          <Route path="/auto-trading" component={AutoTrading} />
          <Route path="/ultra-trading" component={UltraTrading} />
          <Route path="/trading" component={Trading} />
          <Route path="/history" component={History} />
          <Route path="/settings" component={Settings} />
          <Route path="/admin" component={AdminPage} />
          <Route path="/backtest" component={BacktestPage} />
          <Route path="/recommended-strategies" component={RecommendedStrategies} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </Provider>
  );
}

export default App;
