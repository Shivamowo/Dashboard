/**
 * Temporary switches for the current rollout phase. Flip via environment
 * variables (Vercel > Settings > Environment Variables) — no code change needed.
 *
 *  FACULTY_LOGINS_ENABLED=true     -> let faculty accounts sign in again.
 *                                     Default (unset): faculty logins are LOCKED.
 *  HOD_EDITS_NEED_APPROVAL=true    -> send HoD edits back through the Admin
 *                                     approval queue. Default (unset): HoD edits
 *                                     apply immediately.
 */
export const FACULTY_LOGINS_ENABLED = process.env.FACULTY_LOGINS_ENABLED === "true";
export const HOD_EDITS_NEED_APPROVAL = process.env.HOD_EDITS_NEED_APPROVAL === "true";
