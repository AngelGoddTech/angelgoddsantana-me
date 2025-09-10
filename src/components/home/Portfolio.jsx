import React from 'react';
import { motion } from 'framer-motion';

const portfolioItems = [
  {
    title: 'ANGEL GOOD-SANTANA',
    description: 'Visionary AI CDN where users can see the inner star-ships that orbit their favorite star systems.',
    image: '/ags-website-assets/nft-carousel.png',
  },
  {
    title: 'Digital Assets',
    description: 'A showcase of digital assets created for various projects.',
    image: '/ags-website-assets/digital-assets.png',
  },
];

const Portfolio = () => {
  return (
    <section id="portfolio" className="py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5 }}
          className="text-xl font-semibold text-cyan-400 uppercase tracking-widest mb-12"
        >
          Portfolio
        </motion.h2>
        <div className="grid md:grid-cols-2 gap-8">
          {portfolioItems.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="portfolio-card rounded-lg overflow-hidden"
            >
              <img src={item.image} alt={item.title} className="w-full h-64 object-cover" />
              <div className="p-6">
                <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                <p className="text-gray-400 text-sm">{item.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Portfolio;
