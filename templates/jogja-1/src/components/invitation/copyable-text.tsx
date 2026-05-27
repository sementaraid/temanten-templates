import { useState, useRef } from 'react';
import { Button } from '~/components/ui/button';
import { cn } from '~/lib/utils';
import { Check, Copy } from 'lucide-react';

type CopyableTextProps = {
  text: string;
  label: string;
  className?: string;
};

const CopyableText = ({ text, label, className }: CopyableTextProps) => {
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleCopy = () => {
    try {
      const textarea = textareaRef.current;
      if (!textarea) return;

      textarea.focus();
      textarea.select();
      textarea.setSelectionRange(0, textarea.value.length); // iOS Safari

      const success = document.execCommand('copy');
      if (!success) throw new Error('Copy failed');

      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 p-3',
        'bg-[#fdf6ee] dark:bg-gray-800/60',
        'rounded-xl border border-[#a85200]/20 dark:border-[#a85200]/15',
        className
      )}
    >
      <div className="flex-1 min-w-0">
        {label && (
          <p className="text-xs text-[#a85200]/70 dark:text-[#e8a060]/80 mb-1 font-open-sans">
            {label}
          </p>
        )}
        <p className="text-sm font-mono font-semibold text-gray-900 dark:text-gray-100 truncate">
          {text}
        </p>
      </div>

      <textarea
        ref={textareaRef}
        value={text}
        readOnly
        className="absolute left-[-9999px] top-[-9999px] -z-[10000] visible-none"
      />

      <Button
        size="sm"
        variant="outline"
        onClick={handleCopy}
        className="flex-shrink-0 border-[#a85200]/30 text-[#a85200] hover:bg-[#a85200]/10 hover:text-[#a85200] dark:border-[#e8a060]/30 dark:text-[#e8a060] dark:hover:bg-[#e8a060]/10 dark:hover:text-[#e8a060]"
      >
        {copied ? (
          <>
            <Check className="w-4 h-4 mr-1" />
            Tersalin
          </>
        ) : (
          <>
            <Copy className="w-4 h-4 mr-1" />
            Salin
          </>
        )}
      </Button>
    </div>
  );
};

export { CopyableText };
