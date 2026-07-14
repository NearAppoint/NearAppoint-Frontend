'use client';
import * as React from 'react';
import { Search, Bell, Settings, HelpCircle } from 'lucide-react';

/**
 * The top bar from the design. Search, notifications, and who's logged in.
 *
 * The search is deliberately global — the receptionist standing at the counter
 * with a customer in front of her should be able to type a phone number from
 * ANY screen and find them, not navigate to Customers first.
 */
export function TopBar({ ownerName, role = 'Owner' }: {
  ownerName: string; role?: string;
}) {
  const initials = ownerName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <header className="sticky top-0 z-30 hidden items-center gap-5 border-b border-line bg-white px-9 py-3.5 lg:flex">
      <div className="flex max-w-[420px] flex-1 items-center gap-2.5 rounded-full border border-line2 bg-soft px-4 py-2.5 transition-colors focus-within:border-brand focus-within:bg-white">
        <Search className="size-[17px] flex-none text-faint" />
        <input
          placeholder="Search by phone or name"
          className="min-w-0 flex-1 border-0 bg-transparent text-[0.9rem] text-ink placeholder:text-faint focus:outline-none"
        />
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <IconButton label="Help"><HelpCircle className="size-[19px]" /></IconButton>
        <IconButton label="Notifications" dot><Bell className="size-[19px]" /></IconButton>
        <IconButton label="Settings"><Settings className="size-[19px]" /></IconButton>

        <div className="ml-2.5 flex items-center gap-2.5 border-l border-line pl-4">
          <div className="text-right">
            <p className="font-display text-[0.85rem] font-bold leading-tight text-ink">
              {ownerName}
            </p>
            <p className="text-[0.72rem] leading-tight text-faint">{role}</p>
          </div>
          <span className="grid size-9 flex-none place-items-center rounded-full bg-brand-tint font-display text-[0.72rem] font-bold text-brand">
            {initials}
          </span>
        </div>
      </div>
    </header>
  );
}

function IconButton({ children, label, dot }: {
  children: React.ReactNode; label: string; dot?: boolean;
}) {
  return (
    <button aria-label={label}
      className="relative grid size-9 place-items-center rounded-sm text-muted transition-colors hover:bg-soft hover:text-ink">
      {children}
      {dot && <span className="absolute right-2 top-2 size-1.5 rounded-full bg-brand" />}
    </button>
  );
}
