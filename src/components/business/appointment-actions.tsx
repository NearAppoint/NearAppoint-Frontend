'use client';
import * as React from 'react';
import {
  MoreHorizontal, UserX, XCircle, CalendarClock, Undo2, Check,
  AlertCircle, Loader2, Banknote,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog';
import { formatPKR } from '@/lib/money';
import { cn } from '@/lib/utils';

interface Appt {
  id: string;
  reference: string;
  status: string;
  customer_name: string;
  services: string[];
  service_ids: string[];
  staff_id: string | null;
  start_at: string;
  total: number;
}
interface Staff { id: string; full_name: string; service_ids: string[]; is_bookable: boolean }
interface SlotGroup { start_at: string; staff: { id: string; name: string }[] }

type Action = 'complete' | 'no_show' | 'cancel' | 'reschedule' | 'reopen' | null;

/**
 * THE ACTIONS MENU.
 *
 * Before this she could only Start and Complete. A customer who didn't turn up
 * left the chair blocked for the rest of the day.
 *
 * Every action here is destructive-ish, so every one of them:
 *   - states the CONSEQUENCE before she confirms
 *   - can be undone (Reopen)
 *
 * Nobody should learn a rule by breaking it.
 */
export function AppointmentActions({ appt, staff, onDone, compact }: {
  appt: Appt; staff: Staff[]; onDone: () => Promise<void>; compact?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const [action, setAction] = React.useState<Action>(null);

  const closed = ['completed', 'no_show', 'cancelled_by_business',
                  'cancelled_by_customer', 'expired'].includes(appt.status);

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          aria-label="More"
          className={cn(
            'grid place-items-center rounded-sm text-faint transition-colors hover:bg-soft hover:text-ink',
            compact ? 'size-7' : 'size-9',
          )}
        >
          <MoreHorizontal className={compact ? 'size-3.5' : 'size-4'} />
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <div className="absolute right-0 top-full z-50 mt-1 w-[204px] overflow-hidden rounded-lg border border-line bg-white py-1 shadow-lg">
              {closed ? (
                /* THE UNDO. Without it she'll be afraid to press Complete, and
                   then she'll stop marking things done, and her day's revenue
                   stops being true. */
                <MenuItem icon={<Undo2 className="size-4" />}
                  onClick={() => { setOpen(false); setAction('reopen'); }}>
                  Reopen
                </MenuItem>
              ) : (
                <>
                  <MenuItem icon={<Check className="size-4" />}
                    onClick={() => { setOpen(false); setAction('complete'); }}>
                    Complete…
                  </MenuItem>
                  <MenuItem icon={<CalendarClock className="size-4" />}
                    onClick={() => { setOpen(false); setAction('reschedule'); }}>
                    Reschedule
                  </MenuItem>

                  <div className="my-1 h-px bg-line" />

                  <MenuItem icon={<UserX className="size-4" />} danger
                    onClick={() => { setOpen(false); setAction('no_show'); }}>
                    Didn&apos;t turn up
                  </MenuItem>
                  <MenuItem icon={<XCircle className="size-4" />} danger
                    onClick={() => { setOpen(false); setAction('cancel'); }}>
                    Cancel
                  </MenuItem>
                </>
              )}
            </div>
          </>
        )}
      </div>

      {action && (
        <ActionDialog
          action={action}
          appt={appt}
          staff={staff}
          onClose={() => setAction(null)}
          onDone={async () => { setAction(null); await onDone(); }}
        />
      )}
    </>
  );
}

function MenuItem({ children, icon, onClick, danger }: {
  children: React.ReactNode; icon: React.ReactNode;
  onClick: () => void; danger?: boolean;
}) {
  return (
    <button onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left font-display text-[0.87rem] font-semibold transition-colors',
        danger ? 'text-bad hover:bg-red-50' : 'text-ink hover:bg-soft',
      )}>
      {icon} {children}
    </button>
  );
}

/* ====================================================================== */

