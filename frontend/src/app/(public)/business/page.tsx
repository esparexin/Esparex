import { permanentRedirect } from 'next/navigation';

/**
 * /business bare route — server-side 301.
 * next.config.mjs also carries a permanent redirect for belt-and-suspenders.
 * /business/[slug] dynamic routes are unaffected.
 */



export default function BusinessEntryPage() {
    permanentRedirect('/');
}
