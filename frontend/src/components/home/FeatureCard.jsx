// components/FeatureCard.jsx
import React from 'react';
import { Car, Monitor, Heart, Home } from 'lucide-react';

const iconMap = {
  car: Car,
  motorcycle: Monitor,
  heart: Heart,
  home: Home,
};

export default function FeatureCard({ title, icon }) {
  const IconComponent = iconMap[icon] || Home;
  return (
    <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center text-center hover:shadow-md transition">
      <IconComponent className="w-8 h-8 text-primary mb-4" />
      <h3 className="font-medium text-lg">{title}</h3>
    </div>
  );
}