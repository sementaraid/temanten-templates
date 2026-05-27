import type { ComponentProps } from 'react';

type DebitCardProps = ComponentProps<'svg'> & {
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
};

const DebitCard = ({ bankName = 'BANK', accountNumber, accountName, ...props }: DebitCardProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 250" {...props}>
    <defs>
      <linearGradient id="a" x1="0%" x2="100%" y1="0%" y2="100%">
        <stop
          offset="0%"
          style={{
            stopColor: '#06c',
            stopOpacity: 1,
          }}
        />
        <stop
          offset="100%"
          style={{
            stopColor: '#003d7a',
            stopOpacity: 1,
          }}
        />
      </linearGradient>
      <pattern id="b" width={20} height={20} x={0} y={0} patternUnits="userSpaceOnUse">
        <circle cx={2} cy={2} r={1} fill="rgba(255,255,255,0.08)" />
      </pattern>
      <path
        id="c"
        fill="none"
        stroke="rgba(255,255,255,0.1)"
        strokeWidth={40}
        d="M0 20q50-10 100 0t100 0 100 0 100 0"
      />
    </defs>
    <rect width={400} height={250} fill="url(#a)" rx={20} />
    <rect width={400} height={250} fill="url(#b)" rx={20} />
    <use href="#c" opacity={0.3} transform="translate(0 100)" />
    <use href="#c" opacity={0.2} transform="translate(0 140)" />
    <text
      x={20}
      y={45}
      fill="#fff"
      fontFamily="Arial, sans-serif"
      fontSize={36}
      fontWeight="bold"
      letterSpacing={4}
    >
      {bankName}
    </text>
    <rect width={50} height={40} x={30} y={80} fill="#f4d03f" opacity={0.95} rx={5} />
    <rect width={40} height={30} x={35} y={85} fill="none" stroke="#b8860b" rx={3} />
    <path stroke="#b8860b" d="M40 85v30M50 85v30M60 85v30M70 85v30" />
    <text
      x={20}
      y={165}
      fill="#fff"
      fontFamily="'Courier New', monospace"
      fontSize={24}
      letterSpacing={4}
    >
      {accountNumber ?? '0000 0000 00'}
    </text>
    <text x={20} y={205} fill="rgba(255,255,255,0.7)" fontFamily="Arial, sans-serif" fontSize={11}>
      {'\n    CARDHOLDER NAME\n  '}
    </text>
    <text x={20} y={225} fill="#fff" fontFamily="Arial, sans-serif" fontSize={16} fontWeight={600}>
      {accountName ?? 'CARDHOLDER NAME'}
    </text>
    <circle cx={350} cy={35} r={18} fill="#eb001b" opacity={0.9} />
    <circle cx={370} cy={35} r={18} fill="#ff5f00" opacity={0.9} />
    <circle cx={360} cy={35} r={18} fill="#f79e1b" opacity={0.9} />
    <text x={20} y={242} fill="rgba(255,255,255,0.6)" fontFamily="Arial, sans-serif" fontSize={10}>
      {bankName}
    </text>
  </svg>
);
export { DebitCard };
