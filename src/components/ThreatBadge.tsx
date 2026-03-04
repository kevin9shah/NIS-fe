interface ThreatBadgeProps {
    level: string;
}

const styles: Record<string, string> = {
    CRITICAL: 'bg-red-900/50 text-red-400 border-red-700',
    HIGH: 'bg-orange-900/50 text-orange-400 border-orange-700',
    MEDIUM: 'bg-yellow-900/50 text-yellow-400 border-yellow-700',
    LOW: 'bg-blue-900/50 text-blue-400 border-blue-700',
    NORMAL: 'bg-slate-800/50 text-slate-400 border-slate-600',
};

export default function ThreatBadge({ level }: ThreatBadgeProps) {
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${styles[level] || styles.NORMAL}`}>
            {level}
        </span>
    );
}
