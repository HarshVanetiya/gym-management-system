import type { TableName, Tables, WorkoutDay, Meal } from './types';
import { addDays, isoDate } from './utils';

/** Sample data for DEMO MODE. Dates are relative to today so statuses always look realistic. */
export function buildSeed(): { [K in TableName]: Tables[K][] } {
  const today = isoDate();
  const id = () => crypto.randomUUID();
  const d = (n: number) => addDays(today, n);

  const plans = [
    { id: id(), name: 'Monthly', duration_days: 30, price: 1500, description: 'Full gym access', features: ['Gym floor & cardio', 'General workout plan', 'Locker access'], is_active: true, sort_order: 1 },
    { id: id(), name: 'Quarterly', duration_days: 90, price: 4000, description: 'Save ₹500', features: ['Everything in Monthly', 'Diet plan', 'Monthly body assessment'], is_active: true, sort_order: 2 },
    { id: id(), name: 'Half-Yearly', duration_days: 180, price: 7500, description: 'Most popular', features: ['Everything in Quarterly', 'Custom workout plan', 'Progress tracking'], is_active: true, sort_order: 3 },
    { id: id(), name: 'Personal Training', duration_days: 30, price: 6000, description: '1-on-1 coaching', features: ['Daily 1-on-1 sessions', 'Custom diet & workout', 'WhatsApp check-ins'], is_active: true, sort_order: 4 },
  ];

  const ppl: WorkoutDay[] = [
    { day: 'Mon', focus: 'Push (Chest, Shoulders, Triceps)', exercises: [
      { name: 'Barbell Bench Press', sets: '4', reps: '8-10' },
      { name: 'Incline Dumbbell Press', sets: '3', reps: '10-12' },
      { name: 'Overhead Press', sets: '3', reps: '8-10' },
      { name: 'Lateral Raises', sets: '3', reps: '15' },
      { name: 'Rope Pushdown', sets: '3', reps: '12-15' },
    ] },
    { day: 'Tue', focus: 'Pull (Back, Biceps)', exercises: [
      { name: 'Deadlift', sets: '3', reps: '5', notes: 'Warm up properly' },
      { name: 'Lat Pulldown', sets: '4', reps: '10-12' },
      { name: 'Seated Cable Row', sets: '3', reps: '10-12' },
      { name: 'Barbell Curl', sets: '3', reps: '10' },
    ] },
    { day: 'Wed', focus: 'Legs', exercises: [
      { name: 'Back Squat', sets: '4', reps: '6-8' },
      { name: 'Romanian Deadlift', sets: '3', reps: '10' },
      { name: 'Leg Press', sets: '3', reps: '12' },
      { name: 'Standing Calf Raise', sets: '4', reps: '15' },
    ] },
    { day: 'Thu', focus: 'Push', exercises: [
      { name: 'Dumbbell Shoulder Press', sets: '4', reps: '10' },
      { name: 'Weighted Dips', sets: '3', reps: '8-10' },
      { name: 'Cable Fly', sets: '3', reps: '12-15' },
    ] },
    { day: 'Fri', focus: 'Pull', exercises: [
      { name: 'Pull-ups', sets: '4', reps: 'Max' },
      { name: 'Barbell Row', sets: '4', reps: '8' },
      { name: 'Face Pulls', sets: '3', reps: '15' },
      { name: 'Hammer Curl', sets: '3', reps: '12' },
    ] },
    { day: 'Sat', focus: 'Legs + Core', exercises: [
      { name: 'Front Squat', sets: '3', reps: '8' },
      { name: 'Walking Lunges', sets: '3', reps: '12 each' },
      { name: 'Hanging Leg Raise', sets: '3', reps: '15' },
      { name: 'Plank', sets: '3', reps: '60 sec' },
    ] },
    { day: 'Sun', focus: 'Rest', exercises: [] },
  ];

  const fatLoss: WorkoutDay[] = [
    { day: 'Mon', focus: 'Full Body A + 20 min cardio', exercises: [
      { name: 'Goblet Squat', sets: '3', reps: '12' },
      { name: 'Push-ups', sets: '3', reps: '10-15' },
      { name: 'Dumbbell Row', sets: '3', reps: '12' },
      { name: 'Treadmill incline walk', sets: '1', reps: '20 min' },
    ] },
    { day: 'Tue', focus: 'Cardio + Core', exercises: [
      { name: 'Cycling', sets: '1', reps: '30 min' },
      { name: 'Crunches', sets: '3', reps: '20' },
    ] },
    { day: 'Wed', focus: 'Full Body B', exercises: [
      { name: 'Leg Press', sets: '3', reps: '12' },
      { name: 'Lat Pulldown', sets: '3', reps: '12' },
      { name: 'Dumbbell Shoulder Press', sets: '3', reps: '12' },
    ] },
    { day: 'Thu', focus: 'Rest / Walk 8k steps', exercises: [] },
    { day: 'Fri', focus: 'Full Body A + HIIT', exercises: [
      { name: 'Kettlebell Swings', sets: '4', reps: '15' },
      { name: 'Burpees', sets: '3', reps: '10' },
    ] },
    { day: 'Sat', focus: 'Long cardio', exercises: [{ name: 'Brisk walk / jog', sets: '1', reps: '45 min' }] },
    { day: 'Sun', focus: 'Rest', exercises: [] },
  ];

  const vegMeals: Meal[] = [
    { time: '7:00 AM', name: 'Early morning', items: 'Warm water with lemon, 5 soaked almonds' },
    { time: '8:30 AM', name: 'Breakfast', items: 'Besan chilla (2) with paneer stuffing + green chutney' },
    { time: '11:30 AM', name: 'Mid-morning', items: '1 fruit + buttermilk' },
    { time: '1:30 PM', name: 'Lunch', items: '2 rotis, 1 bowl dal, sabzi, salad, curd' },
    { time: '5:00 PM', name: 'Pre-workout', items: 'Black coffee + banana' },
    { time: '7:30 PM', name: 'Post-workout', items: 'Whey protein / 150g paneer' },
    { time: '9:00 PM', name: 'Dinner', items: 'Soya chunks curry, 1 roti, sautéed vegetables' },
  ];
  const nonVegMeals: Meal[] = [
    { time: '8:00 AM', name: 'Breakfast', items: '4 egg whites + 1 whole egg omelette, 2 brown bread' },
    { time: '11:30 AM', name: 'Snack', items: 'Greek yoghurt / sprouts chaat' },
    { time: '1:30 PM', name: 'Lunch', items: '150g grilled chicken, 1 cup rice, salad' },
    { time: '5:00 PM', name: 'Pre-workout', items: 'Banana + peanut butter toast' },
    { time: '8:30 PM', name: 'Dinner', items: 'Fish curry, 1 roti, vegetables' },
  ];

  const workout_plans = [
    { id: id(), name: 'Push Pull Legs (Muscle Gain)', description: '6-day split for intermediate lifters', schedule: ppl },
    { id: id(), name: 'Beginner Fat Loss', description: '3 strength days + cardio', schedule: fatLoss },
  ];
  const diet_plans = [
    { id: id(), name: 'Veg Fat Loss – 1600 kcal', description: 'High-protein vegetarian Indian diet', calories: 1600, meals: vegMeals },
    { id: id(), name: 'Non-Veg Lean Bulk – 2600 kcal', description: 'Protein ~140 g/day', calories: 2600, meals: nonVegMeals },
  ];

  const people: [string, string, string, string, number, number, number][] = [
    // name, email, phone, goal, planIndex, startOffsetDays, paidFraction(0..1)
    ['Rahul Sharma', 'rahul@demo.in', '9876500001', 'Muscle gain', 2, -40, 1],
    ['Priya Verma', 'priya@demo.in', '9876500002', 'Fat loss', 1, -86, 1],
    ['Amit Patel', 'amit@demo.in', '9876500003', 'General fitness', 0, -27, 0.5],
    ['Sneha Iyer', 'sneha@demo.in', '9876500004', 'Fat loss', 3, -10, 1],
    ['Karan Mehta', 'karan@demo.in', '9876500005', 'Strength', 0, -45, 1],
    ['Neha Gupta', 'neha@demo.in', '9876500006', 'Toning', 1, -5, 0],
    ['Arjun Singh', 'arjun@demo.in', '9876500007', 'Muscle gain', 2, -175, 1],
    ['Pooja Nair', 'pooja@demo.in', '9876500008', 'Fat loss', 0, -60, 1],
  ];

  const members: Tables['members'][] = [];
  const subscriptions: Tables['subscriptions'][] = [];
  const payments: Tables['payments'][] = [];
  const attendance: Tables['attendance'][] = [];
  const progress_logs: Tables['progress_logs'][] = [];

  people.forEach(([full_name, email, phone, goal, pi, start, paid], i) => {
    const mid = id();
    const fatLossGoal = goal === 'Fat loss' || goal === 'Toning';
    members.push({
      id: mid, user_id: null, full_name, email, phone, gender: ['Priya', 'Sneha', 'Neha', 'Pooja'].some((n) => full_name.startsWith(n)) ? 'Female' : 'Male',
      dob: null, joined_on: d(start - (i % 3) * 30), goal, notes: null, height_cm: 160 + (i * 3) % 25,
      workout_plan_id: workout_plans[fatLossGoal ? 1 : 0].id, diet_plan_id: diet_plans[fatLossGoal ? 0 : 1].id,
    });
    const plan = plans[pi];
    const sid = id();
    subscriptions.push({ id: sid, member_id: mid, plan_id: plan.id, plan_name: plan.name, start_date: d(start), end_date: d(start + plan.duration_days - 1), price: plan.price });
    if (paid > 0) payments.push({ id: id(), member_id: mid, subscription_id: sid, amount: plan.price * paid, method: i % 2 ? 'cash' : 'upi', paid_on: d(start), note: null });
    for (let k = 0; k < 18; k++) {
      const day = d(-k * 2 - (i % 2));
      if (day >= d(start) && (k + i) % 4 !== 0) attendance.push({ id: id(), member_id: mid, check_in: day });
    }
    const w0 = fatLossGoal ? 78 - i : 64 + i;
    for (let k = 4; k >= 0; k--) {
      progress_logs.push({ id: id(), member_id: mid, logged_on: d(-k * 10), weight_kg: Math.round((w0 + (fatLossGoal ? k * 0.8 : -k * 0.5)) * 10) / 10, body_fat: null, waist_cm: null, notes: null });
    }
  });

  return {
    site_settings: [{
      id: 1,
      gym_name: 'Iron Forge Fitness',
      trainer_name: 'Coach Vikram',
      tagline: 'Stronger every week. Real coaching, real results.',
      bio: 'Certified strength & conditioning coach with 8+ years of experience helping people lose fat, build muscle and get stronger. Every member gets a plan built for their body, schedule and food habits — no crash diets, no shortcuts.',
      phone: '+91 98765 43210',
      whatsapp: '919876543210',
      email: 'hello@ironforge.example',
      address: 'Sector 21, Main Market Road, Your City',
      map_url: 'https://maps.google.com',
      instagram: 'https://instagram.com',
      youtube: '',
      hours: 'Mon–Sat 5:30 AM – 10 PM · Sun 7 AM – 12 PM',
      years_experience: 8,
      clients_trained: 450,
      certifications: ['ACE Certified Personal Trainer', 'Sports Nutrition Specialist', 'CPR & First Aid'],
      upi_id: 'ironforge@upi',
    }],
    plans,
    testimonials: [
      { id: id(), name: 'Rohit K.', text: 'Lost 14 kg in 5 months without giving up home food. The diet plan was practical and Vikram checked in every week.', result: '−14 kg in 5 months', is_published: true },
      { id: id(), name: 'Anjali S.', text: 'I was scared of weights. Now I deadlift 80 kg! The workout schedule in the app makes it easy to know what to do each day.', result: 'Deadlift 0 → 80 kg', is_published: true },
      { id: id(), name: 'Manish T.', text: 'Best coaching in the city. Clean gym, proper form correction, and no unnecessary supplements pushed.', result: '+6 kg lean mass', is_published: true },
    ],
    leads: [
      { id: id(), name: 'Vivek Rao', phone: '9876511111', email: null, message: 'Interested in personal training, evening slot', interested_plan: 'Personal Training', status: 'new', created_at: new Date().toISOString() },
      { id: id(), name: 'Sana Khan', phone: '9876522222', email: 'sana@example.com', message: 'Do you have ladies batch?', interested_plan: 'Monthly', status: 'contacted', created_at: new Date(Date.now() - 3 * 86400000).toISOString() },
    ],
    workout_plans,
    diet_plans,
    members,
    subscriptions,
    payments,
    attendance,
    progress_logs,
  };
}
