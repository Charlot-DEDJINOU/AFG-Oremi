import React from 'react';
import { ArrowRight, Heart, Car, Bike, Plane, Home } from 'lucide-react';
import Header from '../components/commons/Header';

const InsuranceSections = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">

      <div className="max-w-7xl mx-auto">
        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

          {/* Left Section - Main Text */}
          <div className="lg:col-span-1 flex flex-col justify-center p-6 lg:p-8">
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4 leading-tight">
              L'assurance<br />
              sans paperasse.<br />
              <span className="text-pink-500">100% digital</span>
            </h1>
            <p className="text-gray-600 mb-8 text-lg">
              Orem vous permet de souscrire à différentes assurances sans vous déplacer !
            </p>
            <button className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors w-fit">
              Souscrire à une assurance
            </button>
            <div className="mt-4">
              <div className="w-20 h-1 bg-pink-500 rounded-full"></div>
            </div>
          </div>

          {/* Right Section - Insurance Grid 2x3 */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-2 gap-4 h-full">
              
              {/* Row 1 - Auto & Moto */}
              <div className="bg-gradient-to-r from-green-200 to-green-100 rounded-2xl p-4 lg:p-6 relative overflow-hidden">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Assurance</h4>
                    <h3 className="text-lg lg:text-xl font-bold text-gray-900">Auto</h3>
                  </div>
                  <button className="w-8 h-8 lg:w-10 lg:h-10 bg-white rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-shadow">
                    <ArrowRight className="w-3 h-3 lg:w-4 lg:h-4 text-gray-600" />
                  </button>
                </div>
                
                {/* Placeholder for car image */}
                <div className="absolute right-2 bottom-2 lg:right-4 lg:bottom-4 w-16 h-10 lg:w-24 lg:h-16 bg-gray-300 rounded-lg flex items-center justify-center">
                  <Car className="w-4 h-4 lg:w-6 lg:h-6 text-gray-500" />
                </div>
              </div>

              <div className="bg-gradient-to-r from-yellow-200 to-yellow-300 rounded-2xl p-4 lg:p-6 relative overflow-hidden">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Assurance</h4>
                    <h3 className="text-lg lg:text-xl font-bold text-gray-900">Moto</h3>
                  </div>
                  <button className="w-8 h-8 lg:w-10 lg:h-10 bg-white rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-shadow">
                    <ArrowRight className="w-3 h-3 lg:w-4 lg:h-4 text-gray-600" />
                  </button>
                </div>
                
                {/* Placeholder for moto image */}
                <div className="absolute right-2 bottom-2 lg:right-4 lg:bottom-4 w-12 h-12 lg:w-16 lg:h-16 bg-gray-300 rounded-lg flex items-center justify-center">
                  <Bike className="w-4 h-4 lg:w-6 lg:h-6 text-gray-500" />
                </div>
              </div>

              {/* Row 2 - Santé */}
              <div className="bg-green-500 rounded-2xl p-4 lg:p-6 text-white relative overflow-hidden">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="text-sm font-medium text-green-100 mb-1">Assurance</h4>
                    <h3 className="text-lg lg:text-xl font-bold">Santé</h3>
                  </div>
                  <button className="w-8 h-8 lg:w-10 lg:h-10 bg-white rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-shadow">
                    <ArrowRight className="w-3 h-3 lg:w-4 lg:h-4 text-green-600" />
                  </button>
                </div>
                
                {/* Health icon */}
                <div className="absolute right-2 bottom-2 lg:right-4 lg:bottom-4">
                  <div className="w-10 h-10 lg:w-12 lg:h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                    <Heart className="w-4 h-4 lg:w-6 lg:h-6 text-white" />
                  </div>
                </div>
              </div>

              {/* Row 2 - Voyage & Habitation */}
              <div className="grid grid-cols-1 gap-4">
                <div className="bg-gradient-to-br from-pink-200 to-pink-300 rounded-2xl p-3 lg:p-4 relative overflow-hidden">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-xs font-medium text-gray-700 mb-1">Assurance</h4>
                      <h3 className="text-sm lg:text-base font-bold text-gray-900">Voyage</h3>
                    </div>
                    <button className="w-6 h-6 lg:w-8 lg:h-8 bg-white rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-shadow">
                      <ArrowRight className="w-2 h-2 lg:w-3 lg:h-3 text-gray-600" />
                    </button>
                  </div>
                  
                  {/* Placeholder for luggage image */}
                  <div className="absolute right-1 bottom-1 lg:right-2 lg:bottom-2 w-8 h-6 lg:w-12 lg:h-8 bg-gray-300 rounded flex items-center justify-center">
                    <Plane className="w-3 h-3 lg:w-4 lg:h-4 text-gray-500" />
                  </div>
                </div>

                <div className="bg-blue-600 rounded-2xl p-3 lg:p-4 text-white relative overflow-hidden">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-xs font-medium text-blue-100 mb-1">Assurance</h4>
                      <h3 className="text-sm lg:text-base font-bold">Habitation</h3>
                    </div>
                    <button className="w-6 h-6 lg:w-8 lg:h-8 bg-white rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-shadow">
                      <ArrowRight className="w-2 h-2 lg:w-3 lg:h-3 text-blue-600" />
                    </button>
                  </div>
                  
                  {/* Home icon */}
                  <div className="absolute right-1 bottom-1 lg:right-2 lg:bottom-2">
                    <div className="w-8 h-8 lg:w-10 lg:h-10 bg-white bg-opacity-20 rounded flex items-center justify-center">
                      <Home className="w-3 h-3 lg:w-4 lg:h-4 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default InsuranceSections;