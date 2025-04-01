-- Create boards table with sharing capability
CREATE TABLE IF NOT EXISTS boards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content JSONB DEFAULT '[]'::jsonb,
  user_id UUID REFERENCES auth.users(id),
  shared BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create shared_boards table to track board access
CREATE TABLE IF NOT EXISTS shared_boards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  board_id UUID REFERENCES boards(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'editor',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(board_id, user_id)
);

-- RLS Policies for boards table
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;

-- Policy for board owners
CREATE POLICY "Board owners can do anything"
  ON boards
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policy for shared boards (read access)
CREATE POLICY "Users can view boards shared with them"
  ON boards
  FOR SELECT
  USING (
    id IN (
      SELECT board_id FROM shared_boards
      WHERE user_id = auth.uid()
    )
    OR
    (shared = TRUE)
  );

-- Policy for shared boards (update access)
CREATE POLICY "Users can update boards shared with them"
  ON boards
  FOR UPDATE
  USING (
    id IN (
      SELECT board_id FROM shared_boards
      WHERE user_id = auth.uid() AND role = 'editor'
    )
    OR
    (shared = TRUE)
  )
  WITH CHECK (
    id IN (
      SELECT board_id FROM shared_boards
      WHERE user_id = auth.uid() AND role = 'editor'
    )
    OR
    (shared = TRUE)
  );

-- RLS Policies for shared_boards table
ALTER TABLE shared_boards ENABLE ROW LEVEL SECURITY;

-- Policy for board owners to manage sharing
CREATE POLICY "Board owners can manage sharing"
  ON shared_boards
  USING (
    board_id IN (
      SELECT id FROM boards
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    board_id IN (
      SELECT id FROM boards
      WHERE user_id = auth.uid()
    )
  );

-- Policy for users to view their shared boards
CREATE POLICY "Users can view their shared boards"
  ON shared_boards
  FOR SELECT
  USING (user_id = auth.uid());

