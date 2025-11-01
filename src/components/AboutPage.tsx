import React from 'react';
import { Github, Linkedin, Mail, Phone, GraduationCap, Code2, Cpu, Network, Award } from 'lucide-react';
import { Button } from './ui/button';
import profileImage from 'figma:asset/33fd1671044174cf333abc812cb03745399a2f36.png';

export const AboutPage: React.FC = () => {
  const skills = [
    { category: 'Full Stack', items: ['MongoDB', 'Express.js', 'React', 'Node.js'] },
    { category: 'Backend', items: ['NestJS', 'C#', '.NET Core'] },
    { category: 'DevOps', items: ['Docker', 'Kubernetes', 'CI/CD', 'AWS'] },
    { category: 'Blockchain', items: ['Smart Contracts', 'Web3', 'Solidity'] },
    { category: 'Other', items: ['System Design', 'IoT', 'Embedded Systems'] },
  ];

  const interests = [
    { icon: Network, title: 'System Design', description: 'Architecting scalable distributed systems' },
    { icon: Cpu, title: 'IoT & Embedded', description: 'Hardware-software integration and embedded programming' },
    { icon: Award, title: 'Problem Solving', description: 'Competitive programming and algorithmic challenges' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-12 px-4">
      <div className="container mx-auto max-w-5xl">
        
        {/* Hero Section */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-12 text-white">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="w-40 h-40 bg-white rounded-full overflow-hidden shadow-lg border-4 border-white">
                <img src={profileImage} alt="Mahbub Hasan" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-5xl mb-2">Mahbub Hasan</h1>
                <p className="text-xl text-blue-100 mb-4">Full Stack Developer | Problem Solver | Tech Enthusiast</p>
                <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                  <a href="https://github.com/mahbubhasan777" target="_blank" rel="noopener noreferrer">
                    <Button variant="secondary" className="gap-2">
                      <Github className="w-4 h-4" />
                      GitHub
                    </Button>
                  </a>
                  <a href="https://www.linkedin.com/in/mahbub-hasan-634766378/" target="_blank" rel="noopener noreferrer">
                    <Button variant="secondary" className="gap-2">
                      <Linkedin className="w-4 h-4" />
                      LinkedIn
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Contact Info */}
              <div className="space-y-4">
                <h2 className="text-2xl flex items-center gap-2 mb-4">
                  <Mail className="w-6 h-6 text-blue-600" />
                  Contact Information
                </h2>
                <div className="space-y-3">
                  <a href="mailto:bnlimon0@gmail.com" className="flex items-center gap-3 text-gray-700 hover:text-blue-600 transition-colors">
                    <Mail className="w-5 h-5" />
                    <span>bnlimon0@gmail.com</span>
                  </a>
                  <a href="tel:+8801770625452" className="flex items-center gap-3 text-gray-700 hover:text-blue-600 transition-colors">
                    <Phone className="w-5 h-5" />
                    <span>+880 17706-25452</span>
                  </a>
                </div>
              </div>

              {/* Education */}
              <div className="space-y-4">
                <h2 className="text-2xl flex items-center gap-2 mb-4">
                  <GraduationCap className="w-6 h-6 text-purple-600" />
                  Education
                </h2>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-lg">BSc in Computer Science & Engineering</h3>
                  <p className="text-gray-600">American International University-Bangladesh (AIUB)</p>
                  <p className="text-sm text-gray-500 mt-1">Currently Pursuing</p>
                </div>
              </div>
            </div>

            {/* About */}
            <div className="mb-8">
              <h2 className="text-2xl flex items-center gap-2 mb-4">
                <Code2 className="w-6 h-6 text-green-600" />
                About Me
              </h2>
              <p className="text-gray-700 text-lg leading-relaxed mb-4">
                I'm a passionate Computer Science & Engineering student at AIUB with extensive experience in full-stack development 
                using the MERN stack. My expertise extends to advanced backend technologies including NestJS and C#, comprehensive 
                DevOps practices, and cutting-edge blockchain development. I'm particularly interested in system design, IoT, and 
                embedded systems, constantly seeking to bridge the gap between software and hardware. As an avid problem solver, 
                I enjoy tackling complex algorithmic challenges and building scalable, efficient solutions.
              </p>
              <div className="bg-gradient-to-r from-orange-50 to-red-50 border-l-4 border-orange-500 p-4 rounded-lg">
                <h3 className="font-semibold text-lg mb-2 text-orange-700">💡 Why I Built This Tool</h3>
                <p className="text-gray-700 leading-relaxed">
                  Full disclosure: I'm not an OpenGL expert—in fact, I find the repetitive coding part of OpenGL quite tedious! 
                  That's exactly why I created this tool. As a student learning computer graphics, I wanted to focus on understanding 
                  the concepts and visualizing ideas rather than spending hours writing boilerplate FreeGLUT code. This application 
                  automates the boring parts so developers and students can concentrate on creativity and learning. If you're like me 
                  and want to skip straight to seeing your graphics come to life, this tool is for you!
                </p>
              </div>
            </div>

            {/* Skills */}
            <div className="mb-8">
              <h2 className="text-2xl mb-4">Technical Expertise</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {skills.map((skillGroup) => (
                  <div key={skillGroup.category} className="bg-gradient-to-br from-blue-50 to-purple-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-lg mb-3 text-blue-700">{skillGroup.category}</h3>
                    <div className="flex flex-wrap gap-2">
                      {skillGroup.items.map((skill) => (
                        <span key={skill} className="px-3 py-1 bg-white rounded-full text-sm shadow-sm border border-blue-200">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Interests */}
            <div className="mb-8">
              <h2 className="text-2xl mb-4">Areas of Interest</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {interests.map((interest) => (
                  <div key={interest.title} className="bg-gradient-to-br from-green-50 to-blue-50 p-6 rounded-lg text-center">
                    <interest.icon className="w-12 h-12 mx-auto mb-3 text-green-600" />
                    <h3 className="font-semibold text-lg mb-2">{interest.title}</h3>
                    <p className="text-sm text-gray-600">{interest.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Project Info */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-6 rounded-lg text-white text-center">
              <h2 className="text-2xl mb-2">Advanced Drawing to FreeGLUT Converter</h2>
              <p className="text-blue-100 mb-4">
                A comprehensive web application for converting drawings and mathematical graphs into production-ready FreeGLUT C++ code
              </p>
              <div className="flex justify-center gap-4 text-sm">
                <span className="px-4 py-2 bg-white/20 rounded-full backdrop-blur">React + TypeScript</span>
                <span className="px-4 py-2 bg-white/20 rounded-full backdrop-blur">Tailwind CSS</span>
                <span className="px-4 py-2 bg-white/20 rounded-full backdrop-blur">OpenGL</span>
              </div>
              <p className="mt-4 text-sm text-blue-100">© 2025 Mahbub Hasan. All rights reserved.</p>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="text-center">
          <Button
            onClick={() => window.history.back()}
            size="lg"
            variant="outline"
            className="shadow-lg"
          >
            ← Back to Application
          </Button>
        </div>
      </div>
    </div>
  );
};
