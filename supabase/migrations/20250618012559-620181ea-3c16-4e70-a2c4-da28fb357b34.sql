
-- Primeiro, vamos limpar registros duplicados mantendo apenas o mais recente de cada produto
WITH duplicates AS (
  SELECT id, product_id,
         ROW_NUMBER() OVER (PARTITION BY product_id ORDER BY updated_at DESC) as rn
  FROM public.product_strategy
)
DELETE FROM public.product_strategy 
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Fazer o mesmo para product_copy
WITH duplicates AS (
  SELECT id, product_id,
         ROW_NUMBER() OVER (PARTITION BY product_id ORDER BY updated_at DESC) as rn
  FROM public.product_copy
)
DELETE FROM public.product_copy 
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Fazer o mesmo para product_offer
WITH duplicates AS (
  SELECT id, product_id,
         ROW_NUMBER() OVER (PARTITION BY product_id ORDER BY updated_at DESC) as rn
  FROM public.product_offer
)
DELETE FROM public.product_offer 
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Agora adicionar as constraints UNIQUE
ALTER TABLE public.product_strategy 
ADD CONSTRAINT product_strategy_product_id_unique UNIQUE (product_id);

ALTER TABLE public.product_copy 
ADD CONSTRAINT product_copy_product_id_unique UNIQUE (product_id);

ALTER TABLE public.product_offer 
ADD CONSTRAINT product_offer_product_id_unique UNIQUE (product_id);
