import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { 
  Cloud, 
  Brain, 
  Shield, 
  Users, 
  Award, 
  Mail, 
  Linkedin, 
  Download,
  Play,
  Pause,
  Menu,
  X,
  ChevronRight,
  Star,
  Building,
  MapPin,
  Calendar,
  ExternalLink
} from 'lucide-react';
import { Button } from './components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { Progress } from './components/ui/progress';
import './App.css';

// Import video
import videoResume from './assets/angel_godd_santana_video_resume_PROPERLY_EXTENDED.mp4';

// Navigation Component
const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/about', label: 'About' },
    { path: '/experience', label: 'Experience' },
    { path: '/skills', label: 'Skills' },
    { path: '/video-resume', label: 'Video Resume' },
    { path: '/contact', label: 'Contact' }
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-xl font-bold text-primary">
            Angel Godd-Santana
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  location.pathname === item.path ? 'text-primary' : 'text-gray-600'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Mobile Navigation Button */}
          <button
            className="md:hidden"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation Menu */}
        <AnimatePresence>
          {isOpen && (
            <Motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-t border-gray-200"
            >
              <div className="px-2 pt-2 pb-3 space-y-1">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`block px-3 py-2 text-base font-medium transition-colors hover:text-primary ${
                      location.pathname === item.path ? 'text-primary' : 'text-gray-600'
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </Motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
};

// Home Page Component
const HomePage = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="hero-gradient cloud-pattern min-h-screen flex items-center justify-center text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
          <Motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              Angel Godd-Santana
            </h1>
            <h2 className="text-2xl md:text-3xl mb-8 text-blue-100">
              AI Assisted Cloud Architect/Engineer
            </h2>
            <p className="text-xl mb-12 text-blue-50 max-w-3xl mx-auto leading-relaxed">
              Transforming cloud infrastructure through AI-powered solutions and generative AI integration. 
              Specializing in Azure, GCP, and AWS with FedRAMP expertise for US Government contracts.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="glass-effect hover:bg-white/20 text-white border-white/30">
                <Link to="/video-resume">
                  <Play className="mr-2 h-5 w-5" />
                  Watch Video Resume
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="glass-effect hover:bg-white/10 text-white border-white/30">
                <Link to="/contact">
                  <Mail className="mr-2 h-5 w-5" />
                  Get In Touch
                </Link>
              </Button>
            </div>
          </Motion.div>
        </div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-10 floating-animation">
          <Cloud className="h-16 w-16 text-white/30" />
        </div>
        <div className="absolute bottom-20 right-10 floating-animation" style={{ animationDelay: '2s' }}>
          <Brain className="h-12 w-12 text-white/30" />
        </div>
        <div className="absolute top-1/2 left-20 floating-animation" style={{ animationDelay: '4s' }}>
          <Shield className="h-10 w-10 text-white/30" />
        </div>
      </section>

      {/* Key Highlights Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Key Achievements</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Proven track record in cloud architecture, AI integration, and government compliance
            </p>
          </Motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <Shield className="h-8 w-8 text-blue-600" />,
                title: "FedRAMP Moderate",
                description: "Achieved FedRAMP authorization for Azure Government cloud team",
                highlight: "2019-2021"
              },
              {
                icon: <Cloud className="h-8 w-8 text-blue-600" />,
                title: "700+ Deployments",
                description: "Created and deployed Azure subscriptions and AWS accounts",
                highlight: "Enterprise Scale"
              },
              {
                icon: <Brain className="h-8 w-8 text-blue-600" />,
                title: "AI Pioneer",
                description: "Early adopter of Azure Foundry OpenAI platform integration",
                highlight: "Innovation Leader"
              },
              {
                icon: <Users className="h-8 w-8 text-blue-600" />,
                title: "Team Mentor",
                description: "Trained multiple junior engineers in cloud deployments",
                highlight: "Knowledge Transfer"
              }
            ].map((item, index) => (
              <Motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow duration-300">
                  <CardHeader className="text-center">
                    <div className="mx-auto mb-4 p-3 bg-blue-100 rounded-full w-fit">
                      {item.icon}
                    </div>
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                    <Badge variant="secondary">{item.highlight}</Badge>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 text-center">{item.description}</p>
                  </CardContent>
                </Card>
              </Motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <Motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl font-bold mb-6">Ready to Transform Your Cloud Strategy?</h2>
            <p className="text-xl mb-8 text-blue-100">
              Seeking full-time remote positions with US Government agencies and organizations 
              ready to embrace AI-enhanced cloud solutions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" variant="secondary">
                <Link to="/contact">
                  <Mail className="mr-2 h-5 w-5" />
                  Schedule Consultation
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-white border-white hover:bg-white/10">
                <a href="https://linkedin.com/in/angelgoddsantana" target="_blank" rel="noopener noreferrer">
                  <Linkedin className="mr-2 h-5 w-5" />
                  LinkedIn Profile
                </a>
              </Button>
            </div>
          </Motion.div>
        </div>
      </section>
    </div>
  );
};

// About Page Component
const AboutPage = () => {
  return (
    <div className="min-h-screen pt-16">
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl font-bold text-gray-900 mb-8">About Me</h1>
            
            <div className="prose prose-lg max-w-none">
              <p className="text-xl text-gray-600 mb-8">
                I'm an AI Assisted Cloud Architect/Engineer specializing in transforming cloud infrastructure 
                through cutting-edge artificial intelligence solutions. With over 20 years of experience in 
                cloud computing and 10+ years specifically in Azure cloud platform, I'm reinventing my career to leverage generative AI technologies 
                for enhanced cloud architecture and automation.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <MapPin className="mr-2 h-5 w-5 text-blue-600" />
                      Location & Work Style
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">
                      Based in Fort Lauderdale, Florida. Exclusively seeking full-time remote positions, 
                      bringing flexibility and global accessibility to distributed cloud architecture teams.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Building className="mr-2 h-5 w-5 text-blue-600" />
                      Target Focus
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">
                      Primary focus on US Government contracts and medium-sized organizations migrating to cloud, 
                      where security, compliance, and reliability are paramount.
                    </p>
                  </CardContent>
                </Card>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-6">Career Transformation</h2>
              <p className="text-gray-600 mb-8">
                I'm currently transitioning from my role as Senior Cloud Governance Operations Engineer at 
                Cloud Software Group to become an AI Assisted Cloud Architect. This transformation represents 
                my commitment to staying at the forefront of technology, combining extensive cloud expertise 
                with revolutionary AI capabilities including OpenAI APIs and Gemini AI integration.
              </p>

              <h2 className="text-2xl font-bold text-gray-900 mb-6">Specializations</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  "AI-assisted cloud architecture and automation",
                  "Azure Lighthouse technology implementation",
                  "Entra ID and identity management solutions",
                  "Multi-cloud Infrastructure as a Service (IaaS) deployments",
                  "OpenAI and Gemini API integration",
                  "Cloud migration strategies and governance",
                  "NFT minting pipeline development",
                  "FedRAMP compliance and government cloud solutions"
                ].map((item, index) => (
                  <div key={index} className="flex items-start">
                    <ChevronRight className="h-5 w-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                    <span className="text-gray-600">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </Motion.div>
        </div>
      </section>
    </div>
  );
};

// Experience Page Component
const ExperiencePage = () => {
  const experiences = [
    {
      title: "Senior Cloud Governance Ops Engineer",
      company: "Cloud Software Group (formerly Citrix Systems)",
      period: "Sep 2018 - Aug 2025",
      location: "Miami/Fort Lauderdale Area",
      achievements: [
        "Successfully implemented multiple Azure Lighthouse deployments, streamlining multi-tenant governance and identity management",
        "Deployed new Azure Active Directory (Entra ID) tenants, enhancing security and user access management",
        "Instrumental in assisting Azure Government cloud team achieve FedRAMP Moderate authorization (2019-2021)",
        "Executed deployment and integration of Azure Government Active Directory for FedRAMP controls",
        "Architected Identity Access Management solutions integrating Azure Gov and AWS Gov using SAML Single-Sign-On",
        "Created and deployed over 700 Azure subscriptions in commercial and government environments",
        "Led AWS SAML Single-Sign-On implementation in commercial environments",
        "Mentored and trained multiple junior engineers in complex cloud deployments and Azure IaaS migrations",
        "Pioneer in encouraging Generative AI adoption using Azure Foundry OpenAI platform",
        "Fostered and taught engineers AI technology integration in cloud workflows"
      ]
    },
    {
      title: "Azure Cloud Architect - Contractor",
      company: "Godd Technologies, LLC.",
      period: "Feb 2018 - Sep 2018",
      location: "Homestead, FL",
      achievements: [
        "Architected, deployed, and maintained virtual machines in Azure Cloud Computing platform (IaaS solution)",
        "Managed on-premise private cloud infrastructure integration"
      ]
    },
    {
      title: "Manager of IT, Cloud Operations",
      company: "Vertice Technologies",
      period: "Oct 2017 - Feb 2018",
      location: "9350 South Dixie Highway",
      achievements: [
        "Led cloud operations team in Azure infrastructure management",
        "Architected and deployed virtual machines in Azure Cloud Computing platform",
        "Maintained hybrid cloud and on-premise private infrastructure"
      ]
    },
    {
      title: "Azure Cloud Solutions Architect/Engineer",
      company: "Campus Management Corp.",
      period: "May 2011 - Aug 2017",
      location: "Remote",
      achievements: [
        "Architected, deployed, and maintained virtual machines in Azure Cloud Computing platform (IaaS solution)",
        "Managed enterprise-scale cloud infrastructure for educational technology solutions",
        "Developed cloud migration strategies for legacy systems"
      ]
    }
  ];

  return (
    <div className="min-h-screen pt-16">
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl font-bold text-gray-900 mb-12">Professional Experience</h1>
            
            <div className="space-y-12">
              {experiences.map((exp, index) => (
                <Motion.div
                  key={index}
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <Card className="hover:shadow-lg transition-shadow duration-300">
                    <CardHeader>
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                        <div>
                          <CardTitle className="text-xl text-primary">{exp.title}</CardTitle>
                          <CardDescription className="text-lg font-medium text-gray-700 mt-1">
                            {exp.company}
                          </CardDescription>
                        </div>
                        <div className="mt-2 md:mt-0 text-right">
                          <Badge variant="outline" className="mb-1">
                            <Calendar className="mr-1 h-3 w-3" />
                            {exp.period}
                          </Badge>
                          <p className="text-sm text-gray-500">{exp.location}</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {exp.achievements.map((achievement, achIndex) => (
                          <li key={achIndex} className="flex items-start">
                            <Star className="h-4 w-4 text-blue-600 mt-1 mr-2 flex-shrink-0" />
                            <span className="text-gray-600">{achievement}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </Motion.div>
              ))}
            </div>
          </Motion.div>
        </div>
      </section>
    </div>
  );
};

// Skills Page Component
const SkillsPage = () => {
  const skillCategories = [
    {
      category: "Cloud Platforms",
      skills: [
        { name: "Microsoft Azure", level: 95, description: "Azure Lighthouse, Entra ID, Government Cloud" },
        { name: "Amazon Web Services", level: 85, description: "SAML SSO, Government Cloud, IaaS" },
        { name: "Google Cloud Platform", level: 80, description: "Organizations, Projects, Enterprise Architecture" }
      ]
    },
    {
      category: "AI & Machine Learning",
      skills: [
        { name: "OpenAI API", level: 90, description: "GPT integration, Azure Foundry OpenAI" },
        { name: "Generative AI", level: 85, description: "AI-assisted cloud automation" },
        { name: "Gemini AI", level: 75, description: "Google AI integration and workflows" }
      ]
    },
    {
      category: "Programming & Development",
      skills: [
        { name: "Python", level: 85, description: "Cloud automation, AI integration" },
        { name: "SQL", level: 80, description: "Database management and optimization" },
        { name: "C Programming", level: 70, description: "System-level programming" }
      ]
    },
    {
      category: "Security & Compliance",
      skills: [
        { name: "FedRAMP", level: 95, description: "Moderate authorization, Government compliance" },
        { name: "Identity Management", level: 90, description: "SAML SSO, Cross-cloud integration" },
        { name: "Azure Lighthouse", level: 95, description: "Multi-tenant governance" }
      ]
    }
  ];

  return (
    <div className="min-h-screen pt-16">
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl font-bold text-gray-900 mb-12 text-center">Technical Skills</h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {skillCategories.map((category, categoryIndex) => (
                <Motion.div
                  key={categoryIndex}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: categoryIndex * 0.1 }}
                >
                  <Card className="h-full">
                    <CardHeader>
                      <CardTitle className="text-xl text-primary">{category.category}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {category.skills.map((skill, skillIndex) => (
                        <div key={skillIndex} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <h3 className="font-medium text-gray-900">{skill.name}</h3>
                            <span className="text-sm text-gray-500">{skill.level}%</span>
                          </div>
                          <Progress value={skill.level} className="skill-bar" />
                          <p className="text-sm text-gray-600">{skill.description}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </Motion.div>
              ))}
            </div>

            {/* Certifications Section */}
            <Motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mt-16"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Education & Certifications</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Master of Science in Computer Information Systems</CardTitle>
                    <CardDescription>University of Phoenix • 2009 - 2011</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">Computer Science Major</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Bachelor of Science (B.S.)</CardTitle>
                    <CardDescription>University of Phoenix • 2005 - 2008</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">Information Technology</p>
                  </CardContent>
                </Card>
              </div>
            </Motion.div>
          </Motion.div>
        </div>
      </section>
    </div>
  );
};

// Video Resume Page Component
const VideoResumePage = () => {
  return (
    <div className="min-h-screen pt-16">
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">Video Resume</h1>
            <p className="text-xl text-gray-600 text-center mb-12">
              Watch my comprehensive video resume showcasing my expertise in AI-assisted cloud architecture, 
              FedRAMP compliance, and multi-cloud deployments.
            </p>
            
            <div className="relative bg-black rounded-lg overflow-hidden shadow-2xl pulse-glow">
              <video
                controls
                className="w-full h-auto"
                poster="/api/placeholder/800/450"
              >
                <source src={videoResume} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>

            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="text-center">
                <CardHeader>
                  <CardTitle className="text-lg">Duration</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-primary">4:30</p>
                  <p className="text-gray-600">Minutes</p>
                </CardContent>
              </Card>
              
              <Card className="text-center">
                <CardHeader>
                  <CardTitle className="text-lg">Key Topics</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-primary">16</p>
                  <p className="text-gray-600">Slides</p>
                </CardContent>
              </Card>
              
              <Card className="text-center">
                <CardHeader>
                  <CardTitle className="text-lg">Focus</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm font-bold text-primary">AI + Cloud</p>
                  <p className="text-gray-600">Integration</p>
                </CardContent>
              </Card>
            </div>

            <div className="mt-12 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Video Highlights</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                {[
                  "FedRAMP Moderate Achievement & Azure Government Expertise",
                  "700+ Azure Subscriptions & Multi-Cloud Leadership",
                  "Identity Access Management & Cross-Cloud Integration",
                  "AI Integration Pioneer & Azure Foundry OpenAI Leadership",
                  "Mentorship & Knowledge Transfer Excellence",
                  "Vision for AI-Enhanced Cloud Architecture Future"
                ].map((highlight, index) => (
                  <div key={index} className="flex items-start">
                    <Play className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                    <span className="text-gray-600">{highlight}</span>
                  </div>
                ))}
              </div>
            </div>
          </Motion.div>
        </div>
      </section>
    </div>
  );
};

// Contact Page Component
const ContactPage = () => {
  return (
    <div className="min-h-screen pt-16">
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">Get In Touch</h1>
            <p className="text-xl text-gray-600 text-center mb-12">
              Ready to discuss how AI-assisted cloud architecture can transform your organization? 
              Let's connect and explore opportunities.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Contact Information</h2>
                <div className="space-y-6">
                  <div className="flex items-center">
                    <Mail className="h-6 w-6 text-blue-600 mr-4" />
                    <div>
                      <p className="font-medium">Email</p>
                      <p className="text-gray-600">goddsantana@gmail.com</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <Linkedin className="h-6 w-6 text-blue-600 mr-4" />
                    <div>
                      <p className="font-medium">LinkedIn</p>
                      <a 
                        href="https://linkedin.com/in/angelgoddsantana" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline flex items-center"
                      >
                        linkedin.com/in/angelgoddsantana
                        <ExternalLink className="h-4 w-4 ml-1" />
                      </a>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <MapPin className="h-6 w-6 text-blue-600 mr-4" />
                    <div>
                      <p className="font-medium">Location</p>
                      <p className="text-gray-600">Fort Lauderdale, Florida, United States</p>
                      <p className="text-sm text-gray-500">Remote work preferred</p>
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Availability</h3>
                  <div className="space-y-2">
                    <Badge variant="outline" className="mr-2">Full-time Remote Only</Badge>
                    <Badge variant="outline" className="mr-2">US Government Contracts</Badge>
                    <Badge variant="outline">Cloud Migration Projects</Badge>
                  </div>
                </div>
              </div>

              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Areas of Expertise</CardTitle>
                    <CardDescription>
                      Specialized services for your cloud transformation needs
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      "AI-assisted cloud architecture and automation",
                      "FedRAMP compliance and government cloud solutions",
                      "Azure Lighthouse multi-tenant governance",
                      "Cross-cloud identity access management",
                      "Cloud migration strategies and implementation",
                      "Team mentorship and knowledge transfer",
                      "OpenAI and Gemini AI integration",
                      "Enterprise-scale infrastructure deployment"
                    ].map((service, index) => (
                      <div key={index} className="flex items-start">
                        <ChevronRight className="h-4 w-4 text-blue-600 mt-1 mr-2 flex-shrink-0" />
                        <span className="text-gray-600 text-sm">{service}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="mt-12 text-center">
              <Card className="bg-primary text-white">
                <CardContent className="pt-6">
                  <h3 className="text-xl font-bold mb-4">Ready to Transform Your Cloud Strategy?</h3>
                  <p className="mb-6 text-blue-100">
                    Whether you're a US Government agency planning cloud migration or a medium-sized 
                    company seeking innovative infrastructure solutions, I offer the expertise and 
                    remote collaboration capabilities to revolutionize your digital infrastructure.
                  </p>
                  <Button asChild variant="secondary" size="lg">
                    <a href="mailto:goddsantana@gmail.com">
                      <Mail className="mr-2 h-5 w-5" />
                      Schedule a Consultation
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </Motion.div>
        </div>
      </section>
    </div>
  );
};

// Main App Component
function App() {
  return (
    <Router>
      <div className="App">
        <Navigation />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/experience" element={<ExperiencePage />} />
          <Route path="/skills" element={<SkillsPage />} />
          <Route path="/video-resume" element={<VideoResumePage />} />
          <Route path="/contact" element={<ContactPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App
