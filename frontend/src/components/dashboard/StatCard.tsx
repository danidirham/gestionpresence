import { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  color: 'blue' | 'green' | 'red' | 'purple' | 'yellow';
  change?: {
    value: number;
    isPositive: boolean;
  };
}

const StatCard = ({ title, value, icon, color, change }: StatCardProps) => {
  const colorClasses = {
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-900',
      text: 'text-blue-700 dark:text-blue-300',
      iconBg: 'bg-blue-100 dark:bg-blue-800',
      iconText: 'text-blue-600 dark:text-blue-300',
    },
    green: {
      bg: 'bg-green-50 dark:bg-green-900',
      text: 'text-green-700 dark:text-green-300',
      iconBg: 'bg-green-100 dark:bg-green-800',
      iconText: 'text-green-600 dark:text-green-300',
    },
    red: {
      bg: 'bg-red-50 dark:bg-red-900',
      text: 'text-red-700 dark:text-red-300',
      iconBg: 'bg-red-100 dark:bg-red-800',
      iconText: 'text-red-600 dark:text-red-300',
    },
    purple: {
      bg: 'bg-purple-50 dark:bg-purple-900',
      text: 'text-purple-700 dark:text-purple-300',
      iconBg: 'bg-purple-100 dark:bg-purple-800',
      iconText: 'text-purple-600 dark:text-purple-300',
    },
    yellow: {
      bg: 'bg-yellow-50 dark:bg-yellow-900',
      text: 'text-yellow-700 dark:text-yellow-300',
      iconBg: 'bg-yellow-100 dark:bg-yellow-800',
      iconText: 'text-yellow-600 dark:text-yellow-300',
    },
  };

  const classes = colorClasses[color];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 transition-all hover:shadow-md">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{title}</p>
          <p className={`text-3xl font-bold ${classes.text}`}>{value}</p>

          {change && (
            <div className="mt-2 flex items-center">
              <span className={`text-xs font-medium ${change.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {change.isPositive ? '+' : ''}{change.value}%
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">vs. semaine précédente</span>
            </div>
          )}
        </div>

        <div className={`p-3 rounded-full ${classes.iconBg} ${classes.iconText}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export default StatCard;
