CREATE POLICY "Authenticated users can insert subscriptions"
ON public.subscriptions
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM stores
    WHERE stores.id = subscriptions.store_id
    AND stores.user_id = auth.uid()
  )
);