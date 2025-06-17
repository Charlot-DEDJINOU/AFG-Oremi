import { ArrowRight } from 'lucide-react';

const InsuranceProduct = ({ 
  title, 
  description, 
  imageUrl, 
  imageAlt, 
  reverse = false 
}) => {
  return (
    <div className="mb-16">
      {/* Lien "Savoir plus" */}
      <div className="flex justify-end mb-6 border-b-2 border-b-gray-600 pb-3">
        <button className="flex items-center text-gray-600 hover:text-gray-800 transition-colors duration-200">
          <span className="text-sm mr-2">Savoir plus</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Contenu principal */}
      <div className={`grid grid-cols-1 lg:grid-cols-2 gap-8 items-center ${reverse ? 'lg:grid-flow-col-dense' : ''}`}>
        
        {/* Section texte */}
        <div className={`${reverse ? 'lg:col-start-2' : ''}`}>
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6 leading-tight">
            {title}
          </h2>
          <p className="text-gray-600 text-lg leading-relaxed mb-8">
            {description}
          </p>
          <button className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors duration-200">
            Souscrire
          </button>
        </div>

        {/* Section image */}
        <div className={`${reverse ? 'lg:col-start-1' : ''}`}>
          <div className="relative rounded-2xl overflow-hidden shadow-lg">
            <img 
              src={imageUrl} 
              alt={imageAlt}
              className="w-full h-80 lg:h-96 object-cover"
            />
            {/* Logo Oremi en bas à droite */}
            <div className="absolute bottom-4 right-4 bg-white bg-opacity-90 rounded-lg px-3 py-2">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-blue-600 rounded-full mr-2"></div>
                <span className="text-sm font-semibold text-gray-800">Oremi</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default InsuranceProduct;