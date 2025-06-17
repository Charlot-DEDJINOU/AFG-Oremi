const ProcessStep = ({ 
  icon: Icon, 
  title, 
  description, 
  iconColor = "text-teal-500",
  bgColor = "bg-teal-50" 
}) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
      <div className="flex flex-col items-center text-center">
        <div className={`${bgColor} p-4 rounded-xl mb-4`}>
          <Icon className={`w-8 h-8 ${iconColor}`} strokeWidth={1.5} />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-3">
          {title}
        </h3>
        <p className="text-gray-600 text-sm leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
};

export default ProcessStep;