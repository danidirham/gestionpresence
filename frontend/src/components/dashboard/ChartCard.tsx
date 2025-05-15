import { ReactNode } from 'react';
import { FileSpreadsheet, FileText, RefreshCw } from 'lucide-react';

interface ChartCardProps {
  title: string;
  children: ReactNode;
  className?: string;
  onExport?: (format: 'xlsx' | 'csv' | 'pdf') => void;
  onRefresh?: () => void;
  isLoading?: boolean;
}

const ChartCard = ({
  title,
  children,
  className = '',
  onExport,
  onRefresh,
  isLoading = false
}: ChartCardProps) => {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">{title}</h2>

        <div className="flex items-center space-x-2">
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className={`p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 ${isLoading ? 'animate-spin' : ''}`}
              title="Rafraîchir les données"
            >
              <RefreshCw size={16} />
            </button>
          )}

          {onExport && (
            <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
              <button
                onClick={() => onExport('xlsx')}
                className="px-2 py-1 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 flex items-center border-r border-gray-300 dark:border-gray-600"
                title="Exporter en Excel"
              >
                <FileSpreadsheet className="text-green-600 dark:text-green-400" size={14} />
              </button>
              <button
                onClick={() => onExport('csv')}
                className="px-2 py-1 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 flex items-center border-r border-gray-300 dark:border-gray-600"
                title="Exporter en CSV"
              >
                <FileText className="text-blue-600 dark:text-blue-400" size={14} />
              </button>
              <button
                onClick={() => onExport('pdf')}
                className="px-2 py-1 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 flex items-center"
                title="Exporter en PDF"
              >
                <FileText className="text-red-600 dark:text-red-400" size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="h-64 relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white/50 dark:bg-gray-800/50 flex items-center justify-center z-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
          </div>
        )}
        {children}
      </div>
    </div>
  );
};

export default ChartCard;
