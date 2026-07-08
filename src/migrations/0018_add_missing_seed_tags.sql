-- 0018: Add missing tags used by the 300-pattern seed pack and frontend collections.
INSERT OR IGNORE INTO tags (id, name, slug, type) VALUES
('tag_animals', 'Animals', 'animals', 'subject'),
('tag_kawaii', 'Kawaii', 'kawaii', 'style'),
('tag_cute', 'Cute', 'cute', 'style'),
('tag_easy', 'Easy', 'easy', 'difficulty'),
('tag_medium_tag', 'Medium', 'medium', 'difficulty'),
('tag_nature', 'Nature', 'nature', 'subject'),
('tag_fantasy', 'Fantasy', 'fantasy', 'theme'),
('tag_food', 'Food', 'food', 'subject'),
('tag_flowers', 'Flowers', 'flowers', 'subject'),
('tag_seasonal', 'Seasonal', 'seasonal', 'theme'),
('tag_gaming_inspired', 'Gaming Inspired', 'gaming-inspired', 'theme'),
('tag_characters', 'Characters', 'characters', 'subject'),
('tag_pixel_art', 'Pixel Art', 'pixel-art', 'style'),
('tag_christmas', 'Christmas', 'christmas', 'season'),
('tag_halloween', 'Halloween', 'halloween', 'season');
