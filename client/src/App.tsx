import { Switch, Route, useLocation } from "wouter";
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
import { useAuth } from "@/hooks/useAuth";
import { useActivityTracker } from "@/hooks/useActivityTracker";
import LegacyAutoTradingPage from "@/pages/legacy-auto-trading";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { Provider } from "react-redux";
import { store } from "@/store";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [, navigate] = useLocation();
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [countdown, setCountdown] = useState(30);

  // 활동 추적기 활성화 (로그인된 사용자만)
  useActivityTracker({
    interval: 30000, // 30초마다 하트비트
    debounceTime: 1000 // 1초 디바운스
  });

  // 인증 실패 이벤트 감지 - 모달 표시
  useEffect(() => {
    const handleAuthFailed = () => {
      // 로그인 페이지면 무시
      if (window.location.pathname === '/login') {
        return;
      }

      // Redux 상태에서 직접 확인
      const state = store.getState();
      if (state.auth.isAuthenticated && state.auth.user) {
        return;
      }

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

      // 인증 상태 강제 업데이트
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('authToken');
      localStorage.removeItem('authToken');

      setShowSessionModal(true);
      setCountdown(30);
    };

    window.addEventListener('auth-failed', handleAuthFailed);
    return () => window.removeEventListener('auth-failed', handleAuthFailed);
  }, []);

  // 30초 카운트다운 및 자동 이동
  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (showSessionModal && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (showSessionModal && countdown === 0) {
      // 카운트다운이 0이 되면 자동으로 로그인 페이지로 이동
      setShowSessionModal(false);
      navigate('/login');
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [showSessionModal, countdown, navigate]);

  // 세션 만료 모달 확인 버튼 클릭
  const handleSessionModalConfirm = () => {
    setShowSessionModal(false);
    navigate('/login');
  };

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
    <>
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
            <Route component={NotFound} />
          </Switch>
        </main>
      </div>

      {/* 세션 만료 모달 */}
      <Dialog open={false} onOpenChange={setShowSessionModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-600">
              <AlertCircle className="h-5 w-5" />
              세션이 만료되었습니다
            </DialogTitle>
            <DialogDescription className="text-slate-600">
              24시간 세션이 만료되어 자동으로 로그아웃되었습니다.
              다시 로그인해주세요.
            </DialogDescription>
          </DialogHeader>
          <div className="text-center mt-4 mb-4">
            <p className="text-sm text-slate-500">
              {countdown}초 후 자동으로 로그인 페이지로 이동합니다
            </p>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSessionModalConfirm} className="w-full">
              로그인 페이지로 이동
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
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
