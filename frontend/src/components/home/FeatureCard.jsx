// Composant réutilisable pour les cartes de service
const FeatureCard = ({ 
  title, 
  subtitle, 
  icon: Icon, 
  iconColor = "text-white",
  bgColor = "bg-blue-600/20",
  hoverBg = "hover:bg-blue-600/30" 
}) => {
  return (
    <div className={`${bgColor} ${hoverBg} backdrop-blur-sm rounded-2xl p-6 transition-all duration-300 cursor-pointer group border border-white/10`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-blue-200 text-sm mb-2 font-medium">{subtitle}</p>
          <h3 className="text-white text-lg font-semibold leading-tight">{title}</h3>
        </div>
        <div className="ml-4 flex-shrink-0">
          <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors duration-300">
            <Icon className={`w-8 h-8 ${iconColor}`} strokeWidth={1.5} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeatureCard;