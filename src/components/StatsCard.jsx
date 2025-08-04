import React from 'react';

const StatsCard = ({ title, value, change, trend, icon }) => {
  return (
    <div className="bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg p-6 rounded-lg shadow-sm border border-gray-700">
      <div className="flex justify-between">
        <div>
          <p className="text-sm font-medium text-gray-400">{title}</p>
          <p className="text-2xl font-semibold text-gray-200 mt-1">{value}</p>
        </div>
        <div className={`h-12 w-12 ${icon.bgColor} rounded-full flex items-center justify-center`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon.path} />
          </svg>
        </div>
      </div>
      <div className="flex items-center mt-4">
        <div className={`flex items-center text-sm ${trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={trend === 'up' ? 'M5 10l7-7m0 0l7 7m-7-7v18' : 'M19 14l-7 7m0 0l-7-7m7 7V3'} />
          </svg>
          <span className="ml-1">{change}</span>
        </div>
        <span className="text-sm text-gray-400 ml-2">since last month</span>
      </div>
    </div>
  );
};

export default StatsCard;