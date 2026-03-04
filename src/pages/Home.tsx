import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import { uploadDataset } from '../api/client';
import type { AppState } from '../App';

interface Props {
    state: AppState;
    updateState: (u: Partial<AppState>) => void;
}

export default function Home({ state, updateState }: Props) {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [uploadResult, setUploadResult] = useState<any>(null);

    const onDrop = useCallback(async (files: File[]) => {
        if (files.length === 0) return;
        setLoading(true);
        setError('');
        try {
            const res = await uploadDataset(files[0]);
            setUploadResult(res.data);
            updateState({ sessionId: res.data.session_id });
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Upload failed');
        } finally {
            setLoading(false);
        }
    }, [updateState]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'text/csv': ['.csv'] },
        maxFiles: 1,
    });

    return (
        <div className="max-w-7xl mx-auto px-6 py-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Left Panel */}
                <div className="flex flex-col justify-center animate-fade-in">
                    <h1 className="text-6xl font-extrabold text-white mb-3 tracking-tight">
                        Q-<span className="text-gold">SAND</span>
                    </h1>
                    <p className="text-xl text-teal-light mb-8 font-light">
                        Quantum-Inspired Network Anomaly Detector
                    </p>

                    <div className="flex flex-wrap gap-3 mb-10">
                        {['🧬 Explainable ML', '⚛ Quantum Threshold', '🛡 Real-Time Alerts'].map(badge => (
                            <span key={badge} className="px-4 py-2 bg-card rounded-lg border border-border text-sm font-medium text-slate-300 hover:border-teal/40 transition-colors">
                                {badge}
                            </span>
                        ))}
                    </div>

                    <div className="flex items-center gap-4">
                        {['Upload', 'Train', 'Detect', 'Explain'].map((step, i) => (
                            <div key={step} className="flex items-center gap-2">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-teal text-white' : 'bg-card border border-border text-slate-500'
                                    }`}>
                                    {i + 1}
                                </div>
                                <span className="text-sm text-slate-400">{step}</span>
                                {i < 3 && <span className="text-slate-600 mx-1">→</span>}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Panel — Upload */}
                <div className="animate-slide-up">
                    <div
                        {...getRootProps()}
                        className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 ${isDragActive
                                ? 'border-teal bg-teal/5 shadow-[0_0_30px_rgba(0,137,123,0.2)]'
                                : 'border-border hover:border-teal/50 bg-card'
                            }`}
                    >
                        <input {...getInputProps()} />
                        <div className="text-5xl mb-4">📁</div>
                        {loading ? (
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-8 h-8 border-2 border-teal border-t-transparent rounded-full animate-spin" />
                                <p className="text-slate-400">Processing dataset...</p>
                            </div>
                        ) : isDragActive ? (
                            <p className="text-teal text-lg font-medium">Drop your CSV here...</p>
                        ) : (
                            <>
                                <p className="text-lg text-white font-medium mb-2">Drag & drop your CSV dataset</p>
                                <p className="text-sm text-slate-500">or click to browse • CSV files only</p>
                            </>
                        )}
                    </div>

                    {error && (
                        <div className="mt-4 p-4 bg-red-900/30 border border-red-700 rounded-xl text-red-400 text-sm">
                            ❌ {error}
                        </div>
                    )}

                    {uploadResult && (
                        <div className="mt-6 bg-card rounded-xl border border-border p-6 animate-fade-in">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="text-green-400 text-xl">✓</span>
                                <span className="text-white font-semibold">Upload Successful</span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="p-3 rounded-lg bg-dark">
                                    <p className="text-xs text-slate-500 mb-1">Rows</p>
                                    <p className="text-lg font-bold text-gold">{uploadResult.rows.toLocaleString()}</p>
                                </div>
                                <div className="p-3 rounded-lg bg-dark">
                                    <p className="text-xs text-slate-500 mb-1">Columns</p>
                                    <p className="text-lg font-bold text-teal-light">{uploadResult.columns.length}</p>
                                </div>
                            </div>

                            {/* Label Distribution */}
                            <div className="mb-4">
                                <p className="text-xs text-slate-500 mb-2 uppercase tracking-wider">Label Distribution</p>
                                <div className="flex gap-2 h-6 rounded-full overflow-hidden">
                                    <div
                                        className="bg-green-600 flex items-center justify-center text-xs text-white font-medium rounded-l-full"
                                        style={{ width: `${(uploadResult.label_distribution.normal / uploadResult.rows) * 100}%` }}
                                    >
                                        Normal: {uploadResult.label_distribution.normal}
                                    </div>
                                    <div
                                        className="bg-red-600 flex items-center justify-center text-xs text-white font-medium rounded-r-full"
                                        style={{ width: `${(uploadResult.label_distribution.anomaly / uploadResult.rows) * 100}%` }}
                                    >
                                        Anomaly: {uploadResult.label_distribution.anomaly}
                                    </div>
                                </div>
                            </div>

                            {/* Preview Table */}
                            <div className="mb-4">
                                <p className="text-xs text-slate-500 mb-2 uppercase tracking-wider">Preview (first 10 rows)</p>
                                <div className="overflow-x-auto max-h-48 overflow-y-auto rounded-lg border border-border">
                                    <table className="w-full text-xs font-mono">
                                        <thead className="bg-dark sticky top-0">
                                            <tr>
                                                {uploadResult.columns.slice(0, 8).map((col: string) => (
                                                    <th key={col} className="px-3 py-2 text-left text-slate-500 font-semibold whitespace-nowrap">{col}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {uploadResult.preview.map((row: any, i: number) => (
                                                <tr key={i} className="border-t border-border/50 hover:bg-white/5">
                                                    {uploadResult.columns.slice(0, 8).map((col: string) => (
                                                        <td key={col} className="px-3 py-1.5 text-slate-400 whitespace-nowrap">
                                                            {typeof row[col] === 'number' ? row[col].toFixed(4) : String(row[col])}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <button
                                onClick={() => navigate('/training')}
                                className="w-full py-3 rounded-xl bg-teal hover:bg-teal/80 text-white font-semibold transition-all duration-200 hover:shadow-[0_0_20px_rgba(0,137,123,0.3)]"
                            >
                                Proceed to Training →
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
