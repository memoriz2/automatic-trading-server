import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Shield, Lock, User, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
// import { apiRequest } from '@/lib/queryClient'; // fetch로 대체
import { useLocation } from 'wouter';

interface AuthForm {
  username: string;
  password: string;
}

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [loginForm, setLoginForm] = useState<AuthForm>({ username: '', password: '' });
  const [registerForm, setRegisterForm] = useState<AuthForm>({ username: '', password: '' });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log('로그인 시도:', loginForm);
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(loginForm),
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });

      const data = await response.json();
      console.log('로그인 응답:', data);

      if (!response.ok) {
        throw new Error(data.message || '로그인에 실패했습니다');
      }

      // 쿠키 기반 인증: 서버가 HttpOnly 쿠키를 설정하므로 토큰 없이 사용자만 갱신
      if (data.user) {
        login(data.user, undefined as any);
        toast({
          title: "로그인 성공",
          description: `${data.user.username}님, 환영합니다!`,
        });
        setTimeout(() => {
          setLocation('/');
          window.location.reload();
        }, 100);
      }
    } catch (error: any) {
      console.error('로그인 오류:', error);
      toast({
        title: "로그인 실패",
        description: error.message || "로그인 중 오류가 발생했습니다",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(registerForm),
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '회원가입에 실패했습니다');
      }

      if (data.user) {
        login(data.user, undefined as any);
        toast({
          title: "회원가입 성공",
          description: `${data.user.username}님, 환영합니다! 계정이 생성되었습니다.`,
        });
        setLocation('/');
      }
    } catch (error: any) {
      console.error('회원가입 오류:', error);
      toast({
        title: "회원가입 실패",
        description: error.message || "회원가입 중 오류가 발생했습니다",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* 로고 및 제목 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-600 rounded-xl mb-4">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">김치프리미엄 거래</h1>
          <p className="text-slate-400">보안 강화된 자동매매 시스템</p>
        </div>

        {/* 보안 알림 */}
        <Alert className="mb-6 border-emerald-500 bg-emerald-50 dark:bg-emerald-950">
          <AlertCircle className="h-4 w-4 text-emerald-600" />
          <AlertDescription className="text-emerald-700 dark:text-emerald-300">
            모든 API 키와 비밀번호는 암호화되어 안전하게 저장됩니다
          </AlertDescription>
        </Alert>

        <Card className="border-slate-700">
          <CardHeader>
            <CardTitle className="text-center">계정 접속</CardTitle>
            <CardDescription className="text-center">
              기존 계정으로 로그인하거나 새 계정을 만드세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">로그인</TabsTrigger>
                <TabsTrigger value="register">회원가입</TabsTrigger>
              </TabsList>

              {/* 로그인 탭 */}
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-username" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      사용자명
                    </Label>
                    <Input
                      id="login-username"
                      type="text"
                      placeholder="사용자명을 입력하세요"
                      value={loginForm.username}
                      onChange={(e) => setLoginForm(prev => ({ ...prev, username: e.target.value }))}
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      비밀번호
                    </Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="비밀번호를 입력하세요"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? '로그인 중...' : '로그인'}
                  </Button>
                </form>
              </TabsContent>

              {/* 회원가입 탭 */}
              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-username" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      사용자명
                    </Label>
                    <Input
                      id="register-username"
                      type="text"
                      placeholder="3-20자, 영문/숫자/언더스코어만 가능"
                      value={registerForm.username}
                      onChange={(e) => setRegisterForm(prev => ({ ...prev, username: e.target.value }))}
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password" className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      비밀번호
                    </Label>
                    <Input
                      id="register-password"
                      type="password"
                      placeholder="최소 8자, 대소문자+숫자 포함"
                      value={registerForm.password}
                      onChange={(e) => setRegisterForm(prev => ({ ...prev, password: e.target.value }))}
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div className="text-sm text-slate-500 space-y-1">
                    <p>비밀번호 요구사항:</p>
                    <ul className="list-disc list-inside text-xs space-y-1 ml-2">
                      <li>최소 8자 이상</li>
                      <li>대문자 포함</li>
                      <li>소문자 포함</li>
                      <li>숫자 포함</li>
                    </ul>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? '계정 생성 중...' : '계정 생성'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* 보안 정보 */}
        <div className="mt-8 text-center text-sm text-slate-400">
          <p className="mb-2">🔒 모든 데이터는 암호화되어 보호됩니다</p>
          <p>🔑 API 키는 AES 암호화로 안전하게 저장됩니다</p>
        </div>
      </div>
    </div>
  );
}