import React from 'react';

const NewsList = ({ news }) => {
  if (!news || news.length === 0) {
    return <div className="text-gray-500 py-4">No recent news available.</div>;
  }

  return (
    <div className="space-y-4">
      {news.map((item, index) => (
        <a 
          key={index} 
          href={item.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="block p-4 rounded-lg bg-gray-750 hover:bg-gray-700 border border-gray-700 transition-colors duration-200"
        >
          <div className="flex justify-between items-start">
            <h4 className="text-md font-medium text-blue-400 hover:text-blue-300 line-clamp-2">
              {item.title}
            </h4>
          </div>
          <p className="text-sm text-gray-400 mt-2 line-clamp-2">
            {item.description}
          </p>
          <div className="flex justify-between items-center mt-3 text-xs text-gray-500">
            <span>{item.source}</span>
            <span>{new Date(item.published_at).toLocaleDateString()}</span>
          </div>
        </a>
      ))}
    </div>
  );
};

export default NewsList;
