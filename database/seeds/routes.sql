-- Seed data for routes (6 fixed locations with pricing)
INSERT INTO routes (from_location, to_location, price, duration, distance) VALUES
-- From Dhanmondi
('Dhanmondi', 'Gulshan', 120.00, 25, 8.5),
('Dhanmondi', 'Uttara', 180.00, 40, 15.2),
('Dhanmondi', 'Old Dhaka', 100.00, 30, 12.0),
('Dhanmondi', 'Mirpur', 90.00, 20, 7.8),
('Dhanmondi', 'Banani', 110.00, 22, 9.1),

-- From Gulshan  
('Gulshan', 'Dhanmondi', 120.00, 25, 8.5),
('Gulshan', 'Uttara', 80.00, 15, 6.2),
('Gulshan', 'Old Dhaka', 150.00, 35, 14.5),
('Gulshan', 'Mirpur', 140.00, 30, 12.8),
('Gulshan', 'Banani', 60.00, 10, 3.5),

-- From Uttara
('Uttara', 'Dhanmondi', 180.00, 40, 15.2),
('Uttara', 'Gulshan', 80.00, 15, 6.2),
('Uttara', 'Old Dhaka', 200.00, 45, 18.0),
('Uttara', 'Mirpur', 70.00, 12, 5.5),
('Uttara', 'Banani', 90.00, 18, 7.2),

-- From Old Dhaka
('Old Dhaka', 'Dhanmondi', 100.00, 30, 12.0),
('Old Dhaka', 'Gulshan', 150.00, 35, 14.5),
('Old Dhaka', 'Uttara', 200.00, 45, 18.0),
('Old Dhaka', 'Mirpur', 130.00, 28, 11.5),
('Old Dhaka', 'Banani', 160.00, 38, 15.8),

-- From Mirpur
('Mirpur', 'Dhanmondi', 90.00, 20, 7.8),
('Mirpur', 'Gulshan', 140.00, 30, 12.8),
('Mirpur', 'Uttara', 70.00, 12, 5.5),
('Mirpur', 'Old Dhaka', 130.00, 28, 11.5),
('Mirpur', 'Banani', 120.00, 25, 10.2),

-- From Banani
('Banani', 'Dhanmondi', 110.00, 22, 9.1),
('Banani', 'Gulshan', 60.00, 10, 3.5),
('Banani', 'Uttara', 90.00, 18, 7.2),
('Banani', 'Old Dhaka', 160.00, 38, 15.8),
('Banani', 'Mirpur', 120.00, 25, 10.2);