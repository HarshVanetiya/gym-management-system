-- Optional starter content. Run after schema.sql. Safe to edit before running.
update public.site_settings set
  gym_name = 'Iron Forge Fitness',
  trainer_name = 'Coach Vikram',
  tagline = 'Stronger every week. Real coaching, real results.',
  bio = 'Certified strength & conditioning coach helping people lose fat, build muscle and get stronger with practical plans.',
  phone = '+91 98765 43210',
  whatsapp = '919876543210',
  email = 'hello@example.com',
  address = 'Your gym address',
  hours = 'Mon–Sat 5:30 AM – 10 PM · Sun 7 AM – 12 PM',
  years_experience = 8,
  clients_trained = 450,
  certifications = array['ACE Certified Personal Trainer', 'Sports Nutrition Specialist'],
  upi_id = 'yourname@upi'
where id = 1;

insert into public.plans (name, duration_days, price, description, features, sort_order) values
  ('Monthly', 30, 1500, 'Full gym access', array['Gym floor & cardio','General workout plan','Locker access'], 1),
  ('Quarterly', 90, 4000, 'Save ₹500', array['Everything in Monthly','Diet plan','Monthly body assessment'], 2),
  ('Half-Yearly', 180, 7500, 'Most popular', array['Everything in Quarterly','Custom workout plan','Progress tracking'], 3),
  ('Personal Training', 30, 6000, '1-on-1 coaching', array['Daily 1-on-1 sessions','Custom diet & workout','WhatsApp check-ins'], 4);

insert into public.workout_plans (name, description, schedule) values
  ('Beginner Full Body', '3 days a week', '[
    {"day":"Mon","focus":"Full Body A","exercises":[{"name":"Goblet Squat","sets":"3","reps":"12"},{"name":"Push-ups","sets":"3","reps":"10"},{"name":"Dumbbell Row","sets":"3","reps":"12"}]},
    {"day":"Tue","focus":"Rest / walk","exercises":[]},
    {"day":"Wed","focus":"Full Body B","exercises":[{"name":"Leg Press","sets":"3","reps":"12"},{"name":"Lat Pulldown","sets":"3","reps":"12"},{"name":"Shoulder Press","sets":"3","reps":"12"}]},
    {"day":"Thu","focus":"Rest","exercises":[]},
    {"day":"Fri","focus":"Full Body A","exercises":[{"name":"Goblet Squat","sets":"3","reps":"12"},{"name":"Bench Press","sets":"3","reps":"10"},{"name":"Plank","sets":"3","reps":"45 sec"}]},
    {"day":"Sat","focus":"Cardio 30 min","exercises":[{"name":"Treadmill incline walk","sets":"1","reps":"30 min"}]},
    {"day":"Sun","focus":"Rest","exercises":[]}
  ]');

insert into public.diet_plans (name, description, calories, meals) values
  ('Veg Fat Loss – 1600 kcal', 'High-protein vegetarian', 1600, '[
    {"time":"8:30 AM","name":"Breakfast","items":"Besan chilla (2) with paneer + green chutney"},
    {"time":"11:30 AM","name":"Mid-morning","items":"1 fruit + buttermilk"},
    {"time":"1:30 PM","name":"Lunch","items":"2 rotis, dal, sabzi, salad, curd"},
    {"time":"7:30 PM","name":"Post-workout","items":"Whey / 150 g paneer"},
    {"time":"9:00 PM","name":"Dinner","items":"Soya chunks curry, 1 roti, vegetables"}
  ]');

insert into public.testimonials (name, text, result) values
  ('Rohit K.', 'Lost 14 kg in 5 months without giving up home food.', '−14 kg in 5 months');
