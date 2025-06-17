// components/FAQ.jsx
import React, { useState } from 'react';

const faqs = [
  { q: "Comment souscrire à une Assurance sur OREMI by AFG ?", a: "Rendez-vous sur notre plateforme, choisissez votre produit et suivez les étapes de souscription." },
  { q: "Quels modes de paiement sont acceptés sur l’application ?", a: "Carte bancaire, mobile money et virement bancaire." },
  // Ajoutez vos autres questions ici
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggle = idx => setOpenIndex(openIndex === idx ? null : idx);

  return (
    <div className="space-y-4">
      {faqs.map((item, idx) => (
        <div key={idx} className="border rounded-lg">
          <button
            onClick={() => toggle(idx)}
            className="w-full flex justify-between items-center p-4 focus:outline-none"
          >
            <span className="font-medium">{item.q}</span>
            <span className="text-secondary">{openIndex === idx ? '−' : '+'}</span>
          </button>
          {openIndex === idx && (
            <div className="p-4 pt-0 text-gray-600">{item.a}</div>
          )}
        </div>
      ))}
    </div>
  );
}
