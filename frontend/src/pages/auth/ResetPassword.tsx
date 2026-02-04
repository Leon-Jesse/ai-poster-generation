import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authService } from '@/services/authService';
import { Loader2 } from 'lucide-react';

export default function ResetPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [code, setCode] = useState('');
  const [verifyToken, setVerifyToken] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSendCode = async () => {
    if (!email) {
      setError('Please enter your email first.');
      return;
    }
    setError('');
    setIsSendingCode(true);
    try {
      const res = await authService.sendCode(email, 'reset_password');
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
    if (!email || !newPassword || !code || !verifyToken) {
      setError('Please fill in all fields and ensure verification code is sent.');
      return;
    }
    
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const res = await authService.resetPassword(email, newPassword, code, verifyToken);
      if (res.code === 0) {
        setSuccess('Password reset successfully. Redirecting to login...');
        setTimeout(() => {
            navigate('/login');
        }, 2000);
      } else {
        setError(res.message || 'Reset password failed.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Reset password failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Reset Password</h1>
          <p className="text-sm text-muted-foreground">
            Enter your email and new password
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
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  placeholder="Enter your new password"
                  type="password"
                  disabled={isLoading}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              {error && (
                  <p className="text-sm text-red-500">{error}</p>
              )}
              {success && (
                  <p className="text-sm text-green-500">{success}</p>
              )}
              <Button disabled={isLoading}>
                {isLoading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Reset Password
              </Button>
            </div>
          </form>
        </div>
        <p className="px-8 text-center text-sm text-muted-foreground">
          <Link
            to="/login"
            className="hover:text-brand underline underline-offset-4"
          >
            Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
}
