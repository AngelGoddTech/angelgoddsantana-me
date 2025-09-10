import React, { Suspense, lazy } from 'react';
import { motion } from 'framer-motion';

const CubeScene = lazy(() => import('../CubeScene.jsx'));

const Hero = () => {
  return (
    <section id="home" className="relative grid-bg" style={{ minHeight: '100vh' }}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="grid md:grid-cols-2 gap-8 items-center h-full pt-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center md:text-left"
          >
            <h1 className="text-5xl md:text-6xl font-bold text-white uppercase" style={{ fontFamily: '"Orbitron", sans-serif' }}>
              AI Cloud Engineer
            </h1>
            <h2 className="text-3xl md:text-4xl font-bold text-cyan-400 uppercase mt-2" style={{ fontFamily: '"Orbitron", sans-serif' }}>
              20+ Years Experience
            </h2>
            <p className="mt-4 text-lg text-gray-300 max-w-lg mx-auto md:mx-0">
              Specializing in AI Stock Video Licensing, Voice, and Advanced Cloud Solutions
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex justify-center items-center"
          >
            <div className="relative w-[300px] h-[300px] md:w-[450px] md:h-[450px]">
              <Suspense fallback={<div className="w-full h-full bg-gray-800/20 rounded-lg animate-pulse" />}>
                <CubeScene />
              </Suspense>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
