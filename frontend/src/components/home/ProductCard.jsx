// components/ProductCard.jsx
import React from 'react';
import { Clock, FileText, AlertCircle } from 'lucide-react';
import Button from '../commons/Button';

const iconMap = {
  clock: Clock,
  'file-text': FileText,
  'alert-circle': AlertCircle,
};

export default function ProductCard({ title, icon, description, imageUrl }) {
  if (imageUrl) {
    // Showcase produit
    return (
      <div className="flex flex-col md:flex-row items-center bg-white rounded-lg shadow overflow-hidden">
        <img src={imageUrl} alt={title} className="w-full md:w-1/3 object-cover" />
        <div className="p-6 flex-1">
          <h4 className="text-xl font-semibold mb-2">{title}</h4>
          <p className="mb-4 text-gray-600">{description}</p>
          <Button className="bg-primary">En savoir +</Button>
        </div>
      </div>
    );
  }

  // Carte de service simple
  const IconComponent = iconMap[icon] || Clock;
  return (
    <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center text-center hover:shadow-md transition">
      <IconComponent className="w-8 h-8 text-secondary mb-4" />
      <h4 className="font-medium text-lg">{title}</h4>
    </div>
  );
}