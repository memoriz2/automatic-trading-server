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
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const navigation = [
  { name: "대시보드", href: "/", icon: BarChart3 },
  { name: "자동매매", href: "/auto-trading", icon: Activity },
  { name: "실시간 거래", href: "/trading", icon: ArrowLeftRight },
  { name: "거래 내역", href: "/history", icon: History },
  { name: "백테스팅", href: "/backtest", icon: TrendingUp },
  { name: "리스크 관리", href: "/risk", icon: Shield },
  { name: "설정", href: "/settings", icon: Settings },
];

const adminNavigation = [{ name: "관리자", href: "/admin", icon: User }];

export function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { toast } = useToast();

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
    <div className="fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-700 lg:static lg:inset-0">
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
  );
}
