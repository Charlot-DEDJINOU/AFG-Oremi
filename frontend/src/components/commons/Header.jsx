// components/Header.jsx
import React from 'react';
import Button from './Button';
import logo from '../../assets/logo.svg'; // ajustez le chemin
import { NavLink } from 'react-router-dom';

export default function Header() {
    return (
        <header className="bg-white shadow-sm p-4">
            <div className="flex items-center justify-between max-w-7xl mx-auto">
                <div className="flex items-center space-x-4">
                    <NavLink to="/">
                        <img src={logo} />
                    </NavLink>
                </div>

                <div className="hidden md:flex items-center space-x-6 text-sm">
                    <span className="text-gray-600">Aide</span>
                    <NavLink to="/localisation">
                        <span className="text-gray-600">Partenaires</span>
                    </NavLink>
                    <span className="text-gray-600">Se reconnecter</span>
                    <Button className="bg-primary hover:bg-secondary">
                        Faire un devis
                    </Button>
                </div>
            </div>
        </header>
    );
}