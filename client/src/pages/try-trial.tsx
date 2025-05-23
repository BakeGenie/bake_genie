import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const TryTrialPage = () => {
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isStarting, setIsStarting] = useState(false);

  const startTrialMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/subscription/trial/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to start trial');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Trial started!',
        description: 'Your 30-day free trial has begun.',
        variant: 'default',
      });
      // Invalidate trial status query to refresh banner
      queryClient.invalidateQueries({ queryKey: ['/api/subscription/trial/status'] });
      navigate('/dashboard');
    },
    onError: (error: any) => {
      toast({
        title: 'Could not start trial',
        description: error.message || 'Please try again later.',
        variant: 'destructive',
      });
    }
  });

  const handleStartTrial = async () => {
    setIsStarting(true);
    try {
      await startTrialMutation.mutateAsync();
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <div className="container py-8">
      <Card className="max-w-md mx-auto">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
          <CardTitle>Start Your Free Trial</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <p className="mb-6">Click the button below to begin your 30-day free trial of BakeDiary. No credit card required.</p>
          <div className="space-y-2">
            <div className="flex items-center">
              <div className="h-4 w-4 rounded-full bg-green-500 mr-2"></div>
              <p>Full access to all features</p>
            </div>
            <div className="flex items-center">
              <div className="h-4 w-4 rounded-full bg-green-500 mr-2"></div>
              <p>No obligations or hidden fees</p>
            </div>
            <div className="flex items-center">
              <div className="h-4 w-4 rounded-full bg-green-500 mr-2"></div>
              <p>Cancel anytime during trial</p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            Cancel
          </Button>
          <Button 
            onClick={handleStartTrial} 
            disabled={isStarting}
          >
            {isStarting ? 'Starting...' : 'Start Free Trial'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default TryTrialPage;