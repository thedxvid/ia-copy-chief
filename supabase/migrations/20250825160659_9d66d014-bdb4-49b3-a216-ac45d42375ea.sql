-- Fix security vulnerability: Restrict access to kiwify_webhooks table
-- Current issue: Weak admin check and potential data exposure

-- Drop the existing weak admin policy
DROP POLICY IF EXISTS "Admins can view all webhooks" ON public.kiwify_webhooks;

-- Create proper admin policy using the corrected is_admin function
CREATE POLICY "Only admins can view webhooks"
ON public.kiwify_webhooks
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- Allow webhook service to insert new webhooks (for webhook processing)
-- This is needed for the webhook functions to work
DROP POLICY IF EXISTS "Allow webhook service inserts" ON public.kiwify_webhooks;
CREATE POLICY "Allow webhook service inserts"
ON public.kiwify_webhooks
FOR INSERT
TO service_role
WITH CHECK (true);

-- Also allow authenticated webhook inserts (for webhook functions using anon key)
CREATE POLICY "Allow webhook function inserts"
ON public.kiwify_webhooks
FOR INSERT
TO anon
WITH CHECK (true);

-- Prevent any updates or deletes to maintain audit trail integrity
-- (These are already restricted but making it explicit)
CREATE POLICY "No updates allowed"
ON public.kiwify_webhooks
FOR UPDATE
TO authenticated
USING (false);

CREATE POLICY "No deletes allowed"
ON public.kiwify_webhooks
FOR DELETE
TO authenticated
USING (false);