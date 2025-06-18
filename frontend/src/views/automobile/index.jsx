import React, { useState, useCallback } from 'react';
import { Upload, FileText, CreditCard, Car, Check, X, Camera, User, Calendar, MapPin, Settings, ChevronRight, Download, Shield, Receipt } from 'lucide-react';
import { postFile } from '../../services/api';
import { onServerError } from '../../services/Helper';
import { CardGrise } from '../../data/CardGrise';
import { convertDateToISO } from '../../utils/convertDateToISO';

const SmartInsuranceForm = () => {
    const [step, setStep] = useState(1);
    const [insuranceQuote, setInsuranceQuote] = useState(null);
    const [paymentStatus, setPaymentStatus] = useState(null);
    const [documents, setDocuments] = useState({
        carteGrise: null,
        identite: null,
        permis: null
    });
    const [extractedData, setExtractedData] = useState({
        carteGrise: null,
        identite: null,
        permis: null
    });
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState({});

    // Fonction de validation des types de documents
    const validateDocumentType = (detectedType, expectedType) => {
        if (!detectedType) return false;

        const normalizedDetected = detectedType.toLowerCase().trim();

        switch (expectedType) {
            case 'CIP':
                return normalizedDetected === 'cip';

            case 'CARTE_GRISE':
                const validCarteGriseTypes = [
                    'carte grise',
                    'attestation d\'immatriculation',
                    'certificat d\'immatriculation'
                ];
                return validCarteGriseTypes.some(type => normalizedDetected.includes(type));

            case 'PERMIS':
                return normalizedDetected.includes('permis de conduire');

            default:
                return false;
        }
    };

    // Appel API OCR
    const processDocument = async (file, type) => {
        setLoading(prev => ({ ...prev, [type]: true }));

        let mockData = {};
        let file_type = "";

        if (type === 'carteGrise') {
            file_type = "grise_card"
        } else if (type === 'identite') {
            file_type = "id_card"
        } else if (type === 'permis') {
            file_type = type;
        }

        try {
            const res = await postFile('/cards/extract/', { file, file_type });
            mockData = res.data;
            console.log(res.data)
        } catch (error) {
            onServerError("Une erreur est survenue");
            console.log(error);
        }

        setExtractedData(prev => ({ ...prev, [type]: mockData }));
        setLoading(prev => ({ ...prev, [type]: false }));

        // Auto-fill form data
        updateFormData(mockData, type);
    };

    const updateFormData = (data, type) => {
        const updates = {};

        if (type === 'carteGrise') {
            let tmp = CardGrise();
            updates.immatriculation = data.immatriculation || tmp.immatriculation;
            updates.marque = data.marque || tmp.marque;
            updates.modele = data.modele || tmp.modele;
            updates.puissanceFiscale = data.puissanceFiscale || tmp.puissanceFiscale;
            updates.numeroChasis = data.numeroVIN || tmp.numeroChasis;
            updates.dateMiseCirculation = convertDateToISO(data.datePremiereImmatriculation || tmp.datePremiereImmatriculation);
            updates.placesAssises = data.nombrePlacesAssises || tmp.nombrePlacesAssises;
            updates.carburation = data.carburant || tmp.carburant;
        } else if (type === 'identite') {
            updates.nom = data.titulaire_nom;
            updates.prenom = data.titulaire_prenom;
            updates.dateNaissance = convertDateToISO(data.dateNaissance);
            updates.sexe = data.sexe;
            updates.adresse = data.com + " - " + data.arr + " - " + data.lieu;
            updates.npi = data.numeroDocument;
            updates.ville = data.arr ;
        } else if (type === 'permis') {
            updates.numeroPermis = data.numeroPermis;
            updates.categoriePermis = data.categorie;
            updates.dateObtentionPermis = convertDateToISO(data.dateDelivrance);
        }

        setFormData(prev => ({ ...prev, ...updates }));
    };

    const handleFileUpload = useCallback((e, type) => {
        const file = e.target.files[0];
        if (file) {
            setDocuments(prev => ({ ...prev, [type]: file }));
            processDocument(file, type);
        }
    }, []);

    const DocumentUploadCard = ({ type, title, icon: Icon, description, expectedType }) => {
        const doc = documents[type];
        const isProcessing = loading[type];
        const hasData = extractedData[type];
        const documentTypeError = hasData && expectedType && !validateDocumentType(extractedData[type]?.typeDocument, expectedType);

        const getExpectedTypeLabel = (expectedType) => {
            switch (expectedType) {
                case 'CIP':
                    return 'CIP';
                case 'CARTE_GRISE':
                    return 'Carte Grise/Certificat d\'immatriculation';
                case 'PERMIS':
                    return 'Permis de conduire';
                default:
                    return expectedType;
            }
        };

        return (
            <div className={`border-2 border-dashed rounded-xl p-6 transition-colors ${documentTypeError ? 'border-red-300 bg-red-50' :
                    hasData && !documentTypeError ? 'border-green-300 bg-green-50' :
                        'border-gray-300 hover:border-blue-500'
                }`}>
                <div className="text-center">
                    <Icon className={`mx-auto h-12 w-12 mb-4 ${documentTypeError ? 'text-red-500' :
                            hasData && !documentTypeError ? 'text-green-500' :
                                'text-gray-400'
                        }`} />
                    <h3 className="text-lg font-semibold mb-2">{title}</h3>
                    <p className="text-sm text-gray-600 mb-4">{description}</p>

                    {documentTypeError && (
                        <div className="bg-red-100 border border-red-300 rounded-lg p-3 mb-4">
                            <div className="flex items-center gap-2 text-red-800">
                                <X size={16} />
                                <span className="font-medium">Type de document incorrect</span>
                            </div>
                            <p className="text-red-700 text-xs mt-1">
                                Attendu: {getExpectedTypeLabel(expectedType)} | Détecté: {extractedData[type]?.typeDocument || 'Non reconnu'}
                            </p>
                        </div>
                    )}

                    {!doc && (
                        <label className="cursor-pointer">
                            <input
                                type="file"
                                accept="image/*,.pdf"
                                onChange={(e) => handleFileUpload(e, type)}
                                className="hidden"
                            />
                            <div className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2">
                                <Upload size={16} />
                                Choisir le fichier
                            </div>
                        </label>
                    )}

                    {doc && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                                <FileText size={16} />
                                {doc.name}
                            </div>

                            {isProcessing && (
                                <div className="flex items-center justify-center gap-2 text-blue-600">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                    Analyse en cours...
                                </div>
                            )}

                            {hasData && !isProcessing && !documentTypeError && (
                                <div className="flex items-center justify-center gap-2 text-green-600">
                                    <Check size={16} />
                                    Données extraites avec succès
                                </div>
                            )}

                            {hasData && !isProcessing && documentTypeError && (
                                <div className="flex items-center justify-center gap-2 text-red-600">
                                    <X size={16} />
                                    Document non valide
                                </div>
                            )}

                            <button
                                onClick={() => {
                                    setDocuments(prev => ({ ...prev, [type]: null }));
                                    setExtractedData(prev => ({ ...prev, [type]: null }));
                                }}
                                className="text-sm text-red-600 hover:text-red-700"
                            >
                                Remplacer
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const FormField = ({ label, value, onChange, type = "text", required = false, options = null }) => (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            {options ? (
                <select
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                    <option value="">Sélectionner...</option>
                    {options.map(option => (
                        <option key={option} value={option}>{option}</option>
                    ))}
                </select>
            ) : (
                <input
                    type={type}
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
            )}
        </div>
    );

    const isAllDocumentsValid = () => {
        const expectedTypes = { carteGrise: 'CARTE_GRISE', identite: 'CIP', permis: 'PERMIS' };

        return Object.entries(expectedTypes).every(([docType, expectedType]) => {
            const data = extractedData[docType];
            return data && validateDocumentType(data.typeDocument, expectedType);
        });
    };

    const renderStep1 = () => (
        <div className="space-y-8">
            <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Upload vos documents</h2>
                <p className="text-gray-600 mb-2">Téléchargez vos 3 documents pour une extraction automatique des données</p>
                <p className="text-sm text-blue-600 font-medium mb-8">⚠️ Important: La Carte CIP doit être celle du bénéficiaire de l'assurance</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                <DocumentUploadCard
                    type="carteGrise"
                    title="Carte Grise"
                    icon={Car}
                    description="Certificat d'immatriculation de votre véhicule"
                    expectedType="CARTE_GRISE"
                />
                <DocumentUploadCard
                    type="identite"
                    title="Carte CIP"
                    icon={CreditCard}
                    description="Carte d'Identité Personnelle (CIP) du bénéficiaire uniquement"
                    expectedType="CIP"
                />
                <DocumentUploadCard
                    type="permis"
                    title="Permis de Conduire"
                    icon={FileText}
                    description="Permis de conduire du bénéficiaire"
                    expectedType="PERMIS"
                />
            </div>

            {isAllDocumentsValid() && (
                <div className="text-center">
                    <button
                        onClick={() => setStep(2)}
                        className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                    >
                        Continuer vers le formulaire
                    </button>
                </div>
            )}

            {Object.values(extractedData).some(data => data) && !isAllDocumentsValid() && (
                <div className="text-center">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-md mx-auto">
                        <div className="flex items-center gap-2 text-yellow-800">
                            <X size={16} />
                            <span className="font-medium">Documents manquants ou incorrects</span>
                        </div>
                        <p className="text-yellow-700 text-sm mt-1">
                            Veuillez vous assurer que tous les documents sont du bon type avant de continuer
                        </p>
                    </div>
                </div>
            )}
        </div>
    );

    const renderStep2 = () => (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold text-gray-900">Vérification et Complétion</h2>
                <button
                    onClick={() => setStep(1)}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                >
                    ← Retour aux documents
                </button>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-800">
                    <Check size={20} />
                    <span className="font-medium">Données extraites automatiquement</span>
                </div>
                <p className="text-green-700 text-sm mt-1">
                    Vérifiez les informations ci-dessous et complétez les champs manquants
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Informations Véhicule */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2 text-lg font-semibold text-gray-900 border-b pb-2">
                        <Car size={20} />
                        Informations Véhicule
                    </div>

                    <FormField
                        label="Numéro d'immatriculation"
                        value={formData.immatriculation}
                        onChange={(val) => setFormData(prev => ({ ...prev, immatriculation: val }))}
                        required
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            label="Marque"
                            value={formData.marque}
                            onChange={(val) => setFormData(prev => ({ ...prev, marque: val }))}
                            required
                        />
                        <FormField
                            label="Modèle"
                            value={formData.modele}
                            onChange={(val) => setFormData(prev => ({ ...prev, modele: val }))}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            label="Puissance fiscale"
                            value={formData.puissanceFiscale}
                            onChange={(val) => setFormData(prev => ({ ...prev, puissanceFiscale: val }))}
                            required
                        />
                        <FormField
                            label="Nombre de places"
                            value={formData.placesAssises}
                            onChange={(val) => setFormData(prev => ({ ...prev, placesAssises: val }))}
                            required
                        />
                    </div>

                    <FormField
                        label="Numéro de châssis"
                        value={formData.numeroChasis}
                        onChange={(val) => setFormData(prev => ({ ...prev, numeroChasis: val }))}
                        required
                    />

                    <FormField
                        label="Date de mise en circulation"
                        value={formData.dateMiseCirculation}
                        onChange={(val) => setFormData(prev => ({ ...prev, dateMiseCirculation: val }))}
                        type="date"
                        required
                    />

                    <FormField
                        label="Carburation"
                        value={formData.carburation}
                        onChange={(val) => setFormData(prev => ({ ...prev, carburation: val }))}
                        options={['ESSENCE', 'DIESEL', 'ELECTRIQUE', 'HYBRIDE']}
                        required
                    />

                    <FormField
                        label="Valeur du véhicule (FCFA)"
                        value={formData.valeurVehicule}
                        onChange={(val) => setFormData(prev => ({ ...prev, valeurVehicule: val }))}
                        type="number"
                        required
                    />

                    <FormField
                        label="Valeur vénale (FCFA)"
                        value={formData.valeurVenale}
                        onChange={(val) => setFormData(prev => ({ ...prev, valeurVenale: val }))}
                        type="number"
                        required
                    />
                </div>

                {/* Informations Bénéficiaire */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2 text-lg font-semibold text-gray-900 border-b pb-2">
                        <User size={20} />
                        Informations Bénéficiaire (CIP requis)
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            label="Nom"
                            value={formData.nom}
                            onChange={(val) => setFormData(prev => ({ ...prev, nom: val }))}
                            required
                        />
                        <FormField
                            label="Prénom"
                            value={formData.prenom}
                            onChange={(val) => setFormData(prev => ({ ...prev, prenom: val }))}
                            required
                        />
                    </div>

                    <FormField
                        label="Email"
                        value={formData.email}
                        onChange={(val) => setFormData(prev => ({ ...prev, email: val }))}
                        type="email"
                        required
                    />

                    <FormField
                        label="NPI (Numéro Personnel d'Identification)"
                        value={formData.npi}
                        onChange={(val) => setFormData(prev => ({ ...prev, npi: val }))}
                        required
                    />

                    <FormField
                        label="Date de naissance"
                        value={formData.dateNaissance}
                        onChange={(val) => setFormData(prev => ({ ...prev, dateNaissance: val }))}
                        type="date"
                        required
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            label="Sexe"
                            value={formData.sexe}
                            onChange={(val) => setFormData(prev => ({ ...prev, sexe: val }))}
                            options={['M', 'F']}
                            required
                        />
                        <FormField
                            label="Profession"
                            value={formData.profession}
                            onChange={(val) => setFormData(prev => ({ ...prev, profession: val }))}
                            required
                        />
                    </div>

                    <FormField
                        label="Adresse"
                        value={formData.adresse}
                        onChange={(val) => setFormData(prev => ({ ...prev, adresse: val }))}
                        required
                    />

                    <FormField
                        label="Ville/Commune"
                        value={formData.ville}
                        onChange={(val) => setFormData(prev => ({ ...prev, ville: val }))}
                        required
                    />

                    <FormField
                        label="Date d'obtention du permis"
                        value={formData.dateObtentionPermis}
                        onChange={(val) => setFormData(prev => ({ ...prev, dateObtentionPermis: val }))}
                        type="date"
                        required
                    />

                    <FormField
                        label="Numéro de permis"
                        value={formData.numeroPermis}
                        onChange={(val) => setFormData(prev => ({ ...prev, numeroPermis: val }))}
                        required
                    />

                    <FormField
                        label="Catégorie socio-professionnelle"
                        value={formData.categorieSocio}
                        onChange={(val) => setFormData(prev => ({ ...prev, categorieSocio: val }))}
                        options={['Employé', 'Cadre', 'Commerçant', 'Artisan', 'Fonctionnaire', 'Étudiant', 'Retraité', 'Autre']}
                        required
                    />

                    <FormField
                        label="Durée d'assurance souhaitée"
                        value={formData.dureeAssurance}
                        onChange={(val) => setFormData(prev => ({ ...prev, dureeAssurance: val }))}
                        options={['6 mois', '1 an', '2 ans']}
                        required
                    />

                    <FormField
                        label="Date de prise d'effet"
                        value={formData.datePriseEffet}
                        onChange={(val) => setFormData(prev => ({ ...prev, datePriseEffet: val }))}
                        type="date"
                        required
                    />
                </div>
            </div>

            <div className="text-center pt-6">
                <button
                    onClick={() => {
                        // Simulation du calcul du devis
                        const mockQuote = {
                            vehicule: `${formData.marque} ${formData.modele}`,
                            immatriculation: formData.immatriculation,
                            garanties: "Garanties de base",
                            montantTotal: "49 719",
                            reference: `AGF-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
                        };
                        setInsuranceQuote(mockQuote);
                        setStep(3);
                    }}
                    className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold"
                >
                    Obtenir le devis
                </button>
            </div>
        </div>
    );

    const renderStep3 = () => (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold text-gray-900">Récapitulatif du dossier</h2>
                <button
                    onClick={() => setStep(2)}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                >
                    ← Retour au formulaire
                </button>
            </div>

            {/* Header avec véhicule et prix */}
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl p-6 text-white">
                <div className="flex justify-between items-center">
                    <div>
                        <p className="text-purple-200 text-sm mb-1">Récapitulatif du dossier</p>
                        <h3 className="text-2xl font-bold">{insuranceQuote?.vehicule}</h3>
                    </div>
                    <div className="text-right">
                        <p className="text-3xl font-bold">{insuranceQuote?.montantTotal} XOF</p>
                    </div>
                </div>
            </div>

            {/* Garanties */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                    <h4 className="text-lg font-semibold text-gray-900">Garanties de base</h4>
                    <ChevronRight className="text-gray-400" size={20} />
                </div>
            </div>

            {/* Informations du véhicule */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-900">Informations du véhicule</h4>
                    <button className="text-gray-400">
                        <ChevronRight size={20} />
                    </button>
                </div>

                <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                        <span className="text-gray-600">Immatriculation</span>
                        <span className="font-medium">{formData.immatriculation}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">Marque</span>
                        <span className="font-medium">{formData.marque}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">Modèle</span>
                        <span className="font-medium">{formData.modele}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">Puissance fiscale</span>
                        <span className="font-medium">{formData.puissanceFiscale} CV</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">Nbr de place</span>
                        <span className="font-medium">{formData.placesAssises}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">Catégorie socio professionnelle</span>
                        <span className="font-medium">{formData.categorieSocio || 'Cat. 1 (Voyageurs Représentants Placiers (VRP))'}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">Carburation</span>
                        <span className="font-medium">{formData.carburation}</span>
                    </div>
                </div>
            </div>

            {/* Total à payer */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">Total à payer</span>
                    <span className="text-2xl font-bold text-gray-900">{insuranceQuote?.montantTotal} FCFA</span>
                </div>
            </div>

            <div className="flex gap-4">
                <button
                    onClick={() => setStep(2)}
                    className="flex-1 bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center justify-center gap-2"
                >
                    Retour
                </button>
                <button
                    onClick={() => setStep(4)}
                    className="flex-1 bg-blue-900 text-white px-6 py-3 rounded-lg hover:bg-blue-800 transition-colors font-semibold"
                >
                    Valider et Continuer
                </button>
            </div>
        </div>
    );

    const renderStep4 = () => (
        <div className="space-y-8">
            <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900 mb-8">Déclaration sur l'honneur</h2>
            </div>

            <div className="space-y-6">
                {/* Déclaration principale */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <p className="text-gray-700 leading-relaxed">
                        Je soussigné(e) <span className="font-semibold">{formData.nom} {formData.prenom}</span> et <span className="font-semibold">Chef d'entreprise</span>, né le <span className="font-semibold">{formData.dateNaissance}</span> atteste que les informations fournies ci-haut sont correctes et m'engage personnellement.
                    </p>
                    <br />
                    <p className="text-gray-700 leading-relaxed">
                        J'atteste également être conscient qu'en cas de fausses déclarations, des dispositions légales seront prises conformément aux articles du code de la CIMA ci-contre :
                    </p>
                </div>

                {/* Article légal */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-blue-700 font-semibold text-lg mb-4">Article No 18 : Fausse déclaration intentionnelle : sanctions</h3>
                    <p className="text-gray-700 text-sm leading-relaxed">
                        Indépendamment des causes ordinaires de nullité, et sous réserve des dispositions de l'article 80, le contrat d'assurance est nul en cas de réticence ou de fausse déclaration intentionnelle de la part de l'assuré, quand cette réticence ou cette fausse déclaration change l'objet du risque ou en diminue l'opinion pour l'assureur, alors même que le risque omis ou dénaturé par l'assuré a été sans influence sur le sinistre. Les primes payées demeurent alors acquises à l'assureur, qui a droit au paiement de toutes les primes échues à titre de dommages et intérêts. Les dispositions du second alinéa du présent article ne sont pas applicables aux assurances sur la vie.
                    </p>
                </div>
            </div>

            <div className="flex gap-4">
                <button
                    onClick={() => setStep(3)}
                    className="flex-1 bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center justify-center gap-2"
                >
                    Retour
                </button>
                <button
                    onClick={() => setStep(5)}
                    className="flex-1 bg-purple-700 text-white px-6 py-3 rounded-lg hover:bg-purple-800 transition-colors font-semibold"
                >
                    J'approuve
                </button>
            </div>
        </div>
    );

    const renderStep5 = () => (
        <div className="space-y-8">
            <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900 mb-8">Paiement sécurisé</h2>
            </div>

            {/* Récap du montant */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <div className="flex justify-between items-center">
                    <div>
                        <p className="text-blue-800 font-medium">Montant à payer</p>
                        <p className="text-sm text-blue-600">{insuranceQuote?.vehicule}</p>
                    </div>
                    <p className="text-2xl font-bold text-blue-900">{insuranceQuote?.montantTotal} FCFA</p>
                </div>
            </div>

            {/* Widget Kkiapay (simulation) */}
            <div className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-8">
                <div className="text-center space-y-4">
                    <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                        <CreditCard className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">Paiement Kkiapay</h3>
                    <p className="text-gray-600">Plateforme de paiement sécurisée</p>

                    {/* Simulation du widget Kkiapay */}
                    <div className="bg-gray-50 rounded-lg p-6 border">
                        <p className="text-sm text-gray-600 mb-4">Modes de paiement disponibles:</p>
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="bg-white border rounded-lg p-3 text-center">
                                <p className="text-sm font-medium">Mobile Money</p>
                            </div>
                            <div className="bg-white border rounded-lg p-3 text-center">
                                <p className="text-sm font-medium">Carte bancaire</p>
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                // Simulation du paiement
                                setPaymentStatus('success');
                                setTimeout(() => setStep(6), 2000);
                            }}
                            className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                        >
                            {paymentStatus === 'success' ? 'Paiement réussi ✓' : `Payer ${insuranceQuote?.montantTotal} FCFA`}
                        </button>
                    </div>
                </div>
            </div>

            {paymentStatus === 'success' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-green-800">
                        <Check size={20} />
                        <span className="font-medium">Paiement effectué avec succès!</span>
                    </div>
                    <p className="text-green-700 text-sm mt-1">
                        Redirection vers vos documents en cours...
                    </p>
                </div>
            )}

            <div className="flex gap-4">
                <button
                    onClick={() => setStep(4)}
                    className="flex-1 bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    disabled={paymentStatus === 'success'}
                >
                    Retour
                </button>
            </div>
        </div>
    );

    const renderStep6 = () => (
        <div className="space-y-8">
            <div className="text-center">
                <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                    <Check className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Félicitations !</h2>
                <p className="text-gray-600 text-lg mb-8">
                    Votre assurance automobile a été souscrite avec succès.<br />
                    Vos documents sont prêts à télécharger.
                </p>
            </div>

            {/* Référence */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                <h3 className="font-semibold text-blue-900 mb-2">Référence de votre police</h3>
                <p className="text-blue-700 font-mono text-xl">{insuranceQuote?.reference}</p>
            </div>

            {/* Documents disponibles */}
            <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Vos documents d'assurance</h3>

                <div className="grid gap-4">
                    <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Shield className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">e-Attestation d'assurance</p>
                                <p className="text-sm text-gray-500">Document officiel de couverture</p>
                            </div>
                        </div>
                        <button className="text-blue-600 hover:text-blue-700">
                            <Download size={20} />
                        </button>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                <FileText className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">Conditions particulières</p>
                                <p className="text-sm text-gray-500">Détails spécifiques de votre contrat</p>
                            </div>
                        </div>
                        <button className="text-blue-600 hover:text-blue-700">
                            <Download size={20} />
                        </button>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                <Receipt className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">Reçu d'encaissement</p>
                                <p className="text-sm text-gray-500">Preuve de paiement de la prime</p>
                            </div>
                        </div>
                        <button className="text-blue-600 hover:text-blue-700">
                            <Download size={20} />
                        </button>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                <FileText className="w-5 h-5 text-gray-600" />
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">Conditions générales</p>
                                <p className="text-sm text-gray-500">Clauses générales du contrat</p>
                            </div>
                        </div>
                        <button className="text-blue-600 hover:text-blue-700">
                            <Download size={20} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex gap-4">
                <button
                    onClick={() => {
                        setStep(1);
                        setDocuments({ carteGrise: null, identite: null, permis: null });
                        setExtractedData({ carteGrise: null, identite: null, permis: null });
                        setFormData({});
                        setInsuranceQuote(null);
                        setPaymentStatus(null);
                    }}
                    className="flex-1 bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                >
                    Nouvelle souscription
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-6xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold text-gray-900">Devis Automobile</h1>
                        <div className="flex items-center space-x-4">
                            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${step >= 1 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-500'}`}>
                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-400 text-white'}`}>1</span>
                                Documents
                            </div>
                            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${step >= 2 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-500'}`}>
                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-400 text-white'}`}>2</span>
                                Formulaire
                            </div>
                            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${step >= 3 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-500'}`}>
                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-400 text-white'}`}>3</span>
                                Devis
                            </div>
                            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${step >= 4 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-500'}`}>
                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${step >= 4 ? 'bg-blue-600 text-white' : 'bg-gray-400 text-white'}`}>4</span>
                                Déclaration
                            </div>
                            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${step >= 5 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-500'}`}>
                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${step >= 5 ? 'bg-blue-600 text-white' : 'bg-gray-400 text-white'}`}>5</span>
                                Paiement
                            </div>
                            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${step >= 6 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${step >= 6 ? 'bg-green-600 text-white' : 'bg-gray-400 text-white'}`}>6</span>
                                Documents
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-6xl mx-auto px-6 py-8">
                {step === 1 && renderStep1()}
                {step === 2 && renderStep2()}
                {step === 3 && renderStep3()}
                {step === 4 && renderStep4()}
                {step === 5 && renderStep5()}
                {step === 6 && renderStep6()}
            </div>
        </div>
    );
};

export default SmartInsuranceForm;