import { permanentRedirect } from 'next/navigation';

/** Permanent redirect — canonical path is now /post-spare-part-listing */
export default function PostSparePartRedirect() {
    permanentRedirect('/post-spare-part-listing');
}
