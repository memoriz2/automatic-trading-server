import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  ArrowLeftRight,
  History,
  TrendingUp,
  Shield,
  Settings,
  User,
  Activity,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

const navigation = [
  { name: "대시보드", href: "/", icon: BarChart3 },
  { name: "자동매매", href: "/legacy-auto-trading", icon: Activity },
  { name: "실시간 거래", href: "/trading", icon: ArrowLeftRight },
  { name: "거래 내역", href: "/history", icon: History },
  { name: "백테스트", href: "/backtest", icon: TrendingUp },
  { name: "설정", href: "/settings", icon: Settings },
];

const adminNavigation = [{ name: "관리자", href: "/admin", icon: User }];

export function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // 모바일 메뉴 토글
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // 화면 크기 변경 시 모바일 메뉴 닫기
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 링크 클릭 시 모바일 메뉴 닫기
  const handleLinkClick = () => {
    setIsMobileMenuOpen(false);
  };

  const handleLogout = () => {
    console.log("로그아웃 버튼 클릭됨");

    // 강제로 localStorage 정리
    localStorage.clear();

    logout();

    toast({
      title: "로그아웃",
      description: "안전하게 로그아웃되었습니다",
    });

    // 즉시 로그인 페이지로 이동 - 더 확실하게
    setTimeout(() => {
      console.log("페이지 새로고침 실행");
      window.location.href = "/";
    }, 500);
  };

  return (
    <>
      {/* 모바일 햄버거 버튼 */}
      <button
        onClick={toggleMobileMenu}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-slate-900 text-white rounded-lg border border-slate-700 hover:bg-slate-800 transition-colors"
        aria-label="메뉴 열기"
      >
        {isMobileMenuOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <Menu className="w-6 h-6" />
        )}
      </button>

      {/* 모바일 오버레이 */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black bg-opacity-50"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* 사이드바 */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-700 transform transition-transform duration-300 ease-in-out lg:static lg:inset-0 lg:translate-x-0",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center px-6 py-4 border-b border-slate-700">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-white" />
              </div>
              <h1 className="ml-3 text-lg font-bold text-white">김프 자동매매</h1>
            </div>
          </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navigation.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;

            return (
              <Link key={item.name} href={item.href}>
                <a
                  onClick={handleLinkClick}
                  className={cn(
                    "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                    isActive
                      ? "text-white bg-slate-800"
                      : "text-slate-400 hover:text-white hover:bg-slate-800"
                  )}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.name}
                </a>
              </Link>
            );
          })}

          {/* 관리자 메뉴 (관리자만 표시) */}
          {(user as any)?.role === "admin" && (
            <>
              <div className="my-4 border-t border-slate-700"></div>
              {adminNavigation.map((item) => {
                const isActive = location === item.href;
                const Icon = item.icon;

                return (
                  <Link key={item.name} href={item.href}>
                    <a
                      onClick={handleLinkClick}
                      className={cn(
                        "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                        isActive
                          ? "text-white bg-slate-800"
                          : "text-slate-400 hover:text-white hover:bg-slate-800"
                      )}
                    >
                      <Icon className="w-5 h-5 mr-3" />
                      {item.name}
                    </a>
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        {/* User Profile */}
        <div className="px-4 py-4 border-t border-slate-700 space-y-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-white">
                {user?.username || "트레이더"}
              </p>
              <p className="text-xs text-emerald-400">🔒 보안 연결</p>
            </div>
          </div>

          {/* 로그아웃 버튼 */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center px-3 py-2 text-sm font-medium text-slate-400 border border-slate-600 rounded-md hover:text-white hover:bg-slate-700 transition-colors"
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4 mr-2" />
            로그아웃
          </button>
        </div>
        </div>
      </div>
    </>
  );
}