function ActionDialog({ action, appt, staff, onClose, onDone }: {
  action: Exclude<Action, null>;
  appt: Appt; staff: Staff[];
  onClose: () => void; onDone: () => Promise<void>;
}) {
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  /* ---- complete ---- */
  const [amount, setAmount] = React.useState(String(appt.total));
  const [reason, setReason] = React.useState('');

  /* ---- reschedule ---- */
  const [date, setDate] = React.useState(() => new Date().toISOString().slice(0, 10));
  const [slots, setSlots] = React.useState<SlotGroup[] | null>(null);
  const [slot, setSlot] = React.useState('');
  const [staffId, setStaffId] = React.useState(appt.staff_id ?? '');

  React.useEffect(() => {
    if (action !== 'reschedule') return;
    let dead = false;
    setSlots(null); setSlot('');

    /* Ask availability for the SAME services. A shorter query would return
       slots that don't actually fit, she'd pick one, and the EXCLUDE constraint
       would refuse it — with a customer standing there. */
    fetch(`/api/v1/availability?date=${date}&service_ids=${appt.service_ids.join(',')}`)
      .then(r => r.json())
      .then(j => { if (!dead) setSlots(j.data ?? []); })
      .catch(() => { if (!dead) setSlots([]); });

    return () => { dead = true; };
  }, [action, date, appt.service_ids]);

  const run = async () => {
    setError(null);
    setBusy(true);

    let res: Response;

    switch (action) {
      case 'complete':
        res = await fetch(`/api/v1/appointments/${appt.id}/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            final_amount: Number(amount),
            reason: Number(amount) !== appt.total ? (reason || 'Adjusted at the counter') : undefined,
          }),
        });
        break;

      case 'no_show':
      case 'cancel':
        res = await fetch(`/api/v1/appointments/${appt.id}/cancel`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ no_show: action === 'no_show', reason: reason || null }),
        });
        break;

      case 'reopen':
        res = await fetch(`/api/v1/appointments/${appt.id}/reopen`, { method: 'POST' });
        break;

      case 'reschedule':
        if (!slot || !staffId) { setBusy(false); setError('Pick a new time.'); return; }
        res = await fetch(`/api/v1/appointments/${appt.id}/reschedule`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ start_at: slot, staff_id: staffId }),
        });
        break;
    }

    const json = await res!.json();
    setBusy(false);

    if (!res!.ok) { setError(json.error?.title ?? 'Could not do that.'); return; }
    await onDone();
  };

  const TITLES: Record<Exclude<Action, null>, string> = {
    complete:   'Complete appointment',
    no_show:    'Didn\u2019t turn up',
    cancel:     'Cancel appointment',
    reschedule: 'Move appointment',
    reopen:     'Reopen appointment',
  };

  const adjusted = Number(amount) !== appt.total;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent title={TITLES[action]} className="max-w-[460px]">
        {/* Who this is about. She's doing this at a counter with a queue. */}
        <div className="mb-5 rounded-lg border border-line bg-soft px-4 py-3">
          <p className="font-display text-[0.95rem] font-bold text-ink">
            {appt.customer_name}
          </p>
          <p className="text-[0.82rem] text-muted">
            {appt.services.join(', ')}
            {' · '}
            <span className="tnum font-mono">
              {new Date(appt.start_at).toLocaleTimeString('en-GB',
                { hour: '2-digit', minute: '2-digit', hour12: true })}
            </span>
          </p>
        </div>

        <div className="space-y-4">
          {/* ---------- COMPLETE ---------- */}
          {action === 'complete' && (
            <>
              <div>
                <label className="mb-2 block font-display text-[0.72rem] font-bold uppercase tracking-[0.08em] text-faint">
                  What did they actually pay?
                </label>
                <div className="flex items-center overflow-hidden rounded-sm border border-line2 bg-white focus-within:border-brand focus-within:ring-[3px] focus-within:ring-brand/15">
                  <span className="flex-none border-r border-line2 bg-soft px-3.5 py-3 font-mono text-[0.9rem] text-muted">
                    Rs
                  </span>
                  <input
                    autoFocus type="number" inputMode="numeric" min={0}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="tnum min-w-0 flex-1 border-0 bg-transparent px-3.5 py-3 font-mono text-[1.05rem] font-semibold text-ink focus:outline-none"
                  />
                </div>
                <p className="mt-2 text-[0.79rem] text-faint">
                  Quoted <span className="tnum font-mono">{formatPKR(appt.total)}</span>.
                  Change it if the final bill was different.
                </p>
              </div>

              {/* The quote is a PROMISE. If she charged more, we record BOTH —
                  we never silently overwrite what the customer was told. */}
              {adjusted && (
                <div className="rounded-lg border border-brand/25 bg-brand-tint2 p-3.5">
                  <p className="mb-2 flex items-center gap-1.5 font-display text-[0.8rem] font-bold text-ink">
                    <Banknote className="size-4 text-brand" />
                    {Number(amount) > appt.total ? 'More than quoted' : 'Less than quoted'}
                  </p>
                  <Input
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Why? e.g. colour needed an extra tube"
                    className="bg-white"
                  />
                  <p className="mt-2 text-[0.76rem] leading-relaxed text-muted">
                    Both the quote and the final amount are kept. Your reports will
                    show the difference.
                  </p>
                </div>
              )}
            </>
          )}

          {/* ---------- NO-SHOW ---------- */}
          {action === 'no_show' && (
            <>
              <div className="rounded-lg border border-line bg-soft p-4">
                <p className="mb-2.5 font-display text-[0.9rem] font-bold text-ink">
                  This will:
                </p>
                <ul className="space-y-1.5 text-[0.86rem] leading-relaxed text-muted">
                  <li className="flex gap-2">
                    <span className="mt-1.5 size-1.5 flex-none rounded-full bg-ok" />
                    <b className="font-semibold text-ink">Free up the slot immediately</b> — you
                    can give it to someone else right now.
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-1.5 size-1.5 flex-none rounded-full bg-brand" />
                    Count against this customer&apos;s record.
                  </li>
                </ul>
              </div>

              <Input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Note — optional"
              />
            </>
          )}

          {/* ---------- CANCEL ---------- */}
          {action === 'cancel' && (
            <>
              <div className="rounded-lg border border-line bg-soft p-4">
                <p className="text-[0.88rem] leading-relaxed text-muted">
                  The slot is <b className="font-semibold text-ink">freed up immediately</b>.
                  This does <b className="font-semibold text-ink">not</b> count against
                  the customer — use <b className="font-semibold text-ink">&ldquo;Didn&apos;t turn
                  up&rdquo;</b> for that.
                </p>
              </div>

              <Input
                autoFocus
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Why? e.g. she called to cancel"
              />
            </>
          )}

          {/* ---------- REOPEN ---------- */}
          {action === 'reopen' && (
            <div className="rounded-lg border border-line bg-soft p-4">
              <p className="text-[0.88rem] leading-relaxed text-muted">
                This puts the appointment back on the calendar and undoes the visit
                count and revenue.
              </p>
              <p className="mt-2.5 text-[0.84rem] leading-relaxed text-ink">
                If someone else has taken the slot in the meantime, we&apos;ll tell you —
                and nothing will change.
              </p>
            </div>
          )}

          {/* ---------- RESCHEDULE ---------- */}
          {action === 'reschedule' && (
            <>
              <div>
                <label className="mb-2 block font-display text-[0.72rem] font-bold uppercase tracking-[0.08em] text-faint">
                  Which day?
                </label>
                <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
                  {Array.from({ length: 14 }, (_, i) => {
                    const d = new Date(); d.setDate(d.getDate() + i);
                    const iso = d.toISOString().slice(0, 10);
                    const on = iso === date;
                    return (
                      <button key={iso} onClick={() => setDate(iso)}
                        className={cn(
                          'flex-none rounded-sm border px-3 py-2 text-center transition-all',
                          on ? 'border-brand bg-brand text-white'
                             : 'border-line2 bg-white text-ink hover:border-faint',
                        )}>
                        <span className="block text-[0.6rem] font-semibold uppercase opacity-70">
                          {i === 0 ? 'Today' : d.toLocaleDateString('en-GB', { weekday: 'short' })}
                        </span>
                        <span className="tnum block font-display text-[0.95rem] font-bold">
                          {d.getDate()}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {slots === null ? (
                <div className="grid place-items-center py-6 text-faint">
                  <Loader2 className="size-5 animate-spin" />
                </div>
              ) : slots.length === 0 ? (
                <div className="rounded-lg border border-line bg-soft px-4 py-5 text-center">
                  <p className="font-display text-[0.9rem] font-bold text-ink">
                    Nothing free that day.
                  </p>
                  <p className="mt-1 text-[0.83rem] text-muted">Try another day.</p>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-1.5">
                  {slots.map(s => {
                    const on = s.start_at === slot;
                    return (
                      <button key={s.start_at}
                        onClick={() => { setSlot(s.start_at); setStaffId(s.staff[0]!.id); }}
                        className={cn(
                          'tnum rounded-sm border py-2 font-mono text-[0.82rem] transition-all',
                          on ? 'border-brand bg-brand font-semibold text-white'
                             : 'border-line2 bg-white text-ink hover:border-brand',
                        )}>
                        {new Date(s.start_at).toLocaleTimeString('en-GB',
                          { hour: '2-digit', minute: '2-digit', hour12: false })}
                      </button>
                    );
                  })}
                </div>
              )}

              <p className="text-[0.79rem] leading-relaxed text-faint">
                The price stays the same. If the new time isn&apos;t free, nothing
                changes — they keep their original slot.
              </p>
            </>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-[0.87rem] leading-relaxed text-red-700">
              <AlertCircle className="mt-0.5 size-[15px] flex-none" /> {error}
            </div>
          )}
        </div>

        <div className="mt-5 flex gap-2.5 border-t border-line pt-5">
          <Button
            block size="lg"
            loading={busy}
            variant={action === 'no_show' || action === 'cancel' ? 'destructive' : 'primary'}
            onClick={() => void run()}
          >
            {action === 'complete'   && `Complete · ${formatPKR(Number(amount) || 0)}`}
            {action === 'no_show'    && 'Mark as no-show'}
            {action === 'cancel'     && 'Cancel it'}
            {action === 'reopen'     && 'Reopen'}
            {action === 'reschedule' && 'Move it'}
          </Button>
          <DialogClose asChild>
            <Button size="lg" variant="secondary">Back</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
