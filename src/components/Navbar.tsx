import { Link, useLocation } from 'react-router-dom';

interface NavbarProps {
    modelReady: boolean;
}

const links = [
    { to: '/', label: 'Dashboard' },
    { to: '/training', label: 'Training' },
    { to: '/detection', label: 'Detection' },
    { to: '/explainability', label: 'Explainability' },
    { to: '/simulation', label: 'Simulation' },
    { to: '/alerts', label: 'Alerts' },
];

export default function Navbar({ modelReady }: NavbarProps) {
    const location = useLocation();

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-navy border-b border-teal/30 backdrop-blur-sm">
            <div className="max-w-[1920px] mx-auto px-6 h-16 flex items-center justify-between">
                <Link to="/" className="flex items-center gap-2 group">
                    <span className="text-2xl">⬡</span>
                    <span className="text-xl font-bold text-gold tracking-wide group-hover:text-yellow-300 transition-colors">
                        Q-SAND
                    </span>
                </Link>

                <div className="flex items-center gap-1">
                    {links.map(link => (
                        <Link
                            key={link.to}
                            to={link.to}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${location.pathname === link.to
                                    ? 'bg-teal/20 text-teal-light'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            {link.label}
                        </Link>
                    ))}

                    <div className="ml-4 flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${modelReady ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`} />
                        <span className="text-xs text-slate-500">
                            {modelReady ? 'Model Ready' : 'Not Trained'}
                        </span>
                    </div>
                </div>
            </div>
        </nav>
    );
}
