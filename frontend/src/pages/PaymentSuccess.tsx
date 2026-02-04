import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { paymentService } from '@/services/paymentService';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'verifying' | 'success' | 'failed'>('verifying');
  const [message, setMessage] = useState('Verifying payment...');

  useEffect(() => {
    const verifyPayment = async () => {
      // Collect all query parameters
      const params: Record<string, string> = {};
      searchParams.forEach((value, key) => {
        params[key] = value;
      });

      if (Object.keys(params).length === 0) {
        setStatus('failed');
        setMessage('No payment information found.');
        return;
      }

      try {
        const res = await paymentService.verifyAlipayReturn(params);
        if (res.code === 0) {
          setStatus('success');
          setMessage('Payment successful! Your credits have been added.');
        } else {
          setStatus('failed');
          setMessage(res.message || 'Payment verification failed.');
        }
      } catch (error: any) {
        console.error('Payment verification error:', error);
        setStatus('failed');
        setMessage(error.message || 'An error occurred while verifying payment.');
      }
    };

    verifyPayment();
  }, [searchParams]);

  return (
    <div className="container flex flex-col items-center justify-center min-h-[60vh] py-12 space-y-8">
      {status === 'verifying' && (
        <>
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
          <h1 className="text-2xl font-bold">Verifying Payment...</h1>
          <p className="text-muted-foreground">Please wait while we confirm your transaction.</p>
        </>
      )}

      {status === 'success' && (
        <>
          <CheckCircle className="h-16 w-16 text-green-500" />
          <h1 className="text-2xl font-bold">Payment Successful</h1>
          <p className="text-muted-foreground text-center max-w-md">{message}</p>
          <div className="flex gap-4">
            <Button onClick={() => navigate('/workspace')}>Go to Workspace</Button>
            <Button variant="outline" onClick={() => navigate('/pricing')}>Buy More</Button>
          </div>
        </>
      )}

      {status === 'failed' && (
        <>
          <XCircle className="h-16 w-16 text-destructive" />
          <h1 className="text-2xl font-bold">Payment Failed</h1>
          <p className="text-muted-foreground text-center max-w-md">{message}</p>
          <div className="flex gap-4">
            <Button onClick={() => navigate('/pricing')}>Try Again</Button>
            <Button variant="outline" onClick={() => navigate('/')}>Go Home</Button>
          </div>
        </>
      )}
    </div>
  );
}
