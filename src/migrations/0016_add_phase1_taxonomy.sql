-- 0016: Add Phase 1 seed-pack taxonomy entries (collections + tags) used by the frontend sample data.
-- All INSERTs use OR IGNORE so they are safe to re-run on existing DBs.

-- Collections referenced by frontend sample seed data
INSERT OR IGNORE INTO collections (id, title, slug, description, display_order) VALUES
('col_kawaii', 'Kawaii Collection', 'kawaii-collection', 'Cute and kawaii bead patterns.', 21),
('col_gaming', 'Gaming Collection', 'gaming-collection', 'Video game and pixel art bead patterns.', 22),
('col_charm', 'Charm Collection', 'charm-collection', 'Small charm-sized bead patterns.', 23),
('col_flower', 'Flower Collection', 'flower-collection', 'Floral and flower bead patterns.', 24),
('col_nature', 'Nature Collection', 'nature-collection', 'Nature themed bead patterns.', 25),
('col_retro', 'Retro Collection', 'retro-collection', 'Retro and vintage style bead patterns.', 26),
('col_valentine', 'Valentine Collection', 'valentine-collection', 'Love and Valentine themed bead patterns.', 27),
('col_rainbow', 'Rainbow Collection', 'rainbow-collection', 'Rainbow and colorful bead patterns.', 28),
('col_halloween', 'Halloween Collection', 'halloween-collection', 'Spooky and fun Halloween designs.', 29);

-- Tags referenced by frontend sample seed data
INSERT OR IGNORE INTO tags (id, name, slug, type) VALUES
('tag_panda', 'Panda', 'panda', 'subject'),
('tag_mario', 'Mario', 'mario', 'subject'),
('tag_gaming', 'Gaming', 'gaming', 'theme'),
('tag_mushroom', 'Mushroom', 'mushroom', 'subject'),
('tag_cat', 'Cat', 'cat', 'subject'),
('tag_sleepy', 'Sleepy', 'sleepy', 'style'),
('tag_ghost', 'Ghost', 'ghost', 'subject'),
('tag_pumpkin', 'Pumpkin', 'pumpkin', 'subject'),
('tag_flower', 'Flower', 'flower', 'subject'),
('tag_sunflower', 'Sunflower', 'sunflower', 'subject'),
('tag_tulip', 'Tulip', 'tulip', 'subject'),
('tag_daisy', 'Daisy', 'daisy', 'subject'),
('tag_bee', 'Bee', 'bee', 'subject'),
('tag_insect', 'Insect', 'insect', 'subject'),
('tag_butterfly', 'Butterfly', 'butterfly', 'subject'),
('tag_ladybug', 'Ladybug', 'ladybug', 'subject'),
('tag_smiley', 'Smiley', 'smiley', 'subject'),
('tag_heart', 'Heart', 'heart', 'subject'),
('tag_love', 'Love', 'love', 'theme'),
('tag_rainbow', 'Rainbow', 'rainbow', 'theme'),
('tag_colors', 'Colors', 'colors', 'theme'),
('tag_charm', 'Charm', 'charm', 'type'),
('tag_small', 'Small', 'small', 'size'),
('tag_mini', 'Mini', 'mini', 'size'),
('tag_bamboo', 'Bamboo', 'bamboo', 'subject');
