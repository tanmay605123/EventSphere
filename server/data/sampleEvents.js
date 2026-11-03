const sampleEvents = [
  {
    title: "Global AI & Web3 Hackathon 2026",
    category: "Tech",
    description: "Join 500+ developers, designers, and innovators building next-generation AI and decentralized apps. 36 hours of non-stop hacking, mentoring from industry leaders, free food, and $50,000 in prizes! Teams will receive cloud credits and direct access to top tech recruiters.",
    image: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80",
    date: "2026-11-15",
    time: "09:00 AM",
    venue: "Metropolis Tech Park, Hall 4, San Francisco, CA",
    organizer: "DevSphere Innovation Labs",
    totalSeats: 250,
    seatsLeft: 42,
    price: 0
  },
  {
    title: "Neon Beats Indie Music Fest",
    category: "Cultural",
    description: "An unforgettable evening of live acoustic, synthwave, and indie rock under the stars. Featuring top regional breakthrough bands, food trucks, light art installations, and curated artisan stalls.",
    image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80",
    date: "2026-11-20",
    time: "06:30 PM",
    venue: "Riverfront Amphitheater, Austin, TX",
    organizer: "Pulse Live Entertainment",
    totalSeats: 500,
    seatsLeft: 88,
    price: 25
  },
  {
    title: "Autonomous Robotics & ROS Workshop",
    category: "Workshops",
    description: "Hands-on masterclass in building and programming autonomous mobile robots. Learn lidar mapping, obstacle avoidance, ROS 2 pipelines, and computer vision with physical hardware provided during the lab.",
    image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1200&q=80",
    date: "2026-11-22",
    time: "10:00 AM",
    venue: "Apex Innovation Center, Lab 3B, Boston, MA",
    organizer: "RoboTech Institute",
    totalSeats: 40,
    seatsLeft: 6,
    price: 49
  },
  {
    title: "Founder's Circle Startup Meetup",
    category: "Tech",
    description: "Network with seed-stage and Series A founders, venture capitalists, and product leaders. Keynote discussions on AI product-market fit, fundraising dynamics in 2026, and high-growth hiring.",
    image: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=1200&q=80",
    date: "2026-11-25",
    time: "05:00 PM",
    venue: "The Canopy Coworking Hub, New York, NY",
    organizer: "VentureCraft Community",
    totalSeats: 120,
    seatsLeft: 19,
    price: 0
  },
  {
    title: "Golden Hour Urban Photography Walk",
    category: "Cultural",
    description: "Explore historic streets and architectural gems with professional National Geographic contributor Elena Rostova. Master low-light composition, street portraiture, and narrative storytelling.",
    image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80",
    date: "2026-11-28",
    time: "04:30 PM",
    venue: "Old Town Heritage Square, Seattle, WA",
    organizer: "Aperture Guild",
    totalSeats: 30,
    seatsLeft: 4,
    price: 15
  },
  {
    title: "Mindful Sunrise Yoga & Breathwork Camp",
    category: "Sports",
    description: "Recharge your mind and body with sunrise Vinyasa flow, guided pranayama breathwork, and sound bath meditation. Suitable for all fitness levels. Organic herbal teas and mats provided.",
    image: "https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&w=1200&q=80",
    date: "2026-11-29",
    time: "06:30 AM",
    venue: "Ocean View Botanical Gardens, San Diego, CA",
    organizer: "Prana Wellness Collective",
    totalSeats: 60,
    seatsLeft: 14,
    price: 0
  },
  {
    title: "Inter-City Smash Badminton Championship",
    category: "Sports",
    description: "Annual amateur and semi-pro badminton showdown. Men's & Women's singles and doubles tournament with official BWF scoring, live streaming, trophies, and athletic gear hampers.",
    image: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=1200&q=80",
    date: "2026-12-05",
    time: "08:30 AM",
    venue: "Olympus Indoor Arena, Chicago, IL",
    organizer: "Midwest Racquet Club",
    totalSeats: 100,
    seatsLeft: 22,
    price: 30
  },
  {
    title: "Full-Stack Design Systems Masterclass",
    category: "Workshops",
    description: "From Figma tokens to reusable Tailwind & React component libraries. Deep dive into accessible components, compound components, token synchronization, and micro-interactions.",
    image: "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=1200&q=80",
    date: "2026-12-10",
    time: "02:00 PM",
    venue: "Digital Arts Academy, Denver, CO",
    organizer: "UI/UX Collective",
    totalSeats: 50,
    seatsLeft: 11,
    price: 40
  }
];

module.exports = sampleEvents;
