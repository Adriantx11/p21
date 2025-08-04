import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/useAuth';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';

const SubscriptionPlans = () => {
  const { currentUser, updateSubscription } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [upgrading, setUpgrading] = useState(false);
  
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const plansData = await apiService.getSubscriptionPlans();
        setPlans(plansData);
      } catch (error) {
        setError('Failed to load subscription plans');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  const handleSubscribe = async (planId) => {
    if (planId === currentUser?.subscriptionStatus) {
      return; // Already subscribed to this plan
    }

    try {
      setUpgrading(true);
      setError('');
      
      await updateSubscription(planId);
      navigate('/dashboard');
    } catch (error) {
      setError(error.message || 'Failed to upgrade subscription');
      console.error(error);
    } finally {
      setUpgrading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Loading subscription plans...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            <span className="block sm:inline">{error}</span>
          </div>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center">
        <h2 className="text-3xl font-extrabold text-gray-800 sm:text-4xl">
          Choose your subscription
        </h2>
        <p className="mt-4 text-lg text-gray-600">
          Select the plan that works best for you
        </p>
      </div>

      {error && (
        <div className="mt-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <div className="mt-12 space-y-12 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-6 max-w-4xl mx-auto">
        {plans.map((plan) => (
          <div key={plan.id} className={`relative p-8 bg-white rounded-lg shadow-lg flex flex-col ${
            plan.recommended ? 'border-2 border-indigo-500' : ''
          }`}>
            {plan.recommended && (
              <span className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-indigo-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                Recommended
              </span>
            )}
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-gray-900">{plan.name}</h3>
              <p className="mt-4 flex items-baseline text-gray-900">
                <span className="text-4xl font-extrabold tracking-tight">${plan.price}</span>
                {plan.period && <span className="ml-1 text-xl font-semibold">/{plan.period}</span>}
              </p>
              <ul className="mt-6 space-y-4">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>
                    <p className="ml-3 text-base text-gray-700">{feature}</p>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-8">
              <button
                onClick={() => handleSubscribe(plan.id)}
                disabled={currentUser?.subscriptionStatus === plan.id || upgrading}
                className={`w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                  currentUser?.subscriptionStatus === plan.id
                    ? 'bg-gray-400 cursor-not-allowed'
                    : upgrading
                    ? 'bg-indigo-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                }`}
              >
                {currentUser?.subscriptionStatus === plan.id 
                  ? 'Current Plan' 
                  : upgrading 
                  ? 'Processing...' 
                  : plan.id === 'free' 
                  ? 'Current Plan' 
                  : 'Subscribe Now'
                }
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SubscriptionPlans;