import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  ChevronRight,
  Gamepad2,
  Plus,
  Send,
  Play,
  Zap,
  Bot,
  Layers3,
} from 'lucide-react';
import Button from '../components/Button';
import GameCard from '../components/GameCard';

const featuredGames = [
  {
    name: 'Chess',
    description: 'Master openings, tactics, and endgames in a timeless strategy duel.',
    players: '2',
    image: '/pngtree-chess-logo-png-image_7966289.png',
    to: '/game/chess',
  },
  {
    name: 'Connect Four',
    description: 'Fast, competitive, and perfect for quick matches with friends.',
    players: '2',
    image: '/connect-4-logo.png',
    to: '/game/connect-four',
  },
  {
    name: 'Battleship',
    description: 'Predict, hunt, and outplay your opponent in tactical naval combat.',
    players: '2',
    image: '/battleship.png',
    to: '/game/battleship',
  },
];

const howItWorks = [
  {
    icon: Plus,
    title: 'Create Room',
    description: 'Pick your game and instantly generate a private room code.',
  },
  {
    icon: Send,
    title: 'Invite Friend',
    description: 'Share the code with a friend so they can join in seconds.',
  },
  {
    icon: Play,
    title: 'Play',
    description: 'Start the match and compete in real-time with smooth gameplay.',
  },
];

const platformFeatures = [
  {
    icon: Zap,
    title: 'Real-time Multiplayer',
    description: 'Low-latency room updates and move sync powered by sockets.',
  },
  {
    icon: Bot,
    title: 'Bot Mode',
    description: 'Practice solo and sharpen strategy before online matches.',
  },
  {
    icon: Layers3,
    title: 'Multiple Games',
    description: 'Switch between classic board and strategy games in one place.',
  },
];

const platformStats = [
  { value: 12, suffix: 'K+', label: 'Active Players' },
  { value: 50, suffix: 'K+', label: 'Matches Played' },
  { value: 3, suffix: '', label: 'Core Game Modes' },
  { value: 99, suffix: '%', label: 'Room Uptime' },
];

const fadeInUp = {
  hidden: { opacity: 0, y: 38, scale: 0.98 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.55,
      ease: 'easeOut',
      delay,
    },
  }),
};

const container = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.16,
    },
  },
};

function AnimatedCounter({ value, suffix = '' }) {
  const counterRef = useRef(null);
  const isInView = useInView(counterRef, { once: true, amount: 0.6 });
  const [currentValue, setCurrentValue] = useState(0);

  useEffect(() => {
    if (!isInView) return;

    const duration = 900;
    const start = performance.now();

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      setCurrentValue(Math.round(value * progress));
      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }, [isInView, value]);

  return (
    <span ref={counterRef}>
      {currentValue}
      {suffix}
    </span>
  );
}

