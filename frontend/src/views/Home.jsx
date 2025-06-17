import React from 'react';
import {
  ArrowRight, Heart, Car, Bike, Plane, Home, Clock, Shield, FileText, Download, Calculator,
  UserPlus,
  Bookmark,
  CreditCard,
  AlertTriangle,
  MessageCircle,
} from 'lucide-react';
import FeatureCard from '../components/home/FeatureCard';
import ProcessStep from '../components/home/ProcessStep';
import ProductCard from '../components/home/ProductCard';
import Button from '../components/commons/Button';
import assurance_picture from "../assets/assurance_picture.png"
import person_picture from "../assets/person_picture.png"

const services = [
  {
    id: 1,
    subtitle: "Estimez votre",
    title: "Devis d'assurance\nen 5 min",
    icon: Clock,
    iconColor: "text-blue-300"
  },
  {
    id: 2,
    subtitle: "Déclarez",
    title: "vos sinistres et suivez\nson traitement",
    icon: Shield,
    iconColor: "text-blue-300"
  },
  {
    id: 3,
    subtitle: "En quelques clics",
    title: "Souscrivez à\nvotre contrat",
    icon: FileText,
    iconColor: "text-blue-300"
  },
  {
    id: 4,
    subtitle: "Téléchargez",
    title: "vos attestations d'assurances\ninstantanément",
    icon: Download,
    iconColor: "text-blue-300"
  }
];

const processSteps = [
  {
    id: 1,
    icon: Calculator,
    title: "Estimation de prime",
    description: "Fournissez les informations nécessaires pour établir votre devis. C'est instantané et sans obligation de souscription.",
    iconColor: "text-teal-500",
    bgColor: "bg-teal-50"
  },
  {
    id: 2,
    icon: UserPlus,
    title: "Inscription",
    description: "Identifiez-vous pour sauvegarder vos parcours. Votre numéro de téléphone suffit.",
    iconColor: "text-green-500",
    bgColor: "bg-green-50"
  },
  {
    id: 3,
    icon: Bookmark,
    title: "Souscription",
    description: "Automobile, Moto à 2 roues, Multirisque Habitation et voyage. Un seul compte pour gérer toutes vos souscriptions.",
    iconColor: "text-blue-500",
    bgColor: "bg-blue-50"
  },
  {
    id: 4,
    icon: CreditCard,
    title: "Paiement en ligne",
    description: "Par Mobile Money ou par Carte bancaire. C'est vous qui choisissez. C'est rapide et sécurisé.",
    iconColor: "text-teal-500",
    bgColor: "bg-teal-50"
  },
  {
    id: 5,
    icon: AlertTriangle,
    title: "Déclaration de sinistres",
    description: "Faites vos déclarations en ligne et suivez en temps réel l'avancement de votre dossier sans vous déplacer.",
    iconColor: "text-yellow-500",
    bgColor: "bg-yellow-50"
  },
  {
    id: 6,
    icon: MessageCircle,
    title: "Assistance en temps réel",
    description: "Écrivez-nous via Tchat et WhatsApp pour une prise en charge effective par nos équipes.",
    iconColor: "text-blue-500",
    bgColor: "bg-blue-50"
  }
];

