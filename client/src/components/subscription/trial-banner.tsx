import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { CalendarDaysIcon, AlertTriangleIcon, CheckCircleIcon } from 'lucide-react';
import { useLocation } from 'wouter';

const TrialBanner: React.FC = () => {
  // Use location hook from wouter for navigation
  const [_, setLocation] = useLocation();
  
  // Query to fetch trial status
  const { data: trialData, isLoading } = useQuery({
    queryKey: ['/api/subscription/trial/status'],
    refetchInterval: 60 * 60 * 1000, // Refetch every hour
  });

  // Loading state
  if (isLoading) {
    return null; // Don't show anything while loading
  }

  // If user already has an active subscription, don't show the banner at all
  if (trialData?.hasActiveSubscription && !trialData?.isInTrial) {
    return null;
  }

  // If the trial has ended, show prompt to subscribe and prevent navigation to other pages
  if (trialData?.trialEnded) {
    return (
      <div className="bg-destructive/10 text-destructive rounded-md p-4 mb-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <AlertTriangleIcon className="h-5 w-5" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium">Your trial has ended</h3>
            <div className="mt-2 text-sm">
              <p>Your 30-day free trial period has expired. Subscribe now to continue using all premium features.</p>
            </div>
            <div className="mt-4">
              <Button 
                onClick={() => setLocation('/plans')}
                className="bg-destructive hover:bg-destructive/90 text-white"
              >
                Subscribe Now
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If user is in trial period, show days left
  if (trialData?.isInTrial) {
    // Low days warning (7 days or less)
    const isLowDays = trialData.daysLeft <= 7;
    
    return (
      <div className={`${isLowDays ? 'bg-amber-50 border-amber-200' : 'bg-primary/5 border-primary/10'} border rounded-md p-4 mb-6`}>
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {isLowDays ? (
              <AlertTriangleIcon className="h-5 w-5 text-amber-500" />
            ) : (
              <CalendarDaysIcon className="h-5 w-5 text-primary" />
            )}
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium">
              {isLowDays ? 'Your trial is ending soon' : 'Free Trial Active'}
            </h3>
            <div className="mt-2 text-sm">
              <p>
                {isLowDays
                  ? `Your free trial ends in ${trialData.daysLeft} ${trialData.daysLeft === 1 ? 'day' : 'days'}. Subscribe now to continue using all premium features.`
                  : `You have ${trialData.daysLeft} ${trialData.daysLeft === 1 ? 'day' : 'days'} left in your free trial.`
                }
              </p>
            </div>
            {isLowDays && (
              <div className="mt-4">
                <Button 
                  onClick={() => setLocation('/plans')}
                  variant="default"
                  size="sm"
                >
                  View Plans
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Default: Offer to start a trial
  return (
    <div className="bg-primary/5 border border-primary/10 rounded-md p-4 mb-6">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <CheckCircleIcon className="h-5 w-5 text-primary" />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium">Try BakeDiary for free</h3>
          <div className="mt-2 text-sm">
            <p>Start your 30-day free trial today. No credit card required.</p>
          </div>
          <div className="mt-4">
            <Button 
              onClick={() => setLocation('/start-trial')}
              variant="default"
              size="sm"
            >
              Start Free Trial
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrialBanner;