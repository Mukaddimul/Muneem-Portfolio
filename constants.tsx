
import { PortfolioData } from './types';

export const INITIAL_DATA: PortfolioData = {
  profile: {
    name: "Muneem",
    fullName: "MD. Mukaddimul Haque Muneem",
    email: "mukaddimulmunna@gmail.com",
    phone: "+880 1876 343423",
    location: "Mirpur 14, Dhaka, Bangladesh",
    bio: "A disciplined and impact-driven undergraduate merging Biomedical Engineering with Creative Design and Social Leadership. Developing technology-driven solutions for a sustainable future in Bangladesh.",
    profilePic: "profile.png",
    coverPhoto: "cover.png"
  },
  projects: [
    {
      id: 'medilink-x',
      title: 'Medilink X',
      category: 'Healthcare Innovation',
      description: 'An AI-powered healthcare ecosystem designed to bridge the gap between rural patients and urban specialists in Bangladesh.',
      icon: 'fa-heart-pulse',
      color: 'from-blue-700',
      link: 'https://www.medilinkxbd.com/',
      logo: 'https://www.google.com/s2/favicons?sz=256&domain_url=medilinkxbd.com',
      achievements: [
        { 
          text: 'Featured in National Health Tech Summit 2024',
          details: 'Recognized as a leading startup in digital health, presenting to a panel of international healthcare investors.',
          url: 'https://www.medilinkxbd.com/press-release'
        },
        {
          text: 'Rural Health Integration Phase 1 Complete',
          details: 'Successfully connected 12 community clinics in Natore district to the central AI server for preliminary diagnostic checks.'
        }
      ]
    },
    {
      id: 'plastixide',
      title: 'PlastiXide',
      category: 'Environmental Tech',
      description: 'Investigating chemical and biological methods to upcycle plastic waste into medical-grade polymers.',
      icon: 'fa-recycle',
      color: 'from-emerald-700',
      link: 'https://www.plastixide.com/',
      logo: 'https://www.google.com/s2/favicons?sz=256&domain_url=plastixide.com',
      achievements: [
        {
          text: 'Winner: Civic Tech Challenge',
          details: 'Secured first place among 100+ innovative solutions for environmental sustainability.',
          url: 'https://www.civictechchallenge.com/winners-2024'
        },
        'Environmental Excellence Award Nominee'
      ]
    },
    {
      id: 'poster-shorai',
      title: 'Poster Shorai',
      category: 'Creative Venture',
      description: 'A professional branding agency that has served 100+ clients with high-impact visual identities.',
      icon: 'fa-palette',
      color: 'from-orange-600',
      link: 'https://www.postershorai.com/',
      logo: 'https://www.google.com/s2/favicons?sz=256&domain_url=postershorai.com',
      achievements: [
        'Served 100+ Global Clients',
        'Top Rated Creative Agency (Natore)'
      ]
    },
  ],
  skills: [
    {
      id: 'creative',
      title: 'Creative Design',
      icon: 'fa-pen-nib',
      color: 'border-brand-500',
      items: ['Graphic Design (Adobe Suite)', 'Magazine Layout & UI/UX', 'Corporate Branding', 'Motion Graphics'],
    },
    {
      id: 'tech',
      title: 'Tech & Innovation',
      icon: 'fa-microchip',
      color: 'border-cyan-500',
      items: ['Biomedical Instrumentation', 'Robotics (Arduino/ESP32)', 'AI Concept Modeling', 'MATLAB/Simulink'],
    },
    {
      id: 'digital',
      title: 'Digital Strategy',
      icon: 'fa-bullhorn',
      color: 'border-purple-500',
      items: ['Digital Marketing Ops', 'Search Engine Optimization', 'Social Media Analytics', 'Content Growth Strategy'],
    },
    {
      id: 'leadership',
      title: 'Leadership',
      icon: 'fa-users',
      color: 'border-pink-500',
      items: ['Public Speaking', 'Crisis Management', 'Team Coordination', 'Strategic Networking'],
    },
  ],
  timeline: [
    {
      id: 'bme-degree',
      date: '2024 - Present',
      title: 'BSc in Biomedical Engineering',
      subtitle: 'Bangladesh University of Health Sciences',
      type: 'education',
      icon: 'fa-graduation-cap',
      description: 'Focusing on the intersection of medical science and engineering with a vision for national-level innovation.',
      details: [
        'Researching AI-based diagnostic tools.',
        'Developing low-cost biomedical instrumentation.',
        'Maintaining academic excellence in specialized BME modules.'
      ]
    },
    {
      id: 'service-engineer',
      date: '6 Months',
      title: 'Service Engineer',
      subtitle: 'Biomedical Equipment & Solution Tech',
      type: 'professional',
      icon: 'fa-gears',
      description: 'Assisted in installation, servicing, and basic troubleshooting of biomedical equipment.',
      details: [
        'Supported preventive maintenance and operational checks to ensure equipment reliability.',
        'Gained hands-on experience with healthcare technology, safety protocols, and clinical equipment systems.'
      ]
    },
    {
      id: 'abf-president',
      date: 'Leadership',
      title: 'President (Natore Branch)',
      subtitle: 'Amar Bangladesh Foundation',
      type: 'leadership',
      icon: 'fa-crown',
      description: 'Leading community development and social welfare initiatives across the Natore district.',
      details: [
        'Managing volunteer teams and overseeing branch organizational activities.',
        'Planning and executing awareness, education, and relief outreach programs.',
        'Driving youth empowerment and grassroots poverty alleviation strategies.'
      ]
    },
    {
      id: 'ncd-vp',
      date: 'Leadership',
      title: 'Former Vice President',
      subtitle: 'NCD International Co-curricular & Talent Hunt Club',
      type: 'leadership',
      icon: 'fa-users-viewfinder',
      description: 'Strategic management of organizational operations and talent programs.',
      details: [
        'Oversaw end-to-end organizational operations and program execution.',
        'Guided student leadership development and managed talent hunt initiatives.',
        'Directed cross-functional teams to achieve organizational milestones.'
      ]
    },
    {
      id: 'eng-teacher',
      date: '6 Months',
      title: 'English Spoken Teacher',
      subtitle: 'English Pathshala',
      type: 'professional',
      icon: 'fa-chalkboard-user',
      description: 'Conducted spoken English and communication classes.',
      details: [
        'Improved students’ confidence, pronunciation, and presentation skills.',
        'Guided learners in professional and academic communication techniques.'
      ]
    },
    {
      id: 'financial-assoc',
      date: '1 Month',
      title: 'Financial Associate',
      subtitle: 'MetLife Insurance Company',
      type: 'professional',
      icon: 'fa-chart-line',
      description: 'Assisted clients with basic financial planning and corporate communication.',
      details: [
        'Supported policy explanation and maintained professional client relationships.',
        'Gained deep exposure to corporate ethics and institutional financial operations.'
      ]
    },
    {
      id: 'ncd-coord',
      date: 'Leadership',
      title: 'Coordinator',
      subtitle: 'NCD International Co-curricular & Talent Hunt Club',
      type: 'leadership',
      icon: 'fa-handshake-angle',
      description: 'Coordinated youth engagement and national-level competitions.',
      details: [
        'Managed event logistics for co-curricular competitions and youth programs.',
        'Supported the execution of national-level talent development activities.'
      ]
    },
    {
      id: 'navian-science',
      date: 'Leadership',
      title: 'Presentation Secretary',
      subtitle: 'Navian’s Science Club',
      type: 'leadership',
      icon: 'fa-flask-vial',
      description: 'Managed academic sessions and scientific event presentations.',
      details: [
        'Curated content for science seminars and academic sessions.',
        'Oversaw the technical presentation aspect of club-led science festivals.'
      ]
    },
    {
      id: 'navian-env',
      date: 'Leadership',
      title: 'Administrative Secretary',
      subtitle: 'Navian’s Environment & Welfare Society',
      type: 'leadership',
      icon: 'fa-leaf',
      description: 'Administrative coordination of environmental and welfare initiatives.',
      details: [
        'Handled administrative planning and managed large volunteer cohorts.',
        'Planned environmental awareness programs and welfare distribution events.'
      ]
    },
    {
      id: 'campus-ambassador',
      date: 'Professional',
      title: 'Campus Ambassador',
      subtitle: 'Multiple National Organizations',
      type: 'professional',
      icon: 'fa-user-tie',
      description: 'Represented various national organizations at the campus level.',
      details: [
        'Promoted organizational programs and initiatives to the student body.',
        'Coordinated student engagement and localized outreach activities.'
      ]
    },
    {
      id: 'hsc-degree',
      date: '2021 - 2023',
      title: 'Higher Secondary Certificate (HSC)',
      subtitle: 'Science Stream',
      type: 'education',
      icon: 'fa-school',
      description: 'Completed higher secondary education with a focus on core sciences.',
      details: [
        'Achieved GPA 5.0 in the Science group.',
        'Actively participated in college science fairs and debates.'
      ]
    },
    {
      id: 'scout-school-leader',
      date: 'Leadership',
      title: 'Former Rover Scout (Senior Petrol Leader)',
      subtitle: 'Natore Govt. Boys High School Scout Unit',
      type: 'leadership',
      icon: 'fa-compass',
      description: 'Early foundational leadership in the national scouting movement.',
      details: [
        'Led a patrol unit in community service and scouting competitions.',
        'Developed foundational skills in teamwork, discipline, and first aid.'
      ]
    },
    {
      id: 'ssc-degree',
      date: '2019 - 2021',
      title: 'Secondary School Certificate (SSC)',
      subtitle: 'Science Stream',
      type: 'education',
      icon: 'fa-book-open',
      description: 'Foundation in science and mathematical disciplines.',
      details: [
        'Secured GPA 5.0 with distinction.',
        'Led junior school science clubs and scouting units.'
      ]
    },
    {
      id: 'unysab-assoc',
      date: 'Volunteer',
      title: 'Associate Member',
      subtitle: 'UNYSAB (United Nations Youth & Students Association of Bangladesh)',
      type: 'volunteer',
      icon: 'fa-globe-asia',
      description: 'Engagement in youth development and global awareness activities.',
      details: [
        'Participated in national-level programs aligned with UN Sustainable Development Goals (SDGs).',
        'Contributed to youth leadership summits and international policy debates.'
      ]
    },
    {
      id: 'scout-sea',
      date: 'Volunteer',
      title: 'Rover Scout',
      subtitle: 'Bangladesh Scouts – Sea Region',
      type: 'volunteer',
      icon: 'fa-anchor',
      description: 'Active participation in national service and community programs.',
      details: [
        'Developed leadership, discipline, teamwork, and emergency response skills.',
        'Engaged in specialized training camps for water safety and rescue.'
      ]
    },
    {
      id: 'scout-bn-college',
      date: 'Volunteer',
      title: 'Former Rover Scout',
      subtitle: '4 No BN College Dhaka Sea Rover Unit',
      type: 'volunteer',
      icon: 'fa-ship',
      description: 'Scouting activities and community volunteer service.',
      details: [
        'Led local scouting units in community cleaning and awareness drives.',
        'Participated in regional scout rallies representing the college.'
      ]
    },
    {
      id: 'sonskoron-member',
      date: 'Volunteer',
      title: 'General Member',
      subtitle: 'Sonskoron Foundation',
      type: 'volunteer',
      icon: 'fa-hands-holding',
      description: 'Support for social welfare and community-based initiatives.',
      details: [
        'Assisted in relief distribution and health camps in underprivileged areas.',
        'Worked on grassroots awareness campaigns for social justice.'
      ]
    },
    {
      id: 'iub-green-genius',
      date: 'Competition',
      title: 'Participant',
      subtitle: 'IUB Green Genius',
      type: 'volunteer',
      icon: 'fa-seedling',
      description: 'Environmental innovation and sustainability program.',
      details: [
        'Presented sustainable tech solutions for urban waste management.',
        'Collaborated with interdisciplinary teams on environmental design.'
      ]
    },
    {
      id: 'navian-cultural',
      date: 'Creative',
      title: 'General Member',
      subtitle: 'Navian’s Cultural Club',
      type: 'creative',
      icon: 'fa-music',
      description: 'Engagement in cultural and social activities.',
      details: [
        'Performed in cultural festivals and inter-college competitions.',
        'Contributed to the promotion of local heritage and arts.'
      ]
    },
    {
      id: 'cultural-classicist-org',
      date: 'Leadership',
      title: 'Organizer',
      subtitle: 'Cultural Classicist',
      type: 'leadership',
      icon: 'fa-masks-theater',
      description: 'Organization of cultural events and community programs.',
      details: [
        'Managed event logistics and volunteer coordination for major events.',
        'Bridged the gap between modern and classical cultural performance.'
      ]
    },
    {
      id: 'sanskaran-assoc',
      date: 'Creative',
      title: 'Associate – Media & Publication',
      subtitle: 'Sanskaran Foundation',
      type: 'creative',
      icon: 'fa-photo-film',
      description: 'Media, publication, and documentation support.',
      details: [
        'Managed documentation and media-related volunteer work for welfare projects.',
        'Designed visual content for digital and print publications.'
      ]
    },
    {
      id: 'olympiadanes-media',
      date: 'Volunteer',
      title: 'Media Management Secretary',
      subtitle: 'Bangladesh Olympiadanes Club',
      type: 'volunteer',
      icon: 'fa-hashtag',
      description: 'Media coordination for academic initiatives.',
      details: [
        'Managed communication channels and social media strategy for olympiads.',
        'Streamlined PR activities to increase student participation nationwide.'
      ]
    },
    {
      id: 'byosd-leader',
      date: 'Leadership',
      title: 'Campus Leader',
      subtitle: 'Bangladesh Youth Organization for Skill Development',
      type: 'leadership',
      icon: 'fa-user-graduate',
      description: 'Promotion of youth skill development and leadership.',
      details: [
        'Promoted technical training programs to university students.',
        'Coordinated skill-sharing workshops for professional growth.'
      ]
    }
  ],
  awards: [
    { id: '1', title: 'International Leadership Award', detail: '2023 Recipient', icon: 'fa-earth-americas' },
    { id: '2', title: 'Intl. Achievers Award', detail: '2023 Recipient', icon: 'fa-award' },
    { id: '3', title: 'Top 50 Leaders of India', detail: 'Nominated', icon: 'fa-star' },
  ],
  news: [
    {
      id: 'news-1',
      title: 'Muneem Nominated for Top 50 Leaders of India',
      content: 'In a significant academic and leadership milestone, MD. Mukaddimul Haque Muneem has been nominated as one of the Top 50 Leaders in India for his contributions to cross-border youth empowerment and biomedical innovation concepts. The nomination highlights his impact-driven approach to social leadership.',
      date: '2023-10-15',
      author: 'News Desk',
      images: [],
      likes: 42,
      comments: [
        { id: 'c1', userName: 'Anzir', text: 'Huge milestone! Congratulations brother.', date: 'Oct 16, 2023' }
      ]
    },
    {
      id: 'news-2',
      title: 'PlastiXide Secures Civic Tech Challenge Victory',
      content: 'The PlastiXide project, led by Muneem, has emerged victorious in the recent Civic Tech Challenge. The project addresses plastic waste management using engineering solutions tailored for the Bangladeshi landscape. The judges praised the scalability and humanitarian focus of the initiative.',
      date: '2024-03-10',
      author: 'Tech Reporter',
      images: [],
      likes: 85,
      comments: []
    }
  ]
};
