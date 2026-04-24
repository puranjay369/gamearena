import { Play, Users, Zap, Shield, ChevronRight, Gamepad2 } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import Button from '../components/Button';
import GameCard from '../components/GameCard';
import heroGamingIllustration from '../assets/images/hero-gaming-illustration.svg';
import controllerBadge from '../assets/images/controller-badge.svg';
import abstractBlob from '../assets/images/abstract-blob.svg';
import gridSpark from '../assets/images/grid-spark.svg';

const games = [
  {
    name: 'Chess',
    description: 'The classic strategy game. Outsmart your opponent in this timeless battle of wits.',
    players: '2',
    image: '/pngtree-chess-logo-png-image_7966289.png',
    to: '/dashboard',
  },
  {
    name: 'Battleship',
    description: 'Hunt and sink your opponent\'s fleet in this classic naval strategy game.',
    players: '2',
    image: '/battleship.png',
    to: '/dashboard',
  },
  {
    name: 'Connect Four',
    description: 'Drop your discs and connect four in a row before your opponent does.',
    players: '2',
    image: '/connect-4-logo.png',
    to: '/dashboard',
  },
];

const features = [
  {
    icon: Zap,
    title: 'Real-time Multiplayer',
    desc: 'Play against friends or strangers with zero-lag real-time gameplay powered by WebSockets.',
  },
  {
    icon: Users,
    title: 'Private Rooms',
    desc: 'Create private rooms and invite friends with a simple room code. Play on your terms.',
  },
  {
    icon: Shield,
    title: 'Fair Play',
    desc: 'Server-authoritative game logic ensures a fair and cheat-free experience for everyone.',
  },
];

const sectionViewport = { once: true, amount: 0.2 };

function createFadeInUp(shouldReduceMotion) {
  return {
    hidden: {
      opacity: 0,
      y: shouldReduceMotion ? 0 : 50,
      scale: shouldReduceMotion ? 1 : 0.95,
    },
    visible: (delay = 0) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: shouldReduceMotion ? 0.35 : 0.6,
        ease: 'easeOut',
        delay,
      },
    }),
  };
}

const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.2,
    },
  },
};

