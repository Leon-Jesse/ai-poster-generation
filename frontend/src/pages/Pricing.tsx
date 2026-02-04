import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { paymentService, Product } from '@/services/paymentService';
import { useAuthStore } from '@/store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { Check, Loader2 } from 'lucide-react';

interface Plan extends Product {
  id: number;
  name: string;
  features: string[];
  popular?: boolean;
}

export default function Pricing() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<number | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await paymentService.getProducts();
        if (res.code === 0 && res.data) {
          const products = res.data;
          const mappedPlans: Plan[] = [];

          // Map backend products to frontend plans
          const planFeatures: Record<string, { features: string[], popular?: boolean }> = {
            '1': { features: ['Test Plan', '1 Credit', 'Instant Delivery'] },
            '2': { features: ['Test Plan', '5 Credits', 'Instant Delivery'] },
            '3': { features: ['100 Credits', 'Standard Generation Speed', 'Basic Styles'] },
            '4': { features: ['500 Credits', 'Fast Generation Speed', 'All Styles', 'Priority Support'], popular: true },
            '5': { features: ['1000 Credits', 'Ultra Fast Speed', 'All Styles', '24/7 Support', 'API Access'] },
          };

          Object.keys(products).forEach((key) => {
            const product = products[key];
            const id = parseInt(key);
            const extra = planFeatures[key] || { features: [`${product.credits} Credits`] };
            
            mappedPlans.push({
              id,
              name: product.subject,
              ...product,
              features: extra.features,
              popular: extra.popular,
            });
          });

          // Sort by ID
          mappedPlans.sort((a, b) => a.id - b.id);
          
          setPlans(mappedPlans);
        }
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setFetching(false);
      }
    };

    fetchProducts();
  }, []);

  const handlePurchase = async (planId: number) => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      setLoading(planId);
      const res = await paymentService.charge(planId, 'alipay');
      if (res.code === 0 && res.data.pay_url) {
        window.location.href = res.data.pay_url;
      } else {
        console.error('Payment failed:', res.message);
        alert(res.message || 'Payment initiation failed');
      }
    } catch (error) {
      console.error('Payment initiation failed:', error);
      alert('Failed to initiate payment. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="container py-20 min-h-screen">
      <div className="text-center mb-16 space-y-4">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Simple, Transparent Pricing
        </h1>
        <p className="text-xl text-muted-foreground">
          Choose the perfect plan for your creative needs.
        </p>
      </div>

      {fetching ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-8 md:grid-cols-3 lg:gap-12 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative flex flex-col p-8 bg-background border rounded-2xl shadow-sm ${
              plan.popular
                ? 'border-primary ring-2 ring-primary ring-offset-2'
                : 'border-border'
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                  Most Popular
                </span>
              </div>
            )}

            <div className="mb-6">
              <h3 className="text-xl font-bold">{plan.name}</h3>
              <div className="mt-4 flex items-baseline text-gray-900 dark:text-gray-50">
                <span className="text-4xl font-extrabold tracking-tight">¥{plan.amount / 100}</span>
                <span className="ml-1 text-xl font-semibold text-muted-foreground">/once</span>
              </div>
              <p className="mt-2 text-muted-foreground">{plan.credits} Credits</p>
            </div>

            <ul className="space-y-4 mb-8 flex-1">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-center">
                  <Check className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
                  <span className="text-muted-foreground">{feature}</span>
                </li>
              ))}
            </ul>

            <Button
              size="lg"
              className="w-full"
              variant={plan.popular ? 'default' : 'outline'}
              onClick={() => handlePurchase(plan.id)}
              disabled={loading === plan.id}
            >
              {loading === plan.id ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Buy Now'
              )}
            </Button></div>
          ))}
        </div>
      )}
    </div>
  );
}
