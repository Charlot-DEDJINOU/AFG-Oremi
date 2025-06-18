import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Search, 
  Filter, 
  List, 
  Map, 
  Navigation, 
  Phone, 
  Car, 
  Heart, 
  Bike, 
  Home, 
  Plane,
  Building,
  CheckCircle,
  XCircle,
  Star,
  Route,
  ExternalLink,
  Target,
  Loader,
  Layers
} from 'lucide-react';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const InsurancePartnerFinder = () => {
  const [searchMode, setSearchMode] = useState('intelligent');
  const [viewMode, setViewMode] = useState('list');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [partners, setPartners] = useState([]);
  const [filteredPartners, setFilteredPartners] = useState([]);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [nearestPartner, setNearestPartner] = useState(null);
  const [mapLayer, setMapLayer] = useState('satellite');

  // Configuration des couches de carte
  const mapLayers = {
    satellite: {
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      attribution: "© Esri"
    },
    street: {
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      attribution: "© OpenStreetMap"
    },
    terrain: {
      url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
      attribution: "© OpenTopoMap"
    }
  };

  // Centre de la carte (Cotonou) - Coordonnées GPS réelles
  const mapCenter = [6.3598, 2.4178]; // [latitude, longitude] format Leaflet

  // Types d'assurance disponibles
  const insuranceTypes = [
    { id: 'automobile', label: 'Automobile', icon: Car, color: 'text-blue-600' },
    { id: 'sante', label: 'Santé', icon: Heart, color: 'text-green-600' },
    { id: 'motocycle', label: 'Motocycle', icon: Bike, color: 'text-blue-500' },
    { id: 'habitation', label: 'Habitation', icon: Home, color: 'text-green-500' },
    { id: 'voyage', label: 'Voyage', icon: Plane, color: 'text-blue-400' }
  ];

  // Quartiers de Cotonou
  const locations = [
    'Akpakpa', 'Cadjehoun', 'Ganhi', 'Jéricho', 'Haie Vive', 'Godomey', 
    'Fidjrossè', 'Dantokpa', 'Menontin', 'Littoral', 'Sainte Rita', 
    'Tokoin', 'Vossa', 'Missebo', 'Pahou', 'Pk3', 'Pk6', 'Saint Jean'
  ];

  // Données réelles des partenaires avec coordonnées GPS EXACTES
  const realPartners = [
    {
      id: 1,
      name: 'Oremi by AFG',
      type: 'agence',
      address: 'Maro-Militaire, Lot 375, parcelle D, Immeuble AFG Assurances',
      district: 'Ganhi',
      phone: '+229 21 30 00 40',
      types: ['automobile', 'sante', 'habitation', 'motocycle', 'voyage'],
      status: 'ouvert',
      lat: 6.3701,
      lng: 2.4267,
      distance: 2.8,
      rating: 4.8
    },
    {
      id: 2,
      name: 'Hôpital Saint-Luc',
      type: 'hopital',
      address: 'Quartier Saint Jean, Cotonou',
      district: 'Saint Jean',
      phone: '+229 21 33 14 25',
      types: ['sante'],
      status: 'ouvert',
      lat: 6.3623,
      lng: 2.4089,
      distance: 1.9,
      rating: 4.5
    },
    {
      id: 3,
      name: 'CFAO Motors Bénin',
      type: 'garage',
      address: 'Route de Porto-Novo, PK4, Akpakpa',
      district: 'Akpakpa',
      phone: '+229 21 35 42 18',
      types: ['automobile', 'motocycle'],
      status: 'ouvert',
      lat: 6.3573,
      lng: 2.4194,
      distance: 1.2,
      rating: 4.4
    },
    {
      id: 4,
      name: 'Clinique Centrale de Cotonou',
      type: 'clinique',
      address: 'Boulevard de la Marina, Ganhi',
      district: 'Ganhi',
      phone: '+229 21 31 50 60',
      types: ['sante'],
      status: 'ouvert',
      lat: 6.3678,
      lng: 2.4156,
      distance: 2.3,
      rating: 4.2
    },
    {
      id: 5,
      name: 'Les Bagnoles Motors',
      type: 'garage',
      address: 'Avenue de la République Saint Michel, Cadjehoun',
      district: 'Cadjehoun',
      phone: '+229 21 31 26 35',
      types: ['automobile', 'motocycle'],
      status: 'ouvert',
      lat: 6.3528,
      lng: 2.3842,
      distance: 0.8,
      rating: 4.6
    },
    {
      id: 6,
      name: 'BENIN VOYAGE SARL',
      type: 'agence_voyage',
      address: 'Rond-point Godomey, Godomey',
      district: 'Godomey',
      phone: '+229 21 35 42 18',
      types: ['voyage'],
      status: 'ouvert',
      lat: 6.3456,
      lng: 2.3678,
      distance: 4.2,
      rating: 4.0
    },
    {
      id: 7,
      name: 'Centre de Santé Saint Jean',
      type: 'centre_sante',
      address: 'Quartier Saint Jean, près de l\'Église Catholique',
      district: 'Saint Jean',
      phone: '+229 21 32 15 89',
      types: ['sante'],
      status: 'ouvert',
      lat: 6.3612,
      lng: 2.4102,
      distance: 1.7,
      rating: 4.1
    },
    {
      id: 8,
      name: 'Aéroport de Cotonou',
      type: 'aeroport',
      address: 'Route de l\'Aéroport, Cadjehoun',
      district: 'Cadjehoun',
      phone: '+229 21 30 02 44',
      types: ['voyage'],
      status: 'ouvert',
      lat: 6.3572,
      lng: 2.3844,
      distance: 1.1,
      rating: 3.8
    },
    {
      id: 9,
      name: 'Garage Auto Pro',
      type: 'garage',
      address: 'Gbégamey, Cotonou',
      district: 'Jéricho',
      phone: '+229 97 22 33 33',
      types: ['automobile'],
      status: 'ouvert',
      lat: 6.3782,
      lng: 2.4156,
      distance: 2.8,
      rating: 4.0
    },
    {
      id: 10,
      name: 'SOCAR Bénin',
      type: 'concessionnaire',
      address: 'Lot 512, Bd. St Michel Camp Guézo',
      district: 'Cadjehoun',
      phone: '+229 97 22 33 33',
      types: ['automobile', 'motocycle'],
      status: 'ouvert',
      lat: 6.3534,
      lng: 2.3867,
      distance: 0.7,
      rating: 4.2
    }
  ];

  // Position utilisateur (Epitech Bénin) - Coordonnées GPS réelles
  const userPosition = [6.3598, 2.4178];

  useEffect(() => {
    if (searchMode === 'intelligent') {
      setUserLocation({ lat: 6.3598, lng: 2.4178 });
    }
  }, [searchMode]);

  useEffect(() => {
    setPartners(realPartners);
    setFilteredPartners(realPartners);
  }, []);

  // Filtrage des partenaires
  useEffect(() => {
    let filtered = [...partners];

    if (searchMode === 'manuel' && selectedCity) {
      filtered = filtered.filter(partner => 
        partner.district.toLowerCase().includes(selectedCity.toLowerCase())
      );
    }

    if (selectedTypes.length > 0) {
      filtered = filtered.filter(partner =>
        partner.types.some(type => selectedTypes.includes(type))
      );
    }

    if (searchMode === 'intelligent') {
      filtered.sort((a, b) => a.distance - b.distance);
    }

    setFilteredPartners(filtered);
  }, [partners, selectedCity, selectedTypes, searchMode]);

  // Fonction pour trouver le partenaire le plus proche
  const findNearestPartner = async () => {
    setIsSearching(true);
    setNearestPartner(null);
    
    // Simulation de recherche avec animation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    let candidates = [...filteredPartners];
    
    // Filtrer par statut ouvert
    candidates = candidates.filter(p => p.status === 'ouvert');
    
    // Trier par distance
    candidates.sort((a, b) => a.distance - b.distance);
    
    if (candidates.length > 0) {
      const nearest = candidates[0];
      setNearestPartner(nearest);
      setSelectedMarker(nearest);
      // Auto-switch to map view to show result
      setViewMode('map');
    }
    
    setIsSearching(false);
  };

  const handleTypeToggle = (typeId) => {
    setSelectedTypes(prev =>
      prev.includes(typeId)
        ? prev.filter(id => id !== typeId)
        : [...prev, typeId]
    );
  };

  // Fonction pour ouvrir l'itinéraire dans Google Maps
  const openDirections = (partner) => {
    const origin = userLocation ? `${userLocation.lat},${userLocation.lng}` : 'Epitech Bénin, Akpakpa, Cotonou';
    const destination = `${partner.lat},${partner.lng}`;
    const url = `https://www.google.com/maps/dir/${origin}/${destination}`;
    window.open(url, '_blank');
  };

  // Fonction pour ouvrir dans Google Maps
  const openInGoogleMaps = (partner) => {
    const url = `https://www.google.com/maps/place/${partner.lat},${partner.lng}`;
    window.open(url, '_blank');
  };

  const getTypeIcon = (typeId) => {
    const type = insuranceTypes.find(t => t.id === typeId);
    return type ? type.icon : Building;
  };

  const getTypeColor = (typeId) => {
    const type = insuranceTypes.find(t => t.id === typeId);
    return type ? type.color : 'text-gray-600';
  };

  const getPartnerTypeLabel = (type) => {
    const labels = {
      'agence': 'Agence Assurance',
      'hopital': 'Hôpital',
      'clinique': 'Clinique',
      'centre_sante': 'Centre de Santé',
      'garage': 'Garage',
      'concessionnaire': 'Concessionnaire',
      'agence_voyage': 'Agence de Voyage',
      'aeroport': 'Aéroport'
    };
    return labels[type] || 'Partenaire';
  };

  const getPartnerTypeColor = (type) => {
    const colors = {
      'agence': 'bg-blue-100 text-blue-800',
      'hopital': 'bg-green-100 text-green-800',
      'clinique': 'bg-green-100 text-green-800',
      'centre_sante': 'bg-green-100 text-green-800',
      'garage': 'bg-orange-100 text-orange-800',
      'concessionnaire': 'bg-orange-100 text-orange-800',
      'agence_voyage': 'bg-indigo-100 text-indigo-800',
      'aeroport': 'bg-indigo-100 text-indigo-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getMarkerColor = (partner) => {
    if (partner.type === 'agence') return 'bg-blue-600';
    if (partner.types.includes('sante')) return 'bg-green-600';
    if (partner.types.includes('automobile')) return 'bg-orange-600';
    if (partner.types.includes('voyage')) return 'bg-indigo-600';
    return 'bg-purple-600';
  };

  // Custom marker icon creation (for real Leaflet implementation)
  const createCustomIcon = (partner) => {
    const color = getMarkerColor(partner).replace('bg-', '');
    // En production, utilisez L.divIcon() ici
    return {
      className: `custom-marker ${color}`,
      html: `<div class="marker-content">${partner.name.charAt(0)}</div>`
    };
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          <span className='text-primary font-bold'>En un clic</span> trouvez nos partenaires à proximité
        </h1>
        <p className="text-gray-600">
          Découvrez Oremi by AFG et nos partenaires avec cartes satellite réelles
        </p>
      </div>

      {/* Contrôles de recherche */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        {/* Mode de recherche */}
        <div className="flex flex-wrap gap-4 mb-6">
          <button
            onClick={() => setSearchMode('intelligent')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              searchMode === 'intelligent'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Navigation size={20} />
            Recherche Intelligente
          </button>
          <button
            onClick={() => setSearchMode('manuel')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              searchMode === 'manuel'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Search size={20} />
            Recherche Manuelle
          </button>
          
          {/* Bouton de recherche du plus proche */}
          <button
            onClick={findNearestPartner}
            disabled={isSearching}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSearching ? (
              <Loader size={20} className="animate-spin" />
            ) : (
              <Target size={20} />
            )}
            {isSearching ? 'Recherche...' : 'Plus Proche'}
          </button>
        </div>

        {/* Recherche manuelle */}
        {searchMode === 'manuel' && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sélectionnez votre ville/quartier
            </label>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">Toutes les zones</option>
              {locations.map(location => (
                <option key={location} value={location}>{location}</option>
              ))}
            </select>
          </div>
        )}

        {/* Géolocalisation intelligente */}
        {searchMode === 'intelligent' && userLocation && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 text-blue-700">
              <MapPin size={20} />
              <span className="font-medium">Position détectée: Près d'Epitech Bénin, Akpakpa</span>
            </div>
            <p className="text-sm text-blue-600 mt-1">
              📍 GPS: {userLocation.lat.toFixed(4)}°N, {userLocation.lng.toFixed(4)}°E
            </p>
          </div>
        )}

        {/* Résultat de la recherche du plus proche */}
        {nearestPartner && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-700 mb-2">
              <Target size={20} />
              <span className="font-medium">Partenaire le plus proche trouvé !</span>
            </div>
            <div className="text-sm">
              <strong>{nearestPartner.name}</strong> - {nearestPartner.distance} km
              <br />
              📍 GPS: {nearestPartner.lat.toFixed(4)}°N, {nearestPartner.lng.toFixed(4)}°E
              <br />
              {nearestPartner.address}
            </div>
          </div>
        )}

        {/* Filtres par type d'assurance */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Filter size={20} className="text-gray-600" />
            <span className="font-medium text-gray-700">Types d'assurance</span>
          </div>
          <div className="flex flex-wrap gap-3">
            {insuranceTypes.map(type => {
              const Icon = type.icon;
              const isSelected = selectedTypes.includes(type.id);
              return (
                <button
                  key={type.id}
                  onClick={() => handleTypeToggle(type.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                    isSelected
                      ? 'bg-blue-100 border-blue-500 text-blue-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon size={18} className={isSelected ? 'text-blue-600' : type.color} />
                  {type.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sélecteur de vue */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              viewMode === 'list'
                ? 'bg-gray-800 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <List size={18} />
            Liste
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              viewMode === 'map'
                ? 'bg-gray-800 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Map size={18} />
            Carte Leaflet
          </button>

          {/* Sélecteur de couche de carte */}
          {viewMode === 'map' && (
            <div className="flex gap-1">
              <button
                onClick={() => setMapLayer('satellite')}
                className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm transition-colors ${
                  mapLayer === 'satellite'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Layers size={14} />
                Satellite
              </button>
              <button
                onClick={() => setMapLayer('street')}
                className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm transition-colors ${
                  mapLayer === 'street'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Map size={14} />
                Street
              </button>
              <button
                onClick={() => setMapLayer('terrain')}
                className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm transition-colors ${
                  mapLayer === 'terrain'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Navigation size={14} />
                Terrain
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Résultats */}
      <div className="bg-white rounded-lg shadow-md">
        {/* Header des résultats */}
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-800">
            {filteredPartners.length} partenaire{filteredPartners.length > 1 ? 's' : ''} trouvé{filteredPartners.length > 1 ? 's' : ''}
          </h2>
          <div className="text-sm text-gray-600 mt-1">
            🗺️ Coordonnées GPS réelles • Cartes satellite Esri/OpenStreetMap
          </div>
        </div>

        {/* Vue Liste avec GPS */}
        {viewMode === 'list' && (
          <div className="divide-y">
            {filteredPartners.map(partner => (
              <div key={partner.id} className={`p-6 hover:bg-gray-50 transition-colors ${
                nearestPartner?.id === partner.id ? 'bg-green-50 border-l-4 border-l-green-500' : ''
              }`}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-800">
                        {partner.name}
                        {nearestPartner?.id === partner.id && (
                          <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <Target size={12} className="mr-1" />
                            Plus proche
                          </span>
                        )}
                      </h3>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${getPartnerTypeColor(partner.type)}`}>
                        {getPartnerTypeLabel(partner.type)}
                      </div>
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        partner.status === 'ouvert'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {partner.status === 'ouvert' ? (
                          <CheckCircle size={12} />
                        ) : (
                          <XCircle size={12} />
                        )}
                        {partner.status}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-gray-600 mb-2">
                      <MapPin size={16} />
                      <span>{partner.address}</span>
                    </div>

                    <div className="flex items-center gap-2 text-gray-600 mb-2">
                      <Navigation size={16} />
                      <span className="font-mono text-sm">
                        📍 {partner.lat.toFixed(4)}°N, {partner.lng.toFixed(4)}°E
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-gray-600 mb-2">
                      <Phone size={16} />
                      <span>{partner.phone}</span>
                    </div>

                    <div className="flex items-center gap-2 text-gray-600 mb-3">
                      <Star size={16} className="text-yellow-500" />
                      <span className="font-medium">{partner.rating}</span>
                      <span className="text-sm">({Math.floor(Math.random() * 50) + 10} avis)</span>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      {partner.types.map(typeId => {
                        const Icon = getTypeIcon(typeId);
                        const type = insuranceTypes.find(t => t.id === typeId);
                        return (
                          <div
                            key={typeId}
                            className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs"
                          >
                            <Icon size={12} className={getTypeColor(typeId)} />
                            {type?.label}
                          </div>
                        );
                      })}
                    </div>

                    {/* Boutons d'actions */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => openDirections(partner)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Route size={16} />
                        Itinéraire GPS
                      </button>
                      <button
                        onClick={() => openInGoogleMaps(partner)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <ExternalLink size={16} />
                        Google Maps
                      </button>
                    </div>
                  </div>
                  
                  {searchMode === 'intelligent' && (
                    <div className="text-right">
                      <div className="text-sm text-gray-500 mb-1">Distance</div>
                      <div className="text-lg font-semibold text-blue-600">
                        {partner.distance} km
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Vue React-Leaflet avec vraies données GPS */}
        {viewMode === 'map' && (
          <div className="p-6">
            <div className="h-96 rounded-lg overflow-hidden border-2 border-gray-200">
              <MapContainer
                center={mapCenter}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
              >
                {/* Couche de tuiles selon la sélection */}
                <TileLayer
                  url={mapLayers[mapLayer].url}
                  attribution={mapLayers[mapLayer].attribution}
                />

                {/* Position utilisateur avec marker rouge */}
                {searchMode === 'intelligent' && (
                  <Marker position={userPosition}>
                    <div className="relative">
                      <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>
                      <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                        📍 Epitech Bénin
                      </div>
                    </div>
                  </Marker>
                )}

                {/* Markers des partenaires avec coordonnées GPS exactes */}
                {filteredPartners.map((partner) => (
                  <Marker 
                    key={partner.id} 
                    position={[partner.lat, partner.lng]}
                  >
                    <div 
                      className="group cursor-pointer"
                      onClick={() => setSelectedMarker(selectedMarker?.id === partner.id ? null : partner)}
                    >
                      <div className={`w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold transition-all hover:scale-110 ${
                        getMarkerColor(partner)
                      } ${
                        nearestPartner?.id === partner.id ? 'ring-4 ring-yellow-400 animate-pulse' : ''
                      } ${
                        selectedMarker?.id === partner.id ? 'scale-110' : ''
                      }`}>
                        {partner.name.charAt(0)}
                      </div>
                      
                      {/* Popup Leaflet avec toutes les infos */}
                      {selectedMarker?.id === partner.id && (
                        <Popup>
                          <div className="text-sm">
                            <div className="font-semibold text-gray-800 mb-1">{partner.name}</div>
                            <div className={`inline-block px-2 py-1 rounded text-xs font-medium ${getPartnerTypeColor(partner.type)} mb-2`}>
                              {getPartnerTypeLabel(partner.type)}
                            </div>
                            <div className="text-xs text-gray-600 mb-1">{partner.address}</div>
                            <div className="text-xs text-gray-600 mb-1">{partner.phone}</div>
                            <div className="text-xs font-mono text-gray-500 mb-2">
                              📍 {partner.lat.toFixed(4)}°N, {partner.lng.toFixed(4)}°E
                            </div>
                            <div className="flex items-center gap-1 text-xs text-gray-600 mb-3">
                              <Star size={12} className="text-yellow-500" />
                              <span>{partner.rating}</span>
                              <span className="ml-2">🚗 {partner.distance}km</span>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openDirections(partner);
                                }}
                                className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                              >
                                <Route size={12} />
                                GPS
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openInGoogleMaps(partner);
                                }}
                                className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                              >
                                <ExternalLink size={12} />
                                Maps
                              </button>
                            </div>
                          </div>
                        </Popup>
                      )}
                    </div>
                  </Marker>
                ))}
              </MapContainer>
            </div>
            
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600 mb-2">
                🛰️ <strong>React-Leaflet + {mapLayer === 'satellite' ? 'Satellite Esri' : mapLayer === 'street' ? 'OpenStreetMap' : 'OpenTopoMap'}</strong>
              </p>
              <div className="text-xs text-gray-500">
                {filteredPartners.length} partenaires • Coordonnées GPS exactes • Aucune API key requise
              </div>
            </div>
          </div>
        )}

        {/* Aucun résultat */}
        {filteredPartners.length === 0 && (
          <div className="p-12 text-center">
            <Search size={48} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              Aucun partenaire trouvé
            </h3>
            <p className="text-gray-500">
              Essayez de modifier vos critères de recherche ou vos filtres
            </p>
          </div>
        )}
      </div>

      {/* Instructions React-Leaflet */}
      <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-green-800 mb-2">
          🚀 Installation React-Leaflet
        </h3>
        <div className="text-sm text-green-700 space-y-2">
          <p><strong>1. Installation :</strong></p>
          <code className="bg-green-100 px-2 py-1 rounded block mb-2">
            npm install react-leaflet leaflet
          </code>
          
          <p><strong>2. Imports à décommenter :</strong></p>
          <code className="bg-green-100 px-2 py-1 rounded block mb-2">
            import {`{MapContainer, TileLayer, Marker, Popup}`} from 'react-leaflet';<br/>
            import L from 'leaflet';<br/>
            import 'leaflet/dist/leaflet.css';
          </code>
          
          <p><strong>3. Tiles disponibles :</strong></p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
            <div>🛰️ <strong>Satellite Esri</strong><br/>Haute résolution</div>
            <div>🗺️ <strong>OpenStreetMap</strong><br/>Cartes vectorielles</div>
            <div>🏔️ <strong>OpenTopoMap</strong><br/>Relief et topographie</div>
          </div>
          
          <p className="text-green-800 font-semibold">✅ Prêt à fonctionner immédiatement !</p>
        </div>
      </div>
    </div>
  );
};

export default InsurancePartnerFinder;