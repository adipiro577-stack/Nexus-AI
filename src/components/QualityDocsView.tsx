import React, { useState } from 'react';
import { TestCase } from '../types';
import { ShieldCheck, Play, CheckCircle2, AlertTriangle, FileText, Lock, Cpu, Sparkles } from 'lucide-react';

interface QualityDocsViewProps {
  testCases: TestCase[];
  onRunAllTests: () => void;
}

export const QualityDocsView: React.FC<QualityDocsViewProps> = ({
  testCases,
  onRunAllTests
}) => {
  const [activeTab, setActiveTab] = useState<'tests' | 'security' | 'openapi'>('tests');
  const [isRunning, setIsRunning] = useState(false);

  const handleRunTests = () => {
    setIsRunning(true);
    setTimeout(() => {
      onRunAllTests();
      setIsRunning(false);
    }, 1200);
  };

  const passedCount = testCases.filter(t => t.status === 'passed').length;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="text-[10px] font-mono tracking-widest text-[#C5A059] uppercase mb-1">STAGE 05 — QUALITY ASSURANCE & AUDIT</div>
          <h1 className="text-2xl font-serif text-white uppercase font-bold">AUTOMATED TESTING & OPENAPI SPECIFICATION</h1>
        </div>

        <button
          onClick={handleRunTests}
          disabled={isRunning}
          className="flex items-center justify-center space-x-2 px-5 py-2.5 text-xs font-semibold tracking-[0.2em] text-black bg-[#C5A059] hover:bg-[#d9b36a] rounded-sm uppercase transition-all shadow-md"
        >
          <Play className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
          <span>{isRunning ? 'EXECUTING TEST SUITE...' : 'RUN SYNTHETIC TESTS'}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-3 border-b border-white/10 pb-2">
        <button
          onClick={() => setActiveTab('tests')}
          className={`px-4 py-2 text-xs font-mono uppercase tracking-wider rounded-xs transition-all border ${
            activeTab === 'tests' 
              ? 'bg-[#C5A059]/20 text-[#C5A059] border-[#C5A059]/50' 
              : 'text-white/50 border-transparent hover:text-white'
          }`}
        >
          SYNTHETIC TEST SUITE ({testCases.length})
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`px-4 py-2 text-xs font-mono uppercase tracking-wider rounded-xs transition-all border ${
            activeTab === 'security' 
              ? 'bg-[#C5A059]/20 text-[#C5A059] border-[#C5A059]/50' 
              : 'text-white/50 border-transparent hover:text-white'
          }`}
        >
          OWASP SECURITY AUDIT
        </button>

        <button
          onClick={() => setActiveTab('openapi')}
          className={`px-4 py-2 text-xs font-mono uppercase tracking-wider rounded-xs transition-all border ${
            activeTab === 'openapi' 
              ? 'bg-[#C5A059]/20 text-[#C5A059] border-[#C5A059]/50' 
              : 'text-white/50 border-transparent hover:text-white'
          }`}
        >
          OPENAPI 3.0 SPECIFICATION
        </button>
      </div>

      {/* Tab Content: Synthetic Tests */}
      {activeTab === 'tests' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card-luxury p-4 rounded-sm">
              <div className="text-[10px] font-mono text-white/40 uppercase mb-1">TOTAL PASSED TESTS</div>
              <div className="text-xl font-serif text-emerald-400 font-bold">{passedCount} / {testCases.length} Passed</div>
            </div>
            <div className="card-luxury p-4 rounded-sm">
              <div className="text-[10px] font-mono text-white/40 uppercase mb-1">TOTAL CODE COVERAGE</div>
              <div className="text-xl font-serif text-[#C5A059] font-bold">96.8% Covered</div>
            </div>
            <div className="card-luxury p-4 rounded-sm">
              <div className="text-[10px] font-mono text-white/40 uppercase mb-1">EXECUTION TIME</div>
              <div className="text-xl font-serif text-white font-bold">165 ms Total</div>
            </div>
          </div>

          <div className="space-y-3">
            {testCases.map((test) => (
              <div key={test.id} className="card-luxury p-4 rounded-sm flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <h3 className="text-xs font-serif text-white uppercase font-medium">{test.name}</h3>
                    <div className="text-[10px] font-mono text-white/40 uppercase space-x-3 mt-0.5">
                      <span>TYPE: {test.type}</span>
                      <span>DURATION: {test.duration}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right font-mono text-xs">
                  <span className="text-emerald-400 font-bold">{test.coverage}</span>
                  <span className="text-white/30 text-[10px] uppercase block">Coverage</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Content: Security Audit */}
      {activeTab === 'security' && (
        <div className="card-luxury p-6 rounded-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div>
              <span className="text-[10px] font-mono text-[#C5A059] uppercase tracking-wider">OWASP TOP 10 AUDIT REPORT</span>
              <h2 className="text-lg font-serif text-white uppercase font-bold">SECURITY QUALITY SCORE: 98.5 / 100</h2>
            </div>
            <ShieldCheck className="w-8 h-8 text-emerald-400" />
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="p-3 bg-black/40 border border-emerald-500/30 rounded-xs flex items-center justify-between">
              <span>SQL Injection & AST Input Sanitization</span>
              <span className="text-emerald-400 uppercase font-bold">PASSED (0 VULNERABILITIES)</span>
            </div>
            <div className="p-3 bg-black/40 border border-emerald-500/30 rounded-xs flex items-center justify-between">
              <span>JWT Bearer Signature Hardening</span>
              <span className="text-emerald-400 uppercase font-bold">PASSED (TLS 1.3 MANDATED)</span>
            </div>
            <div className="p-3 bg-black/40 border border-amber-500/30 rounded-xs flex items-center justify-between">
              <span>CORS Header Tightening Advisory</span>
              <span className="text-amber-400 uppercase font-bold">ADVISORY (1 TWEAK RECOMMENDED)</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: OpenAPI Specs */}
      {activeTab === 'openapi' && (
        <div className="card-luxury p-6 rounded-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-white/10 font-mono text-xs text-white/60">
            <span>openapi: 3.0.0</span>
            <span>json format</span>
          </div>

          <pre className="p-4 bg-black rounded-xs font-mono text-xs text-emerald-400 max-h-[400px] overflow-y-auto leading-relaxed">
{`{
  "openapi": "3.0.0",
  "info": {
    "title": "Fintech Algorithmic Trading API",
    "version": "1.0.0",
    "description": "High-frequency algorithmic trading order matching engine with Gemini AI real-time risk checks."
  },
  "paths": {
    "/api/orders": {
      "post": {
        "summary": "Place algorithmic order",
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "symbol": { "type": "string" },
                  "quantity": { "type": "number" },
                  "price": { "type": "number" }
                }
              }
            }
          }
        },
        "responses": {
          "200": { "description": "Order successfully executed" }
        }
      }
    }
  }
}`}
          </pre>
        </div>
      )}
    </div>
  );
};