export default function LandingPage() {
  const shouldReduceMotion = useReducedMotion();
  const fadeInUp = createFadeInUp(shouldReduceMotion);
  const floatingTransition = {
    duration: 3,
    repeat: Infinity,
    ease: 'easeInOut',
  };

  return (
    <div className="overflow-hidden">
      {/* Hero */}
      <section className="relative min-h-[85vh] flex items-center justify-center px-4">
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse [animation-delay:1s]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-3xl" />
          <motion.img
            src={abstractBlob}
            alt=""
            aria-hidden="true"
            className="absolute -top-14 -left-16 w-72 sm:w-96 opacity-30 pointer-events-none"
            animate={shouldReduceMotion ? undefined : { y: [0, -10, 0] }}
            transition={floatingTransition}
          />
          <motion.img
            src={controllerBadge}
            alt=""
            aria-hidden="true"
            className="absolute -bottom-10 right-0 w-32 sm:w-44 opacity-40 pointer-events-none"
            animate={shouldReduceMotion ? undefined : { y: [0, 8, 0] }}
            transition={{ ...floatingTransition, duration: 3.4 }}
          />
        </div>

        <motion.div
          className="relative z-10 w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <motion.div className="text-center lg:text-left" variants={staggerContainer}>
            {/* Badge */}
            <motion.div
              className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-full px-4 py-1.5 mb-6"
              variants={fadeInUp}
              custom={0.1}
            >
              <Gamepad2 className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium text-accent">Multiplayer Gaming Platform</span>
            </motion.div>

            <motion.h1
              className="text-4xl sm:text-5xl md:text-7xl font-extrabold text-foreground leading-tight mb-6"
              variants={fadeInUp}
              custom={0.18}
            >
              Play. Compete.
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-purple-500">
                Dominate.
              </span>
            </motion.h1>

            <motion.p
              className="text-lg sm:text-xl text-muted max-w-2xl mx-auto lg:mx-0 mb-8 leading-relaxed"
              variants={fadeInUp}
              custom={0.26}
            >
              Join thousands of players on GameArena — the ultimate destination for classic board games
              reimagined for the modern web. Challenge friends or find opponents instantly.
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-4"
              variants={staggerContainer}
            >
              <motion.div
                variants={fadeInUp}
                custom={0.34}
                whileHover={shouldReduceMotion ? undefined : { scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                <Button variant="primary" size="xl" to="/signup">
                  <Play className="w-5 h-5 mr-2" />
                  Play Now — It's Free
                </Button>
              </motion.div>
              <motion.div
                variants={fadeInUp}
                custom={0.42}
                whileHover={shouldReduceMotion ? undefined : { scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                <Button variant="secondary" size="xl" to="/login">
                  Sign In
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </motion.div>
            </motion.div>

            {/* Stats */}
            <motion.div className="flex items-center justify-center lg:justify-start gap-8 mt-12" variants={staggerContainer}>
              {[
                ['10K+', 'Players'],
                ['50K+', 'Games Played'],
                ['3', 'Game Modes'],
              ].map(([stat, label], index) => (
                <motion.div
                  key={label}
                  className="text-center"
                  variants={fadeInUp}
                  custom={0.48 + index * 0.08}
                >
                  <div className="text-2xl font-bold text-foreground">{stat}</div>
                  <div className="text-xs text-muted mt-0.5">{label}</div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          <motion.div
            className="relative flex items-center justify-center lg:justify-end"
            variants={fadeInUp}
            custom={0.35}
          >
            <div className="relative w-full max-w-[540px] aspect-[4/3]">
              <div className="absolute inset-2 rounded-3xl bg-accent/10 blur-2xl" />
              <motion.img
                src={heroGamingIllustration}
                alt="Gaming illustration showcasing multiplayer dashboard and controller"
                className="relative z-10 w-full h-full object-contain drop-shadow-[0_18px_40px_rgba(30,64,175,0.4)]"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={
                  shouldReduceMotion
                    ? { opacity: 1, scale: 1 }
                    : { opacity: 1, scale: 1, y: [0, -10, 0] }
                }
                transition={
                  shouldReduceMotion
                    ? { duration: 0.5, ease: 'easeOut', delay: 0.2 }
                    : {
                        opacity: { duration: 0.5, ease: 'easeOut', delay: 0.2 },
                        scale: { duration: 0.5, ease: 'easeOut', delay: 0.2 },
                        y: { duration: 3.2, repeat: Infinity, ease: 'easeInOut' },
                      }
                }
              />
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Games Section */}
      <motion.section
        className="relative py-20 px-4 overflow-hidden"
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={sectionViewport}
      >
        <motion.img
          src={gridSpark}
          alt=""
          aria-hidden="true"
          className="absolute right-[-140px] top-10 w-[520px] opacity-20 pointer-events-none"
          variants={fadeInUp}
        />
        <div className="max-w-6xl mx-auto">
          <motion.div className="text-center mb-12" variants={fadeInUp}>
            <motion.img
              src={controllerBadge}
              alt=""
              aria-hidden="true"
              className="mx-auto mb-3 w-14 h-14 opacity-85"
              variants={fadeInUp}
              custom={0.04}
            />
            <motion.h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-3" variants={fadeInUp}>
              Choose Your Game
            </motion.h2>
            <motion.p className="text-muted text-lg max-w-xl mx-auto" variants={fadeInUp} custom={0.08}>
              Classic board games, reimagined for online multiplayer. Pick a game and start playing in seconds.
            </motion.p>
          </motion.div>

          <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" variants={staggerContainer}>
            {games.map((game) => (
              <motion.div
                key={game.name}
                variants={fadeInUp}
                whileHover={shouldReduceMotion ? undefined : { scale: 1.03 }}
                transition={{ duration: 0.2 }}
              >
                <GameCard {...game} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Features Section */}
      <motion.section
        className="relative py-20 px-4 bg-surface-alt/50 overflow-hidden"
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={sectionViewport}
      >
        <motion.img
          src={abstractBlob}
          alt=""
          aria-hidden="true"
          className="absolute left-[-170px] top-16 w-[430px] opacity-20 pointer-events-none"
          variants={fadeInUp}
          custom={0.03}
        />
        <div className="max-w-6xl mx-auto">
          <motion.div className="text-center mb-12" variants={fadeInUp}>
            <motion.h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-3" variants={fadeInUp}>
              Why GameArena?
            </motion.h2>
            <motion.p className="text-muted text-lg max-w-xl mx-auto" variants={fadeInUp} custom={0.08}>
              Built for gamers, by gamers. Everything you need for the best multiplayer experience.
            </motion.p>
          </motion.div>

          <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-6" variants={staggerContainer}>
            {features.map((f) => (
              <motion.div
                key={f.title}
                variants={fadeInUp}
                whileHover={shouldReduceMotion ? undefined : { scale: 1.03 }}
                transition={{ duration: 0.2 }}
                className="bg-card/50 border border-edge/30 rounded-xl p-6 hover:border-accent/30 transition-all duration-300 group"
              >
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                  <f.icon className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* CTA */}
      <motion.section
        className="py-20 px-4"
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={sectionViewport}
      >
        <motion.div className="max-w-3xl mx-auto text-center" variants={staggerContainer}>
          <motion.h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4" variants={fadeInUp}>
            Ready to Play?
          </motion.h2>
          <motion.p className="text-muted text-lg mb-8" variants={fadeInUp} custom={0.08}>
            Create your free account and start competing in seconds.
          </motion.p>
          <motion.div
            variants={fadeInUp}
            custom={0.16}
            whileHover={shouldReduceMotion ? undefined : { scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            <Button variant="primary" size="xl" to="/signup">
              Get Started
              <ChevronRight className="w-5 h-5 ml-1" />
            </Button>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Footer */}
      <footer className="border-t border-edge/30 py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm text-muted">
            © 2026 GameArena. All rights reserved.
          </span>
          <div className="flex items-center gap-6">
            {['Privacy', 'Terms', 'Contact'].map((item) => (
              <a
                key={item}
                href="#"
                className="text-sm text-muted hover:text-foreground transition-colors"
              >
                {item}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
