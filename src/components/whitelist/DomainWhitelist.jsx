import React, { useState } from 'react';
import { ShieldCheck, Plus, Trash2, Globe, Sparkles, AlertTriangle } from 'lucide-react';
import GlassCard from '../common/GlassCard';
import StatusBadge from '../timeline/StatusBadge';

const DEFAULT_WHITELIST = [
  { id: 'wl-1', domain: 'company-internal.com', status: 'success', addedBy: 'admin@safelens.io', dateAdded: '2026-07-20', wildcard: true },
  { id: 'wl-2', domain: 'verified-gov.in', status: 'success', addedBy: 'sec-ops@safelens.io', dateAdded: '2026-07-22', wildcard: false }
];

export default function DomainWhitelist() {
  const [whitelist, setWhitelist] = useState(DEFAULT_WHITELIST);
  const [newDomain, setNewDomain] = useState('');
  const [wildcard, setWildcard] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleAddDomain = (e) => {
    e.preventDefault();
    if (!newDomain.trim()) return;

    // Simple domain regex validation
    const domainRegex = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i;
    if (!domainRegex.test(newDomain.trim())) {
      setErrorMsg('Invalid domain format. Use e.g. company.com');
      return;
    }

    // Check duplicates
    if (whitelist.some((w) => w.domain.toLowerCase() === newDomain.trim().toLowerCase())) {
      setErrorMsg('Domain is already registered in whitelist.');
      return;
    }

    const item = {
      id: `wl-${Date.now()}`,
      domain: newDomain.trim().toLowerCase(),
      status: 'success',
      addedBy: 'sec-ops@safelens.io',
      dateAdded: new Date().toISOString().split('T')[0],
      wildcard: wildcard
    };

    setWhitelist((prev) => [item, ...prev]);
    setNewDomain('');
    setWildcard(false);
    setErrorMsg('');
  };

  const handleDeleteDomain = (id) => {
    setWhitelist((prev) => prev.filter((item) => item.id !== id));
  };

  const handleToggleWildcard = (id) => {
    setWhitelist((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, wildcard: !item.wildcard } : item
      )
    );
  };

  // Filter whitelist items
  const filteredWhitelist = whitelist.filter((item) =>
    item.domain.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full max-w-5xl mx-auto p-4 flex flex-col gap-6 font-mono">
      
      {/* Search and Registration Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        
        {/* Registration Form */}
        <GlassCard className="p-5 border-white/10 md:col-span-1">
          <div className="flex items-center gap-2 border-b border-white/5 pb-3 mb-4 select-none">
            <Plus className="w-4 h-4 text-[var(--color-success)]" />
            <h3 className="font-bold text-sm tracking-wider uppercase text-white">
              Whitelist Domain
            </h3>
          </div>

          <form onSubmit={handleAddDomain} className="flex flex-col gap-4 text-xs">
            
            {/* Input Domain */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="domainInput" className="text-gray-500 font-semibold tracking-wider">DOMAIN HOSTNAME</label>
              <input
                id="domainInput"
                type="text"
                placeholder="e.g. corp-internal.com"
                value={newDomain}
                onChange={(e) => {
                  setNewDomain(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-white font-mono placeholder-gray-600 focus:outline-none focus:border-[var(--color-success)] transition-all"
              />
              {errorMsg && (
                <span className="text-[var(--color-danger)] flex items-center gap-1 mt-1 text-[10px]">
                  <AlertTriangle className="w-3.5 h-3.5" /> {errorMsg}
                </span>
              )}
            </div>

            {/* Subdomain Wildcard Checkbox */}
            <div className="flex items-center justify-between bg-white/2 border border-white/5 p-3 rounded select-none cursor-pointer">
              <div className="flex flex-col gap-0.5">
                <span className="text-white font-semibold">WILDCARD SUBDOMAINS</span>
                <span className="text-[10px] text-gray-500">Enable *.domain rule matching</span>
              </div>
              <button
                type="button"
                onClick={() => setWildcard(!wildcard)}
                className={`w-10 h-6 rounded-full p-0.5 transition-all duration-300 ${wildcard ? 'bg-[var(--color-success)]' : 'bg-gray-800'}`}
              >
                <div className={`bg-black w-5 h-5 rounded-full transition-all transform ${wildcard ? 'translate-x-4' : 'translate-x-0'}`} />
              </button>
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-[var(--color-success)]/10 text-[var(--color-success)] border border-[var(--color-success)]/30 hover:bg-[var(--color-success)]/20 rounded font-bold font-mono tracking-wider transition-all active:scale-95 flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> ADD HOSTNAME
            </button>

          </form>
        </GlassCard>

        {/* Database Whitelist Table View */}
        <GlassCard className="p-5 border-white/10 md:col-span-2">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4 mb-4 select-none">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-[var(--color-info)]" />
              <h3 className="font-bold text-sm tracking-wider uppercase text-white">
                Authorized Domains Whitelist
              </h3>
            </div>
            {/* Search Input */}
            <input
              type="text"
              placeholder="Search registry..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-black/40 border border-white/10 rounded px-2.5 py-1 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[var(--color-info)] transition-all font-mono max-w-[200px]"
            />
          </div>

          {/* Table */}
          <div className="w-full overflow-x-auto scrollbar-thin">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/5 text-gray-500 select-none pb-2">
                  <th className="py-2.5 font-medium">Domain</th>
                  <th className="py-2.5 font-medium">Wildcard</th>
                  <th className="py-2.5 font-medium">Added By</th>
                  <th className="py-2.5 font-medium">Date Added</th>
                  <th className="py-2.5 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-gray-300">
                {filteredWhitelist.length > 0 ? (
                  filteredWhitelist.map((item) => (
                    <tr key={item.id} className="hover:bg-white/2 transition-colors duration-150">
                      
                      {/* Domain Hostname */}
                      <td className="py-3 font-semibold text-white flex items-center gap-2">
                        <Globe className="w-3.5 h-3.5 text-gray-500" />
                        <span>{item.domain}</span>
                      </td>

                      {/* Wildcard */}
                      <td className="py-3">
                        <button
                          type="button"
                          onClick={() => handleToggleWildcard(item.id)}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                            item.wildcard
                              ? 'border-[var(--color-success)]/20 text-[var(--color-success)] bg-[var(--color-success)]/5'
                              : 'border-white/10 text-gray-500'
                          }`}
                        >
                          {item.wildcard ? '(*.) ACTIVE' : 'EXACT MATCH'}
                        </button>
                      </td>

                      {/* Added By */}
                      <td className="py-3 text-gray-400">{item.addedBy}</td>

                      {/* Date Added */}
                      <td className="py-3 text-gray-500">{item.dateAdded}</td>

                      {/* Actions */}
                      <td className="py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteDomain(item.id)}
                          className="p-1 rounded hover:bg-[var(--color-danger)]/10 text-gray-500 hover:text-[var(--color-danger)] transition-all"
                          title="Remove Authorization"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>

                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center py-10 text-gray-500 italic">
                      No matching whitelist rules found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Database Info footer */}
          <div className="flex items-center justify-between border-t border-white/5 pt-3 mt-4 text-[10px] text-gray-500 select-none">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[var(--color-success)]" /> SECURE REGISTRY INTERFACES ENABLED
            </span>
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> ACTIVE: {whitelist.length} RULES
            </span>
          </div>

        </GlassCard>
      </div>

    </div>
  );
}