export default function HomePage() {
  return (
    <div className="space-y-14 sm:space-y-16">
      <motion.section
        className="relative overflow-hidden rounded-2xl border border-edge/40 bg-surface-alt/40 p-6 sm:p-8"
        variants={container}
        initial="hidden"
        animate="visible"
      >
        <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-accent/20 blur-2xl" />
        <div className="absolute -left-12 -bottom-12 h-36 w-36 rounded-full bg-purple-500/20 blur-2xl" />

        <div className="relative z-10 max-w-3xl">
          <motion.div className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-xs text-accent" variants={fadeInUp}>
            <Gamepad2 className="h-4 w-4" />
            Platform Overview
          </motion.div>

          <motion.h1 className="mt-4 text-3xl sm:text-4xl font-bold text-foreground" variants={fadeInUp} custom={0.08}>
            Discover, Invite, and Compete
          </motion.h1>

          <motion.p className="mt-3 text-sm sm:text-base text-muted max-w-2xl" variants={fadeInUp} custom={0.14}>
            GameArena Home is your mission control: discover what to play, how rooms work, and what the platform offers.
            Jump into Games when you are ready to browse the full library.
          </motion.p>

          <motion.div className="mt-6 flex flex-wrap gap-3" variants={container}>
            <motion.div variants={fadeInUp} custom={0.2} whileHover={{ scale: 1.04 }} transition={{ duration: 0.2 }}>
              <Button to="/dashboard/games" variant="primary" size="md">
                Browse Games
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </motion.div>
            <motion.div variants={fadeInUp} custom={0.24} whileHover={{ scale: 1.04 }} transition={{ duration: 0.2 }}>
              <Button to="/dashboard/create-room" variant="secondary" size="md">
                Create Room
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      <motion.section
        variants={container}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <motion.div className="mb-6" variants={fadeInUp}>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Featured Games</h2>
          <p className="text-sm sm:text-base text-muted mt-2">A quick preview before you open the full Games library.</p>
        </motion.div>

        <motion.div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6" variants={container}>
          {featuredGames.map((game) => (
            <motion.div key={game.name} variants={fadeInUp} whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
              <GameCard {...game} />
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      <motion.section
        variants={container}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <motion.div className="mb-6" variants={fadeInUp}>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">How It Works</h2>
          <p className="text-sm sm:text-base text-muted mt-2">From room creation to match start in three simple steps.</p>
        </motion.div>

        <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-4" variants={container}>
          {howItWorks.map((step) => (
            <motion.div
              key={step.title}
              variants={fadeInUp}
              className="rounded-xl border border-edge/40 bg-card/40 p-5"
            >
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-accent/15 text-accent">
                <step.icon className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-foreground">{step.title}</h3>
              <p className="mt-1 text-sm text-muted">{step.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      <motion.section
        variants={container}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <motion.div className="mb-6" variants={fadeInUp}>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Platform Features</h2>
          <p className="text-sm sm:text-base text-muted mt-2">Built to keep matches fast, fair, and easy to start.</p>
        </motion.div>

        <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-4" variants={container}>
          {platformFeatures.map((feature) => (
            <motion.div
              key={feature.title}
              variants={fadeInUp}
              className="rounded-xl border border-edge/40 bg-card/40 p-5"
            >
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-accent/15 text-accent">
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-foreground">{feature.title}</h3>
              <p className="mt-1 text-sm text-muted">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      <motion.section
        className="rounded-2xl border border-edge/40 bg-surface-alt/40 p-6 sm:p-8"
        variants={container}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <motion.div className="mb-6" variants={fadeInUp}>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Platform Stats</h2>
          <p className="text-sm sm:text-base text-muted mt-2">Live momentum across players and matches.</p>
        </motion.div>

        <motion.div className="grid grid-cols-2 lg:grid-cols-4 gap-4" variants={container}>
          {platformStats.map((stat) => (
            <motion.div key={stat.label} variants={fadeInUp} className="rounded-xl border border-edge/40 bg-card/40 p-4 text-center">
              <div className="text-2xl font-bold text-foreground">
                <AnimatedCounter value={stat.value} suffix={stat.suffix} />
              </div>
              <div className="mt-1 text-xs text-muted">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      <motion.section
        className="rounded-2xl border border-accent/20 bg-gradient-to-br from-accent/10 to-purple-500/10 p-6 sm:p-8"
        variants={container}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        <motion.h2 className="text-2xl sm:text-3xl font-bold text-foreground" variants={fadeInUp}>
          Ready for Your Next Match?
        </motion.h2>
        <motion.p className="mt-2 text-sm sm:text-base text-muted max-w-2xl" variants={fadeInUp} custom={0.08}>
          Open the Games page for the full catalog, then create or join a room to start playing.
        </motion.p>
        <motion.div className="mt-5" variants={fadeInUp} custom={0.14} whileHover={{ scale: 1.04 }} transition={{ duration: 0.2 }}>
          <Button to="/dashboard/games" variant="primary" size="md">
            Go to Games
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </motion.div>
      </motion.section>
    </div>
  );
}
