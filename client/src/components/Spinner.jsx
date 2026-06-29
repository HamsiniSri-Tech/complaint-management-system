const Spinner = ({ size = 'md', color = 'primary', fullScreen = false }) => {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-4',
    xl: 'w-16 h-16 border-4',
  };

  const colors = {
    primary: 'border-primary-600',
    white:   'border-white',
    gray:    'border-gray-400',
  };

  const spinner = (
    <div
      className={`
        ${sizes[size]}
        ${colors[color]}
        rounded-full
        border-t-transparent
        animate-spin
      `}
    />
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-80 flex items-center
                      justify-center z-50">
        <div className="flex flex-col items-center gap-3">
          {spinner}
          <p className="text-sm text-gray-500 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return spinner;
};

export default Spinner;