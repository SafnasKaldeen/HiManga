-- =====================================================
-- NOTIFICATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  manga_id UUID NULL,
  chapter_id UUID NULL,
  data JSONB NULL,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT notifications_manga_id_fkey FOREIGN KEY (manga_id) REFERENCES mangas(id) ON DELETE CASCADE,
  CONSTRAINT notifications_chapter_id_fkey FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_expires_at ON public.notifications USING btree (expires_at);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications USING btree (read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications USING btree (type);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications USING btree (user_id, read);

-- =====================================================
-- XP AND RANK SYSTEM
-- =====================================================

-- Rank thresholds based on XP
CREATE OR REPLACE FUNCTION get_rank_from_xp(xp_amount INTEGER)
RETURNS VARCHAR(50)
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  CASE
    WHEN xp_amount < 100 THEN RETURN 'Beginner Reader';
    WHEN xp_amount < 500 THEN RETURN 'Casual Reader';
    WHEN xp_amount < 1000 THEN RETURN 'Regular Reader';
    WHEN xp_amount < 2500 THEN RETURN 'Dedicated Reader';
    WHEN xp_amount < 5000 THEN RETURN 'Avid Reader';
    WHEN xp_amount < 10000 THEN RETURN 'Expert Reader';
    WHEN xp_amount < 20000 THEN RETURN 'Master Reader';
    WHEN xp_amount < 50000 THEN RETURN 'Elite Reader';
    WHEN xp_amount < 100000 THEN RETURN 'Legendary Reader';
    ELSE RETURN 'Mythical Reader';
  END CASE;
END;
$$;

-- =====================================================
-- READING STREAK CALCULATION
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_reading_streak(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  streak_count INTEGER := 0;
  check_date DATE := CURRENT_DATE;
BEGIN
  -- Check consecutive days with reading activity
  LOOP
    IF EXISTS (
      SELECT 1 FROM user_reads
      WHERE user_id = p_user_id
      AND updated_at::date = check_date
    ) THEN
      streak_count := streak_count + 1;
      check_date := check_date - INTERVAL '1 day';
    ELSE
      EXIT;
    END IF;
  END LOOP;

  RETURN streak_count;
END;
$$;

-- =====================================================
-- CONSOLIDATED USER READS TRIGGER (FIXED FOR FLOAT CHAPTERS)
-- Handles: XP awards, panel counting, manga counting, 
--          milestones, and manga completion
-- =====================================================
CREATE OR REPLACE FUNCTION handle_user_reads_update()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  old_chapters TEXT[];
  new_chapters TEXT[];
  newly_read_chapters TEXT[];
  chapters_read_diff INTEGER;
  xp_to_award INTEGER;
  new_xp INTEGER;
  new_rank VARCHAR(50);
  old_rank VARCHAR(50);
  total_chapters_read INTEGER;
  milestone_values INTEGER[] := ARRAY[10, 25, 50, 100, 250, 500, 1000];
  milestone INTEGER;
  milestone_xp INTEGER;
  manga_title VARCHAR(255);
  total_chapters INTEGER;
  read_chapters INTEGER;
  completed_count INTEGER;
  total_panels_to_add INTEGER := 0;
BEGIN
  -- Handle OLD value for both INSERT and UPDATE
  IF TG_OP = 'INSERT' THEN
    old_chapters := ARRAY[]::TEXT[];
  ELSE
    old_chapters := COALESCE(OLD.chapters, ARRAY[]::TEXT[]);
  END IF;
  
  new_chapters := COALESCE(NEW.chapters, ARRAY[]::TEXT[]);
  
  -- Find newly read chapters (chapters in NEW but not in OLD)
  SELECT ARRAY_AGG(chapter_num)
  INTO newly_read_chapters
  FROM UNNEST(new_chapters) AS chapter_num
  WHERE chapter_num NOT IN (SELECT UNNEST(old_chapters));
  
  chapters_read_diff := COALESCE(array_length(newly_read_chapters, 1), 0);

  -- Only process if new chapters were read
  IF chapters_read_diff > 0 THEN
    
    -- ============================================
    -- 1. AWARD XP FOR READING CHAPTERS (10 XP per chapter)
    -- ============================================
    xp_to_award := chapters_read_diff * 10;

    UPDATE users
    SET 
      xp = xp + xp_to_award,
      updated_at = NOW()
    WHERE id = NEW.user_id
    RETURNING xp, rank INTO new_xp, old_rank;

    new_rank := get_rank_from_xp(new_xp);

    IF new_rank != old_rank THEN
      UPDATE users
      SET rank = new_rank
      WHERE id = NEW.user_id;
    END IF;

    -- ============================================
    -- 2. UPDATE TOTAL PANELS READ
    -- ============================================
    -- Calculate total panels for newly read chapters
    -- Convert chapter numbers from TEXT to DECIMAL for comparison
    SELECT COALESCE(SUM(c.total_panels), 0)
    INTO total_panels_to_add
    FROM chapters c
    WHERE c.manga_id = NEW.manga_id 
    AND c.chapter_number::TEXT = ANY(newly_read_chapters);

    IF total_panels_to_add > 0 THEN
      UPDATE users
      SET total_panels_read = total_panels_read + total_panels_to_add
      WHERE id = NEW.user_id;
    END IF;

    -- ============================================
    -- 3. UPDATE TOTAL MANGAS READ
    -- ============================================
    SELECT COUNT(DISTINCT manga_id)
    INTO total_chapters_read
    FROM user_reads
    WHERE user_id = NEW.user_id
    AND array_length(chapters, 1) > 0;

    UPDATE users
    SET total_mangas_read = total_chapters_read
    WHERE id = NEW.user_id;

    -- ============================================
    -- 4. CHECK FOR CHAPTER READING MILESTONES
    -- ============================================
    -- Count total unique chapters read across all manga
    SELECT COALESCE(SUM(array_length(chapters, 1)), 0)
    INTO total_chapters_read
    FROM user_reads
    WHERE user_id = NEW.user_id;

    FOREACH milestone IN ARRAY milestone_values
    LOOP
      IF total_chapters_read >= milestone THEN
        -- Check if milestone already notified
        IF NOT EXISTS (
          SELECT 1 FROM notifications
          WHERE user_id = NEW.user_id
          AND type = 'milestone'
          AND data->>'type' = 'chapters_read'
          AND (data->>'milestone')::INTEGER = milestone
        ) THEN
          milestone_xp := milestone * 10;
          
          -- Award milestone XP
          UPDATE users
          SET xp = xp + milestone_xp
          WHERE id = NEW.user_id
          RETURNING xp, rank INTO new_xp, old_rank;

          new_rank := get_rank_from_xp(new_xp);
          IF new_rank != old_rank THEN
            UPDATE users SET rank = new_rank WHERE id = NEW.user_id;
          END IF;
          
          -- Create notification
          INSERT INTO notifications (user_id, type, title, message, data)
          VALUES (
            NEW.user_id,
            'milestone',
            '🏆 READING MILESTONE',
            'Congratulations! You''ve read ' || milestone || ' chapters total! +' || milestone_xp || ' XP earned!',
            jsonb_build_object(
              'milestone', milestone, 
              'type', 'chapters_read',
              'xp_earned', milestone_xp
            )
          );
        END IF;
      END IF;
    END LOOP;

    -- ============================================
    -- 5. CHECK FOR MANGA COMPLETION
    -- ============================================
    SELECT m.title, m.total_chapters
    INTO manga_title, total_chapters
    FROM mangas m
    WHERE m.id = NEW.manga_id;

    read_chapters := array_length(new_chapters, 1);

    IF read_chapters >= total_chapters AND total_chapters > 0 THEN
      IF NOT EXISTS (
        SELECT 1 FROM notifications
        WHERE user_id = NEW.user_id
        AND manga_id = NEW.manga_id
        AND type = 'manga_completed'
      ) THEN
        -- Award 100 XP for completing manga
        UPDATE users
        SET xp = xp + 100
        WHERE id = NEW.user_id
        RETURNING xp, rank INTO new_xp, old_rank;

        new_rank := get_rank_from_xp(new_xp);
        IF new_rank != old_rank THEN
          UPDATE users SET rank = new_rank WHERE id = NEW.user_id;
        END IF;

        -- Create completion notification
        INSERT INTO notifications (user_id, type, title, message, manga_id, data)
        VALUES (
          NEW.user_id,
          'manga_completed',
          '🏆 MANGA COMPLETED',
          'Congratulations! You''ve finished reading "' || manga_title || '"! +100 XP',
          NEW.manga_id,
          jsonb_build_object('manga_title', manga_title, 'total_chapters', total_chapters, 'xp_earned', 100)
        );

        -- ============================================
        -- 6. CHECK FOR SERIES COMPLETION MILESTONES
        -- ============================================
        SELECT COUNT(DISTINCT ur.manga_id)
        INTO completed_count
        FROM user_reads ur
        JOIN mangas m ON m.id = ur.manga_id
        WHERE ur.user_id = NEW.user_id
        AND array_length(ur.chapters, 1) >= m.total_chapters
        AND m.total_chapters > 0;

        IF completed_count IN (5, 10, 25, 50, 100) THEN
          -- Check if series milestone already notified
          IF NOT EXISTS (
            SELECT 1 FROM notifications
            WHERE user_id = NEW.user_id
            AND type = 'milestone'
            AND data->>'type' = 'series_completed'
            AND (data->>'completed_count')::INTEGER = completed_count
          ) THEN
            milestone_xp := completed_count * 50;
            
            UPDATE users
            SET xp = xp + milestone_xp
            WHERE id = NEW.user_id
            RETURNING xp, rank INTO new_xp, old_rank;

            new_rank := get_rank_from_xp(new_xp);
            IF new_rank != old_rank THEN
              UPDATE users SET rank = new_rank WHERE id = NEW.user_id;
            END IF;

            INSERT INTO notifications (user_id, type, title, message, data)
            VALUES (
              NEW.user_id,
              'milestone',
              '🏆 COMPLETION MILESTONE',
              'You''ve completed ' || completed_count || ' manga series! +' || milestone_xp || ' XP!',
              jsonb_build_object('completed_count', completed_count, 'type', 'series_completed', 'xp_earned', milestone_xp)
            );
          END IF;
        END IF;
      END IF;
    END IF;

  END IF;

  RETURN NEW;
END;
$$;

-- =====================================================
-- READING STREAK TRIGGER
-- Handles: Streak detection and XP awards
-- =====================================================
CREATE OR REPLACE FUNCTION handle_reading_streak()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  streak INTEGER;
  streak_milestones INTEGER[] := ARRAY[7, 14, 30, 60, 90, 180, 365];
  milestone INTEGER;
  reward_xp INTEGER;
  new_xp INTEGER;
  new_rank VARCHAR(50);
  old_rank VARCHAR(50);
BEGIN
  streak := calculate_reading_streak(NEW.user_id);

  FOREACH milestone IN ARRAY streak_milestones
  LOOP
    IF streak = milestone THEN
      -- Check if streak notification already exists
      IF NOT EXISTS (
        SELECT 1 FROM notifications
        WHERE user_id = NEW.user_id
        AND type = 'reading_streak'
        AND (data->>'streak_days')::INTEGER = milestone
      ) THEN
        reward_xp := milestone * 10;
        
        -- Award XP
        UPDATE users
        SET xp = xp + reward_xp
        WHERE id = NEW.user_id
        RETURNING xp, rank INTO new_xp, old_rank;

        -- Check for rank up
        new_rank := get_rank_from_xp(new_xp);
        
        IF new_rank != old_rank THEN
          UPDATE users SET rank = new_rank WHERE id = NEW.user_id;
        END IF;

        -- Create notification
        INSERT INTO notifications (user_id, type, title, message, data)
        VALUES (
          NEW.user_id,
          'reading_streak',
          '🔥 ' || milestone || '-DAY STREAK!',
          'Amazing dedication! You''ve read for ' || milestone || ' consecutive days. +' || reward_xp || ' XP earned!',
          jsonb_build_object(
            'streak_days', milestone, 
            'reward_xp', reward_xp
          )
        );
      END IF;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

-- =====================================================
-- NEW CHAPTER NOTIFICATION
-- Notifies users who favorited OR bookmarked the manga
-- =====================================================
CREATE OR REPLACE FUNCTION notify_new_chapter()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  manga_title VARCHAR(255);
BEGIN
  -- Get manga title
  SELECT title INTO manga_title
  FROM mangas
  WHERE id = NEW.manga_id;

  -- Create notifications for all users who favorited OR bookmarked this manga
  INSERT INTO notifications (user_id, type, title, message, manga_id, chapter_id, data)
  SELECT DISTINCT
    user_id,
    'new_chapter',
    '📚 NEW CHAPTER RELEASED',
    'Chapter ' || NEW.chapter_number || ' of "' || manga_title || '" has been released!',
    NEW.manga_id,
    NEW.id,
    jsonb_build_object(
      'chapter_number', NEW.chapter_number,
      'manga_title', manga_title
    )
  FROM (
    -- Users who favorited the manga
    SELECT user_id FROM user_favorites WHERE manga_id = NEW.manga_id
    UNION
    -- Users who bookmarked the manga
    SELECT user_id FROM bookmarks WHERE manga_id = NEW.manga_id
  ) AS interested_users;

  RETURN NEW;
END;
$$;

-- =====================================================
-- RANK UP NOTIFICATION
-- =====================================================
CREATE OR REPLACE FUNCTION notify_rank_up()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only notify if rank actually changed
  IF NEW.rank IS DISTINCT FROM OLD.rank THEN
    INSERT INTO notifications (user_id, type, title, message, data)
    VALUES (
      NEW.id,
      'rank_up',
      '⭐ LEVEL UP!',
      'You''ve reached a new rank: ' || NEW.rank || '!',
      jsonb_build_object('old_rank', OLD.rank, 'new_rank', NEW.rank, 'xp', NEW.xp)
    );
  END IF;

  RETURN NEW;
END;
$$;

-- =====================================================
-- CONTINUE READING REMINDER (FIXED FOR FLOAT CHAPTERS)
-- Notifies users about bookmarked manga they haven't read in 3 days
-- =====================================================
CREATE OR REPLACE FUNCTION notify_continue_reading()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  bookmark_record RECORD;
  manga_title VARCHAR(255);
BEGIN
  FOR bookmark_record IN
    SELECT b.user_id, b.manga_id, b.chapter_number, b.updated_at
    FROM bookmarks b
    WHERE b.updated_at < NOW() - INTERVAL '3 days'
    AND NOT EXISTS (
      SELECT 1 FROM notifications n
      WHERE n.user_id = b.user_id
      AND n.manga_id = b.manga_id
      AND n.type = 'continue_reading'
      AND n.created_at > NOW() - INTERVAL '3 days'
    )
  LOOP
    -- Get manga title
    SELECT title INTO manga_title
    FROM mangas
    WHERE id = bookmark_record.manga_id;

    -- Create notification
    INSERT INTO notifications (user_id, type, title, message, manga_id, data)
    VALUES (
      bookmark_record.user_id,
      'continue_reading',
      '📖 CONTINUE READING',
      'You left off at Chapter ' || bookmark_record.chapter_number || ' of "' || manga_title || '"',
      bookmark_record.manga_id,
      jsonb_build_object('chapter_number', bookmark_record.chapter_number, 'manga_title', manga_title)
    );
  END LOOP;
END;
$$;

-- =====================================================
-- CATCH UP ALERT (FIXED FOR FLOAT CHAPTERS)
-- Notifies when favorited/bookmarked manga has 3+ unread chapters
-- =====================================================
CREATE OR REPLACE FUNCTION notify_catch_up()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  interested_record RECORD;
  manga_title VARCHAR(255);
  total_chapters INTEGER;
  read_chapters INTEGER;
  unread_count INTEGER;
  all_chapter_numbers TEXT[];
  user_read_chapters TEXT[];
BEGIN
  -- Check both favorites and bookmarks
  FOR interested_record IN
    SELECT DISTINCT user_id, manga_id
    FROM (
      SELECT user_id, manga_id FROM user_favorites
      UNION
      SELECT user_id, manga_id FROM bookmarks
    ) AS interested_users
  LOOP
    -- Get all chapter numbers for this manga as TEXT array
    SELECT ARRAY_AGG(chapter_number::TEXT ORDER BY chapter_number)
    INTO all_chapter_numbers
    FROM chapters
    WHERE manga_id = interested_record.manga_id;
    
    total_chapters := COALESCE(array_length(all_chapter_numbers, 1), 0);

    -- Get chapters read by user
    SELECT chapters
    INTO user_read_chapters
    FROM user_reads
    WHERE user_id = interested_record.user_id
    AND manga_id = interested_record.manga_id;
    
    read_chapters := COALESCE(array_length(user_read_chapters, 1), 0);

    -- Calculate unread chapters by comparing actual chapter arrays
    IF total_chapters > 0 AND user_read_chapters IS NOT NULL THEN
      SELECT COUNT(*)
      INTO unread_count
      FROM UNNEST(all_chapter_numbers) AS chapter_num
      WHERE chapter_num NOT IN (SELECT UNNEST(user_read_chapters));
    ELSE
      unread_count := total_chapters;
    END IF;

    -- If 3+ unread chapters and no recent notification
    IF unread_count >= 3 THEN
      -- Check if notification already sent recently
      IF NOT EXISTS (
        SELECT 1 FROM notifications
        WHERE user_id = interested_record.user_id
        AND manga_id = interested_record.manga_id
        AND type = 'catch_up'
        AND created_at > NOW() - INTERVAL '2 days'
      ) THEN
        -- Get manga title
        SELECT title INTO manga_title
        FROM mangas
        WHERE id = interested_record.manga_id;

        -- Create notification
        INSERT INTO notifications (user_id, type, title, message, manga_id, data)
        VALUES (
          interested_record.user_id,
          'catch_up',
          '⚠️ CATCH UP',
          unread_count || ' new chapters of "' || manga_title || '" are waiting for you!',
          interested_record.manga_id,
          jsonb_build_object('unread_count', unread_count, 'manga_title', manga_title)
        );
      END IF;
    END IF;
  END LOOP;
END;
$$;

-- =====================================================
-- DAILY LOGIN NOTIFICATION & XP
-- =====================================================
CREATE OR REPLACE FUNCTION notify_daily_login(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if user already logged in today
  IF NOT EXISTS (
    SELECT 1 FROM notifications
    WHERE user_id = p_user_id
    AND type = 'daily_login'
    AND created_at::date = CURRENT_DATE
  ) THEN
    INSERT INTO notifications (user_id, type, title, message, data)
    VALUES (
      p_user_id,
      'daily_login',
      '⭐ DAILY LOGIN',
      'Welcome back! Daily login reward claimed: +50 XP',
      jsonb_build_object('reward_xp', 50)
    );
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION award_daily_login_xp(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  already_claimed BOOLEAN;
  new_xp INTEGER;
  new_rank VARCHAR(50);
  old_rank VARCHAR(50);
BEGIN
  -- Check if user already claimed today
  SELECT EXISTS(
    SELECT 1 FROM notifications
    WHERE user_id = p_user_id
    AND type = 'daily_login'
    AND created_at::date = CURRENT_DATE
  ) INTO already_claimed;

  IF already_claimed THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Daily login already claimed today'
    );
  END IF;

  -- Award 50 XP for daily login
  UPDATE users
  SET 
    xp = xp + 50,
    updated_at = NOW()
  WHERE id = p_user_id
  RETURNING xp, rank INTO new_xp, old_rank;

  -- Check for rank up
  new_rank := get_rank_from_xp(new_xp);
  
  IF new_rank != old_rank THEN
    UPDATE users
    SET rank = new_rank
    WHERE id = p_user_id;
  END IF;

  -- Create daily login notification
  PERFORM notify_daily_login(p_user_id);

  RETURN jsonb_build_object(
    'success', true,
    'xp_awarded', 50,
    'total_xp', new_xp,
    'rank', new_rank,
    'ranked_up', (new_rank != old_rank)
  );
END;
$$;

-- =====================================================
-- POPULAR CHAPTER ALERT
-- Notifies when manga reaches view milestones
-- =====================================================
CREATE OR REPLACE FUNCTION notify_popular_chapter()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only trigger at specific view milestones
  IF NEW.total_views >= 10000 AND OLD.total_views < 10000 THEN
    -- Notify users who favorited OR bookmarked this manga
    INSERT INTO notifications (user_id, type, title, message, manga_id, data)
    SELECT DISTINCT
      user_id,
      'popular_chapter',
      '🔥 TRENDING NOW',
      '"' || NEW.title || '" is trending with ' || (NEW.total_views / 1000) || 'K+ readers!',
      NEW.id,
      jsonb_build_object('views', NEW.total_views, 'manga_title', NEW.title)
    FROM (
      -- Users who favorited the manga
      SELECT user_id FROM user_favorites WHERE manga_id = NEW.id
      UNION
      -- Users who bookmarked the manga
      SELECT user_id FROM bookmarks WHERE manga_id = NEW.id
    ) AS interested_users;
  END IF;

  RETURN NEW;
END;
$$;

-- =====================================================
-- CLEANUP EXPIRED NOTIFICATIONS
-- =====================================================
CREATE OR REPLACE FUNCTION cleanup_expired_notifications()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM notifications
  WHERE expires_at < NOW();
END;
$$;

-- =====================================================
-- HELPER FUNCTIONS FOR NOTIFICATION MANAGEMENT
-- =====================================================

-- Mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(p_notification_id UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE notifications
  SET read = TRUE
  WHERE id = p_notification_id;
END;
$$;

-- Mark all notifications as read for a user
CREATE OR REPLACE FUNCTION mark_all_notifications_read(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE notifications
  SET read = TRUE
  WHERE user_id = p_user_id AND read = FALSE;
END;
$$;

-- Delete notification
CREATE OR REPLACE FUNCTION delete_notification(p_notification_id UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM notifications
  WHERE id = p_notification_id;
END;
$$;

-- Clear all notifications for a user
CREATE OR REPLACE FUNCTION clear_all_notifications(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM notifications
  WHERE user_id = p_user_id;
END;
$$;

-- Get unread notification count
CREATE OR REPLACE FUNCTION get_unread_count(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  unread_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO unread_count
  FROM notifications
  WHERE user_id = p_user_id
  AND read = FALSE
  AND expires_at > NOW();

  RETURN unread_count;
END;
$$;

-- Manually adjust user XP
CREATE OR REPLACE FUNCTION adjust_user_xp(
  p_user_id UUID,
  p_xp_change INTEGER,
  p_reason TEXT DEFAULT 'Manual adjustment'
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  new_xp INTEGER;
  new_rank VARCHAR(50);
  old_rank VARCHAR(50);
BEGIN
  UPDATE users
  SET 
    xp = GREATEST(0, xp + p_xp_change),
    updated_at = NOW()
  WHERE id = p_user_id
  RETURNING xp, rank INTO new_xp, old_rank;

  -- Recalculate rank
  new_rank := get_rank_from_xp(new_xp);
  
  IF new_rank != old_rank THEN
    UPDATE users
    SET rank = new_rank
    WHERE id = p_user_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'xp_change', p_xp_change,
    'new_xp', new_xp,
    'old_rank', old_rank,
    'new_rank', new_rank,
    'ranked_up', (new_rank != old_rank),
    'reason', p_reason
  );
END;
$$;

-- =====================================================
-- GET USER READING PROGRESS FOR A MANGA (FIXED)
-- Returns proper chapter count and completion percentage
-- =====================================================
CREATE OR REPLACE FUNCTION get_user_manga_progress(
  p_user_id UUID,
  p_manga_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  total_chapters INTEGER;
  read_chapters INTEGER;
  completion_percentage NUMERIC;
  user_chapters TEXT[];
  result JSONB;
BEGIN
  -- Get total chapters available
  SELECT COUNT(*)
  INTO total_chapters
  FROM chapters
  WHERE manga_id = p_manga_id;

  -- Get user's read chapters
  SELECT chapters
  INTO user_chapters
  FROM user_reads
  WHERE user_id = p_user_id
  AND manga_id = p_manga_id;

  read_chapters := COALESCE(array_length(user_chapters, 1), 0);
  
  -- Calculate completion percentage
  IF total_chapters > 0 THEN
    completion_percentage := ROUND((read_chapters::NUMERIC / total_chapters::NUMERIC) * 100, 2);
  ELSE
    completion_percentage := 0;
  END IF;

  RETURN jsonb_build_object(
    'manga_id', p_manga_id,
    'total_chapters', total_chapters,
    'read_chapters', read_chapters,
    'completion_percentage', completion_percentage,
    'is_completed', (read_chapters >= total_chapters AND total_chapters > 0)
  );
END;
$$;

-- =====================================================
-- GET USER READING PROGRESS FOR A MANGA (FIXED)
-- Returns proper chapter count and completion percentage
-- =====================================================
CREATE OR REPLACE FUNCTION get_user_manga_progress(
  p_user_id UUID,
  p_manga_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  total_chapters INTEGER;
  read_chapters INTEGER;
  completion_percentage NUMERIC;
  user_chapters TEXT[];
  result JSONB;
BEGIN
  -- Get total chapters available
  SELECT COUNT(*)
  INTO total_chapters
  FROM chapters
  WHERE manga_id = p_manga_id;

  -- Get user's read chapters
  SELECT chapters
  INTO user_chapters
  FROM user_reads
  WHERE user_id = p_user_id
  AND manga_id = p_manga_id;

  read_chapters := COALESCE(array_length(user_chapters, 1), 0);
  
  -- Calculate completion percentage
  IF total_chapters > 0 THEN
    completion_percentage := ROUND((read_chapters::NUMERIC / total_chapters::NUMERIC) * 100, 2);
  ELSE
    completion_percentage := 0;
  END IF;

  RETURN jsonb_build_object(
    'manga_id', p_manga_id,
    'total_chapters', total_chapters,
    'read_chapters', read_chapters,
    'completion_percentage', completion_percentage,
    'is_completed', (read_chapters >= total_chapters AND total_chapters > 0)
  );
END;
$$;

-- =====================================================
-- GET ALL USER MANGA WITH PROGRESS (FIXED)
-- Returns all manga read by user with proper progress calculation
-- =====================================================
CREATE OR REPLACE FUNCTION get_user_all_manga_progress(p_user_id UUID)
RETURNS TABLE (
  manga_id UUID,
  manga_title VARCHAR(255),
  total_chapters INTEGER,
  read_chapters INTEGER,
  completion_percentage NUMERIC,
  is_completed BOOLEAN,
  last_read_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id AS manga_id,
    m.title AS manga_title,
    (SELECT COUNT(*) FROM chapters WHERE manga_id = m.id)::INTEGER AS total_chapters,
    COALESCE(array_length(ur.chapters, 1), 0)::INTEGER AS read_chapters,
    CASE 
      WHEN (SELECT COUNT(*) FROM chapters WHERE manga_id = m.id) > 0 
      THEN ROUND((COALESCE(array_length(ur.chapters, 1), 0)::NUMERIC / (SELECT COUNT(*) FROM chapters WHERE manga_id = m.id)::NUMERIC) * 100, 2)
      ELSE 0
    END AS completion_percentage,
    (COALESCE(array_length(ur.chapters, 1), 0) >= (SELECT COUNT(*) FROM chapters WHERE manga_id = m.id) 
     AND (SELECT COUNT(*) FROM chapters WHERE manga_id = m.id) > 0) AS is_completed,
    ur.updated_at AS last_read_at
  FROM user_reads ur
  JOIN mangas m ON m.id = ur.manga_id
  WHERE ur.user_id = p_user_id
  ORDER BY ur.updated_at DESC;
END;
$$;

-- =====================================================
-- CHECK IF CHAPTER IS READ BY USER (FIXED)
-- Returns true if the chapter is in the user's read list
-- =====================================================
CREATE OR REPLACE FUNCTION is_chapter_read(
  p_user_id UUID,
  p_manga_id UUID,
  p_chapter_number TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  is_read BOOLEAN;
BEGIN
  SELECT p_chapter_number = ANY(chapters)
  INTO is_read
  FROM user_reads
  WHERE user_id = p_user_id
  AND manga_id = p_manga_id;
  
  RETURN COALESCE(is_read, FALSE);
END;
$$;

-- =====================================================
-- GET NEXT UNREAD CHAPTER (FIXED)
-- Returns the next chapter the user hasn't read yet
-- =====================================================
CREATE OR REPLACE FUNCTION get_next_unread_chapter(
  p_user_id UUID,
  p_manga_id UUID
)
RETURNS TABLE (
  chapter_id UUID,
  chapter_number DECIMAL,
  chapter_title VARCHAR(255)
)
LANGUAGE plpgsql
AS $$
DECLARE
  user_chapters TEXT[];
BEGIN
  -- Get user's read chapters
  SELECT chapters
  INTO user_chapters
  FROM user_reads
  WHERE user_id = p_user_id
  AND manga_id = p_manga_id;
  
  -- If no chapters read yet, return the first chapter
  IF user_chapters IS NULL THEN
    RETURN QUERY
    SELECT c.id, c.chapter_number, c.title
    FROM chapters c
    WHERE c.manga_id = p_manga_id
    ORDER BY c.chapter_number ASC
    LIMIT 1;
  ELSE
    -- Return first unread chapter
    RETURN QUERY
    SELECT c.id, c.chapter_number, c.title
    FROM chapters c
    WHERE c.manga_id = p_manga_id
    AND c.chapter_number::TEXT != ALL(user_chapters)
    ORDER BY c.chapter_number ASC
    LIMIT 1;
  END IF;
END;
$$;

-- =====================================================
-- GET USER READING STATISTICS (FIXED)
-- Returns comprehensive reading stats for a user
-- =====================================================
CREATE OR REPLACE FUNCTION get_user_reading_stats(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  total_chapters_read INTEGER;
  total_manga_started INTEGER;
  total_manga_completed INTEGER;
  total_panels_read INTEGER;
  current_streak INTEGER;
  user_xp INTEGER;
  user_rank VARCHAR(50);
  avg_chapters_per_manga NUMERIC;
  favorite_genres TEXT[];
  result JSONB;
BEGIN
  -- Get basic user info
  SELECT xp, rank, total_panels_read
  INTO user_xp, user_rank, total_panels_read
  FROM users
  WHERE id = p_user_id;
  
  -- Total chapters read across all manga
  SELECT COALESCE(SUM(array_length(chapters, 1)), 0)
  INTO total_chapters_read
  FROM user_reads
  WHERE user_id = p_user_id;
  
  -- Total manga started (any chapters read)
  SELECT COUNT(*)
  INTO total_manga_started
  FROM user_reads
  WHERE user_id = p_user_id
  AND array_length(chapters, 1) > 0;
  
  -- Total manga completed
  SELECT COUNT(*)
  INTO total_manga_completed
  FROM user_reads ur
  JOIN mangas m ON m.id = ur.manga_id
  WHERE ur.user_id = p_user_id
  AND array_length(ur.chapters, 1) >= m.total_chapters
  AND m.total_chapters > 0;
  
  -- Average chapters per manga
  IF total_manga_started > 0 THEN
    avg_chapters_per_manga := ROUND(total_chapters_read::NUMERIC / total_manga_started::NUMERIC, 2);
  ELSE
    avg_chapters_per_manga := 0;
  END IF;
  
  -- Current reading streak
  current_streak := calculate_reading_streak(p_user_id);
  
  -- Get favorite genres (top 3 most read)
  SELECT ARRAY_AGG(genre)
  INTO favorite_genres
  FROM (
    SELECT m.genre, COUNT(*) as read_count
    FROM user_reads ur
    JOIN mangas m ON m.id = ur.manga_id
    WHERE ur.user_id = p_user_id
    AND m.genre IS NOT NULL
    GROUP BY m.genre
    ORDER BY read_count DESC
    LIMIT 3
  ) AS top_genres;
  
  RETURN jsonb_build_object(
    'user_id', p_user_id,
    'xp', user_xp,
    'rank', user_rank,
    'total_chapters_read', total_chapters_read,
    'total_manga_started', total_manga_started,
    'total_manga_completed', total_manga_completed,
    'total_panels_read', total_panels_read,
    'avg_chapters_per_manga', avg_chapters_per_manga,
    'current_reading_streak', current_streak,
    'favorite_genres', COALESCE(favorite_genres, ARRAY[]::TEXT[])
  );
END;
$$;

-- =====================================================
-- GET RECENTLY READ CHAPTERS (FIXED)
-- Returns the last N chapters read by the user
-- =====================================================
CREATE OR REPLACE FUNCTION get_recently_read_chapters(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  manga_id UUID,
  manga_title VARCHAR(255),
  manga_cover_image TEXT,
  last_read_chapter TEXT,
  last_read_at TIMESTAMP WITH TIME ZONE,
  total_chapters_read INTEGER,
  completion_percentage NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id AS manga_id,
    m.title AS manga_title,
    m.cover_image AS manga_cover_image,
    ur.chapters[array_length(ur.chapters, 1)] AS last_read_chapter,
    ur.updated_at AS last_read_at,
    array_length(ur.chapters, 1) AS total_chapters_read,
    CASE 
      WHEN m.total_chapters > 0 
      THEN ROUND((array_length(ur.chapters, 1)::NUMERIC / m.total_chapters::NUMERIC) * 100, 2)
      ELSE 0
    END AS completion_percentage
  FROM user_reads ur
  JOIN mangas m ON m.id = ur.manga_id
  WHERE ur.user_id = p_user_id
  AND array_length(ur.chapters, 1) > 0
  ORDER BY ur.updated_at DESC
  LIMIT p_limit;
END;
$$;

-- =====================================================
-- DROP ALL OLD CONFLICTING TRIGGERS
-- =====================================================
DROP TRIGGER IF EXISTS trigger_award_xp_for_reading ON user_reads;
DROP TRIGGER IF EXISTS trigger_update_user_panels_read ON user_reads;
DROP TRIGGER IF EXISTS trigger_update_user_mangas_read ON user_reads;
DROP TRIGGER IF EXISTS trigger_notify_reading_milestones ON user_reads;
DROP TRIGGER IF EXISTS trigger_notify_manga_completed ON user_reads;
DROP TRIGGER IF EXISTS trigger_award_completion_xp ON user_reads;
DROP TRIGGER IF EXISTS trigger_award_milestone_xp ON user_reads;
DROP TRIGGER IF EXISTS trigger_award_series_completion_xp ON user_reads;
DROP TRIGGER IF EXISTS trigger_notify_reading_streak ON user_reads;
DROP TRIGGER IF EXISTS trigger_award_streak_xp ON user_reads;
DROP TRIGGER IF EXISTS trigger_notify_new_chapter ON chapters;
DROP TRIGGER IF EXISTS trigger_notify_rank_up ON users;
DROP TRIGGER IF EXISTS trigger_notify_popular_chapter ON mangas;
DROP TRIGGER IF EXISTS trigger_handle_user_reads ON user_reads;
DROP TRIGGER IF EXISTS trigger_handle_reading_streak ON user_reads;

-- =====================================================
-- CREATE ALL TRIGGERS
-- =====================================================

-- Trigger: Handle all user reads updates (XP, panels, milestones, completion)
CREATE TRIGGER trigger_handle_user_reads
AFTER INSERT OR UPDATE OF chapters ON user_reads
FOR EACH ROW
EXECUTE FUNCTION handle_user_reads_update();

-- Trigger: Handle reading streaks
CREATE TRIGGER trigger_handle_reading_streak
AFTER UPDATE OF updated_at ON user_reads
FOR EACH ROW
EXECUTE FUNCTION handle_reading_streak();

-- Trigger: Notify on new chapter release
CREATE TRIGGER trigger_notify_new_chapter
AFTER INSERT ON chapters
FOR EACH ROW
EXECUTE FUNCTION notify_new_chapter();

-- Trigger: Notify on rank up
CREATE TRIGGER trigger_notify_rank_up
AFTER UPDATE OF rank ON users
FOR EACH ROW
WHEN (NEW.rank IS DISTINCT FROM OLD.rank)
EXECUTE FUNCTION notify_rank_up();

-- Trigger: Notify on popular manga
CREATE TRIGGER trigger_notify_popular_chapter
AFTER UPDATE OF total_views ON mangas
FOR EACH ROW
EXECUTE FUNCTION notify_popular_chapter();

-- =====================================================
-- SCHEDULED JOBS (Setup with pg_cron)
-- =====================================================

-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Drop existing cron jobs if they exist
SELECT cron.unschedule('cleanup-notifications');
SELECT cron.unschedule('continue-reading-reminders');
SELECT cron.unschedule('catch-up-alerts');

-- Schedule cleanup at midnight every day
SELECT cron.schedule('cleanup-notifications', '0 0 * * *', 'SELECT cleanup_expired_notifications()');

-- Schedule continue reading reminders at 9 AM daily
SELECT cron.schedule('continue-reading-reminders', '0 9 * * *', 'SELECT notify_continue_reading()');

-- Schedule catch-up alerts at 10 AM daily
SELECT cron.schedule('catch-up-alerts', '0 10 * * *', 'SELECT notify_catch_up()');

-- =====================================================
-- USAGE EXAMPLES & TESTING QUERIES
-- =====================================================

/*
-- ===== BASIC QUERIES =====

-- Get user notifications
SELECT * FROM notifications 
WHERE user_id = 'user-uuid-here' 
AND expires_at > NOW()
ORDER BY created_at DESC;

-- Get unread count
SELECT get_unread_count('user-uuid-here');

-- Mark notification as read
SELECT mark_notification_read('notification-uuid-here');

-- Mark all as read
SELECT mark_all_notifications_read('user-uuid-here');

-- Delete notification
SELECT delete_notification('notification-uuid-here');

-- Clear all notifications
SELECT clear_all_notifications('user-uuid-here');

-- Award daily login XP
SELECT award_daily_login_xp('user-uuid-here');

-- Manually adjust XP
SELECT adjust_user_xp('user-uuid-here', 100, 'Bonus reward');

-- Get user's current rank
SELECT rank, xp FROM users WHERE id = 'user-uuid-here';


-- ===== PROGRESS TRACKING QUERIES =====

-- Get progress for a specific manga
SELECT get_user_manga_progress('user-uuid-here', 'manga-uuid-here');

-- Get all manga progress for a user
SELECT * FROM get_user_all_manga_progress('user-uuid-here');

-- Check if specific chapter is read
SELECT is_chapter_read('user-uuid-here', 'manga-uuid-here', '123.5');

-- Get next unread chapter
SELECT * FROM get_next_unread_chapter('user-uuid-here', 'manga-uuid-here');

-- Get user reading statistics
SELECT get_user_reading_stats('user-uuid-here');

-- Get recently read chapters
SELECT * FROM get_recently_read_chapters('user-uuid-here', 10);


-- ===== DEBUGGING QUERIES =====

-- Test 1: Check what chapters are being detected as new
WITH old_data AS (
  SELECT chapters as old_chapters
  FROM user_reads 
  WHERE user_id = 'your-user-id' AND manga_id = 'your-manga-id'
),
new_data AS (
  SELECT ARRAY['1163','1','1162.00','1161.00','1160.00'] as new_chapters
)
SELECT 
  array_length((SELECT old_chapters FROM old_data), 1) as old_count,
  array_length((SELECT new_chapters FROM new_data), 1) as new_count,
  (
    SELECT ARRAY_AGG(chapter_num)
    FROM UNNEST((SELECT new_chapters FROM new_data)) AS chapter_num
    WHERE chapter_num NOT IN (SELECT UNNEST((SELECT old_chapters FROM old_data)))
  ) as newly_read_chapters;

-- Test 2: Check if chapters exist in chapters table
SELECT chapter_number, total_panels, title
FROM chapters
WHERE manga_id = 'your-manga-id'
AND chapter_number::TEXT = ANY(ARRAY['1163','1','1162.00','1161.00','1160.00']);

-- Test 3: Verify XP calculation for a user
SELECT 
  ur.user_id,
  ur.manga_id,
  array_length(ur.chapters, 1) as total_chapters_in_array,
  u.xp as current_xp,
  u.rank as current_rank,
  u.total_panels_read,
  u.total_mangas_read
FROM user_reads ur
JOIN users u ON u.id = ur.user_id
WHERE ur.user_id = 'your-user-id';

-- Test 4: Verify chapter comparison logic
SELECT 
  manga_id,
  (SELECT COUNT(*) FROM chapters WHERE manga_id = ur.manga_id) as total_available,
  array_length(chapters, 1) as chapters_read,
  (
    SELECT COUNT(*)
    FROM UNNEST((SELECT ARRAY_AGG(chapter_number::TEXT) FROM chapters WHERE manga_id = ur.manga_id)) AS avail_chapter
    WHERE avail_chapter NOT IN (SELECT UNNEST(ur.chapters))
  ) as unread_count
FROM user_reads ur
WHERE user_id = 'your-user-id'
AND manga_id = 'your-manga-id';

-- Test 5: View all user reading activity with proper counts
SELECT 
  u.id,
  u.username,
  u.xp,
  u.rank,
  u.total_panels_read,
  u.total_mangas_read,
  COUNT(DISTINCT ur.manga_id) as manga_count_from_reads,
  COALESCE(SUM(array_length(ur.chapters, 1)), 0) as total_chapters_from_reads
FROM users u
LEFT JOIN user_reads ur ON ur.user_id = u.id
WHERE u.id = 'your-user-id'
GROUP BY u.id;

-- Test 6: Check for duplicate chapters in user_reads
SELECT 
  user_id,
  manga_id,
  array_length(chapters, 1) as total_chapters,
  array_length(ARRAY(SELECT DISTINCT UNNEST(chapters)), 1) as unique_chapters
FROM user_reads
WHERE user_id = 'your-user-id'
HAVING array_length(chapters, 1) != array_length(ARRAY(SELECT DISTINCT UNNEST(chapters)), 1);

-- Test 7: Simulate a chapter read update (TEST ONLY - Don't run on production)
-- This shows what would happen if you update user_reads
DO $$
DECLARE
  test_user_id UUID := 'your-user-id';
  test_manga_id UUID := 'your-manga-id';
  current_chapters TEXT[];
  new_chapter TEXT := '123.5';
BEGIN
  -- Get current chapters
  SELECT chapters INTO current_chapters
  FROM user_reads
  WHERE user_id = test_user_id AND manga_id = test_manga_id;
  
  RAISE NOTICE 'Current chapters: %', current_chapters;
  RAISE NOTICE 'Adding chapter: %', new_chapter;
  
  -- This would trigger the XP system
  -- UPDATE user_reads 
  -- SET chapters = array_append(current_chapters, new_chapter)
  -- WHERE user_id = test_user_id AND manga_id = test_manga_id;
  
  RAISE NOTICE 'XP would be awarded: % XP', 10;
END $$;

*/