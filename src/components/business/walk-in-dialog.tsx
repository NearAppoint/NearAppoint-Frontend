'use client';
import * as React from 'react';
import { Plus, AlertCircle, Check, Loader2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog';
import { formatAsTyped, digitsOnly, isValidPkMobile } from '@/lib/phone';
import { formatPKR } from '@/lib/money';
import { cn } from '@/lib/utils';

interface Service { id: string; name: string; duration_minutes: number; price: number | null }
interface Group   { id: string; name: string; services: Service[] }
interface Staff   { id: string; full_name: string; service_ids: string[]; is_bookable: boolean }

interface Known {
  id: string; full_name: string | null; total_visits: number;
  last_visit_at: string | null; notes: string | null;
}

/**
 * THE WALK-IN.
 *
 * She uses this forty times a day, standing at the counter, with a customer in
 * front of her and a queue behind. If it takes twenty seconds, she reaches for
 * the paper register — and we have lost her.
 *
 * TARGET: phone -> service -> stylist -> Start. Four taps for a returning
 * customer, because her name, her usual, and her history fill in the moment the
 * number is complete.
 *
 * A phone number ALONE is a valid walk-in. Never block the front desk on a name.
 */
export function WalkInDialog({ groups, staff, onDone }: {
  groups: Group[]; staff: Staff[]; onDone: () => Promise<void>;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button size="lg" onClick={() => setOpen(true)}>
        <Plus /> Walk-in
      </Button>
      {open && (
        <WalkInForm
          groups={groups}
          staff={staff}
          onDone={async () => { setOpen(false); await onDone(); }}
        />
      )}
    </Dialog>
  );
}

function WalkInForm({ groups, staff, onDone }: {
  groups: Group[]; staff: Staff[]; onDone: () => Promise<void>;
}) {
  const [phone, setPhone] = React.useState('');
  const [name, setName] = React.useState('');
  const [known, setKnown] = React.useState<Known | null>(null);
  const [looking, setLooking] = React.useState(false);

  const [picked, setPicked] = React.useState<string[]>([]);   // ordered
  const [staffId, setStaffId] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const all = React.useMemo(() => groups.flatMap(g => g.services), [groups]);

  /**
   * The moment the number is complete, we look them up. Her name, her visit
   * count and her notes appear before the receptionist has drawn breath.
   *
   * This is the best demo in the product. Build it early, show it in the shop.
   */
  React.useEffect(() => {
    if (!isValidPkMobile(phone)) { setKnown(null); return; }

    let cancelled = false;
    setLooking(true);

    const t = setTimeout(async () => {
      const res = await fetch(`/api/v1/customers/lookup?phone=${digitsOnly(phone)}`);
      const json = await res.json();
      if (cancelled) return;
      setLooking(false);
      setKnown(json.data ?? null);
      if (json.data?.full_name && !name) setName(json.data.full_name);
    }, 250);

    return () => { cancelled = true; clearTimeout(t); };
  }, [phone]);   // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = (id: string) => {
    setPicked(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
    setError(null);
  };

  // Only staff who can do EVERY service she picked. Showing someone who can't
  // do the job, and letting her pick them, would fail at the server — and she'd
  // have to start over with a customer watching.
  const eligible = React.useMemo(() => {
    const bookable = staff.filter(s => s.is_bookable);
    if (!picked.length) return bookable;
    return bookable.filter(s => picked.every(id => s.service_ids.includes(id)));
  }, [staff, picked]);

  React.useEffect(() => {
    if (staffId && !eligible.some(s => s.id === staffId)) setStaffId('');
  }, [eligible, staffId]);

  const minutes = picked.reduce(
    (n, id) => n + (all.find(s => s.id === id)?.duration_minutes ?? 0), 0);
  const total = picked.reduce(
    (n, id) => n + (all.find(s => s.id === id)?.price ?? 0), 0);

  const submit = async () => {
    setError(null);

    if (!picked.length) { setError('Pick at least one service.'); return; }
    if (!staffId)       { setError('Pick who will do it.'); return; }

    setBusy(true);
    const res = await fetch('/api/v1/appointments/walk-in', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        staff_id: staffId,
        service_ids: picked,
        phone: phone ? digitsOnly(phone) : null,
        full_name: name || null,
      }),
    });
    const json = await res.json();
    setBusy(false);

    if (!res.ok) {
      /**
       * SLOT_TAKEN means the exclusion constraint fired — she tried to give a
       * stylist a customer while that stylist is mid-haircut. The database
       * refused. That is the system WORKING, and she gets a sentence she can
       * act on, not a 500.
       */
      setError(json.error?.title ?? 'Could not add the walk-in.');
      return;
    }

    await onDone();
  };

  return (
    <DialogContent title="Walk-in" className="max-w-[560px]">
      <div className="max-h-[64vh] space-y-5 overflow-y-auto pr-1">

        {/* ---- 1. Phone. Autofocused, numeric, no country picker. ---- */}
        <div>
          <label className="mb-2 block font-display text-[0.85rem] font-bold">
            Phone number <span className="font-normal text-faint">— optional</span>
          </label>
          <div className="flex items-center overflow-hidden rounded-sm border border-line2 bg-white focus-within:border-brand focus-within:ring-[3px] focus-within:ring-brand/15">
            <span className="flex-none border-r border-line2 bg-soft px-3.5 py-3 font-mono text-[0.9rem] text-ink">
              +92
            </span>
            <input
              autoFocus type="tel" inputMode="numeric" maxLength={12}
              value={formatAsTyped(phone)} placeholder="300 1234567"
              onChange={(e) => setPhone(e.target.value)}
              className="tnum min-w-0 flex-1 border-0 bg-transparent px-3.5 py-3 font-mono text-[1rem] text-ink placeholder:text-faint focus:outline-none"
            />
            {looking && <Loader2 className="mr-3 size-4 flex-none animate-spin text-faint" />}
          </div>
        </div>

        {/* ---- The moment that sells the product. ---- */}
        {known ? (
          <div className="rounded-lg border border-ok/30 bg-ok/[.07] p-4">
            <div className="flex items-start gap-3">
              <span className="grid size-9 flex-none place-items-center rounded-full bg-ok/15 font-display text-[0.75rem] font-bold text-ok">
                {(known.full_name ?? '?').split(' ').map(w => w[0]).slice(0, 2).join('')}
              </span>
              <div className="min-w-0">
                <p className="font-display text-[0.95rem] font-bold text-ink">
                  {known.full_name ?? 'Known customer'}
                </p>
                <p className="text-[0.82rem] text-muted">
                  {known.total_visits} {known.total_visits === 1 ? 'visit' : 'visits'}
                  {known.last_visit_at && ` · last ${relative(known.last_visit_at)}`}
                </p>
                {known.notes && (
                  <p className="mt-1.5 rounded bg-white px-2 py-1 text-[0.8rem] font-medium text-ink">
                    {known.notes}
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div>
            <label className="mb-2 block font-display text-[0.85rem] font-bold">
              Name <span className="font-normal text-faint">— optional</span>
            </label>
            <input
              value={name} placeholder="Walk-in"
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-sm border border-line2 bg-white px-4 py-3 text-[0.97rem] text-ink placeholder:text-faint focus:border-brand focus:outline-none focus:ring-[3px] focus:ring-brand/15"
            />
          </div>
        )}

        {/* ---- 2. Services. Chips, not a dropdown. Tap, don't scroll. ---- */}
        <div>
          <label className="mb-2 block font-display text-[0.85rem] font-bold">
            What are they having?
          </label>
          <div className="space-y-3">
            {groups.filter(g => g.services.length > 0).map(g => (
              <div key={g.id}>
                <p className="mb-1.5 font-display text-[0.7rem] font-bold uppercase tracking-wider text-faint">
                  {g.name}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {g.services.map(s => {
                    const on = picked.includes(s.id);
                    const n = picked.indexOf(s.id) + 1;
                    return (
                      <button key={s.id} type="button" onClick={() => toggle(s.id)}
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-sm border px-3 py-2 text-[0.86rem] transition-all',
                          on ? 'border-brand bg-brand-tint font-semibold text-ink'
                             : 'border-line2 bg-white text-muted hover:border-faint',
                        )}>
                        {on && picked.length > 1 && (
                          <span className="grid size-4 place-items-center rounded-full bg-brand font-mono text-[0.6rem] font-bold text-white">
                            {n}
                          </span>
                        )}
                        {s.name}
                        <span className="tnum text-[0.72rem] text-faint">
                          {s.duration_minutes}m
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ---- 3. Who. She picks. She's standing there; she knows who's free. ---- */}
        <div>
          <label className="mb-2 block font-display text-[0.85rem] font-bold">
            Who will do it?
          </label>

          {eligible.length === 0 ? (
            <div className="flex items-start gap-2 rounded-lg border border-brand/25 bg-brand-tint2 px-3.5 py-3 text-[0.86rem] leading-relaxed text-ink">
              <AlertCircle className="mt-0.5 size-[15px] flex-none text-brand" />
              {picked.length
                ? 'Nobody on your team is assigned to all of those services. Assign them in Staff, or pick fewer services.'
                : 'No bookable staff yet. Add someone in Staff first.'}
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {eligible.map(s => (
                <button key={s.id} type="button" onClick={() => setStaffId(s.id)}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-sm border px-3.5 py-2.5 text-[0.9rem] transition-all',
                    staffId === s.id
                      ? 'border-brand bg-brand-tint font-semibold text-ink'
                      : 'border-line2 bg-white text-muted hover:border-faint',
                  )}>
                  <User className="size-3.5" />
                  {s.full_name}
                  {staffId === s.id && <Check className="size-3.5 text-brand" strokeWidth={3} />}
                </button>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-[0.87rem] leading-relaxed text-red-700">
            <AlertCircle className="mt-0.5 size-[15px] flex-none" /> {error}
          </div>
        )}
      </div>

      {/* ---- Footer: what she's about to commit to ---- */}
      <div className="mt-5 border-t border-line pt-5">
        {picked.length > 0 && (
          <div className="mb-3.5 flex items-center justify-between text-[0.88rem]">
            <span className="tnum text-muted">
              {minutes} min
              {/* Buffer is NOT shown. It blocks her calendar, but it is not
                  time the customer is in the chair, and quoting it would be a lie. */}
            </span>
            <span className="tnum font-display font-bold text-ink">{formatPKR(total)}</span>
          </div>
        )}

        <div className="flex gap-2.5">
          <Button block size="lg" loading={busy}
            disabled={!picked.length || !staffId}
            onClick={() => void submit()}>
            Start now
          </Button>
          <DialogClose asChild>
            <Button size="lg" variant="secondary">Cancel</Button>
          </DialogClose>
        </div>
      </div>
    </DialogContent>
  );
}

function relative(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7)   return `${days} days ago`;
  if (days < 30)  return `${Math.floor(days / 7)} weeks ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return 'over a year ago';
}
