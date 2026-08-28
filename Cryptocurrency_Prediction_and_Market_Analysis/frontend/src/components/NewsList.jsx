import React from 'react';
import { ExternalLink, Globe, Clock } from 'lucide-react';

const NewsList = ({ news }) => {
  if (!news || news.length === 0) {
    return <div className="text-gray-500 py-4 text-center">No recent news available.</div>;
  }

  // Helper to format date nicely
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffHours = Math.floor((now - date) / (1000 * 60 * 60));
      
      if (diffHours < 24) {
        return `${diffHours}h ago`;
      }
      return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
    } catch {
      return dateString;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {news.slice(0, 6).map((item, index) => (
        <a 
          key={index} 
          href={item.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="group block bg-[#0a0e17] border border-gray-800 hover:border-blue-500/50 rounded-xl p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_4px_20px_rgba(59,130,246,0.1)]"
        >
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-medium text-blue-400 bg-blue-500/10 px-2 py-1 rounded flex items-center">
              <Globe className="w-3 h-3 mr-1" />
              {item.source}
            </span>
            <ExternalLink className="w-4 h-4 text-gray-500 group-hover:text-blue-400 transition-colors" />
          </div>
          
          <h4 className="text-gray-200 font-medium text-sm line-clamp-2 mb-3 group-hover:text-blue-100 transition-colors">
            {item.title}
          </h4>
          
          <div className="flex items-center text-xs text-gray-500 mt-auto">
            <Clock className="w-3 h-3 mr-1" />
            {formatDate(item.published_at)}
          </div>
        </a>
      ))}
    </div>
  );
};

export default NewsList;
