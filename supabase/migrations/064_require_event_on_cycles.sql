-- Migration: Require Event ID on Cycles
-- All cycles must belong to an event. Orphan cycles are migrated to Appathon 2.0.

-- ============================================
-- STEP 1: MIGRATE ORPHAN CYCLES TO APPATHON 2.0
-- ============================================

DO $$
DECLARE
  v_appathon_id UUID;
  v_orphan_count INTEGER;
BEGIN
  -- Get Appathon 2.0 event ID
  SELECT id INTO v_appathon_id FROM events WHERE slug = 'appathon-2' LIMIT 1;

  IF v_appathon_id IS NULL THEN
    RAISE EXCEPTION 'Appathon 2.0 event not found (slug: appathon-2). Cannot migrate orphan cycles.';
  END IF;

  -- Count orphan cycles before migration
  SELECT COUNT(*) INTO v_orphan_count FROM cycles WHERE event_id IS NULL;
  RAISE NOTICE 'Found % orphan cycles to migrate', v_orphan_count;

  -- Update all cycles without an event_id
  UPDATE cycles
  SET event_id = v_appathon_id,
      updated_at = NOW()
  WHERE event_id IS NULL;

  RAISE NOTICE 'Migrated % orphan cycles to Appathon 2.0 (event_id: %)', v_orphan_count, v_appathon_id;
END $$;

-- ============================================
-- STEP 2: VERIFY NO ORPHANS REMAIN
-- ============================================

DO $$
DECLARE
  v_null_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_null_count FROM cycles WHERE event_id IS NULL;

  IF v_null_count > 0 THEN
    RAISE EXCEPTION 'Migration failed: % cycles still have NULL event_id', v_null_count;
  END IF;

  RAISE NOTICE 'Verification passed: No orphan cycles remain';
END $$;

-- ============================================
-- STEP 3: ADD NOT NULL CONSTRAINT
-- ============================================

ALTER TABLE cycles ALTER COLUMN event_id SET NOT NULL;

-- ============================================
-- STEP 4: UPDATE COMMENT
-- ============================================

COMMENT ON COLUMN cycles.event_id IS 'Required: Every cycle must belong to an event. Users start cycles from event pages.';
