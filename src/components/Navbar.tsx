import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";
import { ChevronDown, Menu, X, ShieldCheck, LogIn, LogOut } from "lucide-react";
import { auth, logout as firebaseLogout } from "../firebase";
import { onAuthStateChanged, User } from "firebase/auth";

import BrandedHeart from "./BrandedHeart";
import AuthModal from "./AuthModal";

const logo2 = new URL("../assets/logo2.png", import.meta.url).href;

export default function Navbar() {
  const location = useLocation();
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const ADMIN_EMAILS = ["wootaengboy@gmail.com"];

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsAdmin(u ? ADMIN_EMAILS.includes(u.email || "") : false);
    });
    return () => unsubscribe();
  }, []);

  const navLinks = [
    { name: "HOME", path: "/" },
    { name: "ABOUT", path: "/about" },
    { 
      name: "SERVICES", 
      path: "/services",
      subItems: [
        { name: "일본 (Japan)", path: "/services/japan" },
        { name: "우즈베키스탄 (Uzbekistan)", path: "/services/uzbekistan" }
      ]
    },
    { name: "PORTFOLIO", path: "/portfolio" },
    { name: "BLOG", path: "/blog" },
    { name: "CONTACT", path: "/contact" },
  ];

  const filteredNavLinks = navLinks.map(link => {
    if (link.name === "SERVICES" && link.subItems) {
      return {
        ...link,
        subItems: link.subItems.filter(sub => {
          if (sub.path === "/services/uzbekistan") {
            return isAdmin;
          }
          return true;
        })
      };
    }
    return link;
  });

  const leftLinks = filteredNavLinks.slice(0, 3);
  const rightLinks = filteredNavLinks.slice(3);

  return (
    <nav className="sticky top-0 left-0 w-full z-[99999] bg-white/80 backdrop-blur-md border-b border-gray-100 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-6 md:px-[5%] h-20 flex items-center justify-between">
        {/* Left Links (Desktop) */}
        <div className="hidden md:flex items-center gap-8 flex-1 justify-end pr-12">
          {leftLinks.map((link) => (
            <div 
              key={link.path} 
              className="relative"
              onMouseEnter={() => link.subItems && setIsServicesOpen(true)}
              onMouseLeave={() => link.subItems && setIsServicesOpen(false)}
            >
              <Link
                to={link.path}
                className={`text-xs font-sans font-bold tracking-[0.2em] transition-colors hover:text-accent-pink flex items-center gap-1 ${
                  location.pathname.startsWith(link.path) ? "text-accent-pink" : "text-gray-900"
                }`}
              >
                {link.name}
                {link.subItems && <ChevronDown className={`w-3 h-3 transition-transform ${isServicesOpen ? 'rotate-180' : ''}`} />}
              </Link>

              {link.subItems && (
                <AnimatePresence>
                  {isServicesOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute top-full left-0 pt-4 w-48"
                    >
                      <div className="bg-white border border-gray-100 shadow-2xl rounded-2xl overflow-hidden py-3 min-w-[220px]">
                        {link.subItems.map((sub) => (
                          <Link
                            key={sub.path}
                            to={sub.path}
                            className={`block px-6 py-4 text-xs font-sans font-bold tracking-widest transition-all hover:bg-accent-pink/5 hover:text-accent-pink border-l-4 border-transparent hover:border-accent-pink ${
                              location.pathname === sub.path ? "text-accent-pink border-accent-pink bg-accent-pink/5" : "text-gray-900"
                            }`}
                          >
                            {sub.name}
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </div>
          ))}
        </div>

        {/* Logo */}
        <Link 
          to="/" 
          className="flex items-center flex-shrink-0"
          onClick={() => window.dispatchEvent(new CustomEvent("reset-active-journey-step"))}
        >
          <img 
            src={logo2} 
            alt="CHEOTOL Logo" 
            className="h-16 md:h-20 w-auto object-contain transition-transform duration-300 hover:scale-[1.02]"
            referrerPolicy="no-referrer"
          />
        </Link>

        {/* Right Links (Desktop) */}
        <div className="hidden md:flex items-center gap-8 flex-1 justify-start pl-12">
          {rightLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`text-xs font-sans font-bold tracking-[0.2em] transition-colors hover:text-accent-pink ${
                location.pathname === link.path ? "text-accent-pink" : "text-gray-900"
              }`}
            >
              {link.name}
            </Link>
          ))}
          {isAdmin && (
            <Link 
              to="/admin/dashboard" 
              className="flex items-center gap-1.5 text-[10px] font-sans font-bold text-accent-pink tracking-[0.1em] border border-accent-pink/20 px-3 py-1.5 rounded-full hover:bg-accent-pink/5 transition-all uppercase"
            >
              <ShieldCheck className="w-3 h-3" /> Admin
            </Link>
          )}
          {user ? (
            <button 
              onClick={() => firebaseLogout()}
              className="group flex items-center gap-2 text-[10px] font-sans font-bold text-gray-400 tracking-[0.1em] hover:text-accent-pink transition-all uppercase"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button 
              onClick={() => setIsAuthModalOpen(true)}
              className="group flex items-center gap-2 text-[10px] font-sans font-bold text-gray-400 tracking-[0.1em] hover:text-accent-pink transition-all uppercase"
              title="Admin Login"
            >
              <LogIn className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-gray-900 p-2 focus:outline-none"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-gray-100 overflow-hidden"
          >
            <div className="flex flex-col p-6 gap-4">
              {filteredNavLinks.map((link) => (
                <div key={link.path} className="flex flex-col gap-2">
                  <Link
                    to={link.path}
                    className={`text-sm font-sans font-bold tracking-[0.1em] transition-colors hover:text-accent-pink ${
                      location.pathname.startsWith(link.path) ? "text-accent-pink" : "text-gray-900"
                    }`}
                  >
                    {link.name}
                  </Link>
                  {link.subItems && (
                    <div className="flex flex-col gap-3 pl-4 border-l border-gray-100 mt-1">
                      {link.subItems.map((sub) => (
                        <Link
                          key={sub.path}
                          to={sub.path}
                          className={`text-xs font-sans font-medium tracking-widest transition-all hover:text-accent-pink ${
                            location.pathname === sub.path ? "text-accent-pink" : "text-gray-500"
                          }`}
                        >
                          {sub.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {isAdmin && (
                <Link
                  to="/admin/dashboard"
                  className="mt-4 flex items-center gap-2 text-sm font-sans font-bold text-accent-pink tracking-[0.1em] py-2 border-t border-gray-50 pt-6"
                >
                  <ShieldCheck className="w-4 h-4" /> ADMIN DASHBOARD
                </Link>
              )}
              <div className="mt-2 pt-4 border-t border-gray-50 flex items-center gap-4">
                {user ? (
                  <button 
                    onClick={() => firebaseLogout()}
                    className="flex items-center gap-2 text-xs font-sans font-bold text-gray-500 uppercase tracking-widest"
                  >
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                ) : (
                  <button 
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setIsAuthModalOpen(true);
                    }}
                    className="flex items-center gap-2 text-xs font-sans font-bold text-gray-500 uppercase tracking-widest"
                  >
                    <LogIn className="w-4 h-4" /> Admin Login
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </nav>
  );
}