const HomePage = () => {
  return (
    <div className="min-h-screen bg-gray-50">

      <div className="max-w-7xl mx-auto p-4 md:p-8">
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
            <div className="grid grid-rows-2 gap-4 h-full">

              {/* Row 1 - Auto & Moto */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-r from-green-200 to-green-100 p-4 lg:p-6 relative overflow-hidden h-[280px]">
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

                <div className="bg-gradient-to-r from-yellow-200 to-yellow-300 p-4 lg:p-6 relative overflow-hidden h-[280px]">
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
              </div>

              {/* Row 2 - Santé, Voyage & Habitation */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-500 p-4 lg:p-6 text-white relative overflow-hidden h-[280px]">
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

                <div className="bg-gradient-to-br from-pink-200 to-pink-300 p-4 lg:p-6 relative overflow-hidden h-[280px]">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Assurance</h4>
                      <h3 className="text-lg lg:text-xl font-bold text-gray-900">Voyage</h3>
                    </div>
                    <button className="w-8 h-8 lg:w-10 lg:h-10 bg-white rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-shadow">
                      <ArrowRight className="w-3 h-3 lg:w-4 lg:h-4 text-gray-600" />
                    </button>
                  </div>

                  {/* Placeholder for luggage image */}
                  <div className="absolute right-2 bottom-2 lg:right-4 lg:bottom-4 w-12 h-12 lg:w-16 lg:h-16 bg-gray-300 rounded-lg flex items-center justify-center">
                    <Plane className="w-4 h-4 lg:w-6 lg:h-6 text-gray-500" />
                  </div>
                </div>

                <div className="bg-blue-600 p-4 lg:p-6 text-white relative overflow-hidden h-[280px]">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="text-sm font-medium text-blue-100 mb-1">Assurance</h4>
                      <h3 className="text-lg lg:text-xl font-bold">Habitation</h3>
                    </div>
                    <button className="w-8 h-8 lg:w-10 lg:h-10 bg-white rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-shadow">
                      <ArrowRight className="w-3 h-3 lg:w-4 lg:h-4 text-blue-600" />
                    </button>
                  </div>

                  {/* Home icon */}
                  <div className="absolute right-2 bottom-2 lg:right-4 lg:bottom-4">
                    <div className="w-10 h-10 lg:w-12 lg:h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                      <Home className="w-4 h-4 lg:w-6 lg:h-6 text-white" />
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>

      <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 p-6">
        <div className="max-w-4xl mx-auto">
          {/* En-tête */}
          <div className="text-center mb-12 pt-8">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
              Simplifiez-vous la vie avec
            </h1>
            <h2 className="text-4xl md:text-5xl font-bold text-white">
              l'assurance en ligne
            </h2>
          </div>

          {/* Grille des services */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {services.map((service) => (
              <FeatureCard
                key={service.id}
                subtitle={service.subtitle}
                title={service.title}
                icon={service.icon}
                iconColor={service.iconColor}
              />
            ))}
          </div>
        </div>
      </div>

      <section id="quick-quote" className="py-20 bg-white text-center">
        <div className="max-w-2xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold">
            Obtenez un <span className="text-tertiary">devis rapide</span> dès maintenant&nbsp;!
          </h2>
          <p className="mt-4 text-gray-600">
            Adieu la paperasse, Oui à l’assurance en ligne sur-mesure. Simulez votre assurance, recevez votre devis gratuit, souscrivez et payez. C’est simple, rapide et immédiat&nbsp;!
          </p>
          <div className="mt-6">
            <Button className="bg-primary hover:bg-secondary">Obtenir un devis</Button>
          </div>
        </div>
      </section>

      <div className="bg-green-50 py-12 px-4 md:px-8">
        <div className="max-w-6xl mx-auto">
          {/* En-tête */}
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Oremi AFG, comment ça marche ?
            </h1>
          </div>

          {/* Grille des étapes du processus */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {processSteps.map((step) => (
              <ProcessStep
                key={step.id}
                icon={step.icon}
                title={step.title}
                description={step.description}
                iconColor={step.iconColor}
                bgColor={step.bgColor}
              />
            ))}
          </div>
        </div>
      </div>

      <section className="px-6 py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-semibold mb-8 text-center">Nos produits d’assurance</h2>
          <div className="space-y-12">
            <ProductCard
              title="Assurance moto"
              description="Parcourez la route en toute confiance avec l'assurance moto sur Oremi. Notre couverture étendue assure votre sécurité, offrant une protection contre les risques et les dommages."
              imageUrl={assurance_picture}
            />
            <ProductCard
              title="Assurance auto"
              description="Parcourez la route en toute confiance avec l'assurance moto sur Oremi. Notre couverture étendue assure votre sécurité, offrant une protection contre les risques et les dommages."
              imageUrl={assurance_picture}
            />
            <ProductCard
              title="Assurance voyage"
              description="Parcourez la route en toute confiance avec l'assurance moto sur Oremi. Notre couverture étendue assure votre sécurité, offrant une protection contre les risques et les dommages."
              imageUrl={assurance_picture}
            />
            <ProductCard
              title="Assurance habitation"
              description="Parcourez la route en toute confiance avec l'assurance moto sur Oremi. Notre couverture étendue assure votre sécurité, offrant une protection contre les risques et les dommages."
              imageUrl={assurance_picture}
            />
            <ProductCard
              title="Assurance santé"
              description="Parcourez la route en toute confiance avec l'assurance moto sur Oremi. Notre couverture étendue assure votre sécurité, offrant une protection contre les risques et les dommages."
              imageUrl={assurance_picture}
            />
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-r from-primary-light to-primary text-white">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center">
          {/* Illustration */}
          <div className="mb-8 md:mb-0 md:w-1/2 flex justify-center">
            <div className="bg-white rounded-full p-4">
              <img
                src={person_picture}
                alt="Conseiller Oremi"
                className="w-48 h-48 object-cover rounded-full"
              />
            </div>
          </div>
          {/* Texte et bouton */}
          <div className="md:w-1/2 md:pl-12 text-center md:text-left">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Transformez l’incertitude en sécurité dès aujourd’hui&nbsp;!
            </h2>
            <p className="mb-6 text-gray-100">
              Obtenez votre devis personnalisé en quelques instants et prenez la décision qui vous offre la tranquillité d’esprit. N’attendez pas l’imprévu.
            </p>
            <Button className="bg-secondary text-primary hover:bg-gray-100">
              Faire un devis
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;