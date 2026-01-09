
import React from 'react';
import { Skill } from '../types';

interface SkillsProps {
  skills: Skill[];
}

const Skills: React.FC<SkillsProps> = ({ skills }) => {
  return (
    <section id="skills" className="py-24 scroll-mt-20">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-white mb-4">Core Competencies</h2>
          <p className="text-slate-400 max-w-2xl mx-auto">A multi-disciplinary skillset bridging the gap between engineering, design, and organizational leadership.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {skills.map((skill) => (
            <div key={skill.id} className={`glass-card p-6 rounded-xl border-t-4 ${skill.color} hover:-translate-y-2 transition-transform duration-300`}>
              <div className="w-12 h-12 bg-slate-800/80 rounded-lg flex items-center justify-center mb-4 text-brand-400 text-xl shadow-inner">
                <i className={`fa-solid ${skill.icon}`}></i>
              </div>
              <h3 className="text-lg font-bold text-white mb-4">{skill.title}</h3>
              <ul className="space-y-2 text-slate-400 text-sm">
                {skill.items.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <i className="fa-solid fa-check text-brand-500 mt-1"></i>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Skills;
