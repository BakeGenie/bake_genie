import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/ui/page-header';
import { CalendarDaysIcon, ClockIcon, CheckCircleIcon } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

const StartTrialPage: React.FC = () => {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  const trialMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/subscription/trial/start', {});
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/subscription/trial/status'] });
      toast({
        title: 'Trial Started!',
        description: 'Your 30-day free trial has been started successfully.',
        variant: 'default',
      });
      // Redirect to dashboard after successful trial creation
      setTimeout(() => {
        setLocation('/dashboard');
      }, 1000);
    },
    onError: (error: any) => {
      console.error('Trial creation error:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to start trial. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleStartTrial = async () => {
    setIsLoading(true);
    await trialMutation.mutateAsync();
    setIsLoading(false);
  };

  return (
    <div className="container mx-auto py-8">
      <PageHeader title="Start Your Free Trial" />
      
      <div className="max-w-3xl mx-auto">
        <Card className="border-primary/10 shadow-md">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-t-lg">
            <CardTitle className="text-2xl flex items-center gap-2">
              <CalendarDaysIcon className="h-6 w-6 text-primary" />
              30-Day Free Trial
            </CardTitle>
            <CardDescription>
              Try all features with no commitment
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-2">
                <div className="rounded-full bg-primary/10 p-1 flex-shrink-0">
                  <CheckCircleIcon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-base font-medium">Full Access</h3>
                  <p className="text-sm text-muted-foreground">
                    Enjoy complete access to all BakeDiary features
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="rounded-full bg-primary/10 p-1 flex-shrink-0">
                  <CheckCircleIcon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-base font-medium">No Credit Card</h3>
                  <p className="text-sm text-muted-foreground">
                    Start your trial without payment information
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="rounded-full bg-primary/10 p-1 flex-shrink-0">
                  <CheckCircleIcon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-base font-medium">All Premium Features</h3>
                  <p className="text-sm text-muted-foreground">
                    Try order management, inventory tracking and more
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="rounded-full bg-primary/10 p-1 flex-shrink-0">
                  <ClockIcon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-base font-medium">Cancel Anytime</h3>
                  <p className="text-sm text-muted-foreground">
                    No obligation to continue after your trial ends
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-muted/30 flex justify-between py-6">
            <Button 
              variant="outline" 
              onClick={() => setLocation('/dashboard')}
            >
              Maybe Later
            </Button>
            <Button 
              onClick={handleStartTrial}
              disabled={isLoading}
              className="bg-primary text-white hover:bg-primary/90"
            >
              {isLoading ? (
                <>
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"></span>
                  Starting Trial...
                </>
              ) : 'Start Free Trial'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default StartTrialPage;