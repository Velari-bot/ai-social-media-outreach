
import Link from "next/link";

export default function WrenchCredits({ className = "" }: { className?: string }) {
    return (
        <div className={`flex items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity ${className}`}>
            <span className="text-xs font-semibold text-gray-500">Developed By</span>
            <Link href="https://x.com/WrenchDevelops" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 group">
                <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3.5 w-3.5 fill-current text-gray-800 group-hover:text-black">
                    <g>
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
                    </g>
                </svg>
                <span className="text-xs font-bold text-gray-800 group-hover:text-black">WrenchDevelops</span>
            </Link>
        </div>
    );
}
