import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import ResearchHeaderSection from '../components/trader/stockResearch/ResearchHeaderSection';
import MainChartSection from '../components/trader/stockResearch/MainChartSection';
import TechnicalSnapshotSection from '../components/trader/stockResearch/TechnicalSnapshotSection';
import WhyThisStockSection from '../components/trader/stockResearch/WhyThisStockSection';
import SmartInsightsSection from '../components/trader/stockResearch/SmartInsightsSection';
import KeyLevelsSection from '../components/trader/stockResearch/KeyLevelsSection';
import SectorStrengthSection from '../components/trader/stockResearch/SectorStrengthSection';
import RelatedSetupsSection from '../components/trader/stockResearch/RelatedSetupsSection';
import UnusualActivitySection from '../components/trader/stockResearch/UnusualActivitySection';
import PerformanceBenchmarksSection from '../components/trader/stockResearch/PerformanceBenchmarksSection';
import FundamentalsCompactSection from '../components/trader/stockResearch/FundamentalsCompactSection';
import NewsPanelSection from '../components/trader/stockResearch/NewsPanelSection';
import { stockResearchMock } from '../data/stockResearchMock';

export default function TraderStockPage({ overrideSymbol, onBack }) {
    const navigate = useNavigate();
    const { symbol: routeSymbol } = useParams();
    const symbol = overrideSymbol || routeSymbol || stockResearchMock.stock.symbol;

    const [isLoading, setIsLoading] = useState(true);
    const [researchData, setResearchData] = useState(stockResearchMock);

    useEffect(() => {
        setIsLoading(true);

        const timer = window.setTimeout(() => {
            setResearchData((prev) => ({
                ...prev,
                stock: {
                    ...prev.stock,
                    symbol,
                    name: symbol === prev.stock.symbol ? prev.stock.name : `${symbol} Research View`,
                },
            }));
            setIsLoading(false);
        }, 450);

        return () => window.clearTimeout(timer);
    }, [symbol]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#040914] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-2 border-cyan-400/30 border-t-cyan-300 rounded-full animate-spin" />
                    <p className="text-xs uppercase tracking-[0.18em] text-cyan-100">Preparing research dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_10%_0%,#1a3159_0%,#081527_45%,#040914_100%)] text-slate-100">
            <div className="mx-auto max-w-[1760px] px-4 py-6 md:px-6 lg:px-8 space-y-5">
                <div className="flex justify-end">
                    <button
                        type="button"
                        onClick={onBack || (() => navigate('/dashboard'))}
                        className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-200 hover:border-cyan-300/30"
                    >
                        Back to Dashboard
                    </button>
                </div>

                {}
                <ResearchHeaderSection stock={researchData.stock} />

                <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
                    <div className="space-y-5">
                        {}
                        <MainChartSection chart={researchData.chart} />

                        {}
                        <TechnicalSnapshotSection snapshot={researchData.technicalSnapshot} />

                        {}
                        <WhyThisStockSection points={researchData.whyThisStock} />

                        {}
                        <SmartInsightsSection insights={researchData.smartInsights} />

                        {}
                        <KeyLevelsSection levels={researchData.keyLevels} />

                        {}
                        <SectorStrengthSection sectorStrength={researchData.sectorStrength} />

                        {}
                        <RelatedSetupsSection setups={researchData.relatedSetups} />

                        {}
                        <UnusualActivitySection items={researchData.unusualActivity} />

                        {}
                        <PerformanceBenchmarksSection performance={researchData.performanceBenchmarks} />

                        {}
                        <FundamentalsCompactSection fundamentals={researchData.fundamentals} />
                    </div>

                    {}
                    <NewsPanelSection news={researchData.news} />
                </div>
            </div>
        </div>
    );
}
