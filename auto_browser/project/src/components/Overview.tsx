import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Globe, Brain, BarChart3, FileText, Download, Zap } from 'lucide-react';

export function Overview() {
  const navigate = useNavigate();
  const sectionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-in-up');
          }
        });
      },
      { threshold: 0.1 }
    );

    const sections = document.querySelectorAll('.workflow-section');
    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  const workflowSteps = [
    {
      icon: <Globe className="w-12 h-12" />,
      title: "Content Input & Crawling",
      description: "Paste your URLs or content. Our AI crawls and analyzes your brand's digital presence across multiple platforms.",
      color: "from-blue-500 to-accent"
    },
    {
      icon: <Brain className="w-12 h-12" />,
      title: "AI-Powered Analysis",
      description: "Advanced language models analyze your content, identify key themes, and generate intelligent questions and answers.",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: <BarChart3 className="w-12 h-12" />,
      title: "Smart Q&A Generation",
      description: "Generate contextually relevant questions and answers that boost your content's visibility and engagement.",
      color: "from-blue-500 to-accent"
    },
    {
      icon: <FileText className="w-12 h-12" />,
      title: "Session Management",
      description: "Organize and manage your Q&A sessions with advanced filtering, search, and export capabilities.",
      color: "from-orange-500 to-red-500"
    },
    {
      icon: <Download className="w-12 h-12" />,
      title: "Analytics & Insights",
      description: "Track performance metrics, cost analysis, and get actionable insights to optimize your content strategy.",
      color: "from-indigo-500 to-purple-500"
    }
  ];

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-white via-blue-50 to-blue-100 overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e0e7ef_1px,transparent_1px),linear-gradient(to_bottom,#e0e7ef_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-10"></div>
        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="max-w-4xl mx-auto text-center animate-fade-in-up">
            <div className="flex justify-center mb-6">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-semibold text-lg shadow">
                <Sparkles className="w-5 h-5" />
                AI-Powered Content & Brand Visibility
              </span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent leading-tight">
              See your brand's impact.<br />
              <span className="block text-primary">Analyze. Optimize. Outperform.</span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-700 mb-8 max-w-3xl mx-auto leading-relaxed">
              Instantly monitor, analyze, and optimize your content's performance across major AI platforms. Track visibility, generate Q&A, compare with competitors, and get actionable insights—all in a seamless, interactive dashboard.
            </p>
            <button
              onClick={() => navigate('/qa-generation')}
              className="mt-8 px-10 py-4 bg-gradient-to-r from-primary to-accent text-white font-bold rounded-lg text-xl shadow hover:scale-105 transition-transform duration-200 flex items-center gap-3 mx-auto animate-bounce-in"
            >
              Enhance Your Content
              <ArrowRight className="w-6 h-6" />
            </button>
          </div>
        </div>
        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-primary rounded-full flex justify-center">
            <div className="w-1 h-3 bg-primary rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      </section>
      {/* Feature Preview Row */}
      <div className="container mx-auto px-4 py-8 flex flex-wrap justify-center gap-6 z-20 relative">
        {workflowSteps.map((step, index) => (
          <button
            key={index}
            onClick={() => {
              const section = document.getElementById(`workflow-section-${index}`);
              if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            className="flex flex-col items-center bg-white rounded-xl shadow hover:shadow-lg transition p-4 w-40 cursor-pointer border border-blue-100 hover:border-primary focus:outline-none"
            style={{ minWidth: 150 }}
          >
            <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-r ${step.color} mb-2 shadow`}>
              <div className="text-white">{step.icon}</div>
            </div>
            <span className="font-semibold text-gray-800 text-center text-base leading-tight">{step.title}</span>
          </button>
        ))}
      </div>
      {/* Workflow Sections */}
      <div ref={sectionsRef} className="relative">
        {workflowSteps.map((step, index) => (
          <section
            key={index}
            id={`workflow-section-${index}`}
            className={`workflow-section min-h-screen flex items-center justify-center relative ${
              index % 2 === 0 ? 'bg-blue-50/60' : 'bg-white/80'
            }`}
            style={{
              transform: `translateZ(${index * -50}px)`,
              zIndex: workflowSteps.length - index
            }}
          >
            <div className="container mx-auto px-4 py-10"> {/* reduced py-20 to py-10 */}
              <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className={`text-center lg:text-left ${index % 2 === 0 ? 'lg:order-1' : 'lg:order-2'}`}> 
                  <div className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-r ${step.color} mb-6 shadow`}>
                    <div className="text-white">{step.icon}</div>
                  </div>
                  <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    {step.title}
                  </h2>
                  <p className="text-xl text-gray-800 leading-relaxed"> {/* changed from text-slate-700 to text-gray-800 */}
                    {step.description}
                  </p>
                </div>
                <div className={`${index % 2 === 0 ? 'lg:order-2' : 'lg:order-1'}`}> 
                  <div className="relative">
                    <div className="w-full h-64 bg-gradient-to-r from-blue-100 to-blue-200 rounded-2xl border border-primary/20 shadow">
                      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-blue-100/40 rounded-2xl"></div>
                      <div className="absolute top-4 left-4 right-4">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                          <div className="w-3 h-3 bg-yellow-300 rounded-full"></div>
                          <div className="w-3 h-3 bg-primary rounded-full"></div>
                        </div>
                        <div className="space-y-2">
                          <div className="h-4 bg-blue-200 rounded w-3/4"></div>
                          <div className="h-4 bg-blue-200 rounded w-1/2"></div>
                          <div className="h-4 bg-blue-200 rounded w-2/3"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        ))}
      </div>
      {/* Final CTA Section */}
      <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-blue-100">
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="max-w-4xl mx-auto">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-r from-primary to-accent mb-8 shadow">
              <Zap className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Ready to Transform Your Content?
            </h2>
            <p className="text-xl text-slate-700 mb-8 max-w-2xl mx-auto">
              Join thousands of content creators and brands who are already using Genfuze.ai to boost their visibility and engagement.
            </p>
            <button
              onClick={() => navigate('/enhance-content')}
              className="px-12 py-6 bg-gradient-to-r from-primary to-accent text-white font-bold rounded-xl text-2xl shadow hover:scale-105 transition-transform duration-200 flex items-center gap-4 mx-auto"
            >
              Enhance Your Content
              <ArrowRight className="w-8 h-8 text-white" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
} 