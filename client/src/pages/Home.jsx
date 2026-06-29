import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FiShield, FiFileText, FiCheckCircle, FiClock,
  FiUsers, FiArrowRight, FiStar, FiZap, FiLock,
} from 'react-icons/fi';

const Home = () => {
  const { user } = useAuth();

  const features = [
    {
      icon: <FiFileText size={24} />,
      title: 'Easy Submission',
      description: 'Submit complaints quickly with our intuitive form. Attach files and set priority levels.',
      color: 'bg-blue-500',
    },
    {
      icon: <FiClock size={24} />,
      title: 'Real-time Tracking',
      description: 'Track your complaint status in real-time from submission to resolution.',
      color: 'bg-purple-500',
    },
    {
      icon: <FiUsers size={24} />,
      title: 'Expert Agents',
      description: 'Dedicated support agents assigned to handle your complaints efficiently.',
      color: 'bg-green-500',
    },
    {
      icon: <FiCheckCircle size={24} />,
      title: 'Fast Resolution',
      description: 'Our streamlined process ensures quick resolution with detailed notes.',
      color: 'bg-orange-500',
    },
    {
      icon: <FiLock size={24} />,
      title: 'Secure & Private',
      description: 'Your data is protected with JWT authentication and encrypted storage.',
      color: 'bg-red-500',
    },
    {
      icon: <FiZap size={24} />,
      title: 'Instant Notifications',
      description: 'Get notified instantly when your complaint status changes.',
      color: 'bg-yellow-500',
    },
  ];

  const stats = [
    { label: 'Complaints Resolved', value: '10,000+' },
    { label: 'Active Users',        value: '5,000+'  },
    { label: 'Support Agents',      value: '200+'    },
    { label: 'Avg Resolution Time', value: '24hrs'   },
  ];

  const steps = [
    {
      step: '01',
      title: 'Register & Login',
      description: 'Create your free account in seconds.',
    },
    {
      step: '02',
      title: 'Submit Complaint',
      description: 'Fill out the form with details and attachments.',
    },
    {
      step: '03',
      title: 'Track Progress',
      description: 'Monitor status updates in real-time.',
    },
    {
      step: '04',
      title: 'Get Resolved',
      description: 'Receive resolution notes and confirmation.',
    },
  ];

  return (
    <div className="min-h-screen bg-white">

      {/* ── Navbar ────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200
                      shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center
                              justify-center text-white shadow">
                <FiShield size={20} />
              </div>
              <span className="text-lg font-bold text-gray-900">
                ComplaintMS
              </span>
            </div>

            {/* Nav links */}
            <div className="hidden md:flex items-center gap-6">
              <a href="#features"
                 className="text-sm text-gray-600 hover:text-primary-600
                            font-medium transition-colors">
                Features
              </a>
              <a href="#how-it-works"
                 className="text-sm text-gray-600 hover:text-primary-600
                            font-medium transition-colors">
                How it Works
              </a>
              <a href="#stats"
                 className="text-sm text-gray-600 hover:text-primary-600
                            font-medium transition-colors">
                Stats
              </a>
            </div>

            {/* Auth buttons */}
            <div className="flex items-center gap-3">
              {user ? (
                <Link
                  to={
                    user.role === 'admin' ? '/admin/dashboard'
                    : user.role === 'agent' ? '/agent/dashboard'
                    : '/dashboard'
                  }
                  className="btn-primary"
                >
                  Go to Dashboard
                  <FiArrowRight size={16} />
                </Link>
              ) : (
                <>
                  <Link to="/login"    className="btn-secondary">Sign In</Link>
                  <Link to="/register" className="btn-primary">Get Started</Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-primary-600 via-primary-700
                          to-blue-800 text-white py-24 px-4">
        <div className="max-w-4xl mx-auto text-center animate-fadeIn">
          <div className="inline-flex items-center gap-2 bg-white bg-opacity-20
                          rounded-full px-4 py-2 text-sm font-medium mb-6">
            <FiStar size={14} className="text-yellow-300" />
            Trusted by 5,000+ users worldwide
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
            Online Complaint
            <span className="block text-blue-200">Registration System</span>
          </h1>
          <p className="text-lg sm:text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Submit, track, and resolve complaints efficiently.
            Our platform connects users with dedicated support agents
            for fast and transparent resolution.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="btn bg-white text-primary-700 hover:bg-blue-50
                         btn-lg font-semibold shadow-lg"
            >
              Start for Free
              <FiArrowRight size={18} />
            </Link>
            <Link
              to="/login"
              className="btn bg-white bg-opacity-20 text-white
                         hover:bg-opacity-30 btn-lg font-semibold border
                         border-white border-opacity-30"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats ─────────────────────────────────────────────── */}
      <section id="stats" className="bg-gray-900 py-14 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <p className="text-3xl sm:text-4xl font-bold text-white mb-1">
                  {stat.value}
                </p>
                <p className="text-sm text-gray-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────── */}
      <section id="features" className="py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Everything you need
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              A complete platform for complaint management with powerful
              features for users, agents, and administrators.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div
                key={i}
                className="card-hover group"
              >
                <div className={`w-12 h-12 ${feature.color} rounded-xl
                                 flex items-center justify-center text-white
                                 mb-4 group-hover:scale-110 transition-transform
                                 duration-200`}>
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it Works ──────────────────────────────────────── */}
      <section id="how-it-works" className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              How it works
            </h2>
            <p className="text-gray-500 text-lg">
              Get started in 4 simple steps
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, i) => (
              <div key={i} className="text-center relative">
                {/* Connector line */}
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-1/2
                                  w-full h-0.5 bg-gray-200 z-0" />
                )}
                <div className="relative z-10">
                  <div className="w-16 h-16 bg-primary-600 rounded-2xl
                                  flex items-center justify-center mx-auto
                                  mb-4 shadow-lg">
                    <span className="text-white font-bold text-lg">
                      {step.step}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-gray-500">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────── */}
      <section className="bg-gradient-to-r from-primary-600 to-blue-700
                          py-20 px-4 text-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to get started?
          </h2>
          <p className="text-blue-100 text-lg mb-8">
            Join thousands of users who trust our platform
            for efficient complaint resolution.
          </p>
          <Link
            to="/register"
            className="btn bg-white text-primary-700 hover:bg-blue-50
                       btn-lg font-bold shadow-xl inline-flex"
          >
            Create Free Account
            <FiArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="bg-gray-900 text-gray-400 py-10 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row
                        items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center
                            justify-center">
              <FiShield size={16} className="text-white" />
            </div>
            <span className="text-white font-semibold">ComplaintMS</span>
          </div>
          <p className="text-sm">
            © {new Date().getFullYear()} Complaint Management System.
            All rights reserved.
          </p>
          <div className="flex gap-4 text-sm">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;