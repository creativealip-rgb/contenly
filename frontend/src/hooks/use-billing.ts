import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export interface BillingData {
    tier: 'FREE' | 'PRO' | 'ENTERPRISE';
    balance: number;
    subscription: any;
}

export function useBilling() {
    const [data, setData] = useState<BillingData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        async function fetchBilling() {
            try {
                // Fetch subscription to get tier
                const subRes = await api.get<any>('/billing/subscriptions');
                const balanceRes = await api.get<{ balance: number }>('/billing/balance');

                setData({
                    tier: subRes.tier || 'FREE',
                    balance: balanceRes.balance,
                    subscription: subRes,
                });
            } catch (err: any) {
                console.error('Failed to fetch billing data:', err);
                setError(err);
            } finally {
                setLoading(false);
            }
        }

        fetchBilling();
    }, []);

    return { data, loading, error };
}
