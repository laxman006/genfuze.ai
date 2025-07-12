import React, { useState } from 'react';
import { BarChart3, User, Plus, Trash2 } from 'lucide-react';

// Static competitor mapping for cloudfuze.com
const STATIC_COMPETITORS: Record<string, { domain: string; type: string; shareOfVoice: number; mentionRate: number; avgRanking: number }[]> = {
  'cloudfuze.com': [
    { domain: 'aws.amazon.com', type: 'Organic', shareOfVoice: 6.05, mentionRate: 64.84, avgRanking: 2.27 },
    { domain: 'azure.microsoft.com', type: 'Organic', shareOfVoice: 5.52, mentionRate: 59.11, avgRanking: 2.88 },
    { domain: 'cloud.google.com', type: 'Organic', shareOfVoice: 5.23, mentionRate: 55.99, avgRanking: 3.38 },
    { domain: 'cloudenure.com', type: 'Organic', shareOfVoice: 3.96, mentionRate: 42.45, avgRanking: 4.76 },
    { domain: 'ibm.com', type: 'Organic', shareOfVoice: 3.31, mentionRate: 35.42, avgRanking: 4.59 },
    { domain: 'carbonite.com', type: 'Organic', shareOfVoice: 2.77, mentionRate: 29.69, avgRanking: 5.19 },
    { domain: 'cloudfuze.com', type: 'Selected', shareOfVoice: 2.07, mentionRate: 22.14, avgRanking: 3.02 },
    { domain: 'bittitan.com', type: 'Selected', shareOfVoice: 1.68, mentionRate: 17.97, avgRanking: 3.58 },
    { domain: 'rackspace.com', type: 'Organic', shareOfVoice: 1.63, mentionRate: 17.45, avgRanking: 7.05 },
    { domain: 'accenture.com', type: 'Organic', shareOfVoice: 1.47, mentionRate: 15.76, avgRanking: 5.05 },
    { domain: 'avepoint.com', type: 'Selected', shareOfVoice: 1.15, mentionRate: 12.37, avgRanking: 4.46 },
    { domain: 'cloudiway.com', type: 'Selected', shareOfVoice: 0.79, mentionRate: 8.46, avgRanking: 3.45 },
    { domain: 'sharegate.com', type: 'Selected', shareOfVoice: 0.51, mentionRate: 5.47, avgRanking: 5.33 },
    { domain: 'multcloud.com', type: 'Selected', shareOfVoice: 0.27, mentionRate: 2.86, avgRanking: 3.69 },
    { domain: 'cloudhq.net', type: 'Selected', shareOfVoice: 0.18, mentionRate: 1.95, avgRanking: 5.33 },
  ],
};

function getInitialCompetitors(mainDomain: string) {
  return STATIC_COMPETITORS[mainDomain]?.map((c, i) => ({ ...c, rank: i + 1 })) || [];
}

export function CompetitorBenchmarking({ competitorDomains }: { competitorDomains?: string[] }) {
  // Use the first provided domain as the main brand
  const mainDomain = competitorDomains && competitorDomains.length > 0 ? competitorDomains[0] : 'cloudfuze.com';
  const [competitors, setCompetitors] = useState(getInitialCompetitors(mainDomain));
  const [newDomain, setNewDomain] = useState('');
  const [newType, setNewType] = useState('Selected');

  const addCompetitor = () => {
    if (!newDomain.trim() || competitors.some(c => c.domain === newDomain.trim())) return;
    setCompetitors([
      ...competitors,
      {
        domain: newDomain.trim(),
        type: newType,
        shareOfVoice: 0,
        mentionRate: 0,
        avgRanking: 0,
        rank: competitors.length + 1,
      },
    ]);
    setNewDomain('');
  };

  const removeCompetitor = (domain: string) => {
    setCompetitors(competitors.filter(c => c.domain !== domain).map((c, i) => ({ ...c, rank: i + 1 })));
  };

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="mb-8 flex items-center gap-4">
        <BarChart3 className="w-8 h-8 text-primary" />
        <h1 className="text-3xl font-bold text-primary">Competitor Benchmarking</h1>
      </div>
      <div className="card mb-8">
        <div className="flex items-center gap-2 mb-4">
          <input
            type="text"
            value={newDomain}
            onChange={e => setNewDomain(e.target.value)}
            placeholder="Add competitor domain (e.g. example.com)"
            className="border border-gray-300 rounded px-3 py-2 text-base"
          />
          <select
            value={newType}
            onChange={e => setNewType(e.target.value)}
            className="border border-gray-300 rounded px-2 py-2 text-base"
          >
            <option value="Selected">Selected</option>
            <option value="Organic">Organic</option>
          </select>
          <button
            onClick={addCompetitor}
            className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 font-semibold hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left border-t border-b border-gray-200">
            <thead>
              <tr className="bg-blue-50">
                <th className="py-2 px-4 font-bold text-gray-700">Rank</th>
                <th className="py-2 px-4 font-bold text-gray-700">Competitor</th>
                <th className="py-2 px-4 font-bold text-gray-700">Share of Voice</th>
                <th className="py-2 px-4 font-bold text-gray-700">Mention Rate</th>
                <th className="py-2 px-4 font-bold text-gray-700">Avg Ranking</th>
                <th className="py-2 px-4 font-bold text-gray-700">Type</th>
                <th className="py-2 px-4 font-bold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {competitors.map((c, i) => (
                <tr key={c.domain} className={c.domain === mainDomain ? 'bg-blue-100 font-bold' : ''}>
                  <td className="py-2 px-4">{c.rank}</td>
                  <td className="py-2 px-4 flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-600" /> {c.domain}
                  </td>
                  <td className="py-2 px-4">{c.shareOfVoice}%</td>
                  <td className="py-2 px-4">{c.mentionRate}%</td>
                  <td className="py-2 px-4">{c.avgRanking}</td>
                  <td className="py-2 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${c.type === 'Organic' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{c.type}</span>
                  </td>
                  <td className="py-2 px-4">
                    <button
                      onClick={() => removeCompetitor(c.domain)}
                      className="text-red-600 hover:text-red-800"
                      title="Remove competitor"
                      disabled={c.domain === mainDomain}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 