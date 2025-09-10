import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Camera, CloudUpload, Gem } from 'lucide-react';

const services = [
  {
    title: 'Gemini 2.5 Flash',
    description: 'Visionary AI. Create, reason, iterate. Unleash the intellect.',
    icon: <Brain size={28} className="text-cyan-400" />,
  },
  {
    title: 'Veo-2/3',
    description: 'AI stock video licensing and voice telemetry across cloud.',
    icon: <Camera size={28} className="text-cyan-400" />,
  },
  {
    title: 'Azure AI Foundry',
    description: 'Secure AI models at scale across FedRAMP environments.',
    icon: <CloudUpload size={28} className="text-cyan-400" />,
  },
  {
    title: 'NFT Blockchain',
    description: 'AI cloud with secure tokenized creation and ownership.',
    icon: <Gem size={28} className="text-cyan-400" />,
  },
];

const Services = () => {
  return (
    <section id="services" className="py-20 bg-gray-900/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5 }}
          className="text-xl font-semibold text-cyan-400 uppercase tracking-widest mb-12"
        >
          Services
        </motion.h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="service-card p-6 rounded-lg"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-gray-800/50 rounded-lg">
                  {service.icon}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">{service.title}</h3>
                  <p className="text-gray-400 text-sm">{service.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
