// components/Footer.jsx
import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-gray-100 text-gray-600 py-10">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 px-6">
        <div>
          <h4 className="font-semibold mb-2">Oremi AFG</h4>
          <p>© 2025 Oremi AFG. Tous droits réservés.</p>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Liens</h4>
          <ul className="space-y-1">
            <li><a href="#assurance" className="hover:text-primary">Assurance</a></li>
            <li><a href="#mentions" className="hover:text-primary">Mentions légales</a></li>
            <li><a href="#contact" className="hover:text-primary">Contact</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Support</h4>
          <ul className="space-y-1">
            <li><a href="#aide" className="hover:text-primary">Aide & FAQ</a></li>
            <li><a href="#assistance" className="hover:text-primary">Assistance 24/7</a></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}