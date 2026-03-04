interface MetricsCardProps {
    label: string;
    value: number | string;
    format?: 'percent' | 'number' | 'raw';
    icon?: string;
}

export default function MetricsCard({ label, value, format = 'number', icon }: MetricsCardProps) {
    const numValue = typeof value === 'number' ? value : parseFloat(value as string);
    const displayValue = format === 'percent'
        ? `${(numValue * 100).toFixed(1)}%`
        : format === 'number'
            ? numValue.toFixed(4)
            : value;

    const getColor = () => {
        if (typeof value !== 'number' && format === 'raw') return 'text-gold';
        if (numValue > 0.9) return 'text-green-400';
        if (numValue > 0.7) return 'text-yellow-400';
        return 'text-red-400';
    };

    return (
        <div className="bg-card rounded-xl border border-border p-5 hover:border-teal/40 transition-all duration-300 group">
            <div className="flex items-center gap-2 mb-2">
                {icon && <span className="text-lg">{icon}</span>}
                <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">{label}</p>
            </div>
            <p className={`text-2xl font-bold ${getColor()} group-hover:scale-105 transition-transform`}>
                {displayValue}
            </p>
        </div>
    );
}
