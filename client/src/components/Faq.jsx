import { useState } from 'react';

const QA = [
  ['Are the 3D models what I actually get?', 'Yes — colours and print placement match the real items. The models are simplified, the fabric is not.'],
  ['How long does shipping take?', 'Everything is printed to order: 2–4 days to print, then 3–7 days in transit. Free shipping over $75.'],
  ['Can I return something?', 'Unworn items can be returned within 30 days. Mugs and stickers are final sale once opened.'],
  ['How do the sizes run?', 'Hoodies and tees are a relaxed, boxy fit. Check the size chart above, or size down for a closer fit.']
];

export default function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <section id="faq" className="faq">
      <div className="section-head">
        <h2>FAQ</h2>
        <span className="mono muted">#support</span>
      </div>
      <div className="thread">
        {QA.map(([q, a], i) => (
          <div key={q} className="msg-group">
            <button className="msg msg-q" onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i}>
              {q}
            </button>
            {open === i && (
              <div className="msg msg-a">
                <span className="typing" aria-hidden="true"><i /><i /><i /></span>
                <span className="answer">{a}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
