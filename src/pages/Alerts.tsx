import { useState } from 'react';
import MetricsCard from '../components/MetricsCard';
import ThreatBadge from '../components/ThreatBadge';
import type { AppState } from '../App';

interface Props {
    state: AppState;
    updateState: (u: Partial<AppState>) => void;
}

const recommendations: Record<string, { action: string; details: string }> = {
    CRITICAL: { action: 'BLOCK', details: 'Immediately block source IP and alert SOC' },
    HIGH: { action: 'INVESTIGATE', details: 'Queue for manual review within 1 hour' },
    MEDIUM: { action: 'MONITOR', details: 'Add to watchlist for next 30 minutes' },
    LOW: { action: 'LOG', details: 'Retain in audit trail for 24 hours' },
};

export default function Alerts({ state }: Props) {
    const [selectedAlert, setSelectedAlert] = useState<any>(null);
    const predictions = state.predictions || [];

    // Filter to only alerts (score > some baseline OR threat level != NORMAL)
    const alerts = predictions
        .filter((p: any) => p.threat_level !== 'NORMAL')
        .sort((a: any, b: any) => {
            const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
            const oa = (order as any)[a.threat_level] ?? 4;
            const ob = (order as any)[b.threat_level] ?? 4;
            return oa - ob || b.anomaly_score - a.anomaly_score;
        });

    const critical = alerts.filter((a: any) => a.threat_level === 'CRITICAL').length;
    const high = alerts.filter((a: any) => a.threat_level === 'HIGH').length;
    const qttaOnly = predictions.filter((p: any) => p.qtta_prediction === 1 && p.static_prediction === 0).length;

    const exportAlerts = () => {
        const headers = ['Index', 'Anomaly Score', 'QTTA Threshold', 'Threat Level', 'Tunneling Prob', 'Alert Pressure'];
        const rows = alerts.map((a: any) =>
            [a.index, a.anomaly_score, a.qtta_threshold, a.threat_level, a.tunneling_prob, a.alert_pressure].join(',')
        );
        const csv = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
        a.download = 'qsand_alerts.csv'; a.click();
    };

    const formatTime = (idx: number) => {
        const base = new Date('2024-01-15T08:00:00');
        base.setSeconds(base.getSeconds() + idx * 0.5);
        return base.toLocaleTimeString();
    };

    if (predictions.length === 0) {
        return (
            <div className="max-w-7xl mx-auto px-6 py-10">
                <h1 className="text-3xl font-bold text-white mb-8">Threat Alerts</h1>
                <div className="flex items-center justify-center h-96 bg-card rounded-xl border border-border">
                    <p className="text-slate-500 text-lg">⚠ Run detection first to generate alerts</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-6 py-10">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold text-white">Threat Alerts</h1>
                <button onClick={exportAlerts} className="px-4 py-2 rounded-lg bg-teal/20 text-teal text-sm hover:bg-teal/30 transition">
                    📥 Export Alerts CSV
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mb-8">
                <MetricsCard label="Total Alerts" value={alerts.length} format="raw" icon="🚨" />
                <MetricsCard label="Critical" value={critical} format="raw" icon="🔴" />
                <MetricsCard label="High" value={high} format="raw" icon="🟠" />
                <MetricsCard label="Caught by QTTA Only" value={qttaOnly} format="raw" icon="⚛" />
            </div>

            {/* Alert Feed + Detail */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Feed */}
                <div className="lg:col-span-2 space-y-3 max-h-[70vh] overflow-y-auto pr-2">
                    {alerts.map((alert: any) => (
                        <div
                            key={alert.index}
                            onClick={() => setSelectedAlert(alert)}
                            className={`bg-card rounded-xl border p-4 cursor-pointer transition-all hover:border-teal/40 ${selectedAlert?.index === alert.index ? 'border-teal' : 'border-border'
                                }`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <ThreatBadge level={alert.threat_level} />
                                    <div>
                                        <p className="text-sm font-semibold text-white">
                                            Packet #{alert.index} — {alert.threat_level} Threat Detected
                                        </p>
                                        <p className="text-xs text-slate-500 mt-1 font-mono">
                                            Score: {alert.anomaly_score.toFixed(4)} | Threshold: {alert.qtta_threshold.toFixed(4)} | T: {alert.tunneling_prob.toFixed(4)}
                                        </p>
                                    </div>
                                </div>
                                <span className="text-xs text-slate-600">{formatTime(alert.index)}</span>
                            </div>
                        </div>
                    ))}
                    {alerts.length === 0 && (
                        <div className="text-center py-10 text-slate-500">
                            <p className="text-4xl mb-2">✅</p>
                            <p>No threats detected</p>
                        </div>
                    )}
                </div>

                {/* Detail Panel */}
                <div className="bg-card rounded-xl border border-border p-6 sticky top-20 h-fit">
                    {selectedAlert ? (
                        <div className="animate-fade-in">
                            <div className="flex items-center gap-2 mb-4">
                                <ThreatBadge level={selectedAlert.threat_level} />
                                <h3 className="text-lg font-semibold text-white">Packet #{selectedAlert.index}</h3>
                            </div>

                            <div className="space-y-3 mb-6">
                                {[
                                    { label: 'Anomaly Score', value: selectedAlert.anomaly_score },
                                    { label: 'QTTA Threshold', value: selectedAlert.qtta_threshold },
                                    { label: 'Tunneling Prob (T)', value: selectedAlert.tunneling_prob },
                                    { label: 'Alert Pressure (E)', value: selectedAlert.alert_pressure },
                                    { label: 'Noise Floor (V₀)', value: selectedAlert.noise_floor },
                                ].map(item => (
                                    <div key={item.label} className="flex justify-between text-sm">
                                        <span className="text-slate-500">{item.label}</span>
                                        <span className="font-mono text-teal-light">{item.value.toFixed(4)}</span>
                                    </div>
                                ))}
                            </div>

                            {/* QTTA State Visual */}
                            <div className="mb-6">
                                <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">QTTA State at Detection</p>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { label: 'E', value: selectedAlert.alert_pressure, color: 'text-yellow-400' },
                                        { label: 'V₀', value: selectedAlert.noise_floor, color: 'text-blue-400' },
                                        { label: 'T', value: selectedAlert.tunneling_prob, color: 'text-purple-400' },
                                        { label: 'κ', value: selectedAlert.qtta_threshold, color: 'text-teal' },
                                    ].map(s => (
                                        <div key={s.label} className="bg-dark rounded-lg p-2 text-center">
                                            <p className="text-[10px] text-slate-500">{s.label}</p>
                                            <p className={`text-sm font-bold font-mono ${s.color}`}>{s.value.toFixed(4)}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Recommendation */}
                            {recommendations[selectedAlert.threat_level] && (
                                <div className="bg-dark rounded-lg p-4 border border-border/50">
                                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Recommended Action</p>
                                    <p className="text-sm font-bold text-gold mb-1">
                                        {recommendations[selectedAlert.threat_level].action}
                                    </p>
                                    <p className="text-xs text-slate-400">
                                        {recommendations[selectedAlert.threat_level].details}
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-10">
                            <p className="text-3xl mb-2">👈</p>
                            <p className="text-slate-500 text-sm">Select an alert to view details</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
