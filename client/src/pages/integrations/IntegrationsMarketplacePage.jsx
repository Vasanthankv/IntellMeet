import React from 'react';
import IntegrationsWorkspace from '../../components/integrations/IntegrationsWorkspace';

export default function IntegrationsMarketplacePage() {
  return (
    <div className="min-h-screen bg-[#1E1E1E] text-white p-6 sm:p-8 lg:p-10 font-sans">
      <div className="max-w-6xl mx-auto">
        <IntegrationsWorkspace />
      </div>
    </div>
  );
}
