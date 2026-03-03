export default function EcologiaLogo({ size = 40, className = '' }: { size?: number; className?: string }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 200 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            {/* Outer circle – institutional green */}
            <circle cx="100" cy="100" r="94" stroke="#3E6C51" strokeWidth="12" fill="white" />
            {/* Petal 1 – top */}
            <ellipse cx="100" cy="60" rx="22" ry="35" fill="url(#petalGrad)" transform="rotate(0, 100, 100)" />
            {/* Petal 2 – top-right */}
            <ellipse cx="100" cy="60" rx="22" ry="35" fill="url(#petalGrad)" transform="rotate(72, 100, 100)" />
            {/* Petal 3 – bottom-right */}
            <ellipse cx="100" cy="60" rx="22" ry="35" fill="url(#petalGrad)" transform="rotate(144, 100, 100)" />
            {/* Petal 4 – bottom-left */}
            <ellipse cx="100" cy="60" rx="22" ry="35" fill="url(#petalGrad)" transform="rotate(216, 100, 100)" />
            {/* Petal 5 – top-left */}
            <ellipse cx="100" cy="60" rx="22" ry="35" fill="url(#petalGrad)" transform="rotate(288, 100, 100)" />
            {/* Center circle */}
            <circle cx="100" cy="100" r="8" fill="white" />
            <circle cx="100" cy="100" r="5" fill="#D4839B" opacity="0.5" />
            <defs>
                <radialGradient id="petalGrad" cx="50%" cy="30%" r="70%">
                    <stop offset="0%" stopColor="#EABDC9" />
                    <stop offset="50%" stopColor="#D4839B" />
                    <stop offset="100%" stopColor="#B8607D" />
                </radialGradient>
            </defs>
        </svg>
    );
}
