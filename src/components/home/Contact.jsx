import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Linkedin, Twitter, Github, Mail } from 'lucide-react';

const Contact = () => {
  return (
    <section id="contact" className="py-20 bg-gray-900/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.5 }}
          >
            <img
              src="/ags-website-assets/angel-headshot.png"
              alt="Angel Good-Santana"
              className="rounded-full w-48 h-48 mx-auto md:mx-0"
            />
            <h3 className="text-2xl font-bold text-white mt-6 text-center md:text-left">Angel Good-Santana</h3>
            <p className="text-cyan-400 text-center md:text-left">AI Cloud Engineer</p>

            <div className="flex justify-center md:justify-start gap-4 mt-6">
              <a href="#" className="text-gray-400 hover:text-white"><Linkedin size={24} /></a>
              <a href="#" className="text-gray-400 hover:text-white"><Twitter size={24} /></a>
              <a href="#" className="text-gray-400 hover:text-white"><Github size={24} /></a>
              <a href="#" className="text-gray-400 hover:text-white"><Mail size={24} /></a>
            </div>
          </motion.div>

          <motion.form
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.5 }}
            className="space-y-4"
          >
            <div>
              <label htmlFor="name" className="text-sm font-medium text-gray-400">Name</label>
              <Input id="name" name="name" type="text" placeholder="Your Name" className="bg-gray-800/50 border-gray-700 text-white" />
            </div>
            <div>
              <label htmlFor="email" className="text-sm font-medium text-gray-400">Email</label>
              <Input id="email" name="email" type="email" placeholder="Your Email" className="bg-gray-800/50 border-gray-700 text-white" />
            </div>
            <div>
              <label htmlFor="message" className="text-sm font-medium text-gray-400">Message</label>
              <Textarea id="message" name="message" rows={4} placeholder="Your Message" className="bg-gray-800/50 border-gray-700 text-white" />
            </div>
            <Button type="submit" className="w-full bg-cyan-500 hover:bg-cyan-600 text-black">
              Send Message
            </Button>
          </motion.form>
        </div>
      </div>
    </section>
  );
};

export default Contact;
