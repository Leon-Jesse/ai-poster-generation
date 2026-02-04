import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/store/useAuthStore';
import { Loader2 } from 'lucide-react';

export default function Register() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [verifyToken, setVerifyToken] = useState(''); // Token received after sending code
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState('');

  const handleSendCode = async () => {
    if (!email) {
      setError('Please enter your email first.');
      return;
    }
    setError('');
    setIsSendingCode(true);
    try {
      const res = await authService.sendCode(email, 'register');
      if (res.code === 0 && res.data.token) {
        setVerifyToken(res.data.token);
        // Start countdown
        setCountdown(60);
        const interval = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(interval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setError(res.message || 'Failed to send verification code.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send verification code.');
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !code || !verifyToken) {
      setError('Please fill in all fields and ensure verification code is sent.');
      return;
    }
    
    setError('');
    setIsLoading(true);

    try {
      const res = await authService.register(email, password, code, verifyToken);
      if (res.code === 0 && res.data.token && res.data.user) {
        login(res.data.token, res.data.user);
        navigate('/');
      } else {
        setError(res.message || 'Registration failed.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Create an account</h1>
          <p className="text-sm text-muted-foreground">
            Enter your email below to create your account
          </p>
        </div>

        <div className="grid gap-6">
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  placeholder="name@example.com"
                  type="email"
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect="off"
                  disabled={isLoading}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="code">Verification Code</Label>
                <div className="flex gap-2">
                    <Input 
                        id="code" 
                        placeholder="123456" 
                        type="text" 
                        disabled={isLoading}
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                    />
                    <Button 
                        type="button" 
                        variant="outline" 
                        disabled={isLoading || isSendingCode || countdown > 0}
                        onClick={handleSendCode}
                        className="w-[140px]"
                    >
                        {isSendingCode ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : countdown > 0 ? (
                            `${countdown}s`
                        ) : (
                            "Send Code"
                        )}
                    </Button>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  placeholder="Enter your password"
                  type="password"
                  disabled={isLoading}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error && (
                  <p className="text-sm text-red-500">{error}</p>
              )}
              <Button disabled={isLoading}>
                {isLoading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Sign Up
              </Button>
            </div>
          </form>
        </div>
        <p className="px-8 text-center text-sm text-muted-foreground">
          <Link
            to="/login"
            className="hover:text-brand underline underline-offset-4"
          >
            Already have an account? Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
