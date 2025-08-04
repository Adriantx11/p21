import React from 'react';
import { useAuth } from '../context/useAuth';
import AreaChartComponent from './charts/AreaChart';
import BarChartComponent from './charts/BarChart';
import PieChartComponent from './charts/PieChart';
import LineChartComponent from './charts/LineChart';
import RadarChartComponent from './charts/RadarChart';
import GaugeChart from './charts/GaugeChart';
import BubbleChart from './charts/BubbleChart';
import TreeMapChart from './charts/TreeMap';
import StatsCard from './StatsCard';
import { mockStats } from '../data/mockData';

const UserDashboard = () => {
  const { currentUser } = useAuth();
  const subscriptionStatus = currentUser?.subscriptionStatus || 'free';
  
  // Determine which charts to show based on subscription level
  const showAllCharts = subscriptionStatus === 'pro';
  const showExtendedCharts = subscriptionStatus === 'basic' || subscriptionStatus === 'pro';

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-200">Welcome, {currentUser?.name || 'User'}</h1>
      
      {/* Subscription Banner */}
      {subscriptionStatus === 'free' && (
        <div className="bg-indigo-900 bg-opacity-70 rounded-lg shadow-lg p-6 border border-indigo-500 text-center">
          <h2 className="text-xl font-semibold text-white mb-2">Upgrade Your Experience</h2>
          <p className="text-indigo-200 mb-4">Get access to all analytics features with a premium subscription</p>
          <a 
            href="/subscription-plans" 
            className="inline-block px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
          >
            Mi Cuenta
          </a>
        </div>
      )}

      {/* Subscription Info */}
      {subscriptionStatus !== 'free' && (
        <div className="bg-indigo-900 bg-opacity-70 rounded-lg shadow-lg p-6 border border-indigo-500">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white mb-1">
                Monthly Subscription
              </h2>
              <p className="text-indigo-200">
                {currentUser?.subscriptionExpiry 
                  ? `Valid until ${new Date(currentUser.subscriptionExpiry).toLocaleDateString()}` 
                  : 'Active subscription'}
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <a 
                href="/subscription-plans" 
                className="inline-block px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
              >
                Mi Cuenta
              </a>
            </div>
          </div>
        </div>
      )}
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {mockStats.map((stat, index) => (
          <StatsCard 
            key={index}
            title={stat.title}
            value={stat.value}
            change={stat.change}
            trend={stat.trend}
            icon={stat.icon}
          />
        ))}
      </div>
      
      {/* Charts - First Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg p-6 rounded-lg shadow-sm border border-gray-700">
          <h2 className="text-lg font-medium text-gray-200 mb-4">Revenue Trends</h2>
          <AreaChartComponent />
        </div>
        <div className="bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg p-6 rounded-lg shadow-sm border border-gray-700">
          <h2 className="text-lg font-medium text-gray-200 mb-4">Monthly Sales</h2>
          <BarChartComponent />
        </div>
      </div>
      
      {/* Charts - Second Row (only for basic & pro) */}
      {showExtendedCharts && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg p-6 rounded-lg shadow-sm border border-gray-700">
            <h2 className="text-lg font-medium text-gray-200 mb-4">Traffic Sources</h2>
            <PieChartComponent />
          </div>
          <div className="bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg p-6 rounded-lg shadow-sm border border-gray-700">
            <h2 className="text-lg font-medium text-gray-200 mb-4">Conversion Rate</h2>
            <LineChartComponent />
          </div>
          <div className="bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg p-6 rounded-lg shadow-sm border border-gray-700">
            <h2 className="text-lg font-medium text-gray-200 mb-4">Performance Metrics</h2>
            <RadarChartComponent />
          </div>
        </div>
      )}
      
      {/* Charts - Third Row (Fancy Charts - only for pro) */}
      {showAllCharts && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg p-6 rounded-lg shadow-sm border border-gray-700">
            <GaugeChart value={72} min={0} max={100} title="System Utilization" />
          </div>
          <div className="bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg p-6 rounded-lg shadow-sm border border-gray-700">
            <BubbleChart />
          </div>
          <div className="bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg p-6 rounded-lg shadow-sm border border-gray-700">
            <TreeMapChart />
          </div>
        </div>
      )}
      
            {/* Amazon Checker Section (Only for monthly users) */}
      {subscriptionStatus === 'monthly' && (
        <div className="bg-gradient-to-r from-green-900 to-emerald-900 rounded-lg shadow-lg p-6 text-center">
          <h3 className="text-xl font-bold text-white mb-2">Amazon Checker</h3>
          <p className="text-green-200 mb-4">
            Accede a nuestra herramienta exclusiva de verificación de tarjetas para Amazon
          </p>
          <a
            href="/amazon"
            className="inline-block px-6 py-3 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 transition-colors"
          >
            Ir a Amazon Checker
          </a>
        </div>
      )}

      {/* Upgrade Prompt (Only for free or basic users) */}
      {subscriptionStatus !== 'pro' && (
        <div className="bg-gradient-to-r from-purple-900 to-indigo-900 rounded-lg shadow-lg p-6 text-center">
          <h3 className="text-xl font-bold text-white mb-2">
            {subscriptionStatus === 'free' 
              ? 'Ready to unlock more features?' 
              : 'Upgrade to Pro for full access'}
          </h3>
          <p className="text-indigo-200 mb-4">
            {subscriptionStatus === 'free' 
              ? 'Get started with our Basic plan for enhanced analytics and insights.' 
              : 'Take your analytics to the next level with our Pro subscription.'}
          </p>
          <a 
            href="/subscription-plans" 
            className="inline-block px-6 py-3 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 transition-colors"
          >
            {subscriptionStatus === 'free' ? 'Subscribe Now' : 'Upgrade to Pro'}
          </a>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;